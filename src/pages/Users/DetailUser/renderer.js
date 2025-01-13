document.addEventListener('DOMContentLoaded', async() => {
    
    const params = new URLSearchParams(window.location.search);
    const idUser = params.get('idUsuario');
    console.log(idUser);
    if(idUser){
        const user = await window.db.getUser(idUser);
        getSavingInfo(idUser);
        console.log(user);
        const cuentaContablePrestamo = document.getElementById("CuentaContablePrestamo");
        const cuentaContableAhorro = document.getElementById("CuentaContableAhorro");
        const ID =  document.getElementById("ID");
        const nombre =  document.getElementById("Nombre");
        const apellidoPaterno = document.getElementById("Apellido_Paterno");
        const apellidoMaterno = document.getElementById("Apellido_Materno");
        const codigoEmpleado = document.getElementById("CodigoEmpleado");
        const fechaNacimiento = document.getElementById("FechaNacimiento");
        const nacionalidad = document.getElementById("Nacionalidad");
        const curp = document.getElementById("CURP");
        const rfc = document.getElementById("RFC");
        const correoElectronico = document.getElementById("CorreoElectronico");
        const colonia = document.getElementById("Colonia");
        const calle = document.getElementById("Calle");
        const numero = document.getElementById("Numero");

        cuentaContablePrestamo.innerText = user.CTA_CONTABLE_PRESTAMO;
        cuentaContableAhorro.innerText = user.CTA_CONTABLE_AHORRO;
        ID.innerText = user.ID; 
        nombre.innerText = user.Nombre; 
        apellidoPaterno.innerText = user.Apellido_Paterno;
        apellidoMaterno.innerText = user.Apellido_Materno;
        codigoEmpleado.innerText = user.Codigo_Empleado;
        fechaNacimiento.innerText = user.Fecha_De_Nacimiento;
        nacionalidad.innerText = user.Nacionalidad;
        curp.innerText = user.CURP; 
        rfc.innerText = user.RFC; 
        correoElectronico.innerText = user.Correo_Electronico;
        colonia.innerText = user.domicilio.Colonia; 
        calle.innerText = user.domicilio.Calle;
        numero.innerText = user.domicilio.Numero; 

    }
});

async function getSavingInfo (idUser) {
    console.log(idUser);
    const dataSaving = await window.db.getAmmountSaving(idUser);

    console.log('dataSaving', dataSaving);

    document.getElementById('totalAmount').innerText = `${Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(dataSaving?.Monto || 0)}`;
}
