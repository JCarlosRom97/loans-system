const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('db', {
  // USERS
  addUser: async (data) => {  // <-- Agrega esta función
    try {
      return await ipcRenderer.invoke('db:addUser', data);
    } catch (error) {
      console.error('Error adding User:', error);
      throw new Error('Error adding user');
    }
  },
  getUser: async (data) => {
    try {
      return await ipcRenderer.invoke('db:getUser', data);
    } catch (error) {
      console.error('Error getting User:', error);
      return [];
    }
  },
  getUsers: async () => {
    try {
      return await ipcRenderer.invoke('db:getUsers');
    } catch (error) {
      console.error('Error getting Users:', error);
      return [];
    }
  },
  updateUser: async (data) => {
    try {
      return await ipcRenderer.invoke('db:updateUser', data);
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error('Error updating user');
    }
  },
  //Address
  addAddress: async (data) => {
    try {
      return await ipcRenderer.invoke('db:addAddress', data);
    } catch (error) {
      console.error('Error adding address:', error);
      throw new Error('Error adding address');
    }
  },
  updateAddress: async (data) => {
    try {
      return await ipcRenderer.invoke('db:updateAddress', data);
    } catch (error) {
      console.error('Error updating Address:', error);
      throw new Error('Error updating address');
    }
  },
  //Search
  searchUsersbyName: async (data) =>{
    try {
      console.log(data, 'dataPreload');
      return await ipcRenderer.invoke('db:getUsersByName', data);
    } catch (error) {
      console.error('Error searching users:', error);
      throw new Error('Error searching users');
    }
  },
  searchUsersbyCTA: async (data) =>{
    try {
      return await ipcRenderer.invoke('db:getUsersByAccount', data);
    } catch (error) {
      console.error('Error searching users:', error);
      throw new Error('Error searching users');
    }
  },

  //Savings
  getAmmountSaving: async (idUser) =>{
    try {
      return await ipcRenderer.invoke('db:getAmmountSaving', idUser);
    } catch (error) {
      console.error('Error getting savings:', error);
      throw new Error('Error getting savings');
    }
  },
  getSavings: async (id_Ahorro_fk) =>{
    try {
      return await ipcRenderer.invoke('db:getAllSavingsTransactions', id_Ahorro_fk);
    } catch (error) {
      console.error('Error getting savings:', error);
      throw new Error('Error getting savings', error);
    }
  },
  //LOANS
  addLoan: async (data) =>{
    try {
      return await ipcRenderer.invoke('db:addLoan', data);
    } catch (error) {
       // Muestra el mensaje de error completo para depuración
       console.error('Error adding Loan:', error.message);
    }
  },
  refinanceLoan: async (data) =>{
    try {
      return await ipcRenderer.invoke('db:refinanceLoan', data);
    } catch (error) {
       // Muestra el mensaje de error completo para depuración
       console.error('Error adding Loan:', error.message);
    }
  },
  getLoan: async (userId) =>{
    try {
      return await ipcRenderer.invoke('db:getLoansByUserId', userId);
    } catch (error) {
       // Muestra el mensaje de error completo para depuración
       console.error('Error adding Loan:', error.message);
    }
  },
  updateLoanCapitalIntereses: async (data) => {
    try {
      return await ipcRenderer.invoke('db:updateLoanCapitalIntereses', data);
    } catch (error) {
       // Muestra el mensaje de error completo para depuración
       console.error('Error adding Loan:', error.message);
    }
  },
  //Payments
  getPayments: async (data) => {
    try {
      return await ipcRenderer.invoke('db:getPaymentsByLoan', data);
    } catch (error) {
      console.error('Error getting User:', error);
      return [];
    }
  },
  addPayment: async (data) => {
    try {
      console.log(data);
      const response = await ipcRenderer.invoke('db:registerPayment', data);
      return response;
    } catch (error) {
      // Muestra el mensaje de error completo para depuración
      console.error('Error adding Payment:', error.message);
    }
  },
  removePayment: async (idPay) =>{
    try {
      console.log(idPay);
      const response = await ipcRenderer.invoke('db:deletePayment', idPay);
      return response;
    } catch (error) {
      // Muestra el mensaje de error completo para depuración
      console.error('Error adding Payment:', error.message);
    }
  },
  //SAVINGS
  addSavings: async (data) =>{
    try {
      return await ipcRenderer.invoke('db:addSaving', data);
    } catch (error) {
       // Muestra el mensaje de error completo para depuración
       console.error('Error adding Savings:', error.message);
      throw new Error('Fondos insuficientes para retirar.');
    }
  },
  removeSavingTransaction: async (idTransaccion) => {
    try {
        const response = await ipcRenderer.invoke('db:removeSavingTransaction', { idTransaccion });
        alert(response.message); // Muestra el mensaje de éxito
    } catch (error) {
        console.error('Error removing saving transaction:', error.message);
        alert("Error al eliminar la transacción.");
    }
  }
});

contextBridge.exposeInMainWorld('api', {
  send: (channel, ...args) => ipcRenderer.send(channel, ...args),
  on: (channel, callback) => ipcRenderer.on(channel, (event, ...args) => callback(...args)),
});

contextBridge.exposeInMainWorld('modal', {
  open: (modalData) => ipcRenderer.invoke('modal:open', modalData),
  close: () => ipcRenderer.invoke('modal:close'),
});

contextBridge.exposeInMainWorld('electron', {
  showNotification: (title, body) => {
    if (Notification.permission === 'granted') {
      new Notification(title, { body });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          new Notification(title, { body });
        } else {
          console.error('Permiso para notificaciones denegado.');
        }
      });
    } else {
      console.error('Permiso para notificaciones ya denegado.');
    }
  },
});
