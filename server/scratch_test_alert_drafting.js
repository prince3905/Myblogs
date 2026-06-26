const mongoose = require('mongoose');
const LiveAlert = require('./src/modules/liveAlerts/liveAlert.model');
const BlogPost = require('./src/modules/posts/post.model');
const env = require('./src/config/env');
const { generateBlogContentCore } = require('./src/modules/ai/ai.controller');

async function run() {
  await mongoose.connect(env.mongoUri);
  console.log("DB connected");

  const alertId = "6a2b6b44568aed7af132b24f";
  console.log(`Loading alert ${alertId}...`);
  const alert = await LiveAlert.findById(alertId);
  if (!alert) {
    console.error("Alert not found in database!");
    await mongoose.disconnect();
    return;
  }

  console.log(`Alert Title: "${alert.title}"`);
  console.log(`Starting generation logic...`);

  try {
    const cleanTitle = alert.title
      .replace(/([a-zA-Z])(\d{4})\b/g, '$1 $2')
      .replace(/\b\w/g, c => c.toUpperCase());

    const resolvedUrl = alert.officialUrl || '';
    const resolvedPdf = alert.officialPdfUrl || '';
    const resolvedApply = alert.officialApplyUrl || '';
    const detailsTextContext = alert.detailsText || '';

    const aiParams = {
      title: cleanTitle,
      model: 'gemini-flash-latest',
      length: 'long',
      tone: 'informative',
      language: 'hinglish',
      category: 'Sarkari Jobs & Exams',
      command: `Below is the official notification details block...`
    };

    const generatedData = await generateBlogContentCore(aiParams);
    console.log("Generation succeeded!");
    console.log("Title:", generatedData.title);
    console.log("Word Count:", generatedData.content.split(/\s+/).filter(Boolean).length);
  } catch (err) {
    console.error("ERROR CAUGHT:");
    console.error(err);
  }

  await mongoose.disconnect();
}

run().catch(console.error);
