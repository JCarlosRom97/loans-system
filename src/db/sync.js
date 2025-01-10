const sequelize = require('./index');

// Importar todos los modelos
const Usuario = require('./models/Usuario');
const Domicilio = require('./models/Domicilio');
const ActividadEconomica = require('./models/ActividadEconomica');
const Ahorro = require('./models/Ahorro');
const TransaccionesAhorro = require('./models/TransaccionesAhorro');
const Prestamo = require('./models/Prestamo');
const Pagos = require('./models/Pagos');

// Establecer las relaciones entre los modelos
const defineRelations = () => {
  try {
    // Relaciones de Usuario
    Usuario.belongsTo(Domicilio, {
      foreignKey: 'id_Domicilio_fk',
      as: 'Domicilio',
      onDelete: 'CASCADE',
    });

    Usuario.belongsTo(ActividadEconomica, {
      foreignKey: 'id_ActividadEconomica_fk',
      as: 'ActividadEconomica',
      onDelete: 'CASCADE',
    });

    Domicilio.hasMany(Usuario, {
      foreignKey: 'id_Domicilio_fk',
      as: 'Usuarios',
    });

    ActividadEconomica.hasMany(Usuario, {
      foreignKey: 'id_ActividadEconomica_fk',
      as: 'Usuarios',
    });

    // Relaciones de Ahorro
    Ahorro.belongsTo(Usuario, {
      foreignKey: 'id_Usuario_fk',
      as: 'Usuario',
      onDelete: 'CASCADE',
    });

    TransaccionesAhorro.belongsTo(Ahorro, {
      foreignKey: 'id_Ahorro_fk',
      as: 'Ahorro',
      onDelete: 'CASCADE',
    });

    // Relaciones de Prestamo
    Prestamo.belongsTo(Usuario, {
      foreignKey: 'id_Usuario_fk',
      as: 'Usuario',
      onDelete: 'CASCADE',
    });

    Pagos.belongsTo(Prestamo, {
      foreignKey: 'id_Prestamo_fk',
      as: 'Prestamo',
      onDelete: 'CASCADE',
    });

    console.log('Relationships defined successfully.');
  } catch (error) {
    console.error('Error defining relationships:', error);
  }
};

// Sincronización de la base de datos
(async () => {
  try {
    // Define las relaciones entre los modelos
    defineRelations();

    // Sincroniza la base de datos (usa "{ force: true }" solo para desarrollo)
    await sequelize.sync({ force: true });
    console.log('Database synced successfully.');
  } catch (error) {
    console.error('Error syncing the database:', error);
  } finally {
    await sequelize.close(); // Cierra la conexión después de sincronizar
    console.log('Database connection closed.');
  }
})();
