const { DataTypes } = require('sequelize');
const sequelize = require('../index');

const Gastos = sequelize.define('Gastos', {
  ID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  No_Cheque: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  Tipo: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  Fecha: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  Monto: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
}, {
  tableName: 'Gastos',
  timestamps: false,
});

module.exports = Gastos;
