document.addEventListener('DOMContentLoaded', async() => {
    
    const params = new URLSearchParams(window.location.search);
    const idUser = params.get('idUsuario');
    console.log(idUser);

    if(idUser){

        getActivities();

        const user = await window.db.getUser(idUser);
        console.log(user);
        console.log(user.Fecha_De_Nacimiento);
        const cuentaContable =  document.getElementById("ctaContable");
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
        const actividadEconomica = document.getElementById("activityDropdown");
        const colonia = document.getElementById("Colonia");
        const calle = document.getElementById("Calle");
        const numero = document.getElementById("Numero");

        cuentaContable.value = user.CTA_CONTABLE;
        ID.value = user.ID; 
        nombre.value = user.Nombre; 
        apellidoPaterno.value = user.Apellido_Paterno;
        apellidoMaterno.value = user.Apellido_Materno;
        codigoEmpleado.value = user.Codigo_Empleado;
        fechaNacimiento.value = formatDateSelect(user.Fecha_De_Nacimiento);
        nacionalidad.value = user.Nacionalidad;
        curp.value = user.CURP; 
        rfc.value = user.RFC; 
        correoElectronico.value = user.Correo_Electronico;
        actividadEconomica.value = user.ActividadEconomica.ID;
        // Domicilio 
        colonia.value = user.domicilio.Colonia; 
        calle.value = user.domicilio.Calle;
        numero.value = user.domicilio.Numero; 
    }

    const form = document.getElementById('userForm');
    let isSubmitting = false; // Flag to prevent multiple submissions

    form.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent form submission that reloads the page


        const ID = document.getElementById("ID").value;

        if (isSubmitting) return; // Prevent multiple submissions
        isSubmitting = true; // Set the flag to true


      
        const fechaNacimiento  = formatDate(document.getElementById('fechaNacimiento').value)
        console.log('fechaNacimiento', fechaNacimiento);

        const userData = {
            // Collect your form data here (example below)
            ID,
            CTA_CONTABLE: document.getElementById('ctaContable').value,
            Nombre: document.getElementById('Nombre').value,
            Apellido_Paterno: document.getElementById('apellidoPaterno').value,
            Apellido_Materno: document.getElementById('apellidoMaterno').value,
            Codigo_Empleado: document.getElementById('codigoEmpleado').value,
            Fecha_De_Nacimiento: fechaNacimiento,
            Nacionalidad: document.getElementById('nacionalidad').value,
            CURP: document.getElementById('curp').value,
            RFC: document.getElementById('rfc').value,
            Correo_Electronico: document.getElementById('correoElectronico').value,
            id_ActividadEconomica_fk: document.getElementById('activityDropdown').value,
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
    })
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