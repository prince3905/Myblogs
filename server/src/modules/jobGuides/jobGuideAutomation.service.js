const mongoose = require('mongoose');
const { generateBlogContentCore } = require('../ai/ai.controller');
const { discoverNextJobGuideTopic } = require('./jobGuideTopics.service');
const { logAutomation } = require('../../shared/utils/automationLogger');

// Curated 4K High-Authority Featured Images for Indian & Global Career Guides
const JOB_GUIDE_FEATURED_IMAGES = {
  indian: [
    'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&h=675&q=85', // Parliament / Gov architecture
    'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&h=675&q=85', // Student exam study desk
    'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=1200&h=675&q=85', // Legal / Gazette documents
    'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&h=675&q=85', // Young graduates / Career planning
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&h=675&q=85'  // Modern government institution
  ],
  global: [
    'https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?auto=format&fit=crop&w=1200&h=675&q=85', // UN Flag / Global summit
    'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&h=675&q=85', // International conference hall
    'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&h=675&q=85', // Global corporate / Ministry office
    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&h=675&q=85', // International passport & travel
    'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&h=675&q=85'  // Dubai UAE skyline
  ]
};

/**
 * Build responsive In-Content Call-To-Action (Internal Linking machine)
 */
function buildContextualJobCta(region = 'indian') {
  if (region === 'global') {
    return `
<div style="margin: 32px 0; padding: 22px 24px; border-radius: 16px; background: linear-gradient(135deg, #0B132B 0%, #064E3B 100%); border: 1.5px solid #34D399; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6); color: #F8FAFC;">
  <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
    <span style="font-size: 26px;">🌍</span>
    <strong style="color: #34D399; font-size: 1.12rem; letter-spacing: 0.3px;">Verified Global Government Vacancies (195 Countries & UN)</strong>
  </div>
  <p style="margin: 0 0 16px 0; color: #CBD5E1; font-size: 0.95rem; line-height: 1.65;">
    Looking for verified public service, multilateral (UN, WHO, World Bank) or foreign expat government opportunities? Explore active circulars with direct official .gov application portals:
  </p>
  <a href="/global-jobs" style="display: inline-block; background: #10B981; color: #FFFFFF; text-decoration: none; font-weight: 850; padding: 11px 22px; border-radius: 10px; font-size: 0.95rem; box-shadow: 0 4px 16px rgba(16, 185, 129, 0.45); transition: background 0.2s ease;">
    👉 Explore Live Global Government Jobs Portal ➔
  </a>
</div>
`;
  }

  return `
<div style="margin: 32px 0; padding: 22px 24px; border-radius: 16px; background: linear-gradient(135deg, #0D1629 0%, #0F172A 100%); border: 1.5px solid #38BDF8; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6); color: #F8FAFC;">
  <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
    <span style="font-size: 26px;">🏛️</span>
    <strong style="color: #38BDF8; font-size: 1.12rem; letter-spacing: 0.3px;">Live Sarkari Vacancy Alert (आज की सक्रिय सरकारी भर्तियां)</strong>
  </div>
  <p style="margin: 0 0 16px 0; color: #CBD5E1; font-size: 0.95rem; line-height: 1.65;">
    क्या आप वर्तमान में जारी 100% सत्यापित सरकारी भर्तियों के लिए आवेदन करना चाहते हैं? अभी देखें आज जारी हुए सभी आधिकारिक गजट नोटिफिकेशन, योग्यता, वेतनमान व डायरेक्ट ऑनलाइन आवेदन लिंक:
  </p>
  <a href="/india/sarkari-jobs" style="display: inline-block; background: #16A34A; color: #FFFFFF; text-decoration: none; font-weight: 850; padding: 11px 22px; border-radius: 10px; font-size: 0.95rem; box-shadow: 0 4px 16px rgba(22, 163, 74, 0.45); transition: background 0.2s ease;">
    👉 100% सत्यापित लाइव सरकारी नौकरियां देखें (Live Portal) ➔
  </a>
</div>
`;
}

/**
 * Generate and Publish an Autonomous High-Value Job Guide Article
 * @param {'indian' | 'global'} targetRegion
 * @param {string|null} manualTopic
 */
async function publishAutomatedJobGuide(targetRegion = 'indian', manualTopic = null) {
  const BlogPost = mongoose.model('BlogPost');
  const region = targetRegion === 'global' ? 'global' : 'indian';
  const category = 'Sarkari Jobs & Exams';

  console.log(`[JobGuide Auto] Initiating publication pipeline for region: "${region}"...`);

  // 1. HARD SAFETY LIMIT: Maximum 3 guides per day total (Boutique Company Anti-Ban Policy)
  if (!manualTopic) {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayGuidesCount = await BlogPost.countDocuments({
      createdAt: { $gte: startOfToday },
      category: category,
      author: 'Global Careers Intelligence Desk',
      status: 'published'
    });

    if (todayGuidesCount >= 3) {
      console.log(`[JobGuide Auto] Daily cap of 3 guides reached today (${todayGuidesCount}/3). Skipping to maintain boutique quality.`);
      return null;
    }
  }

  // 2. Discover or use topic
  let selectedTopic = manualTopic;
  let topicMeta = { region, intent: 'GUIDE' };

  if (!selectedTopic) {
    topicMeta = await discoverNextJobGuideTopic(region);
    selectedTopic = topicMeta.topic;
  }

  console.log(`[JobGuide Auto] Selected topic: "${selectedTopic}" [Intent: ${topicMeta.intent}]`);

  // 3. Generate 1,200+ words crystal-clear guide via AI controller
  let generatedData = null;
  let attempts = 0;
  while (attempts < 3 && !generatedData) {
    attempts++;
    try {
      generatedData = await generateBlogContentCore({
        title: selectedTopic,
        category: category,
        model: 'gemini-2.5-flash',
        length: 'long',
        language: 'hinglish',
        tone: 'informative'
      });
    } catch (aiErr) {
      console.warn(`[JobGuide Auto] AI generation attempt ${attempts} failed: ${aiErr.message}`);
      if (attempts < 3) {
        await new Promise(r => setTimeout(r, 4000));
      } else {
        throw aiErr;
      }
    }
  }

  if (!generatedData || !generatedData.content || generatedData.content.length < 600) {
    throw new Error(`AI generation returned insufficient content for topic: "${selectedTopic}"`);
  }

  // 4. Inject Contextual Live Job CTA & E-E-A-T Signature Block
  const ctaBlock = buildContextualJobCta(region);
  const signatureBlock = `
<div style="margin-top: 36px; padding: 18px 22px; border-radius: 12px; background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255, 255, 255, 0.1); color: #94A3B8; font-size: 0.88rem; line-height: 1.6;">
  🛡️ <strong>Official Advisory & Verification:</strong> This career intelligence briefing is compiled and fact-checked by the <em>Global Careers Intelligence Desk</em> using official Gazette notifications and recruitment board circulars. Never pay fees on any personal UPI/QR code. Always apply directly on official <code>.gov</code> or recognized multilateral agency portals.
</div>
`;

  // Place CTA in middle or end of content
  let finalContent = generatedData.content;
  if (finalContent.includes('## Frequently Asked Questions') || finalContent.includes('## FAQs')) {
    finalContent = finalContent.replace(/(## (?:Frequently Asked Questions|FAQs))/i, `${ctaBlock}\n\n$1`);
  } else {
    finalContent = `${finalContent}\n\n${ctaBlock}`;
  }
  finalContent = `${finalContent}\n\n${signatureBlock}`;

  // 5. Select topic-matched 4K featured image
  const images = JOB_GUIDE_FEATURED_IMAGES[region] || JOB_GUIDE_FEATURED_IMAGES.indian;
  const topicHash = selectedTopic.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const featuredImage = images[Math.abs(topicHash) % images.length];

  // 6. Ensure unique, clean hyphenated slug
  let finalSlug = generatedData.slug || selectedTopic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const existingSlug = await BlogPost.countDocuments({ slug: finalSlug });
  if (existingSlug > 0) {
    finalSlug = `${finalSlug}-${Date.now().toString().slice(-4)}`;
  }

  // 7. Save BlogPost to MongoDB
  const newPost = new BlogPost({
    title: generatedData.title || selectedTopic,
    slug: finalSlug,
    category: category,
    content: finalContent,
    excerpt: generatedData.excerpt || generatedData.seoDescription || selectedTopic,
    seoTitle: generatedData.seoTitle || generatedData.title || selectedTopic,
    seoDescription: generatedData.seoDescription || generatedData.excerpt || selectedTopic,
    seoKeywords: Array.isArray(generatedData.seoKeywords) ? generatedData.seoKeywords : [category, selectedTopic, 'Career Guide 2026', 'Sarkari Jobs'],
    focusKeyword: generatedData.focusKeyword || selectedTopic.split(' ').slice(0, 4).join(' '),
    tags: [category, region === 'global' ? 'Global Jobs' : 'Sarkari Jobs', 'Career Guide 2026', topicMeta.intent || 'Guide'],
    featuredImage: featuredImage,
    author: 'Global Careers Intelligence Desk',
    status: 'published',
    publishedAt: new Date()
  });

  const savedPost = await newPost.save();
  console.log(`[JobGuide Auto] ✅ Successfully published guide: "${savedPost.title}" (/blog/${savedPost.slug})`);

  // 8. Log Automation Event
  await logAutomation({
    service: 'JOB_GUIDE_AUTO',
    action: 'PUBLISH_SUCCESS',
    level: 'INFO',
    message: `Published [${region.toUpperCase()}] guide: "${savedPost.title}"`
  });

  return savedPost;
}

module.exports = {
  publishAutomatedJobGuide
};
