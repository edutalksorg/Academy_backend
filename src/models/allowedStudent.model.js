module.exports = (sequelize, DataTypes) => {
    const AllowedStudent = sequelize.define('AllowedStudent', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        collegeId: { type: DataTypes.INTEGER, allowNull: false },
        rollNumber: { type: DataTypes.STRING, allowNull: false },
        email: { type: DataTypes.STRING, allowNull: false },
        name: { type: DataTypes.STRING, allowNull: false },
        isRegistered: { type: DataTypes.BOOLEAN, defaultValue: false }
    }, {
        tableName: 'allowed_students',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['collegeId', 'rollNumber']
            },
            {
                unique: true,
                fields: ['collegeId', 'email']
            }
        ]
    });

    return AllowedStudent;
};
