const sequelize = require('./index');
const fs = require('fs');

// Importar modelos
const Usuario = require('./models/Usuario');
const Domicilio = require('./models/Domicilio');
const Ahorro = require('./models/Ahorro');
const TransaccionesAhorro = require('./models/TransaccionesAhorro');
const Prestamo = require('./models/Prestamo');
const Pagos = require('./models/Pagos');
const Cheques = require('./models/Cheques')
const AhorroSaldos = require('./models/AhorroSaldos')

// Ruta de la base de datos
const dbPath = sequelize.options.storage;

// Lista de tablas que deben existir
const requiredTables = [
  'Usuario', 
  'Domicilio', 
  'Ahorro', 
  'TransaccionesAhorro', 
  'Prestamo', 
  'Pagos',
  'Cheques',
  'AhorroSaldos'
];

// Función para verificar si las tablas existen
const checkTablesExist = async () => {
  try {
    const result = await sequelize.query(`
      SELECT name FROM sqlite_master WHERE type='table' AND name IN (${requiredTables.map(name => `'${name}'`).join(', ')});
    `, { type: sequelize.QueryTypes.SELECT });

    const existingTables = result.map(row => row.name);
    return requiredTables.every(table => existingTables.includes(table)); // Retorna true si todas existen
  } catch (error) {
    console.error('Error checking database tables:', error);
    return false;
  }
};

// Definir relaciones entre modelos
const defineRelations = () => {
  try {
    Usuario.belongsTo(Domicilio, { foreignKey: 'id_Domicilio_fk', as: 'Domicilio', onDelete: 'CASCADE' });
    Domicilio.hasMany(Usuario, { foreignKey: 'id_Domicilio_fk', as: 'Usuarios' });


    Ahorro.belongsTo(Usuario, { foreignKey: 'id_Usuario_fk', as: 'Usuario', onDelete: 'CASCADE' });
    TransaccionesAhorro.belongsTo(Ahorro, { foreignKey: 'id_Ahorro_fk', as: 'Ahorro', onDelete: 'CASCADE' });

    Prestamo.belongsTo(Usuario, { foreignKey: 'id_Usuario_fk', as: 'Usuario', onDelete: 'CASCADE' });
    Pagos.belongsTo(Prestamo, { foreignKey: 'id_Prestamo_fk', as: 'Prestamo', onDelete: 'CASCADE' });

    console.log('Relationships defined successfully.');
  } catch (error) {
    console.error('Error defining relationships:', error);
  }
};

// Sincronizar base de datos
const syncDatabase = async () => {
  try {
    defineRelations();

    if (!fs.existsSync(dbPath)) {
      console.log('Database does not exist. Creating new database...');
      await sequelize.sync({ force: true });
      console.log('Database created and synced successfully.');
    } else {
      const tablesExist = await checkTablesExist();
      
      if (!tablesExist) {
        console.log('Database found but missing tables. Synchronizing...');
        await sequelize.sync({ force: true }); // ⚠️ Esto borra y recrea las tablas
        console.log('Database structure synced successfully.');
          // Imprimir las tablas
    await printTables();
      } else {
        console.log('Database and tables already exist. No sync needed.');
      }
    }
  } catch (error) {
    console.error('Error syncing the database:', error);
  }
};

const printTables = async () => {
  try {
    const queryInterface = sequelize.getQueryInterface();
    const tables = await queryInterface.showAllTables();

    if (tables.length === 0) {
      console.log('No tables found in the database.');
    } else {
      console.log('Existing tables in the database:');
      tables.forEach((table, index) => {
        console.log(`${index + 1}. ${table}`);
      });
    }
  } catch (error) {
    console.error('Error retrieving tables:', error);
  }
};

module.exports = syncDatabase;
