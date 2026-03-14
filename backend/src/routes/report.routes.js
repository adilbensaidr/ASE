const router = require('express').Router();
const auth = require('../middleware/auth');
const mongoose = require('mongoose');
const ScoutReport = require('../models/ScoutReport');

function parseStringList(input) {
	if (Array.isArray(input)) {
		return input.map((item) => String(item).trim()).filter(Boolean);
	}
	if (typeof input === 'string') {
		return input
			.split(',')
			.map((item) => item.trim())
			.filter(Boolean);
	}
	return [];
}

function computeOverallRating(ratings = {}) {
	const values = Object.values(ratings)
		.map((value) => Number(value))
		.filter((value) => Number.isFinite(value));

	if (!values.length) return null;
	const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
	return Number(avg.toFixed(1));
}

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Informes de scouting
 */

/**
 * @swagger
 * /api/reports:
 *   get:
 *     summary: Listado de informes con filtros y paginación
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: player
 *         schema: { type: string }
 *         description: ID del jugador para filtrar
 *       - in: query
 *         name: scout
 *         schema: { type: string }
 *         description: ID del scout para filtrar
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Lista de informes paginada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reports: { type: array, items: { type: object } }
 *                 total: { type: integer }
 *                 page: { type: integer }
 *                 pages: { type: integer }
 *       401:
 *         description: No autorizado
 */
router.get('/', auth, async (req, res, next) => {
	try {
		const {
			player,
			scout,
			page = 1,
			limit = 20
		} = req.query;

		const filter = {};

		if (player && mongoose.isValidObjectId(player)) {
			filter.player = player;
		}

		if (scout && mongoose.isValidObjectId(scout)) {
			filter.scout = scout;
		}

		const skip = (Number(page) - 1) * Number(limit);

		const [reports, total] = await Promise.all([
			ScoutReport.find(filter)
				.populate('player', 'name team position')
				.populate('scout', 'name email')
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(Number(limit))
				.lean(),
			ScoutReport.countDocuments(filter)
		]);

		res.json({
			reports,
			total,
			page: Number(page),
			pages: Math.ceil(total / Number(limit))
		});
	} catch (err) {
		next(err);
	}
});

/**
 * @swagger
 * /api/reports/{id}:
 *   get:
 *     summary: Detalle de un informe de scouting
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: ID del informe
 *     responses:
 *       200:
 *         description: Informe encontrado
 *       404:
 *         description: Reporte no encontrado
 *       401:
 *         description: No autorizado
 */
router.get('/:id', auth, async (req, res, next) => {
	try {
		const report = await ScoutReport.findById(req.params.id)
			.populate('player', 'name team position')
			.populate('scout', 'name email')
			.lean();

		if (!report) {
			return res.status(404).json({ message: 'Reporte no encontrado' });
		}

		res.json(report);
	} catch (err) {
		next(err);
	}
});

/**
 * @swagger
 * /api/reports:
 *   post:
 *     summary: Crear un nuevo informe de scouting
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [player, matchDate, opponent]
 *             properties:
 *               player:
 *                 type: string
 *                 description: ID del jugador evaluado
 *               matchDate:
 *                 type: string
 *                 format: date
 *               opponent:
 *                 type: string
 *               overallRating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 10
 *               ratings:
 *                 type: object
 *                 properties:
 *                   technical: { type: number }
 *                   physical: { type: number }
 *                   tactical: { type: number }
 *                   mental: { type: number }
 *               strengths:
 *                 type: array
 *                 items: { type: string }
 *               weaknesses:
 *                 type: array
 *                 items: { type: string }
 *               observations:
 *                 type: string
 *               recommendation:
 *                 type: string
 *                 enum: [Seguimiento prioritario, Seguimiento normal, Descartar]
 *     responses:
 *       201:
 *         description: Informe creado correctamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 */
router.post('/', auth, async (req, res, next) => {
	try {
		const payload = {
			...req.body,
			scout: req.user._id,
			strengths: parseStringList(req.body.strengths),
			weaknesses: parseStringList(req.body.weaknesses),
			keyMoments: parseStringList(req.body.keyMoments)
		};

		if (!payload.overallRating && payload.ratings) {
			payload.overallRating = computeOverallRating(payload.ratings);
		}

		const report = await ScoutReport.create(payload);

		const populated = await ScoutReport.findById(report._id)
			.populate('player', 'name team position')
			.populate('scout', 'name email')
			.lean();

		res.status(201).json(populated);
	} catch (err) {
		next(err);
	}
});

/**
 * @swagger
 * /api/reports/{id}:
 *   put:
 *     summary: Actualizar un informe (solo el scout autor)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Informe actualizado
 *       403:
 *         description: No puedes editar este reporte
 *       404:
 *         description: Reporte no encontrado
 *       401:
 *         description: No autorizado
 */
router.put('/:id', auth, async (req, res, next) => {
	try {
		const existing = await ScoutReport.findById(req.params.id);

		if (!existing) {
			return res.status(404).json({ message: 'Reporte no encontrado' });
		}

		if (String(existing.scout) !== String(req.user._id)) {
			return res.status(403).json({ message: 'No puedes editar este reporte' });
		}

		const payload = {
			...req.body,
			strengths: parseStringList(req.body.strengths),
			weaknesses: parseStringList(req.body.weaknesses),
			keyMoments: parseStringList(req.body.keyMoments)
		};

		if (!payload.overallRating && payload.ratings) {
			payload.overallRating = computeOverallRating(payload.ratings);
		}

		const report = await ScoutReport.findByIdAndUpdate(req.params.id, payload, {
			new: true,
			runValidators: true
		})
			.populate('player', 'name team position')
			.populate('scout', 'name email')
			.lean();

		res.json(report);
	} catch (err) {
		next(err);
	}
});

/**
 * @swagger
 * /api/reports/{id}:
 *   delete:
 *     summary: Eliminar un informe (solo el scout autor)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Reporte eliminado correctamente
 *       403:
 *         description: No puedes eliminar este reporte
 *       404:
 *         description: Reporte no encontrado
 *       401:
 *         description: No autorizado
 */
router.delete('/:id', auth, async (req, res, next) => {
	try {
		const report = await ScoutReport.findById(req.params.id);

		if (!report) {
			return res.status(404).json({ message: 'Reporte no encontrado' });
		}

		if (String(report.scout) !== String(req.user._id)) {
			return res.status(403).json({ message: 'No puedes eliminar este reporte' });
		}

		await ScoutReport.findByIdAndDelete(req.params.id);
		res.json({ message: 'Reporte eliminado correctamente' });
	} catch (err) {
		next(err);
	}
});

module.exports = router;
