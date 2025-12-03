module.exports = (sequelize, DataTypes) => {
  const College = sequelize.define('College', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
    collegeCode: { type: DataTypes.STRING, allowNull: false, unique: true },
    address: { type: DataTypes.STRING, allowNull: true }
  }, {
    tableName: 'colleges',
    timestamps: true
  });

  return College;
};
