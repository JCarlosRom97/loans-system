const { app, BrowserWindow, screen, ipcMain } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');
const useWindowSize = require('./src/hooks/useWindowSize');
const fs = require('fs');
const Usuario = require('./src/db/models/Usuario');
const Domicilio = require('./src/db/models/Domicilio');
const Prestamo = require('./src/db/models/Prestamo');
const Ahorro = require('./src/db/models/Ahorro');
const TransaccionesAhorro = require('./src/db/models/TransaccionesAhorro');
const { Sequelize } = require('sequelize');
const sequelize = require('./src/db/index')
const syncDatabase = require('./src/db/sync');
const formatDate = require('./src/hooks/formatDate');


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
        width: 500,
        height: 400,
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
  //Usuarios
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

  ipcMain.handle('db:addSaving', async (_, { idUsuario, monto, tipo, medioPago, Fecha }) => {
    console.log({ idUsuario, monto, tipo, medioPago, Fecha });
    const t = await sequelize.transaction();
    
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
          Fecha: Fecha,
          TipoTransaccion: tipo,
          MedioPago: medioPago,
          id_Ahorro_fk: ahorro.ID
      }, { transaction: t });

      await t.commit();
      console.log(`Transacción ${tipo} de ${monto} realizada con éxito.`);

      return transaccionAhorro.toJSON(); // Retornar el objeto de la transacción
    } catch (error) {
        await t.rollback();
        console.error("Error en la transacción:", error.message);
        throw error;
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
