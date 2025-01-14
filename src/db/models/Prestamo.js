const { DataTypes } = require('sequelize');
const sequelize = require('../index');

const Prestamo = sequelize.define('Prestamo', {
  ID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  Monto: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  Interes: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
  },
  TotalPrestamo: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
  },
  Abono: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  Saldo: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
  },
  EstadoPrestamo: {
    type: DataTypes.ENUM('Activo', 'Pagado', 'Vencido','refinanciado'),
    allowNull: false,
    defaultValue: 'Activo',
  },
  Pagos_Completados: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  No_Catorcenas: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  tableName: 'Prestamo',
  timestamps: false,
});

module.exports = Prestamo;
