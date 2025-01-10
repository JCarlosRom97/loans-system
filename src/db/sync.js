const sequelize = require('./index');
const fs = require('fs');
const path = require('path');

// Importar todos los modelos
const Usuario = require('./models/Usuario');
const Domicilio = require('./models/Domicilio');
const ActividadEconomica = require('./models/ActividadEconomica');
const Ahorro = require('./models/Ahorro');
const TransaccionesAhorro = require('./models/TransaccionesAhorro');
const Prestamo = require('./models/Prestamo');
const Pagos = require('./models/Pagos');

// Ruta de la base de datos en producción
const dbPath = sequelize.options.storage;

// Verifica si la base de datos ya existe antes de sincronizar
const shouldSync = !fs.existsSync(dbPath);

// Establecer las relaciones entre los modelos
const defineRelations = () => {
  try {
    Usuario.belongsTo(Domicilio, { foreignKey: 'id_Domicilio_fk', as: 'Domicilio', onDelete: 'CASCADE' });
    Usuario.belongsTo(ActividadEconomica, { foreignKey: 'id_ActividadEconomica_fk', as: 'ActividadEconomica', onDelete: 'CASCADE' });
    Domicilio.hasMany(Usuario, { foreignKey: 'id_Domicilio_fk', as: 'Usuarios' });
    ActividadEconomica.hasMany(Usuario, { foreignKey: 'id_ActividadEconomica_fk', as: 'Usuarios' });

    Ahorro.belongsTo(Usuario, { foreignKey: 'id_Usuario_fk', as: 'Usuario', onDelete: 'CASCADE' });
    TransaccionesAhorro.belongsTo(Ahorro, { foreignKey: 'id_Ahorro_fk', as: 'Ahorro', onDelete: 'CASCADE' });

    Prestamo.belongsTo(Usuario, { foreignKey: 'id_Usuario_fk', as: 'Usuario', onDelete: 'CASCADE' });
    Pagos.belongsTo(Prestamo, { foreignKey: 'id_Prestamo_fk', as: 'Prestamo', onDelete: 'CASCADE' });

    console.log('Relationships defined successfully.');
  } catch (error) {
    console.error('Error defining relationships:', error);
  }
};

// Función para sincronizar la base de datos
const syncDatabase = async () => {
  try {
    defineRelations();
    
    if (shouldSync) {
      await sequelize.sync({ force: true }); // ⚠️ Usa { force: true } solo en desarrollo
      console.log('Database synced successfully.');
    } else {
      console.log('Database already exists. Skipping sync.');
    }
  } catch (error) {
    console.error('Error syncing the database:', error);
  }
};

module.exports = syncDatabase;
