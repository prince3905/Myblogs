const mongoose = require('mongoose');

/**
 * Official verified government TLDs & multilateral domains.
 * STRICT RULE: No promotional, affiliate, or third-party links permitted.
 */
const OFFICIAL_GOV_TLD_REGEX = /(\.gov|\.gob|\.gouv|\.go\.[a-z]{2}|\.gov\.[a-z]{2}|\.govt\.[a-z]{2}|\.nic\.in|\.gc\.ca|canada\.ca|un\.org|who\.int|worldbank\.org|reliefweb\.int|europa\.eu|imf\.org|oecd\.org|interpol\.int)/i;

function validateOfficialUrl(val) {
  if (!val) return true;
  return OFFICIAL_GOV_TLD_REGEX.test(val);
}

const globalJobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  originalTitle: {
    type: String,
    trim: true
  },
  countryCode: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
    index: true // ISO-3166-1 alpha-2 (e.g., 'IN', 'US', 'AE', 'SA', 'UN')
  },
  countryName: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  countryFlag: {
    type: String,
    default: '🌐'
  },
  continent: {
    type: String,
    required: true,
    enum: ['Multilateral', 'Asia', 'Europe', 'Americas', 'Africa', 'Oceania'],
    index: true
  },
  agencyOrMinistry: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  officialReferenceId: {
    type: String,
    trim: true,
    sparse: true
  },
  jobType: {
    type: String,
    enum: [
      'Civil Service / Administrative',
      'Healthcare & Medical',
      'Tech & Engineering',
      'Defense, Police & Security',
      'Education & Academia',
      'Diplomatic & International Relations',
      'Finance, Revenue & Audit',
      'General Public Service'
    ],
    default: 'General Public Service',
    index: true
  },
  dutyStation: {
    type: String,
    default: 'Nationwide / Headquarters'
  },
  salary: {
    amount: { type: String, default: 'As per Official Gazette Scale' },
    currency: { type: String, default: 'USD' },
    approxUsd: { type: String }
  },
  eligibility: {
    citizenshipRequired: { type: Boolean, default: false }, // false = Open to Expats/Global
    visaSponsored: { type: Boolean, default: false },
    education: { type: String, default: 'Refer to Official Gazette' },
    experience: { type: String, default: 'As per Service Commission Rules' },
    ageLimit: { type: String, default: 'As per Official Gazette' }
  },
  officialGazetteSummary: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  departmentOverview: {
    type: String,
    trim: true
  },
  keyResponsibilities: [{
    type: String,
    trim: true
  }],
  benefits: [{
    type: String,
    trim: true
  }],
  howToApply: {
    type: String,
    trim: true
  },
  officialNoticeUrl: {
    type: String,
    required: true,
    validate: [validateOfficialUrl, 'Only official government (.gov, .gob, .gouv, .go.*) or multilateral (un.org, etc.) URLs allowed']
  },
  officialPdfUrl: {
    type: String,
    validate: [validateOfficialUrl, 'Only official government or multilateral PDF URLs allowed']
  },
  applicationDeadline: {
    type: Date,
    index: true
  },
  sourceProvider: {
    type: String,
    enum: ['reliefweb', 'usajobs', 'gulf', 'adzuna', 'gazette', 'manual'],
    default: 'reliefweb',
    index: true
  },
  verificationStatus: {
    type: String,
    enum: ['VERIFIED_OFFICIAL_GAZETTE', 'GOVERNMENT_PORTAL_CONFIRMED'],
    default: 'VERIFIED_OFFICIAL_GAZETTE'
  },
  // Multilingual Cache: populated by Hy-MT2 or lightweight translator
  translations: {
    hi: {
      title: String,
      agency: String,
      dutyStation: String,
      eligibility: String,
      salary: String
    },
    es: {
      title: String,
      agency: String,
      dutyStation: String,
      eligibility: String,
      salary: String
    },
    ar: {
      title: String,
      agency: String,
      dutyStation: String,
      eligibility: String,
      salary: String
    },
    fr: {
      title: String,
      agency: String,
      dutyStation: String,
      eligibility: String,
      salary: String
    },
    de: {
      title: String,
      agency: String,
      dutyStation: String,
      eligibility: String,
      salary: String
    }
  }
}, {
  timestamps: true
});

// 🔥 60-DAY ZERO-COST AUTO-PURGE TTL INDEX
// Automatically removes entries older than 60 days to keep MongoDB Atlas free tier permanently under 40MB!
globalJobSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 24 * 60 * 60 });

// Compound indexes for lightning-fast geo-priority and chronological sorting
globalJobSchema.index({ countryCode: 1, createdAt: -1 });
globalJobSchema.index({ continent: 1, createdAt: -1 });
globalJobSchema.index({ jobType: 1, createdAt: -1 });
globalJobSchema.index({ applicationDeadline: 1, createdAt: -1 });

// Deduplication index: Prevents re-inserting the same job notice
globalJobSchema.index({ countryCode: 1, officialReferenceId: 1 }, { unique: true, sparse: true });

const GlobalJob = mongoose.model('GlobalJob', globalJobSchema);

module.exports = GlobalJob;
module.exports.OFFICIAL_GOV_TLD_REGEX = OFFICIAL_GOV_TLD_REGEX;
