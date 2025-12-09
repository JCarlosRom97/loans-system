
const Gastos = require('../../models/Gastos');
const Cheques = require('../../models/Cheques');
const { Sequelize } = require('sequelize');
const chequesGastosAPI = (ipcMain) => {
    /* Gastos y cheques */

    ipcMain.handle('db:addGasto', async (_, data) => {
        try {
            const newGasto = await Gastos.create(data);
            return newGasto.toJSON();
        } catch (error) {
            console.error('Error adding gasto:', error);
            throw new Error('Error adding gasto');
        }
    });

    ipcMain.handle('db:getGastos', async (_, { mes, year } = {}) => {

        console.log('db:getGastos', { mes, year });

        try {
            const whereClause = {};

            // Filtro por mes y year (si se proporcionan)
            if (mes !== undefined && year !== undefined) {
                const startDate = new Date(year, mes - 1, 1); // Primer día del mes
                const endDate = new Date(year, mes, 0, 23, 59, 59); // Último día del mes a las 23:59:59

                whereClause.Fecha = {
                    [Sequelize.Op.between]: [startDate, endDate]
                };
            }

            const gastos = await Gastos.findAll({
                where: whereClause,
                order: [['Fecha', 'DESC']],
            });

            return gastos.map(gasto => gasto.toJSON());
        } catch (error) {
            console.error('Error al obtener los gastos:', error);
            throw new Error('Error en la base de datos al cargar gastos');
        }
    });

    ipcMain.handle('db:addCheque', async (_, data) => {
        try {
            const newCheque = await Cheques.create(data);
            return newCheque.toJSON();
        } catch (error) {
            console.error('Error adding cheque:', error);
            throw new Error('Error adding cheque');
        }
    });

    ipcMain.handle('db:getCheques', async (_, { mes, year } = {}) => {
        try {
            console.log('db:getCheques', { mes, year });

            const whereClause = {};

            // Filtro por mes y año (si se proporcionan)
            if (mes !== undefined && year !== undefined) {
                const startDate = new Date(year, mes - 1, 1); // Primer día del mes
                const endDate = new Date(year, mes, 0, 23, 59, 59); // Último día del mes a las 23:59:59

                whereClause.Fecha = {
                    [Sequelize.Op.between]: [startDate, endDate]
                };
            }

            const cheques = await Cheques.findAll({
                where: whereClause,
                order: [['Fecha', 'DESC']], // Ordenar por fecha descendente
            });

            return cheques.map(cheque => cheque.toJSON());
        } catch (error) {
            console.error('Error getting cheques:', error);
            throw new Error('Error getting cheques');
        }
    });

    ipcMain.handle('db:deleteCheque', async (_, chequeId) => {
        try {
            const cheque = await Cheques.findByPk(chequeId);
            if (!cheque) {
                throw new Error('Cheque not found');
            }

            await cheque.destroy();
            return { success: true, message: 'Cheque deleted successfully' };
        } catch (error) {
            console.error('Error deleting cheque:', error);
            throw new Error('Error deleting cheque');
        }
    });
}

module.exports = chequesGastosAPI; 