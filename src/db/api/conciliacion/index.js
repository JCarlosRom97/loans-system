
const ConciliacionBancaria = require('../../models/ConciliacionBancaria');
const { Sequelize } = require('sequelize');
const ConciliacionAPI = (ipcMain) => {

    ipcMain.handle('db:addConciliacion', async (_, data) => {
        try {
            const newConciliacion = await ConciliacionBancaria.create(data);
            return newConciliacion.toJSON();
        } catch (error) {
            console.error('Error adding conciliacion:', error);
            throw new Error('Error adding conciliacion');
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