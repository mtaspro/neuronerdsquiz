import express from 'express';
import { sessionMiddleware } from '../middleware/sessionMiddleware.js';
import UserStats from '../models/UserStats.js';
import User from '../models/User.js';

const router = express.Router();

// ponytail: fixed reward table keyed by levelKey — client cannot set arbitrary
// points. Server derives chapterId by prefixing levelKey up to the level slug.
const LEVELS = {
  'vector-level-1': { chapterId: 'vector', auraPoints: 100, inGameTokens: 50 },
  'vector-scene-1': { chapterId: 'vector', auraPoints: 100, inGameTokens: 50 },
  'vector-scene-2': { chapterId: 'vector', auraPoints: 100, inGameTokens: 50 },
  'vector-scene-3': { chapterId: 'vector', auraPoints: 120, inGameTokens: 60 },
  'chem-level-1':   { chapterId: 'chemistry', auraPoints: 100, inGameTokens: 50 },
  'chem-organic-quest': { chapterId: 'chemistry', auraPoints: 120, inGameTokens: 60 },
};

async function getOrCreateStats(userId) {
  let stats = await UserStats.findOne({ userId });
  if (!stats) {
    const user = await User.findById(userId).select('username');
    stats = new UserStats({ userId, username: user?.username || 'player' });
  }
  return stats;
}

// GET /api/adventure/state — user's campaign progress + wallet
router.get('/state', sessionMiddleware, async (req, res) => {
  try {
    const stats = await getOrCreateStats(req.user.userId);
    if (stats.isNew) await stats.save();

    const completedLevels = [];
    const stars = {};
    for (const cp of stats.campaignProgress || []) {
      for (const lvl of cp.completedLevels || []) {
        completedLevels.push(lvl);
        const s = cp.stars?.get?.(lvl) ?? cp.stars?.[lvl];
        if (s != null) stars[lvl] = s;
      }
    }

    res.json({
      auraPoints: stats.auraPoints || 0,
      inGameTokens: stats.inGameTokens || 0,
      completedLevels,
      stars,
    });
  } catch (error) {
    console.error('Adventure state error:', error);
    res.status(500).json({ error: 'Failed to fetch adventure state' });
  }
});

// POST /api/adventure/complete — record a finished level
router.post('/complete', sessionMiddleware, async (req, res) => {
  try {
    const { levelKey, success, stars } = req.body || {};

    const level = LEVELS[levelKey];
    if (!level) {
      return res.status(400).json({ error: 'Unknown levelKey' });
    }
    if (success !== true) {
      return res.status(400).json({ error: 'Level not completed successfully' });
    }
    const starCount = Number.isInteger(stars) ? Math.max(0, Math.min(3, stars)) : 0;

    const stats = await getOrCreateStats(req.user.userId);
    if (stats.isNew) await stats.save();

    let chapter = stats.campaignProgress.find((c) => c.chapterId === level.chapterId);
    if (!chapter) {
      stats.campaignProgress.push({ chapterId: level.chapterId, completedLevels: [], stars: {} });
      chapter = stats.campaignProgress[stats.campaignProgress.length - 1];
    }

    const alreadyDone = chapter.completedLevels.includes(levelKey);
    let awarded = { auraPoints: 0, inGameTokens: 0 };

    if (!alreadyDone) {
      chapter.completedLevels.push(levelKey);
      awarded = { ...level }; // full rewards first clear
      stats.auraPoints = (stats.auraPoints || 0) + level.auraPoints;
      stats.inGameTokens = (stats.inGameTokens || 0) + level.inGameTokens;
    }

    // Stars: keep best
    if (chapter.stars instanceof Map === false) chapter.stars = new Map(Object.entries(chapter.stars || {}));
    const prevStars = chapter.stars.get(levelKey) || 0;
    if (starCount > prevStars) chapter.stars.set(levelKey, starCount);

    stats.lastUpdated = new Date();
    stats.markModified('campaignProgress');
    await stats.save();

    res.json({
      message: alreadyDone ? 'Level replayed — rewards already claimed' : 'Level complete',
      awarded,
      auraPoints: stats.auraPoints,
      inGameTokens: stats.inGameTokens,
      stars: { [levelKey]: chapter.stars.get(levelKey) },
    });
  } catch (error) {
    console.error('Adventure complete error:', error);
    res.status(500).json({ error: 'Failed to record level completion' });
  }
});

export default router;
