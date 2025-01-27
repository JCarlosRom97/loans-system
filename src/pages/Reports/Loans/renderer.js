document.addEventListener('DOMContentLoaded', async() => {

    getLoansSearch({Status:'', Fecha_Inicio: '', Fecha_Final: '', Nombre: ''})
    
    const statusSelect = document.getElementById('statusSearch');

    statusSelect.addEventListener('change', async(e) =>{
        e.preventDefault();
        const Status = event.target.value || '';
        const Fecha_Inicio = document.getElementById('search-date-from').value || '';
        const Fecha_Final = document.getElementById('search-date-to').value || '';
        const Nombre = document.getElementById('search-name').value || '';
        getLoansSearch({Status, Fecha_Inicio, Fecha_Final, Nombre})
    })

    const searchDateFrom = document.getElementById('search-date-from');

    searchDateFrom.addEventListener('keyup', (e) =>{
        e.preventDefault();
        const Status = document.getElementById('statusSearch').value || '';
        const Fecha_Inicio = document.getElementById('search-date-from').value || '';
        const Fecha_Final = document.getElementById('search-date-to').value || '';
        const Nombre = document.getElementById('search-name').value || '';
        if(regexDate(Fecha_Inicio)){
            getLoansSearch({Status, Fecha_Inicio, Fecha_Final, Nombre})
        }else if(Fecha_Inicio ===''){
            getLoansSearch({Status, Fecha_Inicio, Fecha_Final, Nombre})
        }
    })

    const searchDateTo = document.getElementById('search-date-to');

    searchDateTo.addEventListener('keyup', (e) =>{
        e.preventDefault();
        const Status = document.getElementById('statusSearch').value || '';
        const Fecha_Inicio = document.getElementById('search-date-from').value || '';
        const Fecha_Final = document.getElementById('search-date-to').value || '';
        const Nombre = document.getElementById('search-name').value || '';
        if(regexDate(Fecha_Final)){
            getLoansSearch({Status, Fecha_Inicio, Fecha_Final, Nombre})
        }else if(Fecha_Final ===''){
            getLoansSearch({Status, Fecha_Inicio, Fecha_Final, Nombre})
        }
    })

    const searchName = document.getElementById('search-name');
    searchName.addEventListener('keyup', (e) =>{
        e.preventDefault();
        const Status = document.getElementById('statusSearch').value || '';
        const Fecha_Inicio = document.getElementById('search-date-from').value || '';
        const Fecha_Final = document.getElementById('search-date-to').value || '';
        const Nombre = document.getElementById('search-name').value || '';
       
        getLoansSearch({Status, Fecha_Inicio, Fecha_Final, Nombre})
       
    })
});

const getLoansSearch = async({Status, Fecha_Inicio, Fecha_Final, Nombre}) =>{
    try {
        const searchResult = await window.db.getLoanReport({Status, Fecha_Inicio, Fecha_Final, Nombre});
        generateTableSearch(searchResult);
    } catch (error) {
        console.error(error)
    }
}

const generateTableSearch = async (loans) => {
    // Verificar si hay préstamos
    if (loans.length > 0) {
        // Generar el HTML para la tabla
        let tableHTML = '';
        console.log('loans',loans);
        processInformation(loans)
        // Recorrer los préstamos y agregar filas
        for (const loan of loans) {
            try {

                tableHTML += `
                    <tr>
                        <td>${generateStatusElement(loan.EstadoPrestamo)}</td>
                        <td>${loan.Usuario.Nombre} ${loan.Usuario.Apellido_Paterno} ${loan.Usuario.Apellido_Materno}</td>
                        <td>${loan.Periodo || 'N/A'} años</td>
                        <td>${window.api.formatDateToDisplay(loan.Fecha_Inicio) || 'N/A'}</td>
                        <td>${parseTOMXN(loan.Monto) || 'N/A'}</td>
                        <td>Interes mensual ${loan.Interes}% : ${parseTOMXN(loan.TotalPrestamo_Intereses)}</td>
                        <td>${parseTOMXN(loan.TotalPrestamo)}</td>
                        <td>${loan.Pagos_Completados} x abono: ${parseTOMXN(loan.Abono)}</td>
                        <td>${parseTOMXN(loan.Total_Pagado_Intereses)}</td>
                        <td>${parseTOMXN(loan.Total_Pagado_Capital)}</td>
                        <td>${parseTOMXN(loan.Total_Capital)}</td>
                    </tr>
                `;
            } catch (error) {
                console.error(`Error al obtener el usuario con ID ${loan.id_Usuario_fk}:`, error);
            }
        }

        // Insertar la tabla en el div con ID "loans-table-body"
        const infoDiv = document.getElementById('loans-table-body');
        infoDiv.innerHTML = tableHTML;
        document.getElementById('info').innerText = '';
    } else {
        const infoDiv = document.getElementById('loans-table-body');
        infoDiv.innerHTML = '';
        // Mostrar mensaje si no hay préstamos
        document.getElementById('info').innerText = 'No se encontraron préstamos.';
    }
};

const processInformation = (loans) =>{
  
    const montoTotalPrestado = loans.reduce((accumulator ,loan) => {
        return accumulator += loan.Monto;
    }, 0)

    const interesesTotal = loans.reduce ((accumulator, loan)=>{
        return accumulator += loan.TotalPrestamo_Intereses
    }, 0)

    document.getElementById('monto-total-prestamo').innerText = parseTOMXN(montoTotalPrestado);
    document.getElementById('intereses-total').innerText = parseTOMXN(interesesTotal);
    document.getElementById('monto-total-prestamo-intereses').innerText = parseTOMXN(montoTotalPrestado+interesesTotal);
   
}

const generateStatusElement = (EstadoPrestamo) =>{
    if(EstadoPrestamo =='Activo'){
        return '<span class="status-active">Activo</span>'
    }else if(EstadoPrestamo =='Refinanciado'){
        return '<span class="status-refinance">Refinanciado</span>'
    }else{
        return '<span class="status-payed">Pagado</span>'
    }
}


const parseTOMXN = (number) => Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(number || 0);

function regexDate (fechaValue, totalPrestamoValue){
    const dateRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
    if (dateRegex.test(fechaValue)) {
       return true;
        
    } else {
       return false
    }
}
