module.exports = (sequelize, DataTypes) => {
  const Test = sequelize.define('Test', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    instructorId: { type: DataTypes.INTEGER, allowNull: false },
    collegeId: { type: DataTypes.INTEGER, allowNull: true },
    timeLimit: { type: DataTypes.INTEGER, allowNull: true },
    totalMarks: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
    status: { type: DataTypes.ENUM('draft', 'published'), allowNull: false, defaultValue: 'draft' }
  }, {
    tableName: 'tests',
    timestamps: true
  });

  return Test;
};
