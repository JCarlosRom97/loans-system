const { Sequelize } = require('sequelize');
const Pagos = require('../../models/Pagos');
const Cheques = require('../../models/Cheques');
const Usuario = require('../../models/Usuario');
const Prestamo = require('../../models/Prestamo');
const TransaccionesAhorro = require('../../models/TransaccionesAhorro');
const Ahorro = require('../../models/Ahorro');

const reportsAPI = (ipcMain) =>{
     //Reports
  ipcMain.handle('db:getPaymentsReport', async (_, { Fecha_Inicio, Fecha_Final }) => {
    try {
      console.log({ Fecha_Inicio, Fecha_Final });
  
      // Función para convertir fechas de dd/mm/aaaa a aaaa-mm-dd
      const convertToDate = (dateString) => {
        const regex = /^\d{2}\/\d{2}\/\d{4}$/; // Validar formato dd/mm/aaaa
        if (!regex.test(dateString)) {
          throw new Error(`Fecha inválida: ${dateString}. Use el formato dd/mm/aaaa.`);
        }
        const [day, month, year] = dateString.split('/');``

        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      };
  
      // Construir las condiciones dinámicas para la consulta
      const whereConditions = {};
  
      if (Fecha_Inicio.trim() !== '' && Fecha_Final.trim() !== '') {
        const formattedStartDate = convertToDate(Fecha_Inicio);
        const formattedEndDate = convertToDate(Fecha_Final);
        console.log(formattedStartDate, formattedEndDate);
        whereConditions.Fecha_Pago = {
          [Sequelize.Op.between]: [formattedStartDate, formattedEndDate], // Rango de fechas
        };
      }
  
      // Buscar los pagos con las condiciones construidas
      const pagos = await Pagos.findAll({
        where: whereConditions,
        order: [
          ['ID', 'ASC'], // Ordenar primero por ID ascendente
          ['Fecha_Pago', 'ASC'], // Luego por Fecha_Pago ascendente
        ],
      });
  
      if (pagos.length === 0) {
        return {
          message: 'No se encontraron pagos con este filtro.',
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
  //Conciliacion 

  ipcMain.handle('db:getMonthlyConciliation', async (_, { mes, year }) => {
    try {
        const startDate = new Date(year, mes - 1, 1);
        const endDate = new Date(year, mes, 0, 23, 59, 59);

        // Obtener cheques dentro del rango de fechas
        const cheques = await Cheques.findAll({
            where: {
                Fecha: {
                    [Sequelize.Op.between]: [startDate, endDate]
                }
            }
        });

        // Obtener pagos dentro del rango de fechas
        const pagos = await Pagos.findAll({
            where: {
                Fecha_Pago: {
                    [Sequelize.Op.between]: [startDate, endDate]
                }
            },
            include: [
                {
                    model: Prestamo,
                    as: 'Prestamo',
                    include: [
                        {
                            model: Usuario,
                            as: 'Usuario'
                        }
                    ]
                }
            ]
        });

        // Obtener transacciones de ahorro dentro del rango de fechas
        const transaccionesAhorro = await TransaccionesAhorro.findAll({
            where: {
                Fecha: {
                    [Sequelize.Op.between]: [startDate, endDate]
                }
            },
            include: [
                {
                    model: Ahorro,
                    as: 'Ahorro',
                    include: [
                        {
                            model: Usuario,
                            as: 'Usuario',
                        }
                    ]
                }
            ],
        });

        // Obtener préstamos cuya Fecha_Inicio corresponda con el mes y año del filtro
        const prestamosInicioMes = await Prestamo.findAll({
            where: {
                Fecha_Inicio: {
                    [Sequelize.Op.between]: [startDate, endDate]
                }
            },
            include: [
                {
                    model: Usuario,
                    as: 'Usuario'
                }
            ]
        });

        // Convertir los préstamos a JSON y agregar información adicional
        const prestamosJSON = prestamosInicioMes.map(p => {
            const pJSON = p.toJSON();
            return {
                ...pJSON,
                NombreCompleto: `${pJSON.Usuario?.Nombre || ''} ${pJSON.Usuario?.Apellido_Paterno || ''} ${pJSON.Usuario?.Apellido_Materno || ''}`.trim(),
                CTA_CONTABLE_PRESTAMO: pJSON.Usuario?.CTA_CONTABLE_PRESTAMO || 'N/A',
                CTA_CONTABLE_AHORRO: pJSON.Usuario?.CTA_CONTABLE_AHORRO || 'N/A',
                TipoTransaccion: 'Préstamo Iniciado', // Agregar un tipo de transacción para identificar
                Fecha: pJSON.Fecha_Inicio // Usar Fecha_Inicio como fecha de la transacción
            };
        });

        // Combinar todos los resultados
        return {
            cheques: cheques.map(c => c.toJSON()),
            pagos: pagos.map(p => {
                const pJSON = p.toJSON();
                return {
                    ...pJSON,
                    NombreCompleto: `${pJSON.Prestamo?.Usuario?.Nombre || ''} ${pJSON.Prestamo?.Usuario?.Apellido_Paterno || ''} ${pJSON.Prestamo?.Usuario?.Apellido_Materno || ''}`.trim(),
                    CTA_CONTABLE_PRESTAMO: pJSON.Prestamo?.Usuario?.CTA_CONTABLE_PRESTAMO || 'N/A',
                    CTA_CONTABLE_AHORRO: pJSON.Prestamo?.Usuario?.CTA_CONTABLE_AHORRO || 'N/A'
                };
            }),
            transaccionesAhorro: transaccionesAhorro.map(t => {
                const tJSON = t.toJSON();
                return {
                    ...tJSON,
                    NombreCompleto: `${tJSON.Ahorro?.Usuario?.Nombre || ''} ${tJSON.Ahorro?.Usuario?.Apellido_Paterno || ''} ${tJSON.Ahorro?.Usuario?.Apellido_Materno || ''}`.trim(),
                    CTA_CONTABLE_PRESTAMO: tJSON.Ahorro?.Usuario?.CTA_CONTABLE_PRESTAMO || 'N/A',
                    CTA_CONTABLE_AHORRO: tJSON.Ahorro?.Usuario?.CTA_CONTABLE_AHORRO || 'N/A'
                };
            }),
            prestamosInicioMes: prestamosJSON // Agregar los préstamos con Fecha_Inicio en el mes
        };
    } catch (error) {
        console.error('Error al obtener los datos mensuales:', error);
        throw new Error('Error al obtener los datos mensuales');
    }
  });
}

module.exports = reportsAPI; 