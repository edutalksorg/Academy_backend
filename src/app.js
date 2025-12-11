const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimiter = require('./middlewares/rateLimiter');
const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');
const logger = require('./config/logger');

const app = express();

app.use(helmet());

// ⭐ IMPORTANT: Replace default CORS with specific allowed origins
app.use(cors({
    origin: [
        "https://d3te24boxizt5g.cloudfront.net",   // your frontend
        "http://localhost:5173"                    // dev (optional)
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);

app.use('/api', routes);

// Health
app.get('/health', (req, res) => res.json({ ok: true, message: 'alive' }));

// Error handler
app.use(errorHandler);

module.exports = app;