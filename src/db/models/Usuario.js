const { DataTypes } = require('sequelize');
const sequelize = require('../index'); // Importar la instancia de Sequelize

const Usuario = sequelize.define(
  'Usuario',
  {
    ID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    CTA_CONTABLE_PRESTAMO: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    CTA_CONTABLE_AHORRO: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    Nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    Apellido_Paterno: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    Apellido_Materno: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    Codigo_Empleado: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    Fecha_De_Nacimiento: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    Nacionalidad: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    CURP: {
      type: DataTypes.CHAR(18),
      allowNull: true,
    },
    RFC: {
      type: DataTypes.CHAR(13),
      allowNull: true,
    },
    Correo_Electronico: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    id_Domicilio_fk: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: 'Usuario',
    timestamps: false,
  }
);

module.exports = Usuario;
