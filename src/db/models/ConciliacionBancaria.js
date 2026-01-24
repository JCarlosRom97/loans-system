const { DataTypes } = require('sequelize');
const sequelize = require('../index');

const ConciliacionBancaria = sequelize.define('ConciliacionBancaria', {
  ID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  Mes: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
  },
  Anio: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
  },
  SaldoMesAnterior: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  TotalMes: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
}, {
  tableName: 'ConciliacionBancaria',
  timestamps: false,
});

module.exports = ConciliacionBancaria;
