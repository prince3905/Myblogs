const express = require('express');
const requireAuth = require('../../shared/middleware/auth.middleware');
const Ad = require('./ad.model');

const router = express.Router();
const adminRouter = express.Router();
adminRouter.use(requireAuth);

const slots = ['sidebar', 'incontent', 'afterpost'];

async function ensureSlots() {
  for (const slot of slots) {
    await Ad.findOneAndUpdate(
      { slot },
      { $setOnInsert: { slot, code: '' } },
      { upsert: true }
    );
  }
}

// Public: get all ad codes
router.get('/ads', async (req, res, next) => {
  try {
    await ensureSlots();
    const ads = await Ad.find().lean();
    const result = {};
    ads.forEach(a => { result[a.slot] = a.code; });
    res.json(result);
  } catch (err) { next(err); }
});

// Admin: get all ad codes
adminRouter.get('/ads', async (req, res, next) => {
  try {
    await ensureSlots();
    const ads = await Ad.find().lean();
    res.json(ads);
  } catch (err) { next(err); }
});

// Admin: update ad code for a slot
adminRouter.put('/ads/:slot', async (req, res, next) => {
  try {
    const { slot } = req.params;
    if (!slots.includes(slot)) return res.status(400).json({ error: 'Invalid slot' });
    const ad = await Ad.findOneAndUpdate(
      { slot },
      { code: req.body.code || '' },
      { upsert: true, new: true }
    );
    res.json(ad);
  } catch (err) { next(err); }
});

module.exports = { public: router, admin: adminRouter };
