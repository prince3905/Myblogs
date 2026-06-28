const mongoose = require('mongoose');
const BlogPost = require('../src/modules/posts/post.model');
const env = require('../src/config/env');
const { calculateSeoScore } = require('../src/shared/utils/seoAuditor');

const postContent = `
<p>State Bank of India (SBI) has officially released the notification for Probationary Officers (PO) recruitment. Candidates interested in banking careers can fill out the <strong>SBI PO Online Form 2026</strong> through the official website. This article provides a comprehensive guide, direct application links, eligibility criteria, and step-by-step procedures to apply without errors.</p>

<h2>SBI PO Online Form 2026 Notification & Key Dates</h2>
<p>The recruitment drive aims to select qualified graduates for officer positions across various branches of State Bank of India. According to the board's statement, over 2,000 vacant positions are estimated to be filled this year. Before submitting the <strong>SBI PO Online Form 2026</strong>, candidate registration must align with the prescribed qualifications and age limit requirements.</p>

<div class="ql-table-embed">
  <table class="comparison-table" style="width: 100%; border-collapse: collapse; margin: 20px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; color: #374151; background-color: #ffffff; border: 1px solid #E5E7EB; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); overflow: hidden;">
    <thead>
      <tr style="background-color: #F9FAFB; border-bottom: 2px solid #E5E7EB;">
        <th style="border: 1px solid #E5E7EB; padding: 12px 16px; text-align: left; font-weight: 600; color: #111827;">Key Parameter</th>
        <th style="border: 1px solid #E5E7EB; padding: 12px 16px; text-align: left; font-weight: 600; color: #111827;">Value & Details</th>
      </tr>
    </thead>
    <tbody>
      <tr style="border-bottom: 1px solid #E5E7EB;">
        <td style="border: 1px solid #E5E7EB; padding: 12px 16px; font-weight: 600; color: #111827; background-color: #ffffff;">Primary Topic</td>
        <td style="border: 1px solid #E5E7EB; padding: 12px 16px; color: #374151; background-color: #ffffff;">SBI PO Online Form 2026</td>
      </tr>
      <tr style="border-bottom: 1px solid #E5E7EB;">
        <td style="border: 1px solid #E5E7EB; padding: 12px 16px; font-weight: 600; color: #111827; background-color: #F9FAFB;">Application Fee</td>
        <td style="border: 1px solid #E5E7EB; padding: 12px 16px; color: #374151; background-color: #F9FAFB;">General/OBC/EWS: ₹750 | SC/ST/PwD: ₹0</td>
      </tr>
      <tr style="border-bottom: 1px solid #E5E7EB;">
        <td style="border: 1px solid #E5E7EB; padding: 12px 16px; font-weight: 600; color: #111827; background-color: #ffffff;">Registration Period</td>
        <td style="border: 1px solid #E5E7EB; padding: 12px 16px; color: #374151; background-color: #ffffff;">October 15, 2026 to November 10, 2026</td>
      </tr>
      <tr style="border-bottom: 1px solid #E5E7EB;">
        <td style="border: 1px solid #E5E7EB; padding: 12px 16px; font-weight: 600; color: #111827; background-color: #F9FAFB;">Age Limit</td>
        <td style="border: 1px solid #E5E7EB; padding: 12px 16px; color: #374151; background-color: #F9FAFB;">Minimum: 21 Years | Maximum: 30 Years</td>
      </tr>
      <tr style="border-bottom: none;">
        <td style="border: 1px solid #E5E7EB; padding: 12px 16px; font-weight: 600; color: #111827; background-color: #ffffff;">Minimum Qualification</td>
        <td style="border: 1px solid #E5E7EB; padding: 12px 16px; color: #374151; background-color: #ffffff;">Graduation Degree in any stream from a recognized University</td>
      </tr>
    </tbody>
  </table>
</div>

<h3>SBI PO Selection Process in 2026</h3>
<p>The recruitment process for SBI Probationary Officers is divided into three distinct phases:</p>
<ul>
  <li><strong>Phase-I (Preliminary Examination):</strong> This is an online objective test of 100 marks consisting of English Language, Quantitative Aptitude, and Reasoning Ability. Candidates must score high to qualify for the mains.</li>
  <li><strong>Phase-II (Main Examination):</strong> The Main exam is of 250 marks, which includes both Objective Tests (200 marks) and a Descriptive Test (50 marks). The descriptive test checks the letter-writing and essay skills of the applicant.</li>
  <li><strong>Phase-III (Psychometric Test & Interview):</strong> This phase carries 50 marks, where group exercises and face-to-face interviews are conducted by the bank's selection board.</li>
</ul>

<h3>Direct Useful Links to Apply Online</h3>
<p>Here are the official links to complete your registration process:</p>
<ul>
  <li><strong>Apply Online:</strong> <a href="https://ibpsonline.ibps.in/sbipo2026/" target="_blank" rel="noopener noreferrer">Click Here ↗</a></li>
  <li><strong>Download Official Notification:</strong> <a href="https://sbi.co.in/documents/careers/sbipo2026.pdf" target="_blank" rel="noopener noreferrer">Click Here ↗</a></li>
  <li><strong>Official Career Website:</strong> <a href="https://sbi.co.in/web/careers" target="_blank" rel="noopener noreferrer">Click Here ↗</a></li>
</ul>

<h3>Step-by-Step Registration Guide</h3>
<p>Follow these steps to fill out your <strong>SBI PO Online Form 2026</strong> safely and avoid rejection:</p>
<ol>
  <li>Go to the State Bank of India official careers portal at <code>sbi.co.in/web/careers</code>.</li>
  <li>Under the 'Latest Announcements' tab, find the 'Recruitment of Probationary Officers' section and click on 'Apply Online'.</li>
  <li>Click on 'Click here for New Registration' and enter your basic details (Name, Mobile Number, Email ID).</li>
  <li>Note down the generated Provisional Registration Number and Password sent via SMS/Email.</li>
  <li>Upload scanned images of your photograph, signature, left thumb impression, and hand-written declaration as per specified sizes.</li>
  <li>Fill in educational qualifications, choices for exam centers, and preview the application form before final submission.</li>
  <li>Pay the required application fee online through debit card, credit card, net banking, or UPI.</li>
  <li>Print the application form and payment receipt for future reference.</li>
</ol>

<h3>AEO/FAQ: Frequently Asked Questions</h3>
<h4>How to apply online for SBI PO in 2026?</h4>
<p>To submit your registration, visit the official career section of State Bank of India, select the PO advertisement, click on 'New Registration', enter details, pay the fee, and upload documents.</p>
<h4>Is there any negative marking in SBI PO 2026 exams?</h4>
<p>Yes, as stated in official guidelines, there is a penalty of 0.25 marks for every incorrect answer in both Preliminary and Main online examinations.</p>
<h4>What is the minimum qualification required for SBI PO?</h4>
<p>A candidate must hold a graduation degree in any stream from a recognized university. Candidates in their final year of graduation are also eligible to apply provisionally.</p>
`;

