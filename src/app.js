const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimiter = require('./middlewares/rateLimiter');
const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');
const logger = require('./config/logger');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);

app.use('/api', routes);

// Health
app.get('/health', (req, res) => res.json({ ok: true, message: 'alive' }));

// Error handler
app.use(errorHandler);

module.exports = app;
