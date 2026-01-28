
const ConciliacionBancaria = require('../../models/ConciliacionBancaria');
const { Sequelize } = require('sequelize');
const ConciliacionAPI = (ipcMain) => {

  ipcMain.handle('db:addConciliacion', async (_, data) => {
    try {
      const { Mes, Anio } = data;
  
      const [record, created] = await ConciliacionBancaria.findOrCreate({
        where: { Mes, Anio },
        defaults: data,
      });
  
      // If it already exists, update it
      if (!created) {
        await record.update(data);
      }
  
      return record.toJSON();
    } catch (error) {
      console.error('Error adding/updating conciliacion:', error);
      throw new Error('Error adding or updating conciliacion');
    }
  });
    ipcMain.handle('db:getMonthRegister', async (_, { mes, year }) => {
        try {
          const conciliacion = await ConciliacionBancaria.findOne({
            where: {
              Mes: mes,
              Anio: year,
            },
          });
      
          if (!conciliacion) {
            return null; // o lanza error si prefieres
          }
      
          return conciliacion.toJSON();
        } catch (error) {
          console.error('Error getting Month Conciliation Register:', error);
          throw new Error('Error getting Month Conciliation Register');
        }
      });
}

module.exports = ConciliacionAPI; 