const { app, BrowserWindow, screen, ipcMain } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');
const useWindowSize = require('./src/hooks/useWindowSize');
const fs = require('fs');
const Usuario = require('./src/db/models/Usuario');
const Domicilio = require('./src/db/models/Domicilio');
const Prestamo = require('./src/db/models/Prestamo');
const Pagos = require('./src/db/models/Pagos')
const Ahorro = require('./src/db/models/Ahorro');
const TransaccionesAhorro = require('./src/db/models/TransaccionesAhorro');
const Cheques = require('./src/db/models/Cheques')
const { Sequelize } = require('sequelize');
const sequelize = require('./src/db/index')
const syncDatabase = require('./src/db/sync');
const formatDate = require('./src/hooks/formatDate');
const { log } = require('electron-builder');
const AhorroSaldos = require('./src/db/models/AhorroSaldos');


// add electron reload

require('electron-reload')(__dirname, {
    electron: path.join(__dirname, 'node_modules', '.bin', 'electron'),
});


let mainWindow;
let modalWindow;

const createWindow = () => {
    const { width, height } = useWindowSize();
    mainWindow = new BrowserWindow({
        width: width,
        height: height,
        webPreferences: {
            preload: path.join(__dirname, 'src', 'preloads', 'dataPreload.js'),
            contextIsolation: true, // Mantener true para aislamiento
            nodeIntegration: false, // Habilitar Node.js en el contexto del renderer
            enableRemoteModule: false,
        },
    });

    mainWindow.loadFile('./src/pages/Users/index.html');
};

// Crear una ventana modal
const createModal = (parentWindow, options = {}) => {
    modalWindow = new BrowserWindow({
        width: 900,
        height: 700,
        parent: parentWindow, // Hace que la ventana sea modal
        modal: true,
        show: false, // Evitar que se muestre inmediatamente
        resizable: false, // Evita redimensionar
        webPreferences: {
            contextIsolation: true,
            preload: path.join(__dirname, 'src', 'preloads', 'modalPreload.js'),
        },
    });

    // Cargar el archivo HTML del modal
    modalWindow.loadFile('./src/components/modal/index.html');

    modalWindow.once('ready-to-show', () => {
        modalWindow.show();
        modalWindow.webContents.openDevTools();
    });

    modalWindow.on('closed', () => {
        modalWindow = null;
    });
};

