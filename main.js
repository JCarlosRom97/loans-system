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
const Gastos = require('./src/db/models/Gastos');
const { Sequelize } = require('sequelize');
const sequelize = require('./src/db/index')
const syncDatabase = require('./src/db/sync');
const formatDate = require('./src/hooks/formatDate');
const { log } = require('electron-builder');
const AhorroSaldos = require('./src/db/models/AhorroSaldos');

const userAPI = require('./src/db/api/users/index');
const savingAPI = require('./src/db/api/saving/index');
const loanAPI = require('./src/db/api/loan/index');
const payAPI = require('./src/db/api/pay/index')
const reportsAPI = require('./src/db/api/reports/index');
const chequesGastosAPI = require('./src/db/api/chequesGastos/index');
const conciliacionAPI = require('./src/db/api/conciliacion/index')


// add electron reload

require('electron-reload')(__dirname, {
    electron: path.join(__dirname, 'node_modules', '.bin', 'electron'),
});


let mainWindow;
let modalWindowCheque;
let modalWindowCatorcena;

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
const createModalCheque = (parentWindow, options = {}) => {
    modalWindowCheque = new BrowserWindow({
        width: 1000,
        height: 800,
        parent: parentWindow, // Hace que la ventana sea modal
        modal: true,
        show: false, // Evitar que se muestre inmediatamente
        resizable: false, // Evita redimensionar
        webPreferences: {
            contextIsolation: true,
            preload: path.join(__dirname, 'src', 'preloads', 'modalGastoPreload.js'),
        },
    });

    // Cargar el archivo HTML del modal
    modalWindowCheque.loadFile('./src/components/modal/Cheque/index.html');

    modalWindowCheque.once('ready-to-show', () => {
        modalWindowCheque.show();
        //modalWindowCheque.webContents.openDevTools();
    });

    modalWindowCheque.on('closed', () => {
        modalWindowCheque = null;
    });
};

// Crear una ventana modal
const createModalCatorcena = (parentWindow, options = {}) => {
  modalWindowCatorcena = new BrowserWindow({
      width: 900,
      height: 800,
      parent: parentWindow, // Hace que la ventana sea modal
      modal: true,
      show: false, // Evitar que se muestre inmediatamente
      resizable: false, // Evita redimensionar
      webPreferences: {
          contextIsolation: true,
          preload: path.join(__dirname, 'src', 'preloads', 'modalCatorcenaPreload.js'),
      },
  });

  // Cargar el archivo HTML del modal
  modalWindowCatorcena.loadFile('./src/components/modal/Catorcena/index.html');

  modalWindowCatorcena.once('ready-to-show', () => {
      modalWindowCatorcena.show();
  });

  modalWindowCatorcena.on('closed', () => {
      modalWindowCatorcena = null;
  });
};

app.whenReady().then(async()=>{
  await syncDatabase();
  createWindow();

  userAPI(ipcMain);
  savingAPI(ipcMain);
  loanAPI(ipcMain);
  payAPI(ipcMain);
  reportsAPI(ipcMain);
  chequesGastosAPI(ipcMain);
  conciliacionAPI(ipcMain);

  

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

  ipcMain.handle('modalCheque:open', async (event, modalData) => {
    console.log('Opening modal with data:', modalData);

    if (mainWindow) {
      createModalCheque(mainWindow);
    }
  });

  ipcMain.handle('modalCheque:close', async () => {
    try {
      if (modalWindowCheque) {
        modalWindowCheque.close();
        modalWindowCheque = null; // Liberar referencia al modal
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

  // Catorcena Modal 

  ipcMain.handle('modalCatorcena:open', async (event, modalData) => {
    console.log('Opening modal with data:', modalData);

    if (mainWindow) {
      createModalCatorcena(mainWindow);
    }
  });

  ipcMain.handle('modalCatorcena:close', async () => {
    try {
      if (modalWindowCatorcena) {
        modalWindowCatorcena.close();
        modalWindowCatorcena = null; // Liberar referencia al modal
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
