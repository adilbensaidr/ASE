const Player = require('../models/Player');
const PlayerDetail = require('../models/PlayerDetail');

/**
 * @swagger
 * /api/players:
 *   get:
 *     summary: Lista paginada de jugadores con filtros
 *     tags: [Players]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *         description: Búsqueda de texto (nombre, equipo, nacionalidad)
 *       - in: query
 *         name: position
 *         schema: { type: string, enum: [Goalkeeper, Defender, Midfielder, Forward] }
 *       - in: query
 *         name: team
 *         schema: { type: string }
 *       - in: query
 *         name: nationality
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: sort
 *         schema: { type: string, default: name }
 *         description: Campo de ordenamiento (prefijo - para desc, ej -stats.goals)
 *     responses:
 *       200:
 *         description: Lista de jugadores paginada
 */
exports.getAll = async (req, res, next) => {
  try {
    const {
      q,
      position,
      positions,
      team,
      teams,
      nationality,
      nationalities,
      page     = 1,
      limit    = 20,
      sort     = 'name',
      minAge,
      maxAge,
      minMarketValue,
      maxMarketValue,
      minGoals,
      maxGoals,
      minAssists,
      maxAssists
    } = req.query;

    const filter = {};

    if (q) {
      const escapedQuery = String(q).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (escapedQuery) {
        const queryRegex = new RegExp(escapedQuery, 'i');
        filter.$or = [
          { name: queryRegex },
          { team: queryRegex },
          { nationality: queryRegex }
        ];
      }
    }
    const positionList = String(positions || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    const teamList = String(teams || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    const nationalityList = String(nationalities || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    if (positionList.length > 0) {
      filter.position = { $in: positionList };
    } else if (position) {
      filter.position = position;
    }

    if (teamList.length > 0) {
      filter.team = { $in: teamList };
    } else if (team) {
      filter.team = new RegExp(String(team), 'i');
    }

    if (nationalityList.length > 0) {
      filter.nationality = { $in: nationalityList };
    } else if (nationality) {
      filter.nationality = new RegExp(String(nationality), 'i');
    }

    if (minAge || maxAge) {
      filter.age = {};
      if (minAge) filter.age.$gte = Number(minAge);
      if (maxAge) filter.age.$lte = Number(maxAge);
    }

    if (minMarketValue || maxMarketValue) {
      filter.marketValue = {};
      if (minMarketValue) filter.marketValue.$gte = Number(minMarketValue);
      if (maxMarketValue) filter.marketValue.$lte = Number(maxMarketValue);
    }

    if (minGoals || maxGoals) {
      filter['stats.goals'] = {};
      if (minGoals) filter['stats.goals'].$gte = Number(minGoals);
      if (maxGoals) filter['stats.goals'].$lte = Number(maxGoals);
    }

    if (minAssists || maxAssists) {
      filter['stats.assists'] = {};
      if (minAssists) filter['stats.assists'].$gte = Number(minAssists);
      if (maxAssists) filter['stats.assists'].$lte = Number(maxAssists);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [players, total] = await Promise.all([
      Player.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Player.countDocuments(filter)
    ]);

    res.json({
      players,
      total,
      page:  Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit))
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/players/filters:
 *   get:
 *     summary: Obtener valores globales para filtros de jugadores
 *     tags: [Players]
 *     responses:
 *       200:
 *         description: Opciones de filtros
 */
exports.getFilters = async (_req, res, next) => {
  try {
    const [teams, nationalities] = await Promise.all([
      Player.distinct('team', { team: { $nin: [null, ''] } }),
      Player.distinct('nationality', { nationality: { $nin: [null, ''] } })
    ]);

    const sortText = (a, b) => String(a).localeCompare(String(b), 'es', { sensitivity: 'base' });

    res.json({
      teams: (teams || []).filter(Boolean).sort(sortText),
      nationalities: (nationalities || []).filter(Boolean).sort(sortText)
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/players/{id}:
 *   get:
 *     summary: Obtener jugador por ID
 *     tags: [Players]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Jugador encontrado }
 *       404: { description: Jugador no encontrado }
 */
exports.getOne = async (req, res, next) => {
  try {
    const [player, detail] = await Promise.all([
      Player.findById(req.params.id).lean(),
      PlayerDetail.findOne({ player: req.params.id }).lean()
    ]);

    if (!player) return res.status(404).json({ message: 'Jugador no encontrado' });

    // Fallback para valor de mercado desde coleccion detallada
    if ((player.marketValue == null || player.marketValue === 0) && detail?.marketData?.currentMarketValue != null) {
      player.marketValue = detail.marketData.currentMarketValue;
    }

    player.detailedProfile = detail || null;
    res.json(player);
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/players:
 *   post:
 *     summary: Crear nuevo jugador
 *     tags: [Players]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, position, age, team, nationality]
 *             properties:
 *               name:        { type: string }
 *               position:    { type: string }
 *               age:         { type: integer }
 *               team:        { type: string }
 *               nationality: { type: string }
 *     responses:
 *       201: { description: Jugador creado }
 */
exports.create = async (req, res, next) => {
  try {
    const player = await Player.create(req.body);
    res.status(201).json(player);
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/players/{id}:
 *   put:
 *     summary: Actualizar jugador existente
 *     tags: [Players]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Jugador actualizado }
 *       404: { description: Jugador no encontrado }
 */
exports.update = async (req, res, next) => {
  try {
    const payload = { ...req.body };
    const detailedProfile = payload.detailedProfile;
    delete payload.detailedProfile;

    const player = await Player.findByIdAndUpdate(
      req.params.id,
      payload,
      { new: true, runValidators: true }
    );
    if (!player) return res.status(404).json({ message: 'Jugador no encontrado' });

    if (detailedProfile && typeof detailedProfile === 'object') {
      await PlayerDetail.findOneAndUpdate(
        { player: req.params.id },
        {
          ...detailedProfile,
          player: req.params.id
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
          runValidators: true
        }
      );

      if (detailedProfile.marketData?.currentMarketValue != null) {
        player.marketValue = detailedProfile.marketData.currentMarketValue;
        await player.save();
      }
    }

    res.json(player);
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/players/{id}:
 *   delete:
 *     summary: Eliminar jugador y sus reportes asociados
 *     tags: [Players]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Jugador eliminado }
 *       404: { description: Jugador no encontrado }
 */
exports.remove = async (req, res, next) => {
  try {
    const player = await Player.findByIdAndDelete(req.params.id);
    if (!player) return res.status(404).json({ message: 'Jugador no encontrado' });

    // Eliminar reportes de scouting en cascada
    await require('../models/ScoutReport').deleteMany({ player: req.params.id });

    res.json({ message: 'Jugador eliminado correctamente' });
  } catch (err) {
    next(err);
  }
};
