module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    passwordHash: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.ENUM('superadmin', 'tpo', 'instructor', 'student'), allowNull: false, defaultValue: 'student' },
    status: { type: DataTypes.ENUM('pending', 'active', 'blocked'), allowNull: false, defaultValue: 'active' },
    collegeId: { type: DataTypes.INTEGER, allowNull: true },
    rollNumber: { type: DataTypes.STRING, allowNull: true }
  }, {
    tableName: 'users',
    timestamps: true
  });

  return User;
};
