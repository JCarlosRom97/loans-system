
// Función para obtener y mostrar los usuarios en una tabla
async function fetchAndDisplayUsers(users) {
    try {
        console.log('window.db:', window.db);

        if (!window.db || !window.db.getUsers) {
            throw new Error('El objeto window.db o el método getUsers no están definidos.');
        }
      
        if(users == null){
            users =  await window.db.getUsers();
        }

        console.log(users,' users');
     
        // Verificar si hay usuarios
        if (users.length > 0) {
            // Generar el HTML para la tabla
            let tableHTML = ``;
    
            // Recorrer los usuarios y agregar filas
            users.forEach(user => {
                console.log(user);
            tableHTML += `
                <tr>
                        <td>${user.CTA_CONTABLE_PRESTAMO  || 'N/A'}</td>
                        <td>${user.CTA_CONTABLE_AHORRO  || 'N/A'}</td>
                        <td>${user.Nombre}</td>
                        <td>${user.Apellido_Paterno}</td>
                        <td>${user.Apellido_Materno || 'N/A'}</td>
                        <td>${user.Codigo_Empleado || 'N/A'}</td>
                        <td>${user.Fecha_De_Nacimiento}</td>
                        <td>${user.Nacionalidad || 'N/A'}</td>
                        <td>${user.Correo_Electronico}</td>
                        <td>
                            <button class="action-btn" id="addButton" onclick="goLoans(${user.ID})">Agregar Préstamo</button>
                            <button class="action-btn" onclick="goSavings(${user.ID})" >Ahorro</button>
                            <button class="action-btn detail-button" id="${user.ID}" onclick="goDetail(${user.ID})"  >Ver Detalle</button>
                            <button class="action-btn detail-button" id="${user.ID}" onclick="goEditUser(${user.ID})"  >Editar Usuario</button>
                        </td>
                 
                </tr>
            `;
            });
    
            tableHTML += '</tbody></table>';
    
            // Insertar la tabla en el div con ID "info"
            const infoDiv = document.getElementById('user-table-body');
            infoDiv.innerHTML = tableHTML;
            document.getElementById('info').innerText = '';

   
        } else {
            const infoDiv = document.getElementById('user-table-body');
            infoDiv.innerHTML = "";
            // Mostrar mensaje si no hay usuarios
            document.getElementById('info').innerText = 'No se encontraron usuarios.';
        }
        } catch (error) {
        // Manejar errores
        console.error('Error al obtener usuarios:', error);
        document.getElementById('info').innerText = 'Error al cargar los usuarios.';
    }
}



const searchFunction = () =>{
    const categorySelect= document.getElementById('categorySearch');
    const searchInput = document.getElementById('searchValue');
    searchInput.addEventListener('keyup', async (e) =>{
        const categoryValue = categorySelect.value;
        const searchInputValue = searchInput.value;
        if(categoryValue === "1"){
            const users = await window.db.searchUsersbyName(searchInputValue); // Llamada a la API expuesta en preload
            fetchAndDisplayUsers(users)
        }else{
            const users = await window.db.searchUsersbyCTA(searchInputValue); // Llamada a la API expuesta en preload
            fetchAndDisplayUsers(users) 
        }
        
    })
}

// Listener botón de agregar usuario
document.addEventListener('DOMContentLoaded', () => {
    
    const addUserBtn = document.getElementById('addUserBtn');
    
    addUserBtn.addEventListener('click', (e) => {
        e.preventDefault()
        window.api.send('navigate-to', 'src/pages/Users/AddUser/index.html')
    });
    
    
    
    searchFunction()
    fetchAndDisplayUsers(null);
    
});


const goSavings = (userId) =>{
    console.log('savings', userId);
    if (window.api) {
        window.api.send('navigate-to', 'src/pages/Savings/index.html', userId);
    } else {
        console.error('window.api is not available!');
    }
}

const goDetail = (userId) =>{
    console.log('detail', userId);
    if (window.api) {
        window.api.send('navigate-to', 'src/pages/Users/DetailUser/index.html', userId);
    } else {
        console.error('window.api is not available!');
    }
}

const goEditUser = (userId) => {
    console.log('detail', userId);
    if (window.api) {
        window.api.send('navigate-to', 'src/pages/Users/EditUser/index.html', userId);
    } else {
        console.error('window.api is not available!');
    }
}

const goLoans = (userId) =>{
    console.log('loan', userId);
    if (window.api) {
        window.api.send('navigate-to', 'src/pages/Loans/index.html', userId);
    } else {
        console.error('window.api is not available!');
    }
}
