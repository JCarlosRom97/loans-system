document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('userForm');
    let isSubmitting = false; // Flag to prevent multiple submissions

    form.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent form submission that reloads the page

        if (isSubmitting) return; // Prevent multiple submissions
        isSubmitting = true; // Set the flag to true


        const addressData ={    
            Colonia: document.getElementById('Colonia').value,
            Calle: document.getElementById('Calle').value,
            Numero: document.getElementById('Numero').value,
        }

        console.log(`addressData ${addressData}`);

        const addressID = await window.db.addAddress(addressData);
        const fechaNacimiento  = formatDate(document.getElementById('fechaNacimiento').value)
        console.log('fechaNacimiento',fechaNacimiento);
        const userData = {
            // Collect your form data here (example below)
            CTA_CONTABLE: document.getElementById('ctaContable').value,
            Nombre: document.getElementById('nombre').value,
            Apellido_Paterno: document.getElementById('apellidoPaterno').value,
            Apellido_Materno: document.getElementById('apellidoMaterno').value,
            Codigo_Empleado: document.getElementById('codigoEmpleado').value,
            Fecha_De_Nacimiento: fechaNacimiento,
            Nacionalidad: document.getElementById('nacionalidad').value,
            CURP: document.getElementById('curp').value,
            RFC: document.getElementById('rfc').value,
            Correo_Electronico: document.getElementById('correoElectronico').value,
            id_ActividadEconomica_fk: document.getElementById('activityDropdown').value,
            id_Domicilio_fk: addressID
            // Add other form fields as needed
        };

        // Now you can send the user data or perform any action to display the user
        console.log('User data to submit:', userData);
        
        // Add the user to the database via the main process
        try {
            const newUser = await window.db.addUser(userData);
            console.log('User added:', newUser);

        
            if(newUser){
                // Show Notification
                window.electron.showNotification('Usuario Agregado', 
                `Usuario ${userData.Nombre} ha sido exitosamente añadido!`);

                form.reset();
        
            }
           

        } catch (error) {
            console.error('Error al agregar el usuario:', error);
        } finally {
            isSubmitting = false; // Reset flag after the operation completes
        }
    });

    getActivities();

});

const getActivities = async() =>{
    try {
        const Activities = await window.db.getEconomicActivities();
        console.log('Activities'+Activities)

         // Get the element
        const dropdown = document.getElementById('activityDropdown');

        // Clean 
        dropdown.innerHTML = '';

        // fill with options
        Activities.forEach((activitie) => {
            const option = document.createElement('option');
            option.value = activitie.ID;
            option.textContent = activitie.Actividad;
            dropdown.appendChild(option);
        });
    } catch (error) {
        console.error(`Error: ${error}`)
    }
}

function formatDate(date) {
    console.log(date);
    const dateToFormat = new Date(`${date}T00:00:00`);
    console.log(dateToFormat);
    const day = String(dateToFormat.getDate()).padStart(2, '0'); // Asegura 2 dígitos
    const month = String(dateToFormat.getMonth() + 1).padStart(2, '0'); // Meses comienzan en 0
    const year = dateToFormat.getFullYear(); // Obtiene el año completo

    console.log(`${day}/${month}/${year}`);
    return `${day}/${month}/${year}`;
}