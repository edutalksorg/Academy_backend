const { sequelize } = require('./src/models');

async function sync() {
    try {
        console.log('Syncing database...');
        await sequelize.sync({ alter: true });
        console.log('Database synced successfully');
    } catch (err) {
        console.error('Sync failed:', err);
    } finally {
        await sequelize.close();
    }
}

sync();
