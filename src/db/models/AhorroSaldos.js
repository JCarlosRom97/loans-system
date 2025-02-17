const { DataTypes } = require('sequelize');
const sequelize = require('../index');

const AhorroSaldos = sequelize.define('AhorroSaldos', {
  ID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  ID_Usuario: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  ID_Ahorro: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  Ahorro: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  Interes: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  Total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  Periodo: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },

}, {
  tableName: 'AhorroSaldos',
  timestamps: false,
});

module.exports = AhorroSaldos;
