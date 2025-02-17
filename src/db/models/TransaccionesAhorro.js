const { DataTypes } = require('sequelize');
const sequelize = require('../index');

const TransaccionesAhorro = sequelize.define('TransaccionesAhorro', {
  ID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  Numero_Cheque: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  Monto: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  Monto_Generado: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  Fecha: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  Fecha_Deposito: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  TipoTransaccion: {
    type: DataTypes.ENUM('Ahorro', 'Desahogo','Corte'),
    allowNull: false,
  },
  MedioPago: {
    type: DataTypes.ENUM('Cheque'),
    allowNull: false,
  },
}, {
  tableName: 'TransaccionesAhorro',
  timestamps: false,
});

module.exports = TransaccionesAhorro;
