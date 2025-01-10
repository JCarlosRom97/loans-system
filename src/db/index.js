const { Sequelize } = require('sequelize');
const path = require('path');

// Ruta donde se almacenará la base de datos SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'document/database.sqlite'),
  transactionType:"INMEDIATE"
});

// Verifica la conexión
sequelize
  .authenticate()
  .then(() => console.log('Conection stablished correctly.'))
  .catch(err => console.error('Error connectiong with sqlite', err));

module.exports = sequelize;
