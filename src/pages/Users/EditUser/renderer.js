document.addEventListener('DOMContentLoaded', async() => {
    
    const params = new URLSearchParams(window.location.search);
    const idUser = params.get('idUsuario');
    console.log(idUser);
    let lastValidDate ='';

    if(idUser){

        const user = await window.db.getUser(idUser);
        console.log(user);
        console.log(user.Fecha_De_Nacimiento);
        const cuentaContablePrestamo =  document.getElementById("ctaContablePrestamo");
        const cuentaContableAhorro =  document.getElementById("ctaContableAhorro");
        const ID =  document.getElementById("ID");
        const nombre =  document.getElementById("Nombre");
        const apellidoPaterno = document.getElementById("apellidoPaterno");
        const apellidoMaterno = document.getElementById("apellidoMaterno");
        const codigoEmpleado = document.getElementById("codigoEmpleado");
        const fechaNacimiento = document.getElementById("fechaNacimiento");
        const nacionalidad = document.getElementById("nacionalidad");
        const curp = document.getElementById("curp");
        const rfc = document.getElementById("rfc");
        const correoElectronico = document.getElementById("correoElectronico");
        const colonia = document.getElementById("Colonia");
        const calle = document.getElementById("Calle");
        const numero = document.getElementById("Numero");
        const CodigoPostal = document.getElementById("CodigoPostal");

        cuentaContablePrestamo.value = user.CTA_CONTABLE_PRESTAMO;
        cuentaContableAhorro.value = user.CTA_CONTABLE_AHORRO;
        ID.value = user.ID; 
        nombre.value = user.Nombre; 
        apellidoPaterno.value = user.Apellido_Paterno;
        apellidoMaterno.value = user.Apellido_Materno;
        codigoEmpleado.value = user.Codigo_Empleado;
        fechaNacimiento.value = user.Fecha_De_Nacimiento;
        lastValidDate = user.Fecha_De_Nacimiento;
        nacionalidad.value = user.Nacionalidad;
        curp.value = user.CURP; 
        rfc.value = user.RFC; 
        correoElectronico.value = user.Correo_Electronico;
        // Domicilio 
        colonia.value = user.domicilio.Colonia; 
        calle.value = user.domicilio.Calle;
        numero.value = user.domicilio.Numero; 
        CodigoPostal.value = user.domicilio.CodigoPostal;
    }

    const form = document.getElementById('userForm');
    let isSubmitting = false; // Flag to prevent multiple submissions

    form.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent form submission that reloads the page

        const ID = document.getElementById("ID").value;

        if (isSubmitting) return; // Prevent multiple submissions
        isSubmitting = true; // Set the flag to true

        const userData = {
            // Collect your form data here (example below)
            ID,
            CTA_CONTABLE_PRESTAMO: document.getElementById('ctaContablePrestamo').value,
            CTA_CONTABLE_AHORRO: document.getElementById('ctaContableAhorro').value,
            Nombre: document.getElementById('Nombre').value,
            Apellido_Paterno: document.getElementById('apellidoPaterno').value,
            Apellido_Materno: document.getElementById('apellidoMaterno').value,
            Codigo_Empleado: document.getElementById('codigoEmpleado').value,
            Fecha_De_Nacimiento: document.getElementById('fechaNacimiento').value,
            Nacionalidad: document.getElementById('nacionalidad').value,
            CURP: document.getElementById('curp').value,
            RFC: document.getElementById('rfc').value,
            Correo_Electronico: document.getElementById('correoElectronico').value,
            // Add other form fields as needed
        };

           // Add the user to the database via the main process
           try {
            const newUser = await window.db.updateUser(userData);
            console.log('User edited:', newUser);

        
            if(newUser){
                // Show Notification
                window.electron.showNotification('Usuario Actualizado', 
                `Usuario ${userData.Nombre} ha sido exitosamente editado!`);

                const addressData ={    
                    ID: newUser.id_Domicilio_fk,
                    Colonia: document.getElementById('Colonia').value,
                    Calle: document.getElementById('Calle').value,
                    Numero: document.getElementById('Numero').value,
                    CodigoPostal: document.getElementById('CodigoPostal').value
                }
        
                console.log(`addressData ${addressData}`);
        
                const address = await window.db.updateAddress(addressData);

                console.log('address updated!', address);
            }
           

        } catch (error) {
            console.error('Error al actualizar el usuario:', error);
        } finally {
            isSubmitting = false; // Reset flag after the operation completes
        }
    });

    const fechaNacimiento = document.getElementById('fechaNacimiento');
    console.log(fechaNacimiento);
    
    fechaNacimiento.addEventListener('keyup', (e) =>{
        const current = fechaNacimiento.value;
        console.log(current);
        
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


function formatDateSelect(date) {
    const [day, month, year] = date.split('/'); // Divide la fecha por "/"
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`; // Retorna en formato YYYY-MM-DD
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