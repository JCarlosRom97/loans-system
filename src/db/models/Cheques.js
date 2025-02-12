const { DataTypes } = require('sequelize');
const sequelize = require('../index');

const Cheques = sequelize.define('Cheques', {
  ID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  No_Cheque: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  Nombre: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  Motivo: {
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
  tableName: 'Cheques',
  timestamps: false,
});

module.exports = Cheques;
