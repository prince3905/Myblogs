const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const GlobalJob = require('../src/modules/globalJobs/globalJob.model');

async function enrichAllJobs() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  console.log('Connecting to MongoDB to enrich all existing global jobs...');

  const jobs = await GlobalJob.find({});
  console.log(`Found ${jobs.length} jobs to inspect and enrich...`);

  let updated = 0;

  for (const job of jobs) {
    let needsSave = false;

    // 1. Description & Gazette Summary
    if (!job.description || job.description.length < 30) {
      job.description = `This official public service position is established under ${job.agencyOrMinistry} representing the jurisdiction of ${job.countryName}. The appointed officer will support public administrative operations, policy directives, and ministerial initiatives within the ${job.jobType || 'Civil Service'} division. This public appointment includes comprehensive government benefits, career advancement opportunities, and statutory employment stability.`;
      needsSave = true;
    }

    if (!job.officialGazetteSummary) {
      job.officialGazetteSummary = `Official Gazette Circular: ${job.title}\nAuthority: ${job.agencyOrMinistry}\nJurisdiction: ${job.countryName} (${job.continent})\nDuty Station: ${job.dutyStation}\nPay Scale: ${job.salary?.amount || 'Competitive Official Scale'}\nApplication Deadline: ${job.applicationDeadline ? new Date(job.applicationDeadline).toLocaleDateString() : 'As per official announcement'}\nDirect online application accessible via verified official government portal.`;
      needsSave = true;
    }

    // 2. Key Responsibilities
    if (!job.keyResponsibilities || job.keyResponsibilities.length === 0) {
      job.keyResponsibilities = [
        `Execute official administrative, technical, or operational duties under the oversight of ${job.agencyOrMinistry}.`,
        `Maintain strict compliance with civil service laws, departmental protocols, and national governance frameworks.`,
        `Collaborate with inter-ministerial task forces and public service teams to achieve performance milestones.`,
        `Prepare briefing memoranda, executive filings, and technical progress reports for senior leadership.`,
        `Uphold transparency, integrity, and operational quality in all public interactions and project delivery.`
      ];
      needsSave = true;
    }

    // 3. Benefits
    if (!job.benefits || job.benefits.length === 0) {
      if (job.countryCode === 'US') {
        job.benefits = [
          'Federal Health, Dental & Vision Insurance (FEHB & FEDVIP Programs)',
          'Thrift Savings Plan (TSP) with Generous Government Agency Matching',
          'Official Federal Civil Service Pension (FERS Retirement System)',
          'Paid Annual Leave, Federal Holidays & 12 Weeks Paid Parental Leave',
          'Student Loan Repayment Program & Professional Training Opportunities'
        ];
      } else if (job.countryCode === 'GB') {
        job.benefits = [
          'Civil Service Pension Scheme with One of the Highest Employer Contributions',
          '25 Days Initial Paid Annual Leave, Rising to 30 Days + 8 Public Holidays',
          'Flexible Working Arrangements, Hybrid Working & Special Leave Entitlements',
          'Employee Assistance Program & Comprehensive Wellbeing Services',
          'Established Civil Service Fast Stream & Career Progression Pathways'
        ];
      } else if (['SA', 'AE', 'QA'].includes(job.countryCode)) {
        job.benefits = [
          '100% Tax-Free Competitive Government Compensation Package',
          'Comprehensive Family Medical & Health Insurance Coverage',
          'Housing Allowance or Furnished Government-Sponsored Accommodation',
          '30 Days Annual Paid Leave with Annual Return Flight Tickets',
          'End-of-Service Statutory Gratuity Benefit as per National Labor Law'
        ];
      } else {
        job.benefits = [
          'Official Public Service Compensation Package with Statutory Allowances',
          'Comprehensive Health, Medical & Occupational Safety Coverage',
          'Official Government Civil Service / Multilateral Pension Entitlements',
          'Generous Paid Annual Leave, Public Holidays & Sabbatical Provisions',
          'Equal Opportunity Employment with Structured Promotion Criteria'
        ];
      }
      needsSave = true;
    }

    // 4. How to Apply
    if (!job.howToApply) {
      job.howToApply = `1. Click the 'Apply on Official Portal' button below to navigate directly to the verified ${job.agencyOrMinistry} portal.\n2. Review the formal Gazette circular and confirm your eligibility regarding educational qualifications and experience.\n3. Prepare your official government resume/CV, certified degree copies, and required identification documents.\n4. Complete the official online application form and note down your Reference Code (${job.officialReferenceId || 'Official Reference'}) for tracking.\n5. Submit your application prior to the closing deadline (${job.applicationDeadline ? new Date(job.applicationDeadline).toLocaleDateString() : 'Closing Date'}).`;
      needsSave = true;
    }

    // 5. Eligibility Age limit
    if (!job.eligibility?.ageLimit || job.eligibility.ageLimit === 'As per Official Gazette') {
      job.eligibility = job.eligibility || {};
      job.eligibility.ageLimit = ['US', 'GB', 'CA', 'AU'].includes(job.countryCode) ? '18 to 62 years' : '21 to 55 years';
      needsSave = true;
    }

    if (needsSave) {
      await job.save();
      updated++;
    }
  }

  console.log(`\nSuccessfully enriched ${updated} global jobs with full descriptions, responsibilities, benefits, and application guidelines!`);
  process.exit(0);
}

enrichAllJobs().catch(e => {
  console.error(e);
  process.exit(1);
});
