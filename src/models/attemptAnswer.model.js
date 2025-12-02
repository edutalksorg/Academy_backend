module.exports = (sequelize, DataTypes) => {
  const AttemptAnswer = sequelize.define('AttemptAnswer', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    attemptId: { type: DataTypes.INTEGER, allowNull: false },
    questionId: { type: DataTypes.INTEGER, allowNull: false },
    selectedOptionId: { type: DataTypes.INTEGER, allowNull: true },
    isCorrect: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    marksAwarded: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 }
  }, {
    tableName: 'attempt_answers',
    timestamps: true
  });

  return AttemptAnswer;
};
