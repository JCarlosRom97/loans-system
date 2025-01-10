const { app } = require('electron');
const path = require('path');
const { Sequelize } = require('sequelize');
const fs = require('fs');

// Obtiene la ruta de almacenamiento de usuario
const userDataPath = app.getPath('userData');
const databaseFilename = 'database.sqlite';
const databasePath = path.join(userDataPath, databaseFilename);
const defaultDatabasePath = path.join(__dirname, 'document', databaseFilename);

// Si la base de datos no existe en `userData`, la copiamos desde `src/db/document`
if (!fs.existsSync(databasePath)) {
  console.log('Database not found in userData. Copying from default location...');
  if (fs.existsSync(defaultDatabasePath)) {
    fs.copyFileSync(defaultDatabasePath, databasePath);
    console.log('Database copied successfully.');
  } else {
    console.error('Error: Default database file not found.');
  }
}

// Configura Sequelize con SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: databasePath,
  logging: false, // Desactiva logs en producción
});

// Verifica la conexión
sequelize
  .authenticate()
  .then(() => console.log('Connection established successfully.'))
  .catch(err => console.error('Error connecting to SQLite:', err));

module.exports = sequelize;
