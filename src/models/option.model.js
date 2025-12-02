module.exports = (sequelize, DataTypes) => {
  const Option = sequelize.define('Option', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    questionId: { type: DataTypes.INTEGER, allowNull: false },
    text: { type: DataTypes.STRING, allowNull: false },
    isCorrect: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }
  }, {
    tableName: 'options',
    timestamps: true
  });

  return Option;
};
