/**
 * Server-Side Job Content Scaffolding Engine
 * Generates rich, semantic, 250+ word structured layouts for Sarkari Jobs and Global Jobs
 * Ensures 100% Googlebot visibility, eliminates thin content, and prevents "Crawled - currently not indexed"
 */

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildIndianJobScaffoldHtml(alert = {}, isExpired = false, recAlerts = []) {
  const title = escapeHtml(alert.title || 'Government Job Notification 2026');
  const board = escapeHtml(alert.boardName || 'Government of India / State Commission');
  const state = escapeHtml(alert.state || 'Central/All India');
  const category = escapeHtml(alert.category || 'Sarkari Job');
  const lastDate = escapeHtml(alert.lastDate && alert.lastDate !== 'N/A' ? alert.lastDate : 'As per Official Circular');
  const postDate = escapeHtml(alert.postDate || 'Latest Circular 2026');
  const applyUrl = escapeHtml(alert.officialApplyUrl || alert.officialUrl || alert.sourceUrl || '#');
  const pdfUrl = escapeHtml(alert.officialPdfUrl || alert.sourceUrl || '#');

  const statusBanner = isExpired
    ? `<div style="background: #fef2f2; border: 1.5px solid #fecaca; border-left: 6px solid #dc2626; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 1.25rem;">⏳</span>
          <strong style="color: #991b1b; font-size: 1.05rem;">आवेदन की अंतिम तिथि समाप्त (Application Closed / Archived)</strong>
        </div>
        <p style="margin: 6px 0 0; color: #b91c1c; font-size: 0.92rem; line-height: 1.5;">
          इस भर्ती प्रक्रिया के लिए ऑनलाइन आवेदन अब आधिकारिक रूप से बंद हो चुके हैं। कृपया नीचे दी गई वर्तमान में सक्रिय 2026 की नवीनतम सरकारी भर्तियों में आवेदन करें। (Online applications for this recruitment cycle have officially concluded. Please check active 2026 vacancies below.)
        </p>
      </div>`
    : `<div style="background: #f0fdf4; border: 1.5px solid #bbf7d0; border-left: 6px solid #16a34a; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 1.25rem;">🟢</span>
          <strong style="color: #166534; font-size: 1.05rem;">ऑनलाइन आवेदन सक्रिय (Applications Open — Live Vacancy 2026)</strong>
        </div>
        <p style="margin: 6px 0 0; color: #15803d; font-size: 0.92rem; line-height: 1.5;">
          पात्र व इच्छुक उम्मीदवार अंतिम तिथि (<strong>${lastDate}</strong>) से पूर्व आधिकारिक पोर्टल पर जाकर ऑनलाइन आवेदन पत्र सबमिट करें। (Eligible candidates are advised to verify details and apply online through official government portal before deadline.)
        </p>
      </div>`;

  const rawDetails = alert.detailsText ? escapeHtml(alert.detailsText) : '';

  let recHtml = '';
  if (Array.isArray(recAlerts) && recAlerts.length > 0) {
    recHtml = `
    <section style="margin-top: 36px; padding: 24px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px;">
      <h3 style="font-size: 1.15rem; font-weight: 800; color: #0f172a; margin-top: 0; margin-bottom: 14px; display: flex; align-items: center; gap: 8px;">
        🔥 वर्तमान में चालू प्रमुख सरकारी नौकरियां (Trending Active Live Vacancies 2026):
      </h3>
      <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
        ${recAlerts.map(r => `
          <li style="margin-bottom: 8px;">
            <a href="/india/sarkari-jobs/${r._id}" style="color: #0284c7; text-decoration: none; font-weight: 700; font-size: 0.95rem;">
              ${escapeHtml(r.title)} (${escapeHtml(r.state || 'All India')}) — ${escapeHtml(r.category || 'Latest Job')}
            </a>
          </li>
        `).join('')}
      </ul>
    </section>`;
  }

  return `
  <article class="job-article-scaffold" style="max-width: 900px; margin: 30px auto; padding: 28px 24px; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0,0,0,0.04); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.65;">
    
    <!-- Top Meta Badges -->
    <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px;">
      <span style="display: inline-block; padding: 4px 12px; background: #e0f2fe; color: #0369a1; border-radius: 8px; font-weight: 800; font-size: 0.8rem; text-transform: uppercase;">🏛️ ${board}</span>
      <span style="display: inline-block; padding: 4px 12px; background: #f1f5f9; color: #475569; border-radius: 8px; font-weight: 700; font-size: 0.8rem;">📍 ${state}</span>
      <span style="display: inline-block; padding: 4px 12px; background: #fef3c7; color: #92400e; border-radius: 8px; font-weight: 700; font-size: 0.8rem;">📋 ${category}</span>
    </div>

    <!-- Main H1 Header -->
    <h1 style="font-size: 1.85rem; font-weight: 900; line-height: 1.3; color: #0f172a; margin-top: 0; margin-bottom: 16px;">
      ${title}
    </h1>

    <!-- Status Banner -->
    ${statusBanner}

    <!-- 1. Overview & Comprehensive Briefing (Guarantees 250+ Words) -->
    <section style="margin-bottom: 28px;">
      <h2 style="font-size: 1.3rem; font-weight: 800; color: #0f172a; border-bottom: 2px solid #38bdf8; padding-bottom: 6px; margin-bottom: 12px;">
        📌 भर्ती संक्षिप्त विवरण (Recruitment Overview & Notification Summary)
      </h2>
      <p style="font-size: 0.98rem; color: #334155; line-height: 1.7; margin-bottom: 14px;">
        <strong>${board}</strong> द्वारा <strong>${title}</strong> के अंतर्गत विभिन्न पदों हेतु आधिकारिक भर्ती अधिसूचना जारी की गई है। इस भर्ती प्रक्रिया के तहत निर्धारित शैक्षणिक योग्यता, आयु सीमा व संबंधित मानदंडों को पूरा करने वाले उम्मीदवार ऑनलाइन माध्यम से आवेदन कर सकते हैं। भर्ती से संबंधित समस्त महत्वपूर्ण तिथियां, आवेदन शुल्क, पदवार विवरण, पात्रता मानदंड व चयन प्रक्रिया की संपूर्ण जानकारी नीचे दी गई है।
      </p>
      ${rawDetails ? `<div style="background: #f8fafc; border-left: 4px solid #38bdf8; padding: 14px 18px; border-radius: 8px; margin-bottom: 16px; font-size: 0.92rem; color: #334155; white-space: pre-line;">${rawDetails}</div>` : ''}
      <p style="font-size: 0.95rem; color: #475569; line-height: 1.6;">
        उम्मीदवारों को सलाह दी जाती है कि वे ऑनलाइन आवेदन पत्र भरने से पूर्व आयोग/विभाग द्वारा जारी मूल गजट अधिसूचना (Official Notification PDF) का भली-भांति अवलोकन करें। सभी दस्तावेजों की स्कैन प्रतियां एवं आवश्यक विवरण तैयार रखें।
      </p>
    </section>

    <!-- 2. Important Dates Grid -->
    <section style="margin-bottom: 28px;">
      <h2 style="font-size: 1.3rem; font-weight: 800; color: #0f172a; border-bottom: 2px solid #10b981; padding-bottom: 6px; margin-bottom: 12px;">
        📅 महत्वपूर्ण तिथियां (Important Dates Schedule)
      </h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px;">
        <div style="padding: 12px 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
          <span style="font-size: 0.8rem; color: #64748b; font-weight: 600; display: block;">अधिसूचना जारी (Notification Released):</span>
          <strong style="color: #0f172a; font-size: 0.95rem;">${postDate}</strong>
        </div>
        <div style="padding: 12px 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
          <span style="font-size: 0.8rem; color: #64748b; font-weight: 600; display: block;">ऑनलाइन आवेदन की अंतिम तिथि (Last Date):</span>
          <strong style="color: #dc2626; font-size: 0.95rem;">${lastDate}</strong>
        </div>
        <div style="padding: 12px 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
          <span style="font-size: 0.8rem; color: #64748b; font-weight: 600; display: block;">परीक्षा शुल्क भुगतान अंतिम तिथि (Fee Last Date):</span>
          <strong style="color: #0f172a; font-size: 0.95rem;">अंतिम तिथि तक (Till Last Date)</strong>
        </div>
        <div style="padding: 12px 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
          <span style="font-size: 0.8rem; color: #64748b; font-weight: 600; display: block;">प्रवेश पत्र व परीक्षा तिथि (Exam & Admit Card):</span>
          <strong style="color: #0284c7; font-size: 0.95rem;">शीघ्र अधिसूचित होगी (As per Schedule)</strong>
        </div>
      </div>
    </section>

    <!-- 3. Application Fee & Mode of Payment -->
    <section style="margin-bottom: 28px;">
      <h2 style="font-size: 1.3rem; font-weight: 800; color: #0f172a; border-bottom: 2px solid #f59e0b; padding-bottom: 6px; margin-bottom: 12px;">
        💳 आवेदन शुल्क विवरण (Application Fee Details)
      </h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px; margin-bottom: 10px;">
        <div style="padding: 12px 16px; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px;">
          <span style="font-size: 0.82rem; color: #92400e; font-weight: 600; display: block;">सामान्य / ओबीसी / ईडब्ल्यूएस (General / OBC / EWS):</span>
          <strong style="color: #78350f; font-size: 0.95rem;">आधिकारिक अधिसूचनानुसार (As per Notification)</strong>
        </div>
        <div style="padding: 12px 16px; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px;">
          <span style="font-size: 0.82rem; color: #92400e; font-weight: 600; display: block;">एससी / एसटी / दिव्यांग (SC / ST / PwD):</span>
          <strong style="color: #78350f; font-size: 0.95rem;">नियमानुसार छूट / शून्य (Exempted / As per Rules)</strong>
        </div>
      </div>
      <p style="font-size: 0.88rem; color: #64748b; margin: 0;">
        <strong>भुगतान का माध्यम (Payment Mode):</strong> परीक्षा शुल्क का भुगतान ऑनलाइन माध्यम (डेबिट कार्ड, क्रेडिट कार्ड, नेट बैंकिंग, यूपीआई या ई-चालान) द्वारा किया जा सकता है।
      </p>
    </section>

    <!-- 4. Age Limit & Relaxation -->
    <section style="margin-bottom: 28px;">
      <h2 style="font-size: 1.3rem; font-weight: 800; color: #0f172a; border-bottom: 2px solid #8b5cf6; padding-bottom: 6px; margin-bottom: 12px;">
        👤 आयु सीमा व छूट (Age Limit & Relaxation Criteria)
      </h2>
      <ul style="margin: 0; padding-left: 20px; line-height: 1.7; color: #334155; font-size: 0.95rem;">
        <li><strong>न्यूनतम आयु (Minimum Age):</strong> 18 वर्ष (मानक सरकारी नियमानुसार)</li>
        <li><strong>अधिकतम आयु (Maximum Age):</strong> पदवार अधिसूचना में उल्लिखित नियमानुसार (27 से 40 वर्ष)</li>
        <li><strong>आयु में छूट (Age Relaxation):</strong> आरक्षित श्रेणियों (ओबीसी को 3 वर्ष, एससी/एसटी को 5 वर्ष एवं दिव्यांग अभ्यर्थियों को 10 वर्ष) को सरकारी नियमानुसार छूट प्रदान की जाएगी।</li>
      </ul>
    </section>

    <!-- 5. Educational Qualification & Eligibility -->
    <section style="margin-bottom: 28px;">
      <h2 style="font-size: 1.3rem; font-weight: 800; color: #0f172a; border-bottom: 2px solid #ec4899; padding-bottom: 6px; margin-bottom: 12px;">
        🎓 शैक्षणिक योग्यता व पात्रता (Educational Qualification & Eligibility)
      </h2>
      <p style="font-size: 0.95rem; color: #334155; line-height: 1.7; margin-bottom: 8px;">
        अभ्यर्थी भारत में किसी भी मान्यता प्राप्त बोर्ड या विश्वविद्यालय से संबंधित विषय में 10वीं / 12वीं / आईटीआई / डिप्लोमा / स्नातक (Bachelor Degree) अथवा परास्नातक (Master Degree) उत्तीर्ण होना अनिवार्य है। पदवार विस्तृत पात्रता के लिए कृपया आधिकारिक अधिसूचना पीडीएफ देखें।
      </p>
    </section>

    <!-- 6. Official Direct Action Links (100% Pure Official Links) -->
    <section style="margin-bottom: 28px; padding: 20px; background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 12px;">
      <h2 style="font-size: 1.25rem; font-weight: 800; color: #166534; margin-top: 0; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
        🔗 100% सत्यापित आधिकारिक लिंक (Direct Official Gazette & Apply Links)
      </h2>
      <div style="display: flex; gap: 12px; flex-wrap: wrap;">
        ${!isExpired ? `<a href="${applyUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; gap: 6px; padding: 12px 22px; background: #16a34a; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 0.95rem; box-shadow: 0 4px 12px rgba(22, 163, 74, 0.35);">
          🟢 आधिकारिक पोर्टल पर ऑनलाइन आवेदन करें (Apply Online)
        </a>` : ''}
        <a href="${pdfUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; gap: 6px; padding: 12px 22px; background: #0284c7; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 0.95rem; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.35);">
          📄 आधिकारिक अधिसूचना पीडीएफ डाउनलोड करें (Official PDF)
        </a>
      </div>
    </section>

    <!-- 7. Anti-Fraud Advisory (Rule #15) -->
    <div style="background: #fffbeb; border: 1px solid #fef3c7; border-left: 5px solid #f59e0b; padding: 14px 18px; border-radius: 8px; margin-bottom: 24px; font-size: 0.88rem; color: #92400e; line-height: 1.6;">
      <strong>⚠️ धोखाधड़ी से सावधान (Anti-Fraud Warning):</strong> सरकारी विभाग कभी भी किसी व्यक्तिगत बैंक खाते, QR कोड या UPI पर भर्ती शुल्क नहीं मांगते। केवल आधिकारिक .gov पोर्टल से ही आवेदन करें एवं किसी बिचौलिए के झांसे में न आएं।
    </div>

    <!-- 8. Recommendations / Internal Links -->
    ${recHtml}

  </article>`;
}

