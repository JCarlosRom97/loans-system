var monthTotals = {
    enero: 0,
    febrero: 0,
    marzo: 0,
    abril: 0,
    mayo: 0,
    junio: 0,
    julio: 0,
    agosto: 0,
    septiembre: 0,
    octubre: 0,
    noviembre: 0,
    diciembre: 0,
};


document.addEventListener('DOMContentLoaded', async() => {

    getLoansSearch({Status:'', Year: '',  Nombre: ''})
    
    const statusSelect = document.getElementById('statusSearch');

    statusSelect.addEventListener('change', async(e) =>{
        e.preventDefault();
        const Status = event.target.value || '';
        const Year = document.getElementById('search-date-year').value || '';
        const Nombre = document.getElementById('search-name').value || '';

        monthTotals = {
            enero: 0,
            febrero: 0,
            marzo: 0,
            abril: 0,
            mayo: 0,
            junio: 0,
            julio: 0,
            agosto: 0,
            septiembre: 0,
            octubre: 0,
            noviembre: 0,
            diciembre: 0,
        };

        getLoansSearch({Status, Year, Nombre})
    })

    const searchDateYear = document.getElementById('search-date-year');

    searchDateYear.addEventListener('keyup', (e) =>{
        e.preventDefault();
        const Status = document.getElementById('statusSearch').value || '';
        const Year = document.getElementById('search-date-year').value || '';
        const Nombre = document.getElementById('search-name').value || '';
        if(Year.length == 4){

            monthTotals = {
                enero: 0,
                febrero: 0,
                marzo: 0,
                abril: 0,
                mayo: 0,
                junio: 0,
                julio: 0,
                agosto: 0,
                septiembre: 0,
                octubre: 0,
                noviembre: 0,
                diciembre: 0,
            };

            getLoansSearch({Status, Year, Nombre})
        }
    })



    const searchName = document.getElementById('search-name');
    searchName.addEventListener('keyup', (e) =>{
        e.preventDefault();
        const Status = document.getElementById('statusSearch').value || '';
        const Year = document.getElementById('search-date-year').value || '';
        const Nombre = document.getElementById('search-name').value || '';

        monthTotals = {
            enero: 0,
            febrero: 0,
            marzo: 0,
            abril: 0,
            mayo: 0,
            junio: 0,
            julio: 0,
            agosto: 0,
            septiembre: 0,
            octubre: 0,
            noviembre: 0,
            diciembre: 0,
        };
       
        getLoansSearch({Status, Year, Nombre})
       
    })
});

const getLoansSearch = async({Status, Year, Nombre}) =>{
    try {
        const searchResult = await window.db.getLoanReport({Status, Year, Nombre});
        generateTableSearch(searchResult, Year);
    } catch (error) {
        console.error(error)
    }
}

const generateTableSearch = async (loans, Year) => {
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
                const concilitionData = generateConciliation(loan, Year);

                calculateMonthTotal(concilitionData)

                tableHTML += `
    
                            <tr>
                                <td>${generateStatusElement(loan.EstadoPrestamo)}</td>
                                <td>${loan.Usuario.Nombre} ${loan.Usuario.Apellido_Paterno} ${loan.Usuario.Apellido_Materno}</td>
                                <td>${loan.Usuario.CTA_CONTABLE_PRESTAMO || 'N/A'}</td>
                                <td>${loan.Numero_Cheque || 'N/A'}</td>
                                <td>${loan.Periodo || 'N/A'} </td>
                                <td>${loan.Cantidad_Meses || 'N/A'} </td>
                                <td>${window.api.formatDateToDisplay(loan.Fecha_Inicio) || 'N/A'}</td>
                                <td>${window.api.formatDateToDisplay(loan.Fecha_Termino) || 'N/A'}</td>
                                <td>${parseTOMXN(loan.Monto) || 'N/A'}</td>
                                <td>${loan.Interes +'%' || 'N/A'}</td>
                                <td>${parseTOMXN(loan.TotalPrestamo_Intereses)}</td>
                                ${concilitionData.meses.map((month) =>(`<td>${ parseTOMXN(month.interes)}</td>`)).join('')}
                                <td>${parseTOMXN(concilitionData.totalIntereses)}</td>
                            </tr>

                    `;

            
                TotalIntereses += concilitionData.totalIntereses;
            } catch (error) {
                console.error(`Error al obtener el usuario con ID ${loan.id_Usuario_fk}:`, error);
            }
        }
        document.getElementById('intereses-total').innerText = parseTOMXN(TotalIntereses);
        // Insertar la tabla en el div con ID "loans-table-body"
        const infoDiv = document.getElementById('loans-table-body');


        tableHTML += `

                        <tr>
                            <td colspan="11"></td>
                            <td id='report-table-enero'></td>
                            <td id='report-table-febrero'></td>
                            <td id='report-table-marzo'></td>
                            <td id='report-table-abril'></td>
                            <td id='report-table-mayo'></td>
                            <td id='report-table-junio'></td>
                            <td id='report-table-julio'></td>
                            <td id='report-table-agosto'></td>
                            <td id='report-table-septiembre'></td>
                            <td id='report-table-octubre'></td>
                            <td id='report-table-noviembre'></td>
                            <td id='report-table-diciembre'></td>
                            <td id='report-table-total'></td>
                        </tr>

                `;
        

        infoDiv.innerHTML = tableHTML;
        document.getElementById('info').innerText = '';
        let totalTableMonth = 0;
        // Actualizar los elementos en el DOM con los totales
        for (const [month, total] of Object.entries(monthTotals)) {
            const element = document.getElementById(`report-table-${month}`);
            if (element) {
                totalTableMonth += total; 
                element.textContent = `${parseTOMXN(total)}`; // Actualizar con el valor acumulado formateado
            }
        }

        document.getElementById('report-table-total').textContent = parseTOMXN(totalTableMonth);
    } else {
        const infoDiv = document.getElementById('loans-table-body');
        infoDiv.innerHTML = '';
        // Mostrar mensaje si no hay préstamos
        document.getElementById('info').innerText = 'No se encontraron préstamos.';


        monthTotals = {
            enero: 0,
            febrero: 0,
            marzo: 0,
            abril: 0,
            mayo: 0,
            junio: 0,
            julio: 0,
            agosto: 0,
            septiembre: 0,
            octubre: 0,
            noviembre: 0,
            diciembre: 0,
        };

        cleanTotals();
    }
};