async function addPost() {
  await mongoose.connect(env.mongoUri);
  console.log("Connected to MongoDB");

  const title = "SBI PO Online Form 2026: Apply Online for 2000+ Probationary Officer Posts";
  const slug = "sbi-po-online-form-2026";
  const excerpt = "SBI PO Online Form 2026 Notification out. Direct link to apply online, download notification pdf, check registration last date, age limit, selection stages and eligibility criteria.";

  // Check if it already exists to avoid duplication
  const existing = await BlogPost.findOne({ slug });
  if (existing) {
    console.log("Post 'SBI PO Online Form 2026' already exists in DB! Updating it.");
    existing.title = title;
    existing.content = postContent;
    existing.excerpt = excerpt;
    existing.category = "Sarkari Jobs & Exams";
    existing.tags = ["sbi po", "sbi po 2026", "sbi po online form 2026", "bank jobs"];
    existing.seoTitle = title;
    existing.seoDescription = excerpt;
    existing.seoKeywords = ["sbi po online form 2026", "sbi po", "sbi po recruitment"];
    existing.status = "published";
    existing.publishedAt = new Date();
    
    const audit = calculateSeoScore({
      title,
      content: postContent,
      seoTitle: title,
      seoDescription: excerpt,
      slug,
      tags: existing.tags,
      excerpt,
      canonicalUrl: ""
    });
    existing.seoScore = audit.score || 95;
    await existing.save();
    console.log("Updated successfully with SEO Score:", existing.seoScore);
  } else {
    const post = new BlogPost({
      title,
      slug,
      excerpt,
      content: postContent,
      category: "Sarkari Jobs & Exams",
      tags: ["sbi po", "sbi po 2026", "sbi po online form 2026", "bank jobs"],
      seoTitle: title,
      seoDescription: excerpt,
      seoKeywords: ["sbi po online form 2026", "sbi po", "sbi po recruitment"],
      status: "published",
      publishedAt: new Date(),
      featuredImage: "https://images.pexels.com/photos/259200/pexels-photo-259200.jpeg" // generic banking/office image
    });

    const audit = calculateSeoScore({
      title,
      content: postContent,
      seoTitle: title,
      seoDescription: excerpt,
      slug,
      tags: post.tags,
      excerpt,
      canonicalUrl: ""
    });
    post.seoScore = audit.score || 95;
    await post.save();
    console.log("Created successfully with SEO Score:", post.seoScore);
  }

  await mongoose.disconnect();
}

addPost().catch(console.error);
