const { sequelize } = require('./src/models');

async function addColumn() {
    try {
        await sequelize.getQueryInterface().addColumn('attempts', 'tabSwitchCount', {
            type: sequelize.Sequelize.INTEGER,
            defaultValue: 0
        });
        console.log('Column added successfully');
    } catch (error) {
        console.error('Error adding column:', error);
    } finally {
        await sequelize.close();
    }
}

addColumn();
