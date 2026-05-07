const slugify = require('slugify');

function makeSlug(title, fallback = 'post') {
  return slugify(title || fallback, { lower: true, strict: true, trim: true });
}

function normalizeCsvOrArray(value) {
  if (Array.isArray(value)) {
    return value.map((item) => `${item}`.trim()).filter(Boolean);
  }

  return `${value || ''}`
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function calculateReadingTime(content) {
  const words = `${content || ''}`.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

module.exports = {
  makeSlug,
  normalizeCsvOrArray,
  calculateReadingTime
};
