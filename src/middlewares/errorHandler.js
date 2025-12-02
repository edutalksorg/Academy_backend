function errorHandler(err, req, res, next) { // eslint-disable-line
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ success: false, message, errors: err.errors || null });
}

module.exports = errorHandler;
