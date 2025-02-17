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

// Configura Sequelize con SQLite y habilita WAL
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: databasePath,
  logging: false, // Desactiva logs en producción
  dialectOptions: {
    mode: require('sqlite3').OPEN_READWRITE | require('sqlite3').OPEN_CREATE | require('sqlite3').OPEN_FULLMUTEX
  }
});

// Habilita WAL para mejorar concurrencia
sequelize.query("PRAGMA journal_mode = WAL;");

// Verifica la conexión
sequelize
  .authenticate()
  .then(() => console.log('Connection established successfully.'))
  .catch(err => console.error('Error connecting to SQLite:', err));

// Función para reintentar consultas si la base de datos está bloqueada
const retryQuery = async (fn, retries = 5, delay = 500) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.code === 'SQLITE_BUSY' && i < retries - 1) {
        console.log(`Database locked, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
};

module.exports = sequelize;
