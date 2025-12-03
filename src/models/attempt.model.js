module.exports = (sequelize, DataTypes) => {
  const Attempt = sequelize.define('Attempt', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    testId: { type: DataTypes.INTEGER, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    startedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    completedAt: { type: DataTypes.DATE, allowNull: true },
    totalScore: { type: DataTypes.FLOAT, allowNull: true, defaultValue: 0 },
    status: { type: DataTypes.ENUM('in-progress', 'completed', 'reviewed'), allowNull: false, defaultValue: 'in-progress' }
  }, {
    tableName: 'attempts',
    timestamps: true
  });

  return Attempt;
};
