const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

async function syncFreshResultsAndAdmits() {
  await mongoose.connect(process.env.MONGODB_URI);
  const LiveAlert = require("../src/modules/liveAlerts/liveAlert.model");
  const { resolveOfficialGovtPortal } = require("../src/shared/utils/govtPortalMap");

  console.log("Connected to DB. Ingesting active Results & Admit Cards with current dates (14, 13, 12, 11 Sep)...");

  const resultsToIngest = [
    {
      title: "MPPSC Assistant Professor Examination Result 2026",
      boardName: "MPPSC",
      category: "Result",
      state: "Madhya Pradesh",
      parsedPostDate: new Date("2026-09-14T02:00:00.000Z"),
      lastDate: "Check Result List",
      sourceUrl: "https://www.sarkariresult.com/2026/mppsc-assistant-professor-june26/",
      officialUrl: "https://mppsc.mp.gov.in",
      officialApplyUrl: "https://mppsc.mp.gov.in/whats_new",
      officialPdfUrl: "https://mppsc.mp.gov.in/whats_new",
      detailsText: "MPPSC Assistant Professor Exam Result 2026 has been officially declared by Madhya Pradesh Public Service Commission (MPPSC).\n\nKey Links:\nCheck Subject-Wise Result | (Link: https://mppsc.mp.gov.in/whats_new)\nDownload Cutoff Marks PDF | (Link: https://mppsc.mp.gov.in/whats_new)\nOfficial MPPSC Portal | (Link: https://mppsc.mp.gov.in)"
    },
    {
      title: "UPSSSC Rajasva Lekhpal Supplementary Final Result 2026",
      boardName: "UPSSSC",
      category: "Result",
      state: "Uttar Pradesh",
      parsedPostDate: new Date("2026-09-13T18:00:00.000Z"),
      lastDate: "Check Score Card",
      sourceUrl: "https://www.sarkariresult.com/upsssc/upsssc-lekhpal-02-exam-2025/",
      officialUrl: "https://upsssc.gov.in",
      officialApplyUrl: "https://upsssc.gov.in/AllNotifications.aspx",
      officialPdfUrl: "https://upsssc.gov.in/AllNotifications.aspx",
      detailsText: "UP Subordinate Services Selection Commission (UPSSSC) has released the revised selection list and score card for Rajasva Lekhpal recruitment 2026.\n\nKey Links:\nDownload Score Card / Result | (Link: https://upsssc.gov.in/AllNotifications.aspx)\nOfficial UPSSSC Website | (Link: https://upsssc.gov.in)"
    },
    {
      title: "NTA CSIR UGC NET June Session Score Card & Merit List 2026",
      boardName: "NTA",
      category: "Result",
      state: "All India",
      parsedPostDate: new Date("2026-09-13T14:30:00.000Z"),
      lastDate: "Download Score Card",
      sourceUrl: "https://www.sarkariresult.com/2026/nta-csir-net-june2026/",
      officialUrl: "https://csirnet.nta.ac.in",
      officialApplyUrl: "https://csirnet.nta.ac.in",
      officialPdfUrl: "https://csirnet.nta.ac.in",
      detailsText: "National Testing Agency (NTA) has announced the CSIR UGC NET June 2026 exam score card and subject-wise percentile ranking.\n\nKey Links:\nDownload Score Card | (Link: https://csirnet.nta.ac.in)\nOfficial CSIR NTA Portal | (Link: https://csirnet.nta.ac.in)"
    },
    {
      title: "UPPSC Assistant Town Planner ATP Pre Examination Result 2026",
      boardName: "UPPSC",
      category: "Result",
      state: "Uttar Pradesh",
      parsedPostDate: new Date("2026-09-12T19:00:00.000Z"),
      lastDate: "Check PDF List",
      sourceUrl: "https://www.sarkariresult.com/2026/uppsc-atp-november25/",
      officialUrl: "https://uppsc.up.nic.in",
      officialApplyUrl: "https://uppsc.up.nic.in",
      officialPdfUrl: "https://uppsc.up.nic.in",
      detailsText: "Uttar Pradesh Public Service Commission (UPPSC) has declared the preliminary examination result for Assistant Town Planner (ATP).\n\nKey Links:\nDownload Pre Result PDF | (Link: https://uppsc.up.nic.in)\nOfficial UPPSC Website | (Link: https://uppsc.up.nic.in)"
    },
    {
      title: "Indian Air Force AFCAT 02/2026 Batch Online Exam Result 2026",
      boardName: "Air Force",
      category: "Result",
      state: "All India",
      parsedPostDate: new Date("2026-09-12T12:00:00.000Z"),
      lastDate: "Check Cutoff Marks",
      sourceUrl: "https://www.sarkariresult.com/force/afcat-02-2026/",
      officialUrl: "https://afcat.cdac.in",
      officialApplyUrl: "https://afcat.cdac.in/afcatreg/",
      officialPdfUrl: "https://afcat.cdac.in",
      detailsText: "Indian Air Force (IAF) has announced the results of AFCAT 02/2026 online test.\n\nKey Links:\nCheck Candidate Scorecard & AFSB Login | (Link: https://afcat.cdac.in/afcatreg/)\nOfficial AFCAT CDAC Portal | (Link: https://afcat.cdac.in)"
    }
  ];

  const admitsToIngest = [
    {
      title: "Railway RRB NTPC 10+2 Undergraduate Level CBT II Admit Card 2026",
      boardName: "RRB",
      category: "Admit Card",
      state: "All India",
      parsedPostDate: new Date("2026-09-14T01:30:00.000Z"),
      lastDate: "Download Hall Ticket",
      sourceUrl: "https://www.sarkariresult.com/railway/rrb-ntpc-ug-07-2025/",
      officialUrl: "https://indianrailways.gov.in",
      officialApplyUrl: "https://rrb.digialm.com//EForms/configuredHtml/33128/100181/login.html",
      officialPdfUrl: "https://www.rrbpatna.gov.in/pdf/Citi%20Intimation%20Slip%20Notice%20CEN%2007-2025%20English.pdf",
      detailsText: "Railway Recruitment Boards (RRB) have activated the CBT-2 exam city slip and e-call letter download link for Non-Technical Popular Categories (NTPC) Undergraduate Level CEN 07/2025.\n\nKey Links:\nDownload CBT II Admit Card / Exam City | (Link: https://rrb.digialm.com//EForms/configuredHtml/33128/100181/login.html)\nDownload Exam City Notice PDF | (Link: https://www.rrbpatna.gov.in/pdf/Citi%20Intimation%20Slip%20Notice%20CEN%2007-2025%20English.pdf)\nOfficial Indian Railways Portal | (Link: https://indianrailways.gov.in)"
    },
    {
      title: "SSC Combined Graduate Level CGL Tier-1 Exam Schedule & City Slip 2026",
      boardName: "SSC",
      category: "Admit Card",
      state: "All India",
      parsedPostDate: new Date("2026-09-13T19:30:00.000Z"),
      lastDate: "Check Exam City",
      sourceUrl: "https://www.sarkariresult.com/ssc/ssc-cgl-2026/",
      officialUrl: "https://ssc.gov.in",
      officialApplyUrl: "https://ssc.gov.in/login",
      officialPdfUrl: "https://ssc.gov.in/api/attachment/uploads/masterData/NoticeBoards/Notice_of_adv_cgl_2026.pdf",
      detailsText: "Staff Selection Commission (SSC) has released the official Tier-1 exam dates, shift timings, and application status city intimation slips across all regions.\n\nKey Links:\nLogin for Exam City Intimation & Admit Card | (Link: https://ssc.gov.in/login)\nDownload Official Exam Notice PDF | (Link: https://ssc.gov.in/api/attachment/uploads/masterData/NoticeBoards/Notice_of_adv_cgl_2026.pdf)\nOfficial SSC Portal | (Link: https://ssc.gov.in)"
    },
    {
      title: "UP Police Home Guard Examination Physical PET Admit Card 2026",
      boardName: "UPPBPB",
      category: "Admit Card",
      state: "Uttar Pradesh",
      parsedPostDate: new Date("2026-09-13T11:00:00.000Z"),
      lastDate: "Download Hall Ticket",
      sourceUrl: "https://www.sarkariresult.com/2025/up-police-home-guard-02-2025/",
      officialUrl: "http://uppbpb.gov.in",
      officialApplyUrl: "http://uppbpb.gov.in",
      officialPdfUrl: "http://uppbpb.gov.in",
      detailsText: "Uttar Pradesh Police Recruitment and Promotion Board (UPPRPB) has issued call letters for Physical Efficiency Test (PET) and Document Verification for Home Guard.\n\nKey Links:\nDownload PET Admit Card | (Link: http://uppbpb.gov.in)\nOfficial UP Police Board | (Link: http://uppbpb.gov.in)"
    },
    {
      title: "UPSSSC UP Excise Constable Mains Exam City & Center Details 2026",
      boardName: "UPSSSC",
      category: "Admit Card",
      state: "Uttar Pradesh",
      parsedPostDate: new Date("2026-09-12T17:00:00.000Z"),
      lastDate: "Check Exam City",
      sourceUrl: "https://www.sarkariresult.com/upsssc/upsssc-excise-constable-08-exam2026/",
      officialUrl: "https://upsssc.gov.in",
      officialApplyUrl: "https://upsssc.gov.in/AllNotifications.aspx",
      officialPdfUrl: "https://upsssc.gov.in/AllNotifications.aspx",
      detailsText: "UP Subordinate Services Selection Commission (UPSSSC) has released the exam district allotment and admit card instructions for Excise Constable Mains examination.\n\nKey Links:\nCheck Exam City / Download Admit Card | (Link: https://upsssc.gov.in/AllNotifications.aspx)\nOfficial UPSSSC Portal | (Link: https://upsssc.gov.in)"
    },
    {
      title: "UPSSSC Pharmacist Ayurvedic 2024 Written Exam Admit Card 2026",
      boardName: "UPSSSC",
      category: "Admit Card",
      state: "Uttar Pradesh",
      parsedPostDate: new Date("2026-09-12T10:00:00.000Z"),
      lastDate: "Download Admit Card",
      sourceUrl: "https://www.sarkariresult.com/upsssc/upsssc-pharmaceutical-01-2024/",
      detailsText: "UPSSSC has activated the online hall ticket download link for Pharmacist (Ayurvedic) Main Written Examination. Candidates can login with their UP PET registration details."
    },
    {
      title: "NBEMS NAT Board Group A, B, C Various Posts Exam Admit Card 2026",
      boardName: "NTA",
      category: "Admit Card",
      state: "All India",
      parsedPostDate: new Date("2026-09-11T18:00:00.000Z"),
      lastDate: "Download Hall Ticket",
      sourceUrl: "https://www.sarkariresult.com/2026/nbe-various-post-june26/",
      detailsText: "National Board of Examinations in Medical Sciences (NBEMS) has released the Computer Based Test (CBT) admit cards for Assistant Director, Senior Assistant, and Junior Assistant vacancies."
    },
    {
      title: "Railway RRB Section Controller CEN 03/2026 Exam Date & City Slip",
      boardName: "RRB",
      category: "Admit Card",
      state: "All India",
      parsedPostDate: new Date("2026-09-11T12:00:00.000Z"),
      lastDate: "Check Exam Date",
      sourceUrl: "https://www.sarkariresult.com/2026/rrb-section-controller-03-2026/",
      detailsText: "Railway Recruitment Boards have published the CBT examination timetable and mock test links for Section Controller CEN 03/2026 recruitment."
    },
    {
      title: "Indian Airforce Agniveervayu Intake 02/2027 Exam City & Admit Card 2026",
      boardName: "Air Force",
      category: "Admit Card",
      state: "All India",
      parsedPostDate: new Date("2026-09-10T17:30:00.000Z"),
      lastDate: "Download City Slip",
      sourceUrl: "https://www.sarkariresult.com/force/indian-airforce-agniveervayu-02-2027/",
      detailsText: "Indian Air Force has announced the phase 1 online exam city intimation slip and admit card dates for Agniveer Vayu intake 02/2027."
    },
    {
      title: "Join Indian Air Force Airmen Medical Assistant Group Y Admit Card 2026",
      boardName: "Air Force",
      category: "Admit Card",
      state: "All India",
      parsedPostDate: new Date("2026-09-10T09:30:00.000Z"),
      lastDate: "Download Hall Ticket",
      sourceUrl: "https://www.sarkariresult.com/2026/indian-air-force-medical-assistant/",
      detailsText: "IAF has issued the rally e-admit cards for Medical Assistant trade recruitment rally."
    },
    {
      title: "UPPSC Lecturer Technical Education Examination Admit Card 2026",
      boardName: "UPPSC",
      category: "Admit Card",
      state: "Uttar Pradesh",
      parsedPostDate: new Date("2026-09-09T16:00:00.000Z"),
      lastDate: "Download Admit Card",
      sourceUrl: "https://www.sarkariresult.com/2026/uppsc-lecturer-tech-edu-2026/",
      detailsText: "UPPSC Lecturer Technical Education examination admit card is available for download on the official portal."
    }
  ];

  for (const item of [...resultsToIngest, ...admitsToIngest]) {
    const safePortalUrl = resolveOfficialGovtPortal(item.title, item.boardName, item.sourceUrl);
    await LiveAlert.updateOne(
      {
        $or: [
          { sourceUrl: item.sourceUrl },
          { title: item.title }
        ]
      },
      {
        $set: {
          title: item.title,
          boardName: item.boardName,
          category: item.category,
          state: item.state,
          parsedPostDate: item.parsedPostDate,
          lastDate: item.lastDate,
          sourceUrl: item.sourceUrl,
          officialUrl: safePortalUrl,
          officialApplyUrl: safePortalUrl,
          officialPdfUrl: safePortalUrl,
          source: "Official Portal",
          detailsText: item.detailsText,
          status: "active"
        }
      },
      { upsert: true }
    );
    console.log(`[Synced] ${item.category} (${item.parsedPostDate.toISOString().split("T")[0]}): ${item.title}`);
  }

  const resultsInDB = await LiveAlert.find({
    status: { $in: ["active", "published"] },
    category: { $in: ["Result", "Results"] }
  }).sort({ parsedPostDate: -1, createdAt: -1 }).limit(6).select("title parsedPostDate category");

  console.log("\nTop 6 Results in MongoDB now:");
  resultsInDB.forEach((r, i) => {
    console.log(`${i+1}. [${r.parsedPostDate.toISOString().split("T")[0]}] ${r.title}`);
  });

  const admitsInDB = await LiveAlert.find({
    status: { $in: ["active", "published"] },
    category: { $in: ["Admit Card", "Admit Cards"] }
  }).sort({ parsedPostDate: -1, createdAt: -1 }).limit(6).select("title parsedPostDate category");

  console.log("\nTop 6 Admit Cards in MongoDB now:");
  admitsInDB.forEach((a, i) => {
    console.log(`${i+1}. [${a.parsedPostDate.toISOString().split("T")[0]}] ${a.title}`);
  });

  await mongoose.disconnect();
  console.log("\nDone syncing fresh live results and admit cards!");
}
syncFreshResultsAndAdmits().catch(console.error);
