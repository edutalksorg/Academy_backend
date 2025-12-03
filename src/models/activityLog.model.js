module.exports = (sequelize, DataTypes) => {
    const ActivityLog = sequelize.define('ActivityLog', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        userId: { type: DataTypes.INTEGER, allowNull: false },
        action: { type: DataTypes.ENUM('LOGIN', 'LOGOUT'), allowNull: false },
        details: { type: DataTypes.JSON, allowNull: true }
    }, {
        tableName: 'activity_logs',
        timestamps: true
    });

    return ActivityLog;
};
