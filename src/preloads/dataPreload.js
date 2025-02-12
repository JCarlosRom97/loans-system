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
  getLoanReport: async ({Status, Year, Nombre}) =>{
    try {
      console.log({Status, Year, Nombre});
      return await ipcRenderer.invoke('db:getLoansReport', {Status, Year, Nombre}, );
    } catch (error) {
       // Muestra el mensaje de error completo para depuración
       console.error('Error getting loans:', error.message);
    }
  },
  getAllSavingsTransactionsReport: async ({Fecha_Inicio, Fecha_Final, TipoTransaccion, MedioPago}) =>{
    try {
      console.log({Fecha_Inicio, Fecha_Final, TipoTransaccion, MedioPago});
      return await ipcRenderer.invoke('db:getAllSavingsTransactionsReport', {Fecha_Inicio, Fecha_Final, TipoTransaccion, MedioPago}, );
    } catch (error) {
       // Muestra el mensaje de error completo para depuración
       console.error('Error getting savings:', error.message);
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
  getPaymentsReport: async ({Fecha_Inicio, Fecha_Final}) => {
    try {
      return await ipcRenderer.invoke('db:getPaymentsReport', {Fecha_Inicio, Fecha_Final});
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
  },
  //Cheques
  addCheques: async (data) =>{
    try {
      return await ipcRenderer.invoke('db:addCheque', data);
    } catch (error) {
        // Muestra el mensaje de error completo para depuración
        console.error('Error adding Cheques:', error.message);

    }
  },
});


contextBridge.exposeInMainWorld('api', {
  send: (channel, ...args) => ipcRenderer.send(channel, ...args),
  on: (channel, callback) => ipcRenderer.on(channel, (event, ...args) => callback(...args)),
  formatDateToDisplay: (dateInput) => {

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
  getDateAfterPays: (startDate, pays) => {
    console.log('getDateAfterPays', pays, startDate);

    const [startDay, startMonth, startYear] = startDate.split('/').map(Number);
    let targetDate = new Date(startYear, startMonth - 1, startDay);

    // Sumar exactamente (pays * 14) días sin modificar la fecha de inicio
    targetDate.setDate(targetDate.getDate() + (pays * 14));

    // Formatear la fecha resultante como dd/mm/aaaa
    const formattedDate = 
        `${targetDate.getDate().toString().padStart(2, '0')}/` +
        `${(targetDate.getMonth() + 1).toString().padStart(2, '0')}/` +
        `${targetDate.getFullYear()}`;

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
  },
  formatDateForModel:( dateString) => {
    if (!dateString) {
        throw new Error("La fecha no puede estar vacía.");
      }
    
      const parts = dateString.split('/');
      if (parts.length !== 3) {
        throw new Error("El formato de fecha debe ser dd/mm/aaaa.");
      }
    
      const [day, month, year] = parts;
    
      // Validar que día, mes y año son numéricos
      if (isNaN(day) || isNaN(month) || isNaN(year)) {
        throw new Error("El día, mes o año no son válidos.");
      }
    
      // Validar valores de día, mes y año
      if (+day < 1 || +day > 31 || +month < 1 || +month > 12 || +year < 1000) {
        throw new Error("El rango de día, mes o año no es válido.");
      }
    
      // Crear un objeto Date en UTC y ajustar a CST (UTC-6)
      const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0)); // Mes es 0-indexado
      date.setUTCHours(date.getUTCHours() + 6); // Ajuste a CST
    
      // Retornar en formato aaaa-mm-dd con horario CST
      const formattedDate = date.toISOString().replace('T', ' ').split('.')[0];

      return `${formattedDate} -06:00`;
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
