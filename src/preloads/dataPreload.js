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
  getLoan: async ({userId, status}) =>{
    try {
      return await ipcRenderer.invoke('db:getLoansByUserId', {userId, status}, );
    } catch (error) {
       // Muestra el mensaje de error completo para depuración
       console.error('Error adding Loan:', error.message);
    }
  },
  getLoanReport: async ({Status, Fecha_Inicio, Fecha_Final, Nombre}) =>{
    try {
      console.log({Status, Fecha_Inicio, Fecha_Final, Nombre});
      return await ipcRenderer.invoke('db:getLoansReport', {Status, Fecha_Inicio, Fecha_Final, Nombre}, );
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
  formatDateToDisplay: (dateInput) => {

    console.log('dateInput',dateInput);
    if (!dateInput) {
      throw new Error("La fecha no puede estar vacía.");
    }
  
    const date = new Date(dateInput);
  
    if (isNaN(date.getTime())) {
      throw new Error("Formato de fecha no válido.");
    }
  
    const day = String(date.getDate()).padStart(2, '0'); // Día con dos dígitos
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Mes con dos dígitos (0 indexado)
    const year = date.getFullYear(); // Año completo
  
    return `${day}/${month}/${year}`;
  },
  getDateAfterPays:(startDate, pays) => {

    console.log('getDateAfterPays', pays, startDate);
    const [startDay, startMonth, startYear] = startDate.split('/').map(Number);
    let currentFriday = new Date(startYear, startMonth - 1, startDay);

    // Asegurarse de que la fecha inicial sea un viernes
    while (currentFriday.getDay() !== 5) {
        currentFriday.setDate(currentFriday.getDate() + 1);
    }

    // Calcular la fecha después de recorrer las catorcenas
    const daysToAdd = pays * 14; // Cada catorcena son 14 días
    currentFriday.setDate(currentFriday.getDate() + daysToAdd);

    // Formatear la fecha resultante como dd/mm/aaaa
    const formattedDate = 
        `${currentFriday.getDate().toString().padStart(2, '0')}/` +
        `${(currentFriday.getMonth() + 1).toString().padStart(2, '0')}/` +
        `${currentFriday.getFullYear()}`;

        console.log(formattedDate);

    return formattedDate;
  },
  hasOneYearPassed:(dateInput) => {
    // Verificar que la fecha de entrada sea válida
    const inputDate = new Date(dateInput);
  
    if (isNaN(inputDate.getTime())) {
      throw new Error("La fecha proporcionada no es válida.");
    }
  
    // Obtener la fecha actual
    const currentDate = new Date();
  
    // Calcular la diferencia en milisegundos
    const timeDifference = currentDate - inputDate;
  
    // Convertir milisegundos a días
    const daysDifference = timeDifference / (1000 * 60 * 60 * 24);
  
    // Verificar si ha pasado un año (aproximadamente 365 días)

    console.log(daysDifference >= 365);
    return daysDifference >= 365;
  }
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