app.whenReady().then(async()=>{
  await syncDatabase();
  createWindow();
  //USERS
  ipcMain.handle('db:getUser', async (event, userId) => {
      try {
          if (!userId) {
              throw new Error('User ID is required');
          }
  
          const user = await Usuario.findByPk(userId);

          const DomicilioResponse = await Domicilio.findByPk(user.id_Domicilio_fk);
          
          console.log(DomicilioResponse, user);

          let userJSON = user.toJSON();

          userJSON= {...userJSON, domicilio:{...DomicilioResponse.dataValues}};

          if (!user) {
              throw new Error(`User with ID ${userId} not found`);
          }
  
          return userJSON;
      } catch (error) {
          console.error('Error fetching user:', error);
          throw new Error('Error fetching user');
      }
  });
  

  ipcMain.handle('db:getUsers', async () => {
    try {
      console.log(Usuario);
      const users = await Usuario.findAll();
      return users.map(user => user.toJSON());
    } catch (error) {
      console.error('Error fetching users:', error, Usuario);
      throw new Error('Error fetching users', error);
    }
  });

  ipcMain.handle('db:getUsersByName', async (event, searchTerm) => {
    console.log(searchTerm,'Search');
    try {  
      const users = await Usuario.findAll({
        where: {
          [Sequelize.Op.or]: [
            { Nombre: { [Sequelize.Op.like]: `%${searchTerm}%` } },
            { Apellido_Paterno: { [Sequelize.Op.like]: `%${searchTerm}%` } },
            { Apellido_Materno: { [Sequelize.Op.like]: `%${searchTerm}%` } },
          ],
        },
      });
      return users.map(user => user.toJSON());
    } catch (error) {
      console.error('Error fetching users by name ipcMain:', error);
      throw new Error('Error fetching users by name');
    }
  });


  ipcMain.handle('db:getUsersByAccount', async (event, searchTerm) => {
    console.log(searchTerm, 'SearchAccount');
    try {
      const users = await Usuario.findAll({
        where: {
          [Sequelize.Op.or]: [
            { CTA_CONTABLE_PRESTAMO: { [Sequelize.Op.like]: `%${searchTerm}%` } },
            { CTA_CONTABLE_AHORRO: { [Sequelize.Op.like]: `%${searchTerm}%` } },
          ],
        },
      });
      return users.map(user => user.toJSON());
    } catch (error) {
      console.error('Error fetching users by account in ipcMain:', error);
      throw new Error('Error fetching users by account');
    }
  });
    
  ipcMain.handle('db:addUser', async (_, data) => {
    try {
      const newUser = await Usuario.create(data);
      return newUser.toJSON();
    } catch (error) {
      console.error('Error adding user:', error);
      throw new Error('Error adding user');
    }
  });

  ipcMain.handle('db:updateUser', async (_, data) => {
    try {
      console.log('Update User data', data);
      // Busca el usuario por su ID
      const user = await Usuario.findByPk(data.ID);
  
      if (!user) {
        throw new Error(`User with ID ${data.ID} not found`);
      }
  
      // Actualiza el usuario con los datos proporcionados
      await user.update(data);
  
      // Retorna el usuario actualizado
      return user.toJSON();
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error('Error updating user');
    }
  });

  ipcMain.handle('db:updateAddress', async (_, data) => {
    try {
      // Busca el domicilio por su ID
      const address = await Domicilio.findByPk(data.ID);
  
      if (!address) {
        throw new Error(`Address with ID ${data.ID} not found`);
      }
  
      // Actualiza el domicilio con los datos proporcionados
      await address.update(data);
  
      // Retorna el domicilio actualizado
      return address.toJSON();
    } catch (error) {
      console.error('Error updating address:', error);
      throw new Error('Error updating address');
    }
  });
  // Domicilio
  ipcMain.handle('db:addAddress', async (_, data) => {
    try {
      const newAddress = await Domicilio.create(data);
      return newAddress.dataValues.ID;
    } catch (error) {
      console.error('Error adding address:', error);
      throw new Error('Error adding address');
    }
  });

  //Savings

  ipcMain.handle('db:getAllSavingsTransactions', async (_, idAhorro) => {
    try {
      console.log(idAhorro);

      if(idAhorro){
        const transacciones = await TransaccionesAhorro.findAll({
            where: { id_Ahorro_fk: idAhorro }, // Filtra por el id_ahorro_fk
            order: [['Fecha', 'DESC']] // Ordena las transacciones de más reciente a más antigua
        });
  
        return transacciones.map(t => t.toJSON()); // Retorna un array de objetos JSON
      }else{
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
              },
            ],
          },
        ],
        raw: false,
      });
  
      // Transformar la salida para separar transacciones del año actual y del anterior
      const resultado = usuarios.map(usuario => {
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
        };
      });
  
      console.log('getUserSavingsReport:', resultado);
  
      return resultado;
    } catch (error) {
      console.error('Error al obtener el reporte de ahorro por usuario:', error);
      throw new Error('Error al obtener el reporte de ahorro por usuario');
    }
  });
  
  
  
  
  ipcMain.handle('db:getAmmountSaving', async (_, idUsuario) => {
    try {
      console.log('idUsuario',idUsuario);
      let ahorro = await Ahorro.findOne({ where: { id_Usuario_fk: idUsuario } });
      if(ahorro){
        console.log('ahorro', ahorro.dataValues);
        return ahorro.dataValues;
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

  ipcMain.handle('db:saveCorteAhorro', async (_, { ID_Usuario, saveCorteAhorro, Periodo, Interes, Total, Monto_Generado }) => {
    try {
      console.log('saveCorteAhorro', { ID_Usuario, saveCorteAhorro, Periodo, Interes, Total, Monto_Generado });
  
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
        Interes,
        Total,
        Periodo
      });
  
      // Actualizar el monto en Ahorro
      await Ahorro.update(
        { Monto: nuevoMonto },
        { where: { ID: ahorroId } }
      );
  
      // Registrar solo los intereses en TransaccionesAhorro
      await TransaccionesAhorro.create({
        id_Ahorro_fk: ahorroId,
        Monto: Total,
        Fecha: new Date(),
        Fecha_Deposito: new Date(),
        TipoTransaccion: 'Corte',
        MedioPago: 'Cheque',
        Monto_Generado
      });
  
      return { ahorroSaldo: newAhorroSaldo };
    } catch (error) {
      console.error('Error saving corte ahorro:', error);
      throw new Error('Error saving corte ahorro');
    }
  });
  
  
  

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
  

  ipcMain.handle('db:getLoansByUserId', async (_, {userId, status}) => {
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
        attributes: ['ID', 'Nombre', 'Apellido_Paterno', 'Apellido_Materno','CTA_CONTABLE_PRESTAMO'],
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

  


  ipcMain.handle('db:updateLoanCapitalIntereses', async (_, { id, Total_Pagado_Capital = 0, Total_Pagado_Intereses = 0 }) => {
    try {
      console.log({ id, Total_Pagado_Capital , Total_Pagado_Intereses  });
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

  ipcMain.handle('db:getPaymentsReport', async (_, { Fecha_Inicio, Fecha_Final }) => {
    try {
      console.log({ Fecha_Inicio, Fecha_Final });
  
      // Función para convertir fechas de dd/mm/aaaa a aaaa-mm-dd
      const convertToDate = (dateString) => {
        const regex = /^\d{2}\/\d{2}\/\d{4}$/; // Validar formato dd/mm/aaaa
        if (!regex.test(dateString)) {
          throw new Error(`Fecha inválida: ${dateString}. Use el formato dd/mm/aaaa.`);
        }
        const [day, month, year] = dateString.split('/');

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
  

  ipcMain.handle('db:registerPayment', async (_, data) => {
    const { id_Prestamo_fk, Fecha_Pago, Fecha_Catorcena, Monto_Pago, Monto_Pago_Capital, Monto_Pago_Intereses, Periodo_Catorcenal, Metodo_Pago } = data;

    console.log('db:registerPayment', data);

    try {
        // Buscar el préstamo por su ID
        const prestamo = await Prestamo.findByPk(id_Prestamo_fk);

        if (!prestamo) {
            throw new Error('Préstamo no encontrado');
        }

        let montoRestante = Monto_Pago;

        // Verificar si hay un abono restante en el préstamo
        let abonoPendiente = parseFloat(prestamo.Resto_Abono || 0);

        // Si hay un abono pendiente, intentar cubrirlo
        if (abonoPendiente > 0) {
            if (montoRestante >= abonoPendiente) {
                // Cubrir el abono pendiente completamente
                montoRestante -= abonoPendiente;
                abonoPendiente = 0;
                prestamo.Pagos_Completados = (prestamo.Pagos_Completados || 0) + 1;
            } else {
                // Cubrir parcialmente el abono pendiente
                abonoPendiente -= montoRestante;
                montoRestante = 0;
            }
        }

        // Si queda un monto restante, aplicarlo al abono actual
        if (montoRestante > 0) {
            const abonoActual = parseFloat(prestamo.Abono);

            if (montoRestante >= abonoActual) {
                // Pago completo del abono
                montoRestante -= abonoActual;
                abonoPendiente = 0;
                prestamo.Pagos_Completados = (prestamo.Pagos_Completados || 0) + 1;
            } else {
                // Pago parcial del abono
                abonoPendiente = abonoActual - montoRestante;
                montoRestante = 0;
            }
        }

        // Calcular el nuevo saldo del préstamo
        const nuevoSaldo = parseFloat(prestamo.Saldo) - Monto_Pago;

        // Registrar el pago
        const pago = await Pagos.create({
            Fecha_Pago,
            Fecha_Catorcena,
            Monto_Pago,
            Monto_Pago_Capital,
            Monto_Pago_Intereses,
            Periodo_Catorcenal,
            Metodo_Pago,
            Saldo_Actual: nuevoSaldo,
            id_Prestamo_fk,
        });

        // Actualizar el préstamo
        const totalPagosEsperados = parseInt(prestamo.No_Catorcenas || 0); // Asumiendo que este campo representa el total de pagos esperados
        let nuevoEstado = prestamo.EstadoPrestamo;

        if (nuevoSaldo <= 0 || (prestamo.Pagos_Completados || 0) >= totalPagosEsperados) {
            nuevoEstado = 'Pagado';
        }

        await prestamo.update({
            Saldo: nuevoSaldo,
            Resto_Abono: abonoPendiente,
            Pagos_Completados: prestamo.Pagos_Completados,
            EstadoPrestamo: nuevoEstado,
        });

        // Crear mensaje de resultado
        const mensaje = abonoPendiente === 0
            ? 'Pago registrado como completo.'
            : `Pago registrado. Resta ${abonoPendiente.toFixed(2)} para completar el abono.`;

        return {
            message: mensaje,
            pago,
        };
    } catch (error) {
        console.error('Error registrando el pago:', error);
        throw new Error('Error registrando el pago');
    }
});


  ipcMain.handle('db:deletePayment', async (_, idPago) => {
    try {
        // Buscar el pago por su ID
        const pago = await Pagos.findByPk(idPago);
        if (!pago) {
            throw new Error('Pago no encontrado');
        }

        // Buscar el préstamo relacionado con el pago
        const prestamo = await Prestamo.findByPk(pago.id_Prestamo_fk);
        if (!prestamo) {
            throw new Error('Préstamo relacionado no encontrado');
        }

        // Recuperar montos del pago y del préstamo
        const montoPago = parseFloat(pago.Monto_Pago);
        const montoCapital = parseFloat(pago.Monto_Pago_Capital);
        const montoIntereses = parseFloat(pago.Monto_Pago_Intereses);

        // Revertir el saldo del préstamo
        const nuevoSaldo = parseFloat(prestamo.Saldo) + montoPago;

        // Determinar ajustes para pagos completados y abono pendiente
        let abonoPendiente = parseFloat(prestamo.Resto_Abono || 0);
        let pagosCompletados = prestamo.Pagos_Completados || 0;

        // Si el pago eliminado incluía abono y el resto del abono es 0
        const abonoActual = parseFloat(prestamo.Abono);
        if (abonoPendiente === 0) {
            abonoPendiente = abonoActual - montoPago;
            if (abonoPendiente < 0) {
                abonoPendiente = 0;
            }

            // Si el pago eliminado era parcial, decrementar Pagos_Completados
            if (montoPago < abonoActual) {
                pagosCompletados -= 1;
            }
        } else {
            // Ajustar el abono pendiente directamente
            abonoPendiente += montoPago;
            // Si el pago era completo y ahora se descompleta
            if (montoPago >= abonoActual) {
                pagosCompletados -= 1;
            }
        }

        // Actualizar el total pagado de capital e intereses
        const totalPagadoCapital = parseFloat(prestamo.Total_Pagado_Capital || 0) - montoCapital;
        const totalPagadoIntereses = parseFloat(prestamo.Total_Pagado_Intereses || 0) - montoIntereses;

        // Validar que los totales no sean negativos
        const totalCapitalValidado = totalPagadoCapital >= 0 ? totalPagadoCapital : 0;
        const totalInteresesValidado = totalPagadoIntereses >= 0 ? totalPagadoIntereses : 0;

        // Eliminar el pago
        await pago.destroy();

        // Actualizar el préstamo
        await prestamo.update({
            Saldo: nuevoSaldo,
            Resto_Abono: abonoPendiente,
            Pagos_Completados: pagosCompletados,
            Total_Pagado_Capital: totalCapitalValidado,
            Total_Pagado_Intereses: totalInteresesValidado,
        });

        return {
            message: 'Pago eliminado exitosamente.',
        };
    } catch (error) {
        console.error('Error eliminando el pago:', error);
        throw new Error('Error eliminando el pago');
    }
});

ipcMain.handle('db:addSaving', async (_, { idUsuario, monto, Numero_Cheque, tipo, medioPago, Fecha, Fecha_Deposito }) => {
  console.log({ idUsuario, monto, Numero_Cheque, tipo, medioPago, Fecha, Fecha_Deposito });
  
  const t = await sequelize.transaction(); // Iniciar la transacción

  try {
      monto = parseFloat(monto);
      if (isNaN(monto)) {
          throw new Error("El monto debe ser un número válido.");
      }

      let ahorro = await Ahorro.findOne({ where: { id_Usuario_fk: idUsuario }, transaction: t });

      if (!ahorro) {
          if (tipo === "Desahogo") {
              throw new Error("No existe una cuenta de ahorro para retirar dinero.");
          }

          // Crear una nueva cuenta de ahorro
          ahorro = await Ahorro.create({
              Monto: 0,
              FechaUltimaActualizacion: Fecha,
              id_Usuario_fk: idUsuario
          }, { transaction: t });
      } else {
          // ✅ Usar `await` y la clave correcta `transaction`
          await ahorro.update({
              FechaUltimaActualizacion: Fecha
          }, { transaction: t });
      }

      if (tipo === "Ahorro") {
          ahorro.Monto += monto;
      } else if (tipo === "Desahogo") {
          if (ahorro.Monto < monto) {
              throw new Error("Fondos insuficientes para retirar.");
          }
          ahorro.Monto -= monto;
      } else {
          throw new Error("Tipo de transacción inválido.");
      }

      await ahorro.save({ transaction: t });

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

  ipcMain.handle('db:addCheque', async (_, data) => {
    try {
      const newCheque = await Cheques.create(data);
      return newCheque.toJSON();
    } catch (error) {
      console.error('Error adding cheque:', error);
      throw new Error('Error adding cheque');
    }
  });

  ipcMain.handle('db:getCheques', async () => {
    try {
      const cheques = await Cheques.findAll();
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

  //Conciliacion 

  ipcMain.handle('db:getMonthlyConciliation', async (_, { mes, year }) => {
    try {
        const startDate = new Date(year, mes - 1, 1);
        const endDate = new Date(year, mes, 0, 23, 59, 59);

        const cheques = await Cheques.findAll({
            where: {
                Fecha: {
                    [Sequelize.Op.between]: [startDate, endDate]
                }
            }
        });

        const pagos = await Pagos.findAll({
            where: {
                Fecha_Pago: {
                    [Sequelize.Op.between]: [startDate, endDate]
                }
            },
            include: [
                {
                    model: Prestamo,
                    as: 'Prestamo', // Asegúrate de que el alias es correcto en tu definición de relaciones
                    include: [
                        {
                            model: Usuario,
                            as: 'Usuario' // Asegúrate de que el alias es correcto en tu definición de relaciones
                        }
                    ]
                }
            ]
        });

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

        return {
            cheques: cheques.map(c => c.toJSON()), // Convertir objetos Sequelize a JSON
            pagos: pagos.map(p => {
                const pJSON = p.toJSON(); // Convertir objeto a JSON
                return {
                    ...pJSON,
                    NombreCompleto: `${pJSON.Prestamo?.Usuario?.Nombre || ''} ${pJSON.Prestamo?.Usuario?.Apellido_Paterno || ''} ${pJSON.Prestamo?.Usuario?.Apellido_Materno || ''}`.trim(),
                    CTA_CONTABLE_PRESTAMO: pJSON.Prestamo?.Usuario?.CTA_CONTABLE_PRESTAMO || 'N/A',
                    CTA_CONTABLE_AHORRO: pJSON.Prestamo?.Usuario?.CTA_CONTABLE_AHORRO || 'N/A'
                };
            }),
            transaccionesAhorro: transaccionesAhorro.map(t => {
                const tJSON = t.toJSON(); // Convertir el objeto a JSON
                return {
                    ...tJSON,
                    NombreCompleto: `${tJSON.Ahorro?.Usuario?.Nombre || ''} ${tJSON.Ahorro?.Usuario?.Apellido_Paterno || ''} ${tJSON.Ahorro?.Usuario?.Apellido_Materno || ''}`.trim(),
                    CTA_CONTABLE_PRESTAMO: tJSON.Ahorro?.Usuario?.CTA_CONTABLE_PRESTAMO || 'N/A',
                    CTA_CONTABLE_AHORRO: tJSON.Ahorro?.Usuario?.CTA_CONTABLE_AHORRO || 'N/A'
                };
            })
        };
    } catch (error) {
        console.error('Error al obtener los datos mensuales:', error);
        throw new Error('Error al obtener los datos mensuales');
    }
});





  ipcMain.on('navigate-to', (event, page, usuarioId = null) => {
      try {
          const absolutePath = path.join(__dirname, page);

          if (fs.existsSync(absolutePath)) {
              console.log(`Loading file: ${absolutePath} ${usuarioId ? `with usuarioId: ${usuarioId}` : ''}`);

              if (usuarioId) {
                console.log('loadUrl');
                const fileUrl = pathToFileURL(absolutePath).toString();
                console.log('Loading URL:', `${fileUrl}?idUsuario=${usuarioId}`);
                mainWindow.loadURL(`${fileUrl}?idUsuario=${usuarioId}`);
              }else{

                mainWindow.loadFile(absolutePath).then(() => {
                  mainWindow.webContents.send('set-usuario-id', usuarioId);
                }).catch(err => {
                  console.error('Error loading file:', err);
                });
              }
          } else {
              console.error('File does not exist:', absolutePath);
          }
      } catch (error) {
          console.error('Navigation error:', error);
      }
  });

  // Evento para ir hacia atrás
  ipcMain.on('go-back', () => {
      if (mainWindow.webContents.canGoBack()) {
      mainWindow.webContents.goBack();
      }
  });
  
  ipcMain.on('reload', () => {
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.reload(); // Recargar la página actual
    }
  });

  ipcMain.handle('modal:open', async (event, modalData) => {
    console.log('Opening modal with data:', modalData);

    if (mainWindow) {
      createModal(mainWindow);
    }
  });

  ipcMain.handle('modal:close', async () => {
    try {
      if (modalWindow) {
        modalWindow.close();
        modalWindow = null; // Liberar referencia al modal
        console.log('Modal window closed successfully');
        return { success: true, message: 'Modal closed successfully' };
      } else {
        console.log('No modal window to close');
        return { success: false, message: 'No modal window to close' };
      }
    } catch (error) {
      console.error('Error closing modal:', error);
      return { success: false, message: 'Error closing modal' };
    }
  });


  // Abre DevTools automáticamente
  mainWindow.webContents.openDevTools();
});
