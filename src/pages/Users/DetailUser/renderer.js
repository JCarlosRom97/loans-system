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
        const CodigoPostal = document.getElementById("CodigoPostal");

        cuentaContablePrestamo.innerText = user.CTA_CONTABLE_PRESTAMO;
        cuentaContableAhorro.innerText = user.CTA_CONTABLE_AHORRO;
        ID.value = user.ID; 
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
        CodigoPostal.innerText = user.domicilio.CodigoPostal;

        const loanDetail = await window.db.getLoan({userId:user.ID, status:'Activo'});

        if(loanDetail.length > 0){
            document.getElementById('detailLoanSection').classList.add('visible');
            document.getElementById('detailLoanSection').classList.remove('hidden');
            fillLoanDataUI(loanDetail);
        }else{
            document.getElementById('infoNoLoan').classList.add('visible');
            document.getElementById('infoNoLoan').classList.remove('hidden');
        }



    }

    const saveButton = document.getElementById('savingButton');

    saveButton.addEventListener('click', (e) =>{
        e.preventDefault();
        const userId = document.getElementById("ID").value;
        console.log('savings', userId);
        if (window.api) {
            window.api.send('navigate-to', 'src/pages/Savings/index.html', userId);
        } else {
            console.error('window.api is not available!');
        }
    })

    const loanButton = document.getElementById('loan-redirect-button');
    
    loanButton.addEventListener('click', (e)=>{
        e.preventDefault();
        const userId = document.getElementById("ID").value;
        console.log('savings', userId);
        if (window.api) {
            window.api.send('navigate-to', 'src/pages/Loans/index.html', userId);
        } else {
            console.error('window.api is not available!');
        }
    })
});



const fillLoanDataUI = (loan) =>{
    const fechaPago = getDateAfterPays( loan[0].Fecha_Inicio,loan[0].Pagos_Completados);;
    document.getElementById('fecha-inicio').innerText = loan[0].Fecha_Inicio;
    document.getElementById('fecha-pago').innerText = fechaPago;
    document.getElementById('loan-amount').innerText = parseTOMXN(loan[0].Monto);
    document.getElementById('loan-interest').innerText = `${loan[0].Interes}%`;
    document.getElementById('loan-total').innerText = parseTOMXN(loan[0].TotalPrestamo);
    document.getElementById('loan-abono').innerText = parseTOMXN(loan[0].Abono);
    document.getElementById('loan-saldo').innerText = parseTOMXN(loan[0].Saldo); 
    document.getElementById('loan-status').innerText = loan[0].EstadoPrestamo;
    document.getElementById('loan-payments').innerText = loan[0].Pagos_Completados;
    document.getElementById('loan-catorcenas').innerText = loan[0].No_Catorcenas;
    
    document.getElementById('periodoCatorcenal').innerText = loan[0].Pagos_Completados +1;
    document.getElementById('fecha-pago').value = fechaPago;
}

async function getSavingInfo (idUser) {
    console.log(idUser);
    const dataSaving = await window.db.getAmmountSaving(idUser);

    console.log('dataSaving', dataSaving);

    document.getElementById('totalAmount').innerText = `${Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(dataSaving?.Monto || 0)}`;
}

function getDateAfterPays(startDate, pays) {
    // Convertir la fecha inicial de formato dd/mm/aaaa a objeto Date
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

    return formattedDate;
}

const parseTOMXN = (number) => Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(number || 0);
