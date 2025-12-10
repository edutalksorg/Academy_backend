require('dotenv').config();
const { sequelize } = require('../src/models');
const logger = require('../src/config/logger');

/**
 * Reset the database by dropping all tables and recreating them
 * WARNING: This will delete ALL data in the database
 */
async function resetDatabase() {
    try {
        logger.info('Starting database reset...');
        logger.warn('⚠️  WARNING: This will delete ALL data from the database!');

        // Connect to database
        await sequelize.authenticate();
        logger.info('Database connection established');

        // Drop all tables and recreate them
        await sequelize.sync({ force: true });
        logger.info('✅ All tables dropped and recreated successfully');

        logger.info('Database reset completed. The database is now empty and ready for new users.');

    } catch (error) {
        logger.error('Database reset failed', error);
        throw error;
    } finally {
        await sequelize.close();
    }
}

if (require.main === module) {
    resetDatabase().then(() => {
        console.log('\n✅ Database reset complete!');
        console.log('You can now start the server and register new users.');
        process.exit(0);
    }).catch((error) => {
        console.error('\n❌ Database reset failed:', error.message);
        process.exit(1);
    });
}

module.exports = resetDatabase;
