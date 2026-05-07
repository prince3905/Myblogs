const { body } = require('express-validator');

const createPostValidator = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }).withMessage('Title must be less than 200 characters'),
  body('content').trim().notEmpty().withMessage('Content is required'),
  body('excerpt').optional().trim().isLength({ max: 500 }).withMessage('Excerpt must be less than 500 characters'),
  body('status').optional().isIn(['draft', 'published']).withMessage('Status must be draft or published'),
  body('category').optional().trim(),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('featuredImage').optional().isURL().withMessage('Featured image must be a valid URL'),
  body('seoTitle').optional().trim().isLength({ max: 60 }).withMessage('SEO title must be less than 60 characters'),
  body('seoDescription').optional().trim().isLength({ max: 160 }).withMessage('SEO description must be less than 160 characters'),
  body('seoKeywords').optional().trim(),
  body('canonicalUrl').optional().isURL().withMessage('Canonical URL must be a valid URL')
];

const updatePostValidator = [
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty').isLength({ max: 200 }).withMessage('Title must be less than 200 characters'),
  body('content').optional().trim().notEmpty().withMessage('Content cannot be empty'),
  body('excerpt').optional().trim().isLength({ max: 500 }).withMessage('Excerpt must be less than 500 characters'),
  body('status').optional().isIn(['draft', 'published']).withMessage('Status must be draft or published'),
  body('category').optional().trim(),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('featuredImage').optional().isURL().withMessage('Featured image must be a valid URL'),
  body('seoTitle').optional().trim().isLength({ max: 60 }).withMessage('SEO title must be less than 60 characters'),
  body('seoDescription').optional().trim().isLength({ max: 160 }).withMessage('SEO description must be less than 160 characters'),
  body('seoKeywords').optional().trim(),
  body('canonicalUrl').optional().isURL().withMessage('Canonical URL must be a valid URL')
];

module.exports = { createPostValidator, updatePostValidator };
