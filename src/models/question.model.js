module.exports = (sequelize, DataTypes) => {
  const Question = sequelize.define('Question', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    testId: { type: DataTypes.INTEGER, allowNull: false },
    text: { type: DataTypes.TEXT, allowNull: false },
    marks: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 }
  }, {
    tableName: 'questions',
    timestamps: true
  });

  return Question;
};
