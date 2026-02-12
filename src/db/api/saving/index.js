const { Sequelize } = require('sequelize');
const sequelize = require('../../index');
const Ahorro = require('../../models/Ahorro');
const TransaccionesAhorro = require('../../models/TransaccionesAhorro');
const Usuario = require('../../models/Usuario');
const AhorroSaldos = require('../../models/AhorroSaldos');
const savingsAPI = (ipcMain) => {
    console.log(sequelize)
    //Savings
    ipcMain.handle('db:addSaving', async (_, { idAhorro, idUsuario, monto, Numero_Cheque, tipo, medioPago, Fecha, Fecha_Deposito }) => {
        console.log({ idAhorro, idUsuario, monto, Numero_Cheque, tipo, medioPago, Fecha, Fecha_Deposito });

        const t = await sequelize.transaction(); // Iniciar la transacción

        try {

            let ahorro = await Ahorro.findByPk(idAhorro);
            monto = parseFloat(monto);
          
            // Registrar la transacción
            const transaccionAhorro = await TransaccionesAhorro.create({
                Monto: monto,
                Numero_Cheque,
                Fecha: Fecha,
                Fecha_Deposito,
                TipoTransaccion: tipo,
                MedioPago: medioPago,
                id_Ahorro_fk: ahorro.ID
            }, { transaction: t });

            await t.commit(); // Confirmar la transacción
            console.log(`Transacción ${tipo} de ${monto} realizada con éxito.`);

            return transaccionAhorro.toJSON();
        } catch (error) {
            await t.rollback();
            console.error("Error en la transacción:", error.message);
            throw error;
        }
    });

    ipcMain.handle('db:getAllSavingsTransactions', async (_, idAhorro) => {
        try {
            const t = await sequelize.transaction(); // Iniciar la transacción
            if (idAhorro) {
                const transacciones = await TransaccionesAhorro.findAll({
                    where: { id_Ahorro_fk: idAhorro }, // Filtra por el id_ahorro_fk
                    order: [['Fecha', 'DESC']] // Ordena las transacciones de más reciente a más antigua
                },{ transaction: t });

                const ahorro = await Ahorro.findOne({
                    where: { ID: idAhorro }, // Filtra por el id_ahorro_fk
                },{ transaction: t });

                await t.commit(); // Confirmar la transacción

                return {transacciones: transacciones.map(t => t.toJSON()), MontoComprometido: ahorro.MontoComprometido}; // Retorna un array de objetos JSON
            } else {
                return []
            }
        } catch (error) {
            console.error('Error al obtener las transacciones de ahorro:', error);
            throw new Error('Error al obtener las transacciones de ahorro');
        }
    });


    ipcMain.handle('db:getUserSavingsReport', async (_, { NombreCompleto, Anio }) => {
        try {
            console.log({ NombreCompleto, Anio });

            const whereUserClause = NombreCompleto
                ? {
                    [Sequelize.Op.or]: [
                        { Nombre: { [Sequelize.Op.like]: `%${NombreCompleto}%` } },
                        { Apellido_Paterno: { [Sequelize.Op.like]: `%${NombreCompleto}%` } },
                        { Apellido_Materno: { [Sequelize.Op.like]: `%${NombreCompleto}%` } },
                    ],
                }
                : {};

            const usuarios = await Usuario.findAll({
                attributes: ['ID', 'Nombre', 'Apellido_Paterno', 'Apellido_Materno', 'Codigo_Empleado'],
                where: whereUserClause,
                include: [
                    {
                        model: Ahorro,
                        as: 'Ahorro',
                        required: false,
                        attributes: ['ID', 'Monto'], // Se agrega el Monto de Ahorro
                        include: [
                            {
                                model: TransaccionesAhorro,
                                as: 'Transacciones',
                                required: false,
                                attributes: ['ID', 'Monto', 'TipoTransaccion', 'Fecha'],
                                where: {
                                    TipoTransaccion: {
                                        [Sequelize.Op.notIn]: ['Corte', 'Desahogo'], // Excluir "Corte" y "Desahogo"
                                    },
                                },
                            },
                        ],
                    },
                ],
                raw: false,
            });

            // Obtener el año anterior en formato yyyy
            const añoAnterior = (parseInt(Anio) - 1).toString();

            // Transformar la salida para separar transacciones del año actual y del anterior
            const resultado = await Promise.all(usuarios.map(async (usuario) => {
                // Filtrar transacciones por año
                const transaccionesAnioActual = [];
                const transaccionesAnioAnterior = [];

                if (usuario.Ahorro) {
                    usuario.Ahorro.forEach(ahorro => {
                        if (ahorro.Transacciones) {
                            ahorro.Transacciones.forEach(transaccion => {
                                const transaccionFecha = new Date(transaccion.Fecha);
                                const transaccionAnio = transaccionFecha.getFullYear();

                                if (transaccionAnio === parseInt(Anio)) {
                                    transaccionesAnioActual.push(transaccion);
                                } else if (transaccionAnio === parseInt(Anio) - 1) {
                                    transaccionesAnioAnterior.push(transaccion);
                                }
                            });
                        }
                    });
                }

                // Ordenar las transacciones por fecha en ambas categorías
                transaccionesAnioActual.sort((a, b) => new Date(a.Fecha) - new Date(b.Fecha));
                transaccionesAnioAnterior.sort((a, b) => new Date(a.Fecha) - new Date(b.Fecha));

                // Buscar los cortes en AhorroSaldos por ID_Usuario y que correspondan al año anterior
                const cortesAhorroSaldos = await AhorroSaldos.findAll({
                    where: {
                        ID_Usuario: usuario.ID, // Buscar por ID_Usuario
                        Periodo: añoAnterior,   // Filtrar por el año anterior en formato yyyy
                    },
                    attributes: ['Total'], // Solo retornar el campo Total
                    raw: true,
                });

                return {
                    ID: usuario.ID,
                    Nombre: usuario.Nombre,
                    Apellido_Paterno: usuario.Apellido_Paterno,
                    Apellido_Materno: usuario.Apellido_Materno,
                    Codigo_Empleado: usuario.Codigo_Empleado,
                    MontoAhorro: usuario.Ahorro
                        ? usuario.Ahorro.reduce((acc, ahorro) => acc + parseFloat(ahorro.Monto || 0), 0)
                        : 0,
                    TransaccionesAhorro: {
                        AnioActual: transaccionesAnioActual,
                        AnioAnterior: transaccionesAnioAnterior,
                    },
                    TotalAhorroSaldosAnioAnterior: cortesAhorroSaldos.length > 0 ? cortesAhorroSaldos[0].Total : null, // Retornar el Total si existe
                };
            }));

            console.log('getUserSavingsReport:', resultado);

            return resultado;
        } catch (error) {
            console.error('Error al obtener el reporte de ahorro por usuario:', error);
            throw new Error('Error al obtener el reporte de ahorro por usuario');
        }
    });

    ipcMain.handle('db:getUserSavingDesahogoReport', async (_, { NombreCompleto, Anio }) => {
        try {
            // Validar que el año sea un valor de 4 dígitos
            const yearRegex = /^\d{4}$/;
            if (Anio && !yearRegex.test(Anio)) {
                throw new Error('El formato del año debe ser YYYY');
            }

            // Construir el filtro de nombre
            const whereUserClause = NombreCompleto
                ? {
                    [Sequelize.Op.or]: [
                        { Nombre: { [Sequelize.Op.like]: `%${NombreCompleto}%` } },
                        { Apellido_Paterno: { [Sequelize.Op.like]: `%${NombreCompleto}%` } },
                        { Apellido_Materno: { [Sequelize.Op.like]: `%${NombreCompleto}%` } },
                    ],
                }
                : {};

            // Construir el filtro de fecha si se especificó el año
            const whereTransactionClause = Anio
                ? {
                    Fecha: {
                        [Sequelize.Op.between]: [
                            new Date(`${Anio}-01-01`),
                            new Date(`${Anio}-12-31 23:59:59`)
                        ]
                    }
                }
                : {};

            // Obtener usuarios con sus transacciones de desahogo
            const usuarios = await Usuario.findAll({
                attributes: ['ID', 'Nombre', 'Apellido_Paterno', 'Apellido_Materno', 'Codigo_Empleado'],
                where: whereUserClause,
                include: [
                    {
                        model: Ahorro,
                        as: 'Ahorro',
                        required: false,
                        attributes: ['ID'],
                        include: [
                            {
                                model: TransaccionesAhorro,
                                as: 'Transacciones',
                                required: false,
                                attributes: ['ID', 'Monto', 'Fecha'],
                                where: {
                                    ...whereTransactionClause,
                                    TipoTransaccion: 'Desahogo' // Solo transacciones de tipo Desahogo
                                }
                            }
                        ]
                    }
                ],
                order: [
                    ['Apellido_Paterno', 'ASC'],
                    ['Apellido_Materno', 'ASC'],
                    ['Nombre', 'ASC']
                ]
            });

            // Procesar los resultados
            const resultado = usuarios.map(usuario => {
                // Filtrar solo los ahorros que tienen transacciones
                const ahorrosConTransacciones = usuario.Ahorro?.filter(ahorro =>
                    ahorro.Transacciones && ahorro.Transacciones.length > 0
                ) || [];

                // Obtener todas las transacciones de desahogo
                const transaccionesDesahogo = ahorrosConTransacciones.flatMap(ahorro =>
                    ahorro.Transacciones.map(transaccion => ({
                        idTransaccion: transaccion.ID,
                        monto: transaccion.Monto,
                        fecha: transaccion.Fecha,
                        idAhorro: ahorro.ID
                    }))
                );

                // Calcular total desahogado
                const totalDesahogado = transaccionesDesahogo.reduce(
                    (sum, transaccion) => sum + parseFloat(transaccion.monto || 0), 0
                );

                return {
                    idUsuario: usuario.ID,
                    nombreCompleto: `${usuario.Nombre} ${usuario.Apellido_Paterno} ${usuario.Apellido_Materno || ''}`.trim(),
                    codigoEmpleado: usuario.Codigo_Empleado,
                    cantidadDesahogos: transaccionesDesahogo.length,
                    totalDesahogado: totalDesahogado,
                    desahogos: transaccionesDesahogo
                };
            }).filter(usuario => usuario.cantidadDesahogos > 0); // Filtrar solo usuarios con desahogos

            return resultado;
        } catch (error) {
            console.error('Error al obtener el reporte de desahogos:', error);
            throw new Error(error.message || 'Error al obtener el reporte de desahogos');
        }
    });



    ipcMain.handle('db:getAmmountSaving', async (_, idUsuario) => {
        try {
            console.log('idUsuario', idUsuario);

            // Buscar el registro de Ahorro del usuario
            let ahorro = await Ahorro.findOne({ where: { id_Usuario_fk: idUsuario } });

            if (ahorro) {
                console.log('ahorro', ahorro.dataValues);

                // Obtener el id del Ahorro
                const idAhorro = ahorro.dataValues.ID;

                // Buscar el último registro de TransaccionesAhorro para el Ahorro, donde el tipo sea "Ahorro"
                const ultimaTransaccionAhorro = await TransaccionesAhorro.findOne({
                    where: {
                        id_Ahorro_fk: idAhorro, // Usar el id del Ahorro
                        TipoTransaccion: 'Ahorro' // Filtrar solo transacciones de tipo "Ahorro"
                    },
                    order: [['Fecha', 'DESC']], // Ordenar por fecha en orden descendente para obtener el último registro
                });

                console.log(ultimaTransaccionAhorro,'ultimaTransaccionAhorro');
                

                // Actualizar FechaUltimaActualizacion con la fecha de la última transacción de ahorro
                if (ultimaTransaccionAhorro) {
                    ahorro.dataValues.FechaUltimaActualizacion = ultimaTransaccionAhorro.Fecha;
                }else{
                    ahorro.dataValues.FechaUltimaActualizacion = null;
                }

                return ahorro.dataValues; // Devolver el registro de Ahorro con la fecha actualizada
            } else {
                console.log('No se encontró el registro de ahorro para el usuario.');
                return null; // Devolver null si no hay registro de ahorro
            }

        } catch (error) {
            console.error('Error al obtener el monto de ahorro:', error);
            throw new Error('Error al obtener el monto de ahorro:');
        }
    });


    ipcMain.handle('db:getAhorroSaldoById', async (_, idAhorro) => {
        try {
            // Buscar registros en el modelo AhorroSaldos por ID_Ahorro
            const ahorroRecords = await AhorroSaldos.findAll({
                where: { ID_Ahorro: idAhorro }
            });

            return ahorroRecords.map(record => record.toJSON());
        } catch (error) {
            console.error('Error fetching AhorroSaldos:', error);
            throw new Error('Error fetching AhorroSaldos');
        }
    });


    ipcMain.handle('db:getTotalSavingCorte', async (_, { userId, year }) => {
        try {
            console.log({ userId, year });
            const ahorroRecords = await Ahorro.findAll({
                where: { id_Usuario_fk: userId },
                attributes: ['ID']
            });

            const ahorroIds = ahorroRecords.map(record => record.ID);

            const total = await TransaccionesAhorro.findAll({
                where: {
                    id_Ahorro_fk: ahorroIds,
                    Fecha: {
                        [Sequelize.Op.between]: [new Date(`${year}-01-01`), new Date(`${year}-12-31 23:59:59`)]
                    }
                },
                attributes: ['Monto', 'TipoTransaccion']
            });

            const totalAhorro = total.reduce((acc, transaccion) => {
                return transaccion.TipoTransaccion === 'Ahorro' || transaccion.TipoTransaccion === 'Corte'
                    ? acc + parseFloat(transaccion.Monto)
                    : acc - parseFloat(transaccion.Monto);
            }, 0);

            return { totalAhorro };
        } catch (error) {
            console.error('Error calculating total ahorro:', error);
            throw new Error('Error calculating total ahorro');
        }
    });

    ipcMain.handle('db:saveCorteAhorro', async (_, { ID_Usuario, saveCorteAhorro, Periodo, Multa, SubTotal, Interes, Total, Monto_Generado }) => {
        try {
            console.log('saveCorteAhorro', { ID_Usuario, saveCorteAhorro, Periodo, Multa, SubTotal, Interes, Total, Monto_Generado });

            // Obtener el ID de Ahorro asociado al usuario
            const ahorroRecord = await Ahorro.findOne({
                where: { id_Usuario_fk: ID_Usuario },
                attributes: ['ID', 'Monto']
            });

            if (!ahorroRecord) {
                throw new Error('No savings record found');
            }

            const ahorroId = ahorroRecord.ID;
            const nuevoMonto = ahorroRecord.Monto + (Total - saveCorteAhorro);

            // Registrar en AhorroSaldos
            const newAhorroSaldo = await AhorroSaldos.create({
                ID_Usuario,
                ID_Ahorro: ahorroId,
                Ahorro: saveCorteAhorro,
                Periodo,
                Multa,
                SubTotal,
                Interes,
                TotalGenerado: Total - saveCorteAhorro + Multa,
                Total,
            });

            // Actualizar el monto en Ahorro
            await Ahorro.update(
                { Monto: nuevoMonto },
                { where: { ID: ahorroId } }
            );

            // Registrar solo los intereses en TransaccionesAhorro
            await TransaccionesAhorro.create({
                id_Ahorro_fk: ahorroId,
                Monto: Monto_Generado,
                Fecha: new Date(),
                Fecha_Deposito: new Date(),
                TipoTransaccion: 'Corte',
                MedioPago: 'Cheque',
                Saldo_Final_Corte: Total
            });

            return { ahorroSaldo: newAhorroSaldo };
        } catch (error) {
            console.error('Error saving corte ahorro:', error);
            throw new Error('Error saving corte ahorro');
        }
    });

    ipcMain.handle('db:removeSavingTransaction', async (_, { idTransaccion }) => {
        console.log('removeid', { idTransaccion });
        const t = await sequelize.transaction();

        try {
            // Buscar la transacción a eliminar
            const transaccionAhorro = await TransaccionesAhorro.findOne({
                where: { ID: idTransaccion },
                include: [
                    {
                        model: Ahorro,
                        required: true, // Para asegurarnos de que la transacción esté asociada a un ahorro
                        as: 'Ahorro'   // Usa el alias correcto aquí
                    }
                ],
                transaction: t
            });

            // Verificar si la transacción existe
            if (!transaccionAhorro) {
                throw new Error("Transacción no encontrada.");
            }

            // Obtener el ahorro relacionado
            const ahorro = transaccionAhorro.Ahorro;  // Accede usando el alias

            // Actualizar el monto del ahorro dependiendo del tipo de transacción
            if (transaccionAhorro.TipoTransaccion === "Ahorro") {
                ahorro.Monto -= transaccionAhorro.Monto; // Si es un depósito, restamos el monto
            } else if (transaccionAhorro.TipoTransaccion === "Desahogo") {
                ahorro.Monto += transaccionAhorro.Monto; // Si es un Desahogo, sumamos el monto
            } else {
                throw new Error("Tipo de transacción inválido.");
            }

            // Guardar los cambios en el monto del ahorro
            await ahorro.save({ transaction: t });

            // Eliminar la transacción de la tabla
            await transaccionAhorro.destroy({ transaction: t });

            // Confirmar la transacción
            await t.commit();
            console.log(`Transacción con ID ${idTransaccion} eliminada y monto actualizado en Ahorro.`);

            return { success: true, message: "Transacción eliminada y monto actualizado." };
        } catch (error) {
            await t.rollback();
            console.error("Error al eliminar la transacción:", error.message);
            throw new Error("Error al eliminar la transacción y actualizar el monto.");
        }
    });


}

module.exports = savingsAPI; 