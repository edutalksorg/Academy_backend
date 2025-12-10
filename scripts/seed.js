const { sequelize } = require('../src/models');
const logger = require('../src/config/logger');
const { hashPassword } = require('../src/utils/password');

/**
 * Seed the database with initial data
 * Creates a default superadmin account
 */
async function seed() {
    try {
        logger.info('Starting database seed...');

        // Create default superadmin account
        const defaultAdmin = {
            name: 'System Administrator',
            email: 'megamart.dvst@gmail.com',
            passwordHash: await hashPassword('Megamart@123'),
            role: 'superadmin',
            status: 'active',
            collegeId: null,
            rollNumber: null
        };

        const [user, created] = await sequelize.models.User.findOrCreate({
            where: { email: defaultAdmin.email },
            defaults: defaultAdmin
        });

        if (created) {
            logger.info(`✅ Default superadmin created: ${defaultAdmin.email}`);
        } else {
            logger.info(`ℹ️  Default superadmin already exists: ${defaultAdmin.email}`);
        }

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
