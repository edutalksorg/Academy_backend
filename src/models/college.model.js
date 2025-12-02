module.exports = (sequelize, DataTypes) => {
  const College = sequelize.define('College', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    address: { type: DataTypes.STRING, allowNull: true }
  }, {
    tableName: 'colleges',
    timestamps: true
  });

  return College;
};
