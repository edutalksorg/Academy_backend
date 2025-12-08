const { sequelize } = require('../src/models');
const logger = require('../src/config/logger');

/**
 * Seed the database with initial data
 */
async function seed() {
    try {
        logger.info('Starting database seed...');

        // Add seed logic here
        // Example:
        // await sequelize.models.User.findOrCreate({ ... });

        logger.info('Database seed completed successfully.');
    } catch (error) {
        logger.error('Database seed failed', error);
        throw error;
    }
}

if (require.main === module) {
    seed().then(() => {
        process.exit(0);
    }).catch(() => {
        process.exit(1);
    });
}

module.exports = seed;
