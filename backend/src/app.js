const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// Seguridad y parseo
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(morgan('dev'));
app.use(express.json({ limit: '8mb' }));

// Swagger
const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: '3.0.0',
    info: { title: 'ASE Athletics API', version: '1.0.0' },
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js']
});
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rutas
app.use('/api/auth',      require('./routes/auth.routes'));
app.use('/api/players',   require('./routes/player.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));
app.use('/api/reports',   require('./routes/report.routes'));

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok' }));

// Manejador de errores global
app.use(errorHandler);

module.exports = app;
