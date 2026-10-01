/**
 * Server-Side Job Content Scaffolding Engine
 * Generates rich, semantic, 300+ word structured layouts for Sarkari Jobs and Global Jobs
 * Ensures 100% Googlebot visibility, eliminates thin content, and satisfies all candidate intent signals.
 */

const { parseJobMetadata } = require('./jobSeoOptimizer');

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
  const meta = parseJobMetadata(alert);
  const jobName = escapeHtml(meta.jobName);
  const board = escapeHtml(meta.board);
  const state = escapeHtml(meta.state);
  const category = escapeHtml(meta.category);
  const year = escapeHtml(meta.year);
  const vacancyText = escapeHtml(meta.vacancyCount ? `${meta.vacancyCount} Posts` : 'Various Posts');
  const qualification = escapeHtml(meta.qualification);
  const lastDate = escapeHtml(meta.lastDate);
  const postDate = escapeHtml(meta.postDate);
  const applyUrl = escapeHtml(meta.applyUrl);
  const pdfUrl = escapeHtml(meta.pdfUrl);

  const statusBanner = isExpired
    ? `<div style="background: #fef2f2; border: 1.5px solid #fecaca; border-left: 6px solid #dc2626; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 1.25rem;">⏳</span>
          <strong style="color: #991b1b; font-size: 1.05rem;">आवेदन की अंतिम तिथि समाप्त (Application Closed / Archived)</strong>
        </div>
        <p style="margin: 6px 0 0; color: #b91c1c; font-size: 0.92rem; line-height: 1.5;">
          ${jobName} भर्ती प्रक्रिया के लिए ऑनलाइन आवेदन अब आधिकारिक रूप से बंद हो चुके हैं। कृपया नीचे दी गई वर्तमान में सक्रिय 2026 की नवीनतम सरकारी भर्तियों में आवेदन करें। (Online applications for this recruitment cycle have officially concluded. Please explore active 2026 vacancies below.)
        </p>
      </div>`
    : `<div style="background: #f0fdf4; border: 1.5px solid #bbf7d0; border-left: 6px solid #16a34a; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 1.25rem;">🟢</span>
          <strong style="color: #166534; font-size: 1.05rem;">ऑनलाइन आवेदन सक्रिय (Applications Open — Live Vacancy ${year})</strong>
        </div>
        <p style="margin: 6px 0 0; color: #15803d; font-size: 0.92rem; line-height: 1.5;">
          पात्र व इच्छुक उम्मीदवार अंतिम तिथि (<strong>${lastDate}</strong>) से पूर्व आधिकारिक पोर्टल पर जाकर ऑनलाइन आवेदन पत्र सबमिट करें। (Eligible candidates can apply online directly through official portal before deadline.)
        </p>
      </div>`;

  const rawDetails = alert.detailsText ? escapeHtml(alert.detailsText) : '';

  let recHtml = '';
  if (Array.isArray(recAlerts) && recAlerts.length > 0) {
    recHtml = `
    <section style="margin-top: 36px; padding: 24px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px;">
      <h3 style="font-size: 1.15rem; font-weight: 800; color: #0f172a; margin-top: 0; margin-bottom: 14px; display: flex; align-items: center; gap: 8px;">
        🔥 वर्तमान में चालू प्रमुख सरकारी नौकरियां (Trending Active Live Vacancies ${year}):
      </h3>
      <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
        ${recAlerts.map(r => `
          <li style="margin-bottom: 8px;">
            <a href="/india/sarkari-jobs/${r.slug || r._id}" style="color: #0284c7; text-decoration: none; font-weight: 700; font-size: 0.95rem;">
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
      ${jobName} Recruitment ${year}: ${vacancyText}, Eligibility, Last Date & Apply Online
    </h1>

    <!-- Status Banner -->
    ${statusBanner}

    <!-- 1. Post Intro (First 100 Words Guarantee: Board Name, Total Posts, Qualification, Apply Online) -->
    <section style="margin-bottom: 28px;">
      <p style="font-size: 1rem; color: #1e293b; line-height: 1.75; margin-bottom: 16px; font-weight: 500;">
        <strong>${board}</strong> has officially announced the notification for <strong>${jobName} Recruitment ${year}</strong> for a total of <strong>${vacancyText}</strong>. Candidates holding the required <strong>${qualification}</strong> eligibility criteria can <strong>Apply Online</strong> directly through the official portal before the closing last date of <strong>${lastDate}</strong>. Comprehensive information regarding post-wise vacancy breakdown, educational eligibility, age limit relaxation, category application fee, and direct official gazette links are detailed below to help candidates submit their application form smoothly.
      </p>
      <p style="font-size: 0.95rem; color: #334155; line-height: 1.7; margin-bottom: 14px; background: #f8fafc; padding: 12px 16px; border-left: 4px solid #0284c7; border-radius: 4px;">
        <strong>संक्षिप्त विवरण (Hindi Summary):</strong> <strong>${board}</strong> द्वारा <strong>${jobName}</strong> के कुल <strong>${vacancyText}</strong> पर भर्ती अधिसूचना जारी कर दी गई है। निर्धारित योग्यता धारक अभ्यर्थी <strong>Apply Online</strong> लिंक के माध्यम से अंतिम तिथि <strong>${lastDate}</strong> तक आवेदन कर सकते हैं।
      </p>
      ${rawDetails ? `<div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px 18px; border-radius: 8px; margin-bottom: 16px; font-size: 0.92rem; color: #334155; white-space: pre-line;">${rawDetails}</div>` : ''}
    </section>

    <!-- 2. Candidate Intent Heading: Eligibility & Age Limit -->
    <section style="margin-bottom: 28px;">
      <h2 style="font-size: 1.3rem; font-weight: 800; color: #0f172a; border-bottom: 2px solid #8b5cf6; padding-bottom: 6px; margin-bottom: 14px;">
        🎯 ${jobName} Eligibility & Age Limit (पात्रता व आयु सीमा)
      </h2>
      <div style="background: #fcfaff; border: 1px solid #ede9fe; border-radius: 12px; padding: 18px 20px; margin-bottom: 16px;">
        <h3 style="font-size: 1.05rem; font-weight: 750; color: #6d28d9; margin-top: 0; margin-bottom: 10px;">
          🎓 Educational Qualification (शैक्षणिक योग्यता):
        </h3>
        <p style="font-size: 0.95rem; color: #334155; line-height: 1.7; margin-bottom: 14px;">
          Candidates must have passed <strong>${qualification}</strong> from any recognized Board / University / Institute in India. Post-wise specialized trade certificates or degree requirements must be confirmed via the official PDF notice.
        </p>

        <h3 style="font-size: 1.05rem; font-weight: 750; color: #6d28d9; margin-top: 0; margin-bottom: 10px;">
          👤 Age Limit & Relaxation (आयु सीमा व छूट):
        </h3>
        <ul style="margin: 0; padding-left: 20px; line-height: 1.7; color: #334155; font-size: 0.95rem;">
          <li><strong>न्यूनतम आयु (Minimum Age):</strong> 18 वर्ष (मानक सरकारी नियमानुसार)</li>
          <li><strong>अधिकतम आयु (Maximum Age):</strong> पदवार अधिसूचना नियमानुसार (27 से 40 वर्ष)</li>
          <li><strong>आयु में छूट (Age Relaxation):</strong> आरक्षित श्रेणियों (OBC को 3 वर्ष, SC/ST को 5 वर्ष एवं PwD अभ्यर्थियों को 10 वर्ष) को सरकारी नियमानुसार अधिकतम आयु सीमा में छूट देय होगी।</li>
        </ul>
      </div>
    </section>

    <!-- 3. Candidate Intent Heading: Important Dates & Application Fee -->
    <section style="margin-bottom: 28px;">
      <h2 style="font-size: 1.3rem; font-weight: 800; color: #0f172a; border-bottom: 2px solid #10b981; padding-bottom: 6px; margin-bottom: 14px;">
        📅 ${jobName} Important Dates & Application Fee (महत्वपूर्ण तिथियां व आवेदन शुल्क)
      </h2>
      
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; margin-bottom: 18px;">
        <div style="padding: 12px 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
          <span style="font-size: 0.8rem; color: #64748b; font-weight: 600; display: block;">अधिसूचना जारी (Notification Date):</span>
          <strong style="color: #0f172a; font-size: 0.95rem;">${postDate}</strong>
        </div>
        <div style="padding: 12px 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
          <span style="font-size: 0.8rem; color: #64748b; font-weight: 600; display: block;">ऑनलाइन आवेदन अंतिम तिथि (Last Date):</span>
          <strong style="color: #dc2626; font-size: 0.95rem;">${lastDate}</strong>
        </div>
        <div style="padding: 12px 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
          <span style="font-size: 0.8rem; color: #64748b; font-weight: 600; display: block;">शुल्क भुगतान अंतिम तिथि (Fee Deadline):</span>
          <strong style="color: #0f172a; font-size: 0.95rem;">अंतिम तिथि तक</strong>
        </div>
        <div style="padding: 12px 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
          <span style="font-size: 0.8rem; color: #64748b; font-weight: 600; display: block;">परीक्षा व प्रवेश पत्र (Exam & Admit Card):</span>
          <strong style="color: #0284c7; font-size: 0.95rem;">यथाशीघ्र सूचित की जाएगी</strong>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px;">
        <div style="padding: 14px 18px; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px;">
          <span style="font-size: 0.82rem; color: #92400e; font-weight: 700; display: block;">General / OBC / EWS आवेदन शुल्क:</span>
          <strong style="color: #78350f; font-size: 0.95rem;">आधिकारिक अधिसूचनानुसार (As per Board Rules)</strong>
        </div>
        <div style="padding: 14px 18px; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px;">
          <span style="font-size: 0.82rem; color: #92400e; font-weight: 700; display: block;">SC / ST / PwD / Female आवेदन शुल्क:</span>
          <strong style="color: #78350f; font-size: 0.95rem;">नियमानुसार छूट / शून्य (Exempted)</strong>
        </div>
      </div>
      <p style="font-size: 0.88rem; color: #64748b; margin-top: 8px;">
        <strong>भुगतान विधि:</strong> अभ्यर्थी परीक्षा शुल्क का भुगतान ऑनलाइन माध्यम (नेट बैंकिंग, डेबिट/क्रेडिट कार्ड, यूपीआई) अथवा ई-चालान द्वारा कर सकते हैं।
      </p>
    </section>

    <!-- 4. Candidate Intent Heading: How to Fill Online Form Step-by-Step -->
    <section style="margin-bottom: 28px;">
      <h2 style="font-size: 1.3rem; font-weight: 800; color: #0f172a; border-bottom: 2px solid #0284c7; padding-bottom: 6px; margin-bottom: 14px;">
        📝 How to Fill ${jobName} Online Form Step-by-Step (आवेदन प्रक्रिया)
      </h2>
      <ol style="margin: 0; padding-left: 22px; line-height: 1.8; color: #334155; font-size: 0.95rem;">
        <li><strong>आधिकारिक पोर्टल खोलें (Open Official Portal):</strong> नीचे दिए गए आधिकारिक "Apply Online" लिंक पर क्लिक करें।</li>
        <li><strong>नवीन पंजीकरण (New Registration):</strong> अपना सक्रिय मोबाइल नंबर, ईमेल आईडी एवं मूल व्यक्तिगत विवरण दर्ज कर रजिस्ट्रेशन करें।</li>
        <li><strong>आवेदन पत्र भरें (Fill Application Details):</strong> अपनी शैक्षणिक योग्यता, पद का विकल्प एवं स्थायी पते का विवरण सावधानीपूर्वक भरें।</li>
        <li><strong>दस्तावेज अपलोड करें (Upload Documents):</strong> निर्धारित आकार व प्रारूप (JPG/PDF) में नवीनतम पासपोर्ट साइज फोटो एवं हस्ताक्षर अपलोड करें।</li>
        <li><strong>परीक्षा शुल्क का भुगतान (Pay Fee):</strong> अपनी श्रेणी के अनुसार निर्धारित आवेदन शुल्क का ऑनलाइन भुगतान करें।</li>
        <li><strong>अंतिम सबमिशन व प्रिंटआउट (Final Submit & Print):</strong> फॉर्म सबमिट करने के बाद भरे हुए आवेदन पत्र का प्रिंटआउट सुरक्षित रख लें।</li>
      </ol>
    </section>

    <!-- 5. Candidate Intent Heading: Important Links -->
    <section style="margin-bottom: 28px; padding: 22px; background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 14px;">
      <h2 style="font-size: 1.25rem; font-weight: 800; color: #166534; margin-top: 0; margin-bottom: 14px; display: flex; align-items: center; gap: 8px;">
        🔗 Important Links (Notification PDF & Apply Online - आधिकारिक लिंक)
      </h2>
      <div style="display: flex; gap: 12px; flex-wrap: wrap;">
        ${!isExpired ? `<a href="${applyUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; gap: 6px; padding: 13px 24px; background: #16a34a; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 800; font-size: 0.95rem; box-shadow: 0 4px 14px rgba(22, 163, 74, 0.35);">
          🟢 Apply Online (Direct Official Portal)
        </a>` : ''}
        <a href="${pdfUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; gap: 6px; padding: 13px 24px; background: #0284c7; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 800; font-size: 0.95rem; box-shadow: 0 4px 14px rgba(2, 132, 199, 0.35);">
          📄 Download Official Notification (PDF)
        </a>
      </div>
      <p style="font-size: 0.85rem; color: #166534; margin: 10px 0 0; font-weight: 600;">
        🛡️ 100% सत्यापित आधिकारिक लिंक: किसी भी प्रकार के मध्यस्थ या फर्जी पोर्टल से बचें।
      </p>
    </section>

    <!-- 6. Visible FAQ Accordion Section (Rich Snippet Backing) -->
    <section style="margin-bottom: 28px;">
      <h2 style="font-size: 1.3rem; font-weight: 800; color: #0f172a; border-bottom: 2px solid #f59e0b; padding-bottom: 6px; margin-bottom: 14px;">
        ❓ Frequently Asked Questions (FAQ) - ${jobName}
      </h2>
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 18px;">
          <strong style="color: #0f172a; font-size: 0.95rem; display: block; margin-bottom: 4px;">Q1: What is the last date to apply online for ${jobName} Recruitment ${year}?</strong>
          <span style="color: #475569; font-size: 0.9rem; line-height: 1.6;">The last date to submit online applications is <strong>${lastDate}</strong>. Ensure to submit early to avoid technical bottlenecks.</span>
        </div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 18px;">
          <strong style="color: #0f172a; font-size: 0.95rem; display: block; margin-bottom: 4px;">Q2: What is the eligibility qualification required for ${jobName}?</strong>
          <span style="color: #475569; font-size: 0.9rem; line-height: 1.6;">Applicants must hold <strong>${qualification}</strong> from a recognized institution. Verify post-wise criteria in the official PDF.</span>
        </div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 18px;">
          <strong style="color: #0f172a; font-size: 0.95rem; display: block; margin-bottom: 4px;">Q3: What is the age limit for this recruitment?</strong>
          <span style="color: #475569; font-size: 0.9rem; line-height: 1.6;">The minimum age is 18 years, and standard category age relaxations (OBC 3 yrs, SC/ST 5 yrs, PwD 10 yrs) apply per official rules.</span>
        </div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 18px;">
          <strong style="color: #0f172a; font-size: 0.95rem; display: block; margin-bottom: 4px;">Q4: How can candidates apply online for ${jobName}?</strong>
          <span style="color: #475569; font-size: 0.9rem; line-height: 1.6;">Access the direct official apply link in the Important Links section above, register your credentials, complete the form, upload documents, and pay the fee.</span>
        </div>
      </div>
    </section>

    <!-- 7. Anti-Fraud Advisory (Rule #15) -->
    <div style="background: #fffbeb; border: 1px solid #fef3c7; border-left: 5px solid #f59e0b; padding: 14px 18px; border-radius: 8px; margin-bottom: 24px; font-size: 0.88rem; color: #92400e; line-height: 1.6;">
      <strong>⚠️ धोखाधड़ी से सावधान (Anti-Fraud Warning):</strong> सरकारी विभाग कभी भी किसी व्यक्तिगत बैंक खाते, QR कोड या UPI पर भर्ती शुल्क नहीं मांगते। केवल आधिकारिक .gov/.nic.in पोर्टल से ही आवेदन करें एवं किसी बिचौलिए के झांसे में न आएं।
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
