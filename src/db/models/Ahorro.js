const { DataTypes } = require('sequelize');
const sequelize = require('../index');

const Ahorro = sequelize.define('Ahorro', {
  ID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  Monto: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  FechaUltimaActualizacion: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
}, {
  tableName: 'Ahorro',
  timestamps: false,
});

module.exports = Ahorro;
