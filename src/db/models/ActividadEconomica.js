const { DataTypes } = require('sequelize');
const sequelize = require('../index');

const ActividadEconomica = sequelize.define('ActividadEconomica', {
  ID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  Actividad: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
}, {
  tableName: 'ActividadEconomica',
  timestamps: false,
});

module.exports = ActividadEconomica;
