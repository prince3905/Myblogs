const CurrentAffairs = require('./currentAffairs.model');
const { generateDailyCurrentAffairs, generateQuizForSummary, getDefaultEmergencyQuizzes } = require('./currentAffairs.service');

/**
 * Public: Get paginated list of Current Affairs articles
 */
async function getDailyCurrentAffairsList(req, res) {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 12;
    const search = (req.query.search || '').trim();
    const category = (req.query.category || '').trim();
    const date = (req.query.date || '').trim();

    const query = { status: 'published' };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { summary: { $regex: search, $options: 'i' } },
        { highlights: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      query.categories = category;
    }

    if (date) {
      query.dateString = date;
    }

    const total = await CurrentAffairs.countDocuments(query);
    const items = await CurrentAffairs.find(query)
      .select('title slug dateString publishDate summary highlights categories readingTimeMinutes views featuredImage createdAt')
      .sort({ publishDate: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return res.status(200).json({
      success: true,
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * Public: Get single Current Affairs article by slug or dateString
 */
async function getCurrentAffairsBySlug(req, res) {
  try {
    const { slug } = req.params;

    const item = await CurrentAffairs.findOne({
      $or: [{ slug }, { dateString: slug }]
    });

    if (!item) {
      return res.status(404).json({ success: false, message: 'Current Affairs article not found' });
    }

    // Increment view counter in background
    CurrentAffairs.updateOne({ _id: item._id }, { $inc: { views: 1 } }).exec();

    return res.status(200).json({
      success: true,
      data: item
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * Public: Get today's or date-specific Daily Quiz with Automatic Self-Healing
 */
async function getTodayQuiz(req, res) {
  try {
    const dateParam = req.query.date;
    let query = { status: 'published' };

    if (dateParam) {
      query.dateString = dateParam;
    }

    let item = await CurrentAffairs.findOne(query)
      .select('title slug dateString publishDate summary quizzes')
      .sort({ publishDate: -1 });

    const now = new Date();
    const istDate = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
    const targetDateString = dateParam || (item ? item.dateString : istDate.toISOString().split('T')[0]);

    // Self-healing: if article doesn't have quizzes, generate or provide emergency quizzes immediately
    let quizzesList = item?.quizzes || [];
    if (!quizzesList || quizzesList.length === 0) {
      console.log(`[getTodayQuiz] No quizzes found in DB for ${targetDateString}. Triggering automatic self-healing...`);
      quizzesList = await generateQuizForSummary(targetDateString, item?.summary || '');
      
      if (!quizzesList || quizzesList.length === 0) {
        quizzesList = getDefaultEmergencyQuizzes(targetDateString);
      }

      if (item) {
        item.quizzes = quizzesList;
        await item.save().catch(e => console.error('Failed to persist self-healed quizzes:', e.message));
      }
    }

    // Hide correctOptionIndex from questions so client cannot inspect/cheat before submitting
    const sanitizedQuizzes = quizzesList.map(q => ({
      questionId: q.questionId,
      questionText: q.questionText,
      options: q.options,
      topicCategory: q.topicCategory
    }));

    return res.status(200).json({
      success: true,
      postTitle: item ? item.title : `Daily GK Practice Quiz (${targetDateString})`,
      slug: item ? item.slug : `daily-current-affairs-${targetDateString}-hindi-gk-quiz`,
      dateString: targetDateString,
      publishDate: item ? item.publishDate : new Date(),
      totalQuestions: sanitizedQuizzes.length,
      quizzes: sanitizedQuizzes
    });
  } catch (err) {
    console.error('[getTodayQuiz] Error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * Public: Submit Quiz Answers and calculate score with full answer key
 */
async function submitQuizAttempt(req, res) {
  try {
    const { dateString, answers } = req.body; // answers: { [questionId]: selectedOptionIndex }

    const item = await CurrentAffairs.findOne({ dateString });
    if (!item || !item.quizzes || item.quizzes.length === 0) {
      return res.status(404).json({ success: false, message: 'Quiz not found for grading.' });
    }

    let score = 0;
    const total = item.quizzes.length;
    const results = [];

    for (const q of item.quizzes) {
      const selected = answers ? answers[q.questionId] : undefined;
      const isCorrect = selected !== undefined && Number(selected) === q.correctOptionIndex;
      if (isCorrect) score += 1;

      results.push({
        questionId: q.questionId,
        questionText: q.questionText,
        options: q.options,
        selectedOptionIndex: selected !== undefined ? Number(selected) : null,
        correctOptionIndex: q.correctOptionIndex,
        isCorrect,
        explanation: q.explanation,
        topicCategory: q.topicCategory
      });
    }

    const percentage = Math.round((score / total) * 100);

    return res.status(200).json({
      success: true,
      score,
      total,
      percentage,
      passed: percentage >= 50,
      results
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * Admin: 1-Click Trigger / Manual Generator
 */
async function adminGenerateDaily(req, res) {
  try {
    const targetDate = req.body.date ? new Date(req.body.date) : new Date();
    
    // Check if already exists for this date
    const istDate = new Date(targetDate.getTime() + (5.5 * 60 * 60 * 1000));
    const dateString = istDate.toISOString().split('T')[0];

    let existing = await CurrentAffairs.findOne({ dateString });
    if (existing && req.body.force !== true) {
      return res.status(200).json({
        success: true,
        message: `Current Affairs for ${dateString} already exists.`,
        data: existing
      });
    }

    const generated = await generateDailyCurrentAffairs(targetDate);
    
    if (existing) {
      Object.assign(existing, generated);
      await existing.save();
      return res.status(200).json({
        success: true,
        message: `Updated Current Affairs for ${dateString}`,
        data: existing
      });
    }

    const doc = new CurrentAffairs(generated);
    await doc.save();

    // Trigger instant indexing ping
    try {
      const { notifyAllIndexing } = require('../../shared/utils/google-indexing');
      notifyAllIndexing(doc.canonicalUrl, 'URL_UPDATED').catch(() => {});
    } catch (e) {}

    return res.status(201).json({
      success: true,
      message: `Successfully generated and published Current Affairs for ${dateString}!`,
      data: doc
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  getDailyCurrentAffairsList,
  getCurrentAffairsBySlug,
  getTodayQuiz,
  submitQuizAttempt,
  adminGenerateDaily
};
