const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registro de usuario
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:     { type: string }
 *               email:    { type: string, format: email }
 *               password: { type: string, minLength: 6 }
 *     responses:
 *       201: { description: Usuario registrado }
 *       409: { description: Email ya registrado }
 */
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: 'Nombre, email y contraseña son requeridos' });

    if (await User.findOne({ email }))
      return res.status(409).json({ message: 'Email ya registrado' });

    const user = await User.create({ name, email, password });
    res.status(201).json({ token: signToken(user._id), user });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login de usuario
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:    { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200: { description: Login exitoso, devuelve token }
 *       401: { description: Credenciales incorrectas }
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: 'Email y contraseña son requeridos' });

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ message: 'Credenciales incorrectas' });

    res.json({ token: signToken(user._id), user });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Obtener usuario autenticado
 *     tags: [Auth]
 *     responses:
 *       200: { description: Datos del usuario }
 */
exports.me = (req, res) => res.json(req.user);
