document.addEventListener('DOMContentLoaded', async() => {

    getLoansSearch({Status:'', Year: '',  Nombre: ''})
    
    const statusSelect = document.getElementById('statusSearch');

    statusSelect.addEventListener('change', async(e) =>{
        e.preventDefault();
        const Status = event.target.value || '';
        const Year = document.getElementById('search-date-year').value || '';
        const Nombre = document.getElementById('search-name').value || '';
        getLoansSearch({Status, Year, Nombre})
    })

    const searchDateYear = document.getElementById('search-date-year');

    searchDateYear.addEventListener('keyup', (e) =>{
        e.preventDefault();
        const Status = document.getElementById('statusSearch').value || '';
        const Year = document.getElementById('search-date-year').value || '';
        const Nombre = document.getElementById('search-name').value || '';
        if(Year.length == 4){
            getLoansSearch({Status, Year, Nombre})
        }
    })



    const searchName = document.getElementById('search-name');
    searchName.addEventListener('keyup', (e) =>{
        e.preventDefault();
        const Status = document.getElementById('statusSearch').value || '';
        const Year = document.getElementById('search-date-year').value || '';
        const Nombre = document.getElementById('search-name').value || '';
       
        getLoansSearch({Status, Year, Nombre})
       
    })
});

const getLoansSearch = async({Status, Year, Nombre}) =>{
    try {
        const searchResult = await window.db.getLoanReport({Status, Year, Nombre});
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
        let TotalIntereses = 0;
        // Recorrer los préstamos y agregar filas
        for (const loan of loans) {
            try {
                const concilitionData = generateConciliation(loan);
                console.log(concilitionData);

                tableHTML += `
                <div class='container-tables' >
                    <table class="loans-table" id="loans-table-body">
                        <thead>
                            <tr>
                                <th>Estatus</th>
                                <th>Nombre</th>
                                <th>Número de Cheque</th>
                                <th>Periodo</th>
                                <th>Fecha Inicio</th>
                                <th>Fecha Termino</th>
                                <th>Monto</th>
                                <th>Total Préstamo (Intereses)</th>
                            </tr>
                        </thead>
                        <tbody id="loans-table-body">
                            <tr>
                                <td>${generateStatusElement(loan.EstadoPrestamo)}</td>
                                <td>${loan.Usuario.Nombre} ${loan.Usuario.Apellido_Paterno} ${loan.Usuario.Apellido_Materno}</td>
                                <td>${loan.Numero_Cheque || 'N/A'}</td>
                                <td>${loan.Periodo || 'N/A'} </td>
                                <td>${window.api.formatDateToDisplay(loan.Fecha_Inicio) || 'N/A'}</td>
                                <td>${window.api.formatDateToDisplay(loan.Fecha_Termino) || 'N/A'}</td>
                                <td>${parseTOMXN(loan.Monto) || 'N/A'}</td>
                                <td>Interes mensual ${loan.Interes}% : ${parseTOMXN(loan.TotalPrestamo_Intereses)}</td>
                            </tr>
                        </tbody>
                    </table>
                    <table  class="loans-table month-table">
                        <thead>
                        <tr>
                            ${concilitionData.meses.map((month) =>(`<th>${month.mes}</th>`)).join('')}
                            <th>Total:</th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr>
                            ${concilitionData.meses.map((month) =>(`<td>${ parseTOMXN(month.interes)}</td>`)).join('')}
                            <td>${parseTOMXN(concilitionData.totalIntereses)}</td>
                        </tr>
                        </tbody>
                    </table>
                    </div>
                <hr/>
                `;
            
                TotalIntereses += concilitionData.totalIntereses;
            } catch (error) {
                console.error(`Error al obtener el usuario con ID ${loan.id_Usuario_fk}:`, error);
            }
        }
        document.getElementById('intereses-total').innerText = parseTOMXN(TotalIntereses);
        // Insertar la tabla en el div con ID "loans-table-body"
        const infoDiv = document.getElementById('tables-container');
        infoDiv.innerHTML = tableHTML;
        document.getElementById('info').innerText = '';
    } else {
        const infoDiv = document.getElementById('tables-container');
        infoDiv.innerHTML = '';
        // Mostrar mensaje si no hay préstamos
        document.getElementById('info').innerText = 'No se encontraron préstamos.';
    }
};

const generateConciliation = (loan) => {
    const { Fecha_Inicio, Monto, Interes } = loan;
    const tasaMensual = Interes / 100; // Interés como decimal
    const fechaInicio = new Date(Fecha_Inicio);
    const añoFin = fechaInicio.getFullYear(); // Tomamos el año de la fecha de inicio

    const resultado = [];
    let totalIntereses = 0; // Acumulador para la suma de intereses

    // Recorremos los 12 meses del año
    for (let mes = 0; mes < 12; mes++) {
        const primerDiaMes = new Date(añoFin, mes, 1); // Primer día del mes
        const ultimoDiaMes = new Date(añoFin, mes + 1, 0); // Último día del mes
        const diasMes = ultimoDiaMes.getDate(); // Días totales del mes

        let diasAplicables;

        // Si el mes actual es el de inicio, calculamos los días restantes
        if (
            mes === fechaInicio.getMonth() &&
            añoFin === fechaInicio.getFullYear()
        ) {
            diasAplicables = diasMes - fechaInicio.getDate() + 1;
        } else if (mes < fechaInicio.getMonth() && añoFin === fechaInicio.getFullYear()) {
            // Para los meses antes de la fecha de inicio, no se considera ningún interés
            diasAplicables = 0;
        } else {
            // Meses completos
            diasAplicables = diasMes;
        }

        // Calcular el interés proporcional
        const interesMensual = (Monto * tasaMensual * diasAplicables) / diasMes;

        // Sumar el interés mensual al total
        totalIntereses += interesMensual;

        // Agregar al resultado
        resultado.push({
            mes: `${primerDiaMes.toLocaleString('es-ES', { month: 'long' })} `,
            diasAplicables,
            interes: Math.round(interesMensual), // Redondear a entero
        });
    }

    // Retornar los resultados y la suma total de intereses
    return {
        meses: resultado,
        totalIntereses: Math.round(totalIntereses), // Redondear la suma total
    };
};

const processInformation = (loans) =>{
  
    const montoTotalPrestado = loans.reduce((accumulator ,loan) => {
        return accumulator += loan.Monto;
    }, 0)

    document.getElementById('monto-total-prestamo').innerText = parseTOMXN(montoTotalPrestado);
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
