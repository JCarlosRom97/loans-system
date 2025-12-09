const { Sequelize } = require('sequelize');
const Domicilio = require('../../models/Domicilio');
const Usuario = require('../../models/Usuario');

const usersAPI = (ipcMain) => {
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

      userJSON = { ...userJSON, domicilio: { ...DomicilioResponse.dataValues } };

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
    console.log(searchTerm, 'Search');
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
}

module.exports = usersAPI;