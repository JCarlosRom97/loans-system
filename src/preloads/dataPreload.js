const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('db', {
  // USERS
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
  updateAddress: async (data) => {
    try {
      return await ipcRenderer.invoke('db:updateAddress', data);
    } catch (error) {
      console.error('Error updating Address:', error);
      throw new Error('Error updating address');
    }
  },
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
  addAddress: async (data) => {
    try {
      return await ipcRenderer.invoke('db:addAddress', data);
    } catch (error) {
      console.error('Error adding address:', error);
      throw new Error('Error adding address');
    }
  },
  getEconomicActivities: async () => {
    try {
      return await ipcRenderer.invoke('db:getEconomicActivities');
    } catch (error) {
      console.error('Error getting activities:', error);
      return [];
    }
  },
  addEconomicActivities: async (data) =>{
    try {
      return await ipcRenderer.invoke('db:addActividad', data);
    } catch (error) {
      console.error('Error adding Activity:', error);
      throw new Error('Error adding Activity');
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
