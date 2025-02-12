const { DataTypes } = require('sequelize');
const sequelize = require('../index');

const Pagos = sequelize.define('Pagos', {
  ID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  Fecha_Catorcena: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  Fecha_Pago: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  Monto_Pago: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
  },
  Monto_Pago_Capital: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
  },
  Monto_Pago_Intereses: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
  },
  Periodo_Catorcenal: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  Metodo_Pago: {
    type: DataTypes.ENUM('Transferencia', 'Cheque'),
    allowNull: false,
  },
  Saldo_Actual: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    comment: 'Saldo restante del préstamo después de este pago.',
  },
}, {
  tableName: 'Pagos',
  timestamps: false,
});

module.exports = Pagos;
