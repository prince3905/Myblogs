const mongoose = require('mongoose');

const slideSchema = new mongoose.Schema({
  heading: { type: String, required: true, trim: true },
  text: { type: String, required: true, trim: true },
  image: { type: String, required: true, trim: true }
});

const webStorySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'BlogPost', required: true },
    slides: { type: [slideSchema], required: true },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    views: { type: Number, default: 0 }
  },
  { timestamps: true }
);

webStorySchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('WebStory', webStorySchema);