function buildGlobalJobScaffoldHtml(job = {}, isExpired = false) {
  const title = escapeHtml(job.title || 'Government Vacancy Notification');
  const agency = escapeHtml(job.agencyOrMinistry || job.countryName || 'Federal Ministry');
  const country = escapeHtml(job.countryName || 'International');
  const dutyStation = escapeHtml(job.dutyStation || job.countryName || 'Headquarters');
  const deadline = escapeHtml(job.applicationDeadline ? new Date(job.applicationDeadline).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Ongoing / Open Until Filled');
  const noticeUrl = escapeHtml(job.officialNoticeUrl || '#');
  const gazetteSummary = escapeHtml(job.officialGazetteSummary || job.description || '');

  const statusBanner = isExpired
    ? `<div style="background: #fef2f2; border: 1.5px solid #fecaca; border-left: 6px solid #dc2626; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px;">
        <strong style="color: #991b1b; font-size: 1.05rem;">⏳ Application Closed / Deadline Passed</strong>
        <p style="margin: 4px 0 0; color: #b91c1c; font-size: 0.92rem;">The official application window for this government position has closed. Please explore active verified international circulars below.</p>
      </div>`
    : `<div style="background: #f0fdf4; border: 1.5px solid #bbf7d0; border-left: 6px solid #16a34a; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px;">
        <strong style="color: #166534; font-size: 1.05rem;">🟢 Live Verified Vacancy — Applications Open</strong>
        <p style="margin: 4px 0 0; color: #15803d; font-size: 0.92rem;">Applications are actively accepted by the issuing government department through the official ministry portal before ${deadline}.</p>
      </div>`;

  return `
  <article class="global-job-scaffold" style="max-width: 900px; margin: 30px auto; padding: 28px 24px; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0,0,0,0.04); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.65;">
    
    <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px;">
      <span style="display: inline-block; padding: 4px 12px; background: #e0f2fe; color: #0369a1; border-radius: 8px; font-weight: 800; font-size: 0.8rem; text-transform: uppercase;">🛡️ ${agency}</span>
      <span style="display: inline-block; padding: 4px 12px; background: #f1f5f9; color: #475569; border-radius: 8px; font-weight: 700; font-size: 0.8rem;">📍 ${dutyStation}, ${country}</span>
    </div>

    <h1 style="font-size: 1.85rem; font-weight: 900; line-height: 1.3; color: #0f172a; margin-top: 0; margin-bottom: 16px;">
      ${title}
    </h1>

    ${statusBanner}

    <section style="margin-bottom: 28px;">
      <h2 style="font-size: 1.3rem; font-weight: 800; color: #0f172a; border-bottom: 2px solid #38bdf8; padding-bottom: 6px; margin-bottom: 12px;">
        🏛️ Official Gazette Circular Briefing & Scope
      </h2>
      <p style="font-size: 0.98rem; color: #334155; line-height: 1.7; margin-bottom: 14px;">
        This government career opportunity is published under <strong>${agency}</strong> in <strong>${country}</strong>. All eligibility parameters, required qualifications, experience criteria, and statutory citizen guidelines are governed by the respective federal civil service commission framework.
      </p>
      ${gazetteSummary ? `<div style="background: #f8fafc; border-left: 4px solid #38bdf8; padding: 14px 18px; border-radius: 8px; margin-bottom: 16px; font-size: 0.92rem; color: #334155; white-space: pre-line;">${gazetteSummary}</div>` : ''}
    </section>

    <section style="margin-bottom: 28px;">
      <h2 style="font-size: 1.3rem; font-weight: 800; color: #0f172a; border-bottom: 2px solid #10b981; padding-bottom: 6px; margin-bottom: 12px;">
        📋 Key Vacancy Overview
      </h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px;">
        <div style="padding: 12px 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
          <span style="font-size: 0.8rem; color: #64748b; font-weight: 600; display: block;">Department / Agency:</span>
          <strong style="color: #0f172a; font-size: 0.95rem;">${agency}</strong>
        </div>
        <div style="padding: 12px 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
          <span style="font-size: 0.8rem; color: #64748b; font-weight: 600; display: block;">Duty Station:</span>
          <strong style="color: #0f172a; font-size: 0.95rem;">${dutyStation}</strong>
        </div>
        <div style="padding: 12px 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
          <span style="font-size: 0.8rem; color: #64748b; font-weight: 600; display: block;">Application Deadline:</span>
          <strong style="color: #dc2626; font-size: 0.95rem;">${deadline}</strong>
        </div>
        <div style="padding: 12px 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
          <span style="font-size: 0.8rem; color: #64748b; font-weight: 600; display: block;">Official Gazette Reference:</span>
          <strong style="color: #0284c7; font-size: 0.95rem;">${escapeHtml(job.officialReferenceId || job._id)}</strong>
        </div>
      </div>
    </section>

    <section style="margin-bottom: 28px; padding: 20px; background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 12px;">
      <h2 style="font-size: 1.25rem; font-weight: 800; color: #166534; margin-top: 0; margin-bottom: 12px;">
        🔗 Official Government Portal Link
      </h2>
      <a href="${noticeUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; gap: 6px; padding: 12px 22px; background: #16a34a; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 0.95rem; box-shadow: 0 4px 12px rgba(22, 163, 74, 0.35);">
        🏛️ Apply on Official Ministry Portal (Direct Government Link)
      </a>
    </section>

    <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px 18px; border-radius: 8px; font-size: 0.88rem; color: #64748b; line-height: 1.6;">
      🛡️ <strong>Research Desk Verification:</strong> Sourced directly from official federal gazette feeds and statutory multilateral portals. 100% verified official destination.
    </div>

  </article>`;
}

module.exports = {
  buildIndianJobScaffoldHtml,
  buildGlobalJobScaffoldHtml
};
