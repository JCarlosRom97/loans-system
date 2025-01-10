const { app } = require('electron'); // Solo si estás en un archivo del lado de Node
const path = require('path');
const { Sequelize } = require('sequelize');

// Determina si estás en producción
const isProduction = process.env.NODE_ENV === 'production';

// Define la ruta a la base de datos dependiendo del entorno
const databasePath = isProduction
  ? path.join(app.getPath('userData'), 'database.sqlite') // Producción
  : path.join(__dirname, 'document/database.sqlite'); // Desarrollo

// Configura Sequelize con SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: databasePath,
  logging: false, // Desactiva logs para producción
});

// Verifica la conexión
sequelize
  .authenticate()
  .then(() => console.log('Connection established correctly.'))
  .catch(err => console.error('Error connecting with SQLite', err));

module.exports = sequelize;
