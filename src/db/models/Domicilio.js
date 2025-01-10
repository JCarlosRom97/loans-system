const { DataTypes } = require('sequelize');
const sequelize = require('../index'); // Asegúrate de importar la instancia de Sequelize

const Domicilio = sequelize.define('Domicilio', {
  ID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  Colonia: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  Calle: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  Numero: {
    type: DataTypes.STRING(10),
    allowNull: false,
  },
}, {
  tableName: 'Domicilio',
  timestamps: false,
});

module.exports = Domicilio;
