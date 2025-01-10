const { app, BrowserWindow, screen, ipcMain } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');
const useWindowSize = require('./src/hooks/useWindowSize');
const fs = require('fs');
const Usuario = require('./src/db/models/Usuario');
const ActividadEconomica = require('./src/db/models/ActividadEconomica');
const Domicilio = require('./src/db/models/Domicilio');
const { Sequelize } = require('sequelize');

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

app.whenReady().then(()=>{
    createWindow();
  //Usuarios
  ipcMain.handle('db:getUser', async (event, userId) => {
      try {
          if (!userId) {
              throw new Error('User ID is required');
          }
  
          const user = await Usuario.findByPk(userId);

          const DomicilioResponse = await Domicilio.findByPk(user.id_Domicilio_fk);
          
          const ActividadEconomicaResponse = await ActividadEconomica.findByPk(user.id_ActividadEconomica_fk)

          console.log(DomicilioResponse, ActividadEconomicaResponse, user);

          let userJSON = user.toJSON();

          userJSON= {...userJSON, domicilio:{...DomicilioResponse.dataValues}, ActividadEconomica:{...ActividadEconomicaResponse.dataValues}};

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
      const users = await Usuario.findAll();
      return users.map(user => user.toJSON());
    } catch (error) {
      console.error('Error fetching users:', error);
      throw new Error('Error fetching users');
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
    console.log(searchTerm,'SearchAccount');
    try {  
      const users = await Usuario.findAll({
        where: {
          [Sequelize.Op.or]: [
            { CTA_CONTABLE: { [Sequelize.Op.like]: `%${searchTerm}%` } },
          
          ],
        },
      });
      return users.map(user => user.toJSON());
    } catch (error) {
      console.error('Error fetching users by CTA ipcMain:', error);
      throw new Error('Error fetching users by CTA');
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
  // Actividad economica
  ipcMain.handle('db:getEconomicActivities', async () => {
    try {
      const activities = await ActividadEconomica.findAll();
      return activities.map(activity => activity.toJSON());
    } catch (error) {
      console.error('Error fetching activities:', error);
      return [];
    }
  });

  ipcMain.handle('db:addActividad', async (_, data) => {
    try {
      console.log(data);
      const newActividad = await ActividadEconomica.create({Actividad: data});
      return newActividad.dataValues.Actividad;
    } catch (error) {
      console.error('Error adding Actividad:', error);
      throw new Error('Error adding Actividad');
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
