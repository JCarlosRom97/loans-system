const { DataTypes } = require('sequelize');
const sequelize = require('../index');

const Prestamo = sequelize.define('Prestamo', {
  ID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  Numero_Prestamo: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  Numero_Cheque: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  Periodo:{
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  Cantidad_Meses:{
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  Monto: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  Interes: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
  },
  Interes_Total: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
  },
  TotalPrestamo: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
  },
  TotalPrestamo_Intereses:{
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
  },
  Abono: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  Ultimo_Abono: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  Saldo: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
  },
  EstadoPrestamo: {
    type: DataTypes.ENUM('Activo', 'Pagado', 'Vencido','Refinanciado','Eliminado'),
    allowNull: false,
    defaultValue: 'Activo',
  },
  Pagos_Completados: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  Fecha_Inicio: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  Fecha_Termino: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  No_Catorcenas: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  Resto_Abono: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0, // Asignamos un valor por defecto de 0
    comment: 'Monto restante para completar el abono mínimo.',
  },
  Total_Capital: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    defaultValue: 0,
    comment: 'Monto total capital.',
    validate: {
      max: 250000, // Validación directa
    },
  },
  Total_Pagado_Capital: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    defaultValue: 0,
    comment: 'Monto total pagado hacia el capital antes de refinanciar.',
  },
  Total_Pagado_Intereses: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      defaultValue: 0,
      comment: 'Monto total pagado en intereses antes de refinanciar.',
  },
}, {
  tableName: 'Prestamo',
  timestamps: false,
});

module.exports = Prestamo;
