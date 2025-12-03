const { sequelize } = require('../src/models');

async function syncDb() {
    try {
        console.log('🔄 Syncing database schema...');
        await sequelize.sync({ alter: true });
        console.log('✅ Database schema synced successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error syncing database:', err);
        process.exit(1);
    }
}

syncDb();
