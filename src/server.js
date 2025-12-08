require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./models');
const logger = require('./config/logger');

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    await sequelize.authenticate();
    // Sync models (use migrations in production)
    await sequelize.sync();
    logger.info('Database connected and models synced');

    if (process.env.SEED === 'true') {
      // lazy-load seed to avoid circular
      const seed = require('../scripts/seed');
      await seed();
    }

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (err) {
    logger.error('Failed to start server', err);
    process.exit(1);
  }
}

start();

