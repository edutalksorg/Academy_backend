module.exports = (sequelize, DataTypes) => {
    const TestCase = sequelize.define('TestCase', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        questionId: { type: DataTypes.INTEGER, allowNull: false },
        input: { type: DataTypes.TEXT, allowNull: false },
        expectedOutput: { type: DataTypes.TEXT, allowNull: false },
        explanation: { type: DataTypes.TEXT, allowNull: true }, // Optional explanation for the test case
        isPublic: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false } // true = visible to student, false = hidden for grading
    }, {
        tableName: 'test_cases',
        timestamps: true
    });

    return TestCase;
};
