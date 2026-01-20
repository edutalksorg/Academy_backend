module.exports = (sequelize, DataTypes) => {
  const Question = sequelize.define('Question', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    testId: { type: DataTypes.INTEGER, allowNull: false },
    text: { type: DataTypes.TEXT, allowNull: false },
    marks: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    // Coding Question Fields
    type: { type: DataTypes.ENUM('MCQ', 'CODING'), allowNull: false, defaultValue: 'MCQ' },
    description: { type: DataTypes.TEXT, allowNull: true }, // Richer content for coding problems
    constraints: { type: DataTypes.TEXT, allowNull: true },
    codeTemplate: { type: DataTypes.TEXT, allowNull: true }, // Starter code
    language: { type: DataTypes.TEXT, allowNull: true, defaultValue: 'javascript' } // e.g., 'javascript', 'python'
  }, {
    tableName: 'questions',
    timestamps: true
  });

  return Question;
};
