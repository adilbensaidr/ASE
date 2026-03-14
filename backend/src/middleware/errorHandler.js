const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // Error de validación de Mongoose
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: 'Error de validación', errors: messages });
  }

  // Duplicate key (ej: email único)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({ message: `El campo '${field}' ya existe` });
  }

  // CastError de Mongoose (ID inválido)
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'ID inválido' });
  }

  const status = err.status || 500;
  res.status(status).json({
    message: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = { errorHandler };
