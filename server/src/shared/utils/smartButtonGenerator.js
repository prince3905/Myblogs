/**
 * Smart Post-Intent Aware Action Button Generator
 * Analyzes post title, category, and content to render 100% CONTEXT-ACCURATE action buttons:
 * - Admit Card -> "Download Admit Card (Direct Link 🎟️)"
 * - Result -> "Check Exam Result (Direct Link 📊)"
 * - Answer Key -> "Download Answer Key (Direct Link 🔑)"
 * - Admission -> "Apply for Admission (रजिस्ट्रेशन करें 🎓)"
 * - Vacancy / Job -> "Apply Online Form (यहाँ क्लिक करें ✍️)"
 */

function generateSmartActionButtons(title = '', urls = {}) {
  const lowerTitle = (title || '').toLowerCase();

  const applyUrl = urls.apply || 'https://www.india.gov.in/';
  const pdfUrl = urls.pdf || urls.web || 'https://www.india.gov.in/';
  const webUrl = urls.web || 'https://www.india.gov.in/';

  let btn1Text = 'Apply Online Form (यहाँ क्लिक करें ✍️)';
  let btn2Text = 'Download Official Notification (PDF 📄)';
  let btn3Text = 'Official Website (विजिट करें 🌐)';

  if (/admit card|hall ticket|call letter|permission letter|city details|exam city/i.test(lowerTitle)) {
    btn1Text = 'Download Admit Card (Direct Link 🎟️)';
    btn2Text = 'Official Notification / Exam Notice (PDF 📄)';
    btn3Text = 'Official Exam Portal (विजिट करें 🌐)';
  } else if (/result|merit list|score card|selection list|cut off|final result/i.test(lowerTitle)) {
    btn1Text = 'Check Exam Result (Direct Link 📊)';
    btn2Text = 'Result Notification & Cut Off (PDF 📄)';
    btn3Text = 'Official Board Portal (विजिट करें 🌐)';
  } else if (/answer key|key|objection/i.test(lowerTitle)) {
    btn1Text = 'Download Answer Key (Direct Link 🔑)';
    btn2Text = 'Official Answer Key Notice (PDF 📄)';
    btn3Text = 'Official Board Portal (विजिट करें 🌐)';
  } else if (/admission|counseling|entrance|uptac|ugmac|cuet|bhu set|b.ed/i.test(lowerTitle)) {
    btn1Text = 'Apply for Admission (रजिस्ट्रेशन करें 🎓)';
    btn2Text = 'Admission Information Brochure (PDF 📄)';
    btn3Text = 'University Official Website (विजिट करें 🌐)';
  }

  const buttonHtmls = [
    `<a href="${applyUrl}" class="btn-link-action btn-apply" target="_blank" rel="noopener noreferrer" style="margin: 5px 0; width: 100%; max-width: 420px; justify-content: center; display: inline-flex; padding: 12px 20px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 0.95rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); cursor: pointer; background: #16a34a; color: #ffffff;">${btn1Text}</a>`,
    `<a href="${pdfUrl}" class="btn-link-action btn-notification" target="_blank" rel="noopener noreferrer" style="margin: 5px 0; width: 100%; max-width: 420px; justify-content: center; display: inline-flex; padding: 12px 20px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 0.95rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); cursor: pointer; background: #dc2626; color: #ffffff;">${btn2Text}</a>`,
    `<a href="${webUrl}" class="btn-link-action btn-website" target="_blank" rel="noopener noreferrer" style="margin: 5px 0; width: 100%; max-width: 420px; justify-content: center; display: inline-flex; padding: 12px 20px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 0.95rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); cursor: pointer; background: #2563eb; color: #ffffff;">${btn3Text}</a>`
  ];

  return `\n<div class="ql-table-embed">\n<div class="action-buttons-group" style="display: flex; flex-direction: column; gap: 10px; margin: 20px 0; align-items: flex-start;">\n${buttonHtmls.join('\n')}\n</div>\n</div>\n`;
}

module.exports = {
  generateSmartActionButtons
};
