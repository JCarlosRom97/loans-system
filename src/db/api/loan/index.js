const { Sequelize } = require('sequelize');
const Prestamo = require('../../models/Prestamo');
const Pagos = require('../../models/Pagos');
const Usuario = require('../../models/Usuario');
const Domicilio = require('../../models/Domicilio');
const loanAPI = (ipcMain) => {
    //Prestamos

    ipcMain.handle('db:addLoan', async (_, data) => {
        try {
            // Crear un nuevo registro en el modelo Prestamo
            const newPrestamo = await Prestamo.create(data);
            return newPrestamo.toJSON(); // Convertir a JSON y devolver el resultado
        } catch (error) {
            console.error('Error adding Prestamo:', error);
            throw new Error('Error adding Prestamo');
        }
    });

    ipcMain.handle('db:refinanceLoan', async (_, data) => {
        try {
            console.log(data);
            const prestamoActual = await Prestamo.findByPk(data.id);

            if (!prestamoActual) {
                throw new Error('Préstamo no encontrado');
            }

            // Calcular el monto del nuevo préstamo
            const nuevoMonto = parseFloat(prestamoActual.Total_Capital);

            if (nuevoMonto > 250000) {
                throw new Error('El monto del nuevo préstamo no puede exceder 250,000.');
            }

            const totalPagadoCapital = parseFloat(prestamoActual.Monto) - parseFloat(prestamoActual.Saldo);
            const totalPagadoIntereses = parseFloat(prestamoActual.TotalPrestamo_Intereses || 0) - parseFloat(prestamoActual.Saldo);

            // Actualizar el préstamo actual
            await prestamoActual.update({
                TotalPagadoCapital: totalPagadoCapital,
                TotalPagadoIntereses: totalPagadoIntereses,
                EstadoPrestamo: 'Refinanciado',
            });

            // Crear el nuevo préstamo
            const nuevoPrestamo = await Prestamo.create(data);

            return {
                message: 'Préstamo refinanciado exitosamente.',
                loan: nuevoPrestamo.dataValues,
            };
        } catch (error) {
            console.error('Error refinanciando el préstamo:', error);
            throw new Error(error.message || 'Error refinanciando el préstamo.');
        }
    });

    ipcMain.handle('db:deleteLoan', async (_, data) => {
        try {
            const prestamoActual = await Prestamo.findByPk(data.idPrestamo);

            if (!prestamoActual) {
                throw new Error('Préstamo no encontrado');
            }

            // Actualizar el préstamo actual
            await prestamoActual.update({
                EstadoPrestamo: data.status,
                FechaEliminacion: new Date(),
            });

            return {
                message: 'Préstamo Eliminado Exitosamente.',
                loan: prestamoActual.dataValues,
            };
        } catch (error) {
            console.error('Error Eliminando el préstamo:', error);
            throw new Error(error.message || 'Error Eliminando el préstamo.');
        }
    });


    ipcMain.handle('db:getLoansByUserId', async (_, { userId, status }) => {
        try {
            // Buscar todos los préstamos asociados al id_Usuario_fk con estado 'Activo'
            const prestamos = await Prestamo.findAll({
                where: {
                    id_Usuario_fk: userId, // Buscar por id_Usuario_fk
                    EstadoPrestamo: status, // Solo préstamos con estado 'Activo'
                },
            });

            if (!prestamos || prestamos.length === 0) {
                return []; // Retornar un array vacío si no hay resultados
            }

            return prestamos.map((prestamo) => prestamo.toJSON()); // Convertir a JSON y devolver la lista de resultados
        } catch (error) {
            console.error('Error fetching Prestamos by User ID and EstadoPrestamo:', error);
            throw new Error('Error fetching Prestamos by User ID and EstadoPrestamo');
        }
    });

    ipcMain.handle('db:getLoansReport', async (_, filters) => {
        try {
            console.log('filters', filters);

            const prestamoConditions = {};

            if (filters.Status) {
                prestamoConditions.EstadoPrestamo = filters.Status;
            }

            const convertToISO = (dateString) => {
                const [day, month, year] = dateString.split('/');
                return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            };

            if (filters.Year) {
                const yearStart = convertToISO(`01/01/${filters.Year}`);
                const yearEnd = convertToISO(`31/12/${filters.Year}`);

                prestamoConditions[Sequelize.Op.and] = [
                    { Fecha_Inicio: { [Sequelize.Op.lte]: yearEnd } },
                    { Fecha_Termino: { [Sequelize.Op.gte]: yearStart } }
                ];
            }

            const prestamos = await Prestamo.findAll({
                where: prestamoConditions,
            });

            if (!prestamos || prestamos.length === 0) {
                return [];
            }

            const usuarioIDs = [...new Set(prestamos.map((prestamo) => prestamo.id_Usuario_fk))];

            const usuarioConditions = {};
            if (filters.Nombre) {
                usuarioConditions[Sequelize.Op.or] = [
                    { Nombre: { [Sequelize.Op.like]: `%${filters.Nombre}%` } },
                    { Apellido_Paterno: { [Sequelize.Op.like]: `%${filters.Nombre}%` } },
                    { Apellido_Materno: { [Sequelize.Op.like]: `%${filters.Nombre}%` } },
                ];
            }
            usuarioConditions.ID = { [Sequelize.Op.in]: usuarioIDs };

            const usuarios = await Usuario.findAll({
                where: usuarioConditions,
                attributes: ['ID', 'Nombre', 'Apellido_Paterno', 'Apellido_Materno', 'CTA_CONTABLE_PRESTAMO'],
            });

            if (!usuarios || usuarios.length === 0) {
                return [];
            }

            const usuarioMap = usuarios.reduce((map, usuario) => {
                map[usuario.ID] = usuario.toJSON();
                return map;
            }, {});

            return prestamos
                .filter((prestamo) => usuarioMap[prestamo.id_Usuario_fk])
                .map((prestamo) => ({
                    ...prestamo.toJSON(),
                    Usuario: usuarioMap[prestamo.id_Usuario_fk],
                }));
        } catch (error) {
            console.error('Error fetching Prestamos with filters:', error);
            throw new Error('Error fetching Prestamos with filters');
        }
    });

    ipcMain.handle('db:getLoansByMonthYear', async (_, { month, year }) => {
        try {

            console.log('db:getLoansByMonthYear', { month, year });

            // Validar que mes y año sean proporcionados
            if (!month || !year) {
                throw new Error('Month and year are required');
            }

            // Convertir mes y año a fechas de inicio y fin del mes
            const monthStart = new Date(year, month - 1, 1); // mes -1 porque en JS enero es 0
            const monthEnd = new Date(year, month, 0); // día 0 del siguiente mes = último día del mes actual

            const prestamos = await Prestamo.findAll({
                where: {
                    Fecha_Inicio: {
                        [Sequelize.Op.between]: [monthStart, monthEnd]
                    }
                },
                include: [{
                    model: Usuario,
                    as: 'Usuario',
                    include: [{
                        model: Domicilio,
                        as: 'Domicilio'
                    }]
                }]
            });

            if (!prestamos || prestamos.length === 0) {
                return [];
            }

            // Formatear la respuesta para incluir toda la información
            return prestamos.map(prestamo => {
                const prestamoJSON = prestamo.toJSON();

                return {
                    ...prestamoJSON,
                    Usuario: {
                        ...prestamoJSON.Usuario,
                        Domicilio: prestamoJSON.Usuario.Domicilio || null
                    }
                };
            });
        } catch (error) {
            console.error('Error fetching Prestamos by month and year:', error);
            throw new Error('Error fetching Prestamos by month and year');
        }
    });


    ipcMain.handle('db:updateLoanCapitalIntereses', async (_, { id, Total_Pagado_Capital = 0, Total_Pagado_Intereses = 0 }) => {
        try {
            console.log({ id, Total_Pagado_Capital, Total_Pagado_Intereses });
            // Buscar el préstamo por su ID
            const prestamo = await Prestamo.findByPk(id);

            if (!prestamo) {
                throw new Error('Préstamo no encontrado');
            }

            // Sumar los valores proporcionados a los actuales
            const nuevoTotalCapital = parseFloat(prestamo.Total_Pagado_Capital || 0) + parseFloat(Total_Pagado_Capital);
            const nuevoTotalIntereses = parseFloat(prestamo.Total_Pagado_Intereses || 0) + parseFloat(Total_Pagado_Intereses);

            // Actualizar los campos con los nuevos totales
            await prestamo.update({
                Total_Pagado_Capital: nuevoTotalCapital,
                Total_Pagado_Intereses: nuevoTotalIntereses,
                Total_Capital: prestamo.Total_Capital - parseFloat(Total_Pagado_Capital)
            });

            return {
                message: 'Préstamo actualizado exitosamente.',
                prestamo: prestamo.toJSON(),
            };
        } catch (error) {
            console.error('Error updating Prestamo:', error);
            throw new Error('Error updating Prestamo');
        }
    });

    ipcMain.handle('db:getPaymentsByLoan', async (_, id_Prestamo_fk) => {
        try {
            // Buscar los pagos relacionados con el préstamo
            const pagos = await Pagos.findAll({
                where: {
                    id_Prestamo_fk, // Campo relacionado con el préstamo
                },
                order: [
                    ['id', 'ASC'], // Ordenar primero por ID ascendente
                    ['Fecha_Pago', 'ASC'], // Luego por Fecha_Pago ascendente
                ],
            });

            if (pagos.length === 0) {
                return {
                    message: 'No se encontraron pagos para este préstamo.',
                    pagos: [],
                };
            }

            return {
                message: 'Pagos encontrados exitosamente.',
                pagos: pagos.map((pago) => pago.toJSON()),
            };
        } catch (error) {
            console.error('Error obteniendo pagos:', error);
            throw new Error('Error al obtener los pagos relacionados con el préstamo');
        }
    });

}

module.exports = loanAPI;