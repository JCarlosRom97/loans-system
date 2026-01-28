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
            CodigoPostal: document.getElementById('CodigoPostal').value
        }

        console.log(`addressData ${addressData}`);

        const addressID = await window.db.addAddress(addressData);
        const userData = {
            // Collect your form data here (example below)
            CTA_CONTABLE_PRESTAMO: document.getElementById('ctaContablePrestamo').value,
            CTA_CONTABLE_AHORRO: document.getElementById('ctaContableAhorro').value,
            Nombre: document.getElementById('nombre').value,
            Apellido_Paterno: document.getElementById('apellidoPaterno').value,
            Apellido_Materno: document.getElementById('apellidoMaterno').value,
            Codigo_Empleado: document.getElementById('codigoEmpleado').value,
            Fecha_De_Nacimiento: document.getElementById('fechaNacimiento').value,
            Nacionalidad: document.getElementById('nacionalidad').value,
            CURP: document.getElementById('curp').value,
            RFC: document.getElementById('rfc').value,
            Correo_Electronico: document.getElementById('correoElectronico').value,
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


    const fechaNacimiento = document.getElementById('fechaNacimiento');
    let lastValidDate ='';
    
    fechaNacimiento.addEventListener('keyup', (e) =>{
        const current = fechaNacimiento.value;
        
        // If what the user typed breaks the dd/mm/aaaa structure → revert
        if (!window.api.formatInputDate(current)) {
            fechaNacimiento.value = lastValidDate;
          return;
        }
      
        // If full date is written, validate logical date
        if (current.length === 10 && !window.api.formatInputDate(current)) {
            fechaNacimiento.value = lastValidDate;
          return;
        }
      
        // Save valid value
        lastValidDate = current;
        e.preventDefault();
    });

});



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