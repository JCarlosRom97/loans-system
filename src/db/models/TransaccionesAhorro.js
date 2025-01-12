const { DataTypes } = require('sequelize');
const sequelize = require('../index');

const TransaccionesAhorro = sequelize.define('TransaccionesAhorro', {
  ID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  Monto: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  Fecha: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  TipoTransaccion: {
    type: DataTypes.ENUM('Deposito', 'Retiro'),
    allowNull: false,
  },
  MedioPago: {
    type: DataTypes.ENUM('Transferencia', 'Efectivo'),
    allowNull: false,
  },
}, {
  tableName: 'TransaccionesAhorro',
  timestamps: false,
});

module.exports = TransaccionesAhorro;
