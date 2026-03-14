const router = require('express').Router();
const Player = require('../models/Player');
const auth   = require('../middleware/auth');

/**
 * @swagger
 * /api/dashboard/stats:
 *   get:
 *     summary: Métricas agregadas para el panel de análisis
 *     tags: [Dashboard]
 *     responses:
 *       200: { description: Estadísticas del dashboard }
 */
router.get('/stats', auth, async (req, res, next) => {
  try {
    const now          = new Date();
    const in180days    = new Date(now.getTime() + 180 * 86400000);

    const [total, byPosition, topScorers, expiringContracts, avgAgeResult, marketValueTrend] =
      await Promise.all([
        Player.countDocuments(),

        Player.aggregate([
          { $group: { _id: '$position', count: { $sum: 1 } } },
          { $sort:  { count: -1 } }
        ]),

        Player.find()
          .sort({ 'stats.goals': -1 })
          .limit(5)
          .select('name team nationality stats.goals stats.assists stats.appearances imageUrl')
          .lean(),

        Player.find({ 'contract.contractEnd': { $lte: in180days } })
          .select('name team contract.contractEnd contract.salary')
          .sort({ 'contract.contractEnd': 1 })
          .lean(),

        Player.aggregate([{ $group: { _id: null, avg: { $avg: '$age' } } }]),

        Player.find({ marketValue: { $ne: null } })
          .sort({ marketValue: -1 })
          .limit(8)
          .select('name marketValue')
          .lean()
      ]);

    const topAssists = await Player.find()
      .sort({ 'stats.assists': -1 })
      .limit(5)
      .select('name team stats.assists stats.goals imageUrl')
      .lean();

    const byNationality = await Player.aggregate([
      { $group: { _id: '$nationality', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      totalPlayers:       total,
      averageAge:         avgAgeResult[0]?.avg?.toFixed(1) ?? null,
      byPosition,
      topScorers,
      topAssists,
      byNationality,
      expiringContracts,
      marketValueTrend
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