const generateConciliation = (loan, Year) => {
    const { Fecha_Inicio, Monto, Interes, Fecha_Termino } = loan;
    const tasaMensual = Interes / 100; // Interés como decimal
    const fechaInicio = new Date(Fecha_Inicio);
    const fechaTermino = new Date(Fecha_Termino);

    // Si Year es vacío o null, se asigna el año en curso
    Year = Year || new Date().getFullYear();

    const resultado = [];
    let totalIntereses = 0; // Acumulador para la suma de intereses

    // Recorremos los 12 meses del año especificado
    for (let mes = 0; mes < 12; mes++) {
        const primerDiaMes = new Date(Year, mes, 1); // Primer día del mes del año especificado
        const ultimoDiaMes = new Date(Year, mes + 1, 0); // Último día del mes del año especificado
        const diasMes = ultimoDiaMes.getDate(); // Días totales del mes

        let diasAplicables = 0;

        // Validar si el mes está dentro del rango entre Fecha_Inicio y Fecha_Termino
        if (
            (primerDiaMes >= fechaInicio && primerDiaMes <= fechaTermino) ||
            (ultimoDiaMes >= fechaInicio && ultimoDiaMes <= fechaTermino)
        ) {
            if (parseInt(Year) === fechaInicio.getFullYear() && mes === fechaInicio.getMonth()) {
                // Días proporcionales si es el mes de inicio
                diasAplicables = diasMes - fechaInicio.getDate() + 1; // Desde el día inicial hasta el final del mes
            } else if (parseInt(Year) === fechaTermino.getFullYear() && mes === fechaTermino.getMonth()) {
                // Días proporcionales si es el mes de término
                diasAplicables = fechaTermino.getDate(); // Hasta el último día del mes de término
                console.log('2', diasAplicables);
            } else {
                // Mes completo dentro del rango
                diasAplicables = diasMes;
                console.log('3', diasAplicables);
            }
        }

        // Calcular el interés proporcional solo si hay días aplicables
        const interesMensual = (Monto * tasaMensual * diasAplicables) / diasMes;

        // Sumar el interés mensual al total
        totalIntereses += interesMensual;

        // Agregar al resultado
        resultado.push({
            mes: `${primerDiaMes.toLocaleString("es-ES", { month: "long" })} `,
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


const calculateMonthTotal = (conciliationData) => {
    // Acumuladores para cada mes

    // Iterar sobre los datos de conciliación y acumular los valores de interés por mes
    conciliationData.meses.forEach(({ mes, interes }) => {
        const mesKey = mes.trim().toLowerCase();
        if (monthTotals.hasOwnProperty(mesKey)) {
            monthTotals[mesKey] += interes; // Acumular el interés
        }
    });

    

    // Actualizar los elementos en el DOM con los totales
    for (const [month, total] of Object.entries(monthTotals)) {
        const element = document.getElementById(`${month}-total`);
        if (element) {
            element.textContent = `$${total}`; // Actualizar con el valor acumulado formateado
        }
    }

};

const cleanTotals = () =>{
        // Actualizar los elementos en el DOM con los totales
        for (const [month, total] of Object.entries(monthTotals)) {
            const element = document.getElementById(`${month}-total`);
            if (element) {
                element.textContent = `$${total}`; // Actualizar con el valor acumulado formateado
            }
        }
}


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
