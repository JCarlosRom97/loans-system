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

document.addEventListener('DOMContentLoaded', async () => {

    const fechaActual = new Date();
    const year = fechaActual.getFullYear(); // Año en formato 'YYYY'

    document.getElementById('search-date-year').value = year;

    getLoansSearch({ Status: '', Year: year, Nombre: '' });

    /* Filtro de Status */
    const statusSelect = document.getElementById('statusSearch');
    statusSelect.addEventListener('change', async (e) => {
        e.preventDefault();
        const Status = e.target.value || '';
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

        getLoansSearch({ Status, Year, Nombre });
    });

    /* Filtro de año */
    const searchDateYear = document.getElementById('search-date-year');
    searchDateYear.addEventListener('keyup', (e) => {
        e.preventDefault();
        const Status = document.getElementById('statusSearch').value || '';
        const Year = document.getElementById('search-date-year').value || '';
        const Nombre = document.getElementById('search-name').value || '';
        if (Year.length == 4) {
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

            getLoansSearch({ Status, Year, Nombre });
        }
    });
    /* Filtro de nombre */
    const searchName = document.getElementById('search-name');
    searchName.addEventListener('keyup', (e) => {
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

        getLoansSearch({ Status, Year, Nombre });
    });
});

const getLoansSearch = async ({ Status, Year, Nombre }) => {
    try {
        const searchResult = await window.db.getLoanReport({ Status, Year, Nombre });
        generateTableSearch(searchResult, Year);
    } catch (error) {
        console.error(error);
    }
};

const generateTableSearch = async (loans, Year) => {
    if (loans.length > 0) {
        let tableHTML = '';
        processInformation(loans);
        let TotalIntereses = 0;

        // Reiniciar los totales mensuales
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

        for (const loan of loans) {
            try {

     
                const concilitionData = generateConciliation(loan, Year);
                calculateMonthTotal(concilitionData);

                tableHTML += `
                    <tr>
                        <td>${generateStatusElement(loan.EstadoPrestamo)}</td>
                        <td>${loan.Usuario.Nombre} ${loan.Usuario.Apellido_Paterno} ${loan.Usuario.Apellido_Materno}</td>
                        <td>${loan.Usuario.CTA_CONTABLE_PRESTAMO || 'N/A'}</td>
                        <td>${loan.Numero_Cheque || 'N/A'}</td>
                        <td>${loan.Periodo || 'N/A'} Años</td>
                        <td>${loan.Cantidad_Meses || 'N/A'}</td>
                        <td>${window.api.formatDateToDisplay(loan.Fecha_Inicio) || 'N/A'}</td>
                        <td>${window.api.formatDateToDisplay(loan.Fecha_Termino) || 'N/A'}</td>
                        <td>${parseTOMXN(loan.Monto) || 'N/A'}</td>
                        <td>${loan.Interes + '%' || 'N/A'}</td>
                        <td>${parseTOMXN(loan.TotalPrestamo_Intereses)}</td>
                        <td>${parseTOMXN(loan.Abono)}</td>
                        ${concilitionData.meses.map((month) => (`
                            <td><input type="number" value="${month.interes}" data-month="${month.mes.trim().toLowerCase()}" data-loan-id="${loan.ID}" class="month-input"></td>
                        `)).join('')}
                        <td data-loan-total="${loan.ID}">${parseTOMXN(concilitionData.totalIntereses)}</td>

                    </tr>
                `;

                TotalIntereses += concilitionData.totalIntereses;
            } catch (error) {
                console.error(`Error al obtener el usuario con ID ${loan.id_Usuario_fk}:`, error);
            }
        }

        document.getElementById('intereses-total').innerText = parseTOMXN(TotalIntereses);
        const infoDiv = document.getElementById('loans-table-body');

        tableHTML += `
            <tr>
                <td colspan="12"></td>
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

        // Actualizar los totales mensuales en la tabla
        updateMonthTotalsInTable();

        // Agregar eventos de escucha a los inputs
        const monthInputs = document.querySelectorAll('.month-input');
        monthInputs.forEach(input => {
            input.addEventListener('change', handleMonthInputChange);
        });
    } else {
        const infoDiv = document.getElementById('loans-table-body');
        infoDiv.innerHTML = '';
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
            } else {
                // Mes completo dentro del rango
                diasAplicables = diasMes;
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
    // Iterar sobre los datos de conciliación y acumular los valores de interés por mes
    conciliationData.meses.forEach(({ mes, interes }) => {
        const mesKey = mes.trim().toLowerCase();
        if (monthTotals.hasOwnProperty(mesKey)) {
            monthTotals[mesKey] += interes; // Acumular el interés
        }
    });
};

const handleMonthInputChange = (event) => {
    const input = event.target;
    const month = input.dataset.month.trim().toLowerCase();
    const loanId = input.dataset.loanId;

    let newValue = parseFloat(input.value) || 0;
    let oldValue = parseFloat(input.defaultValue) || 0;

    console.log(`Cambio detectado en el mes ${month} para el préstamo ${loanId}: ${oldValue} → ${newValue}`);

    // Ajustar el total mensual correctamente
    monthTotals[month] += newValue - oldValue;

    // Actualizar el valor por defecto para futuros cambios
    input.defaultValue = newValue;

    // Actualizar totales en la tabla
    updateMonthTotalsInTable();

    // Actualizar el total del préstamo
    updateLoanTotalInterests(loanId);
};




const updateMonthTotalsInTable = () => {
    let totalTableMonth = 0;

    // Actualizar los totales en la tabla
    for (const [month, total] of Object.entries(monthTotals)) {
        const element = document.getElementById(`report-table-${month}`);
        const elementCalculo = document.getElementById(`${month}-total`);
        if (element) {
            totalTableMonth += total;
            element.textContent = `${parseTOMXN(total)}`;
            elementCalculo.textContent = `${parseTOMXN(total)}`;
        }
    }

    document.getElementById('report-table-total').textContent = parseTOMXN(totalTableMonth);

    // Recalcular el total de intereses
    const totalIntereses = Object.values(monthTotals).reduce((acc, curr) => acc + curr, 0);
    document.getElementById('intereses-total').innerText = parseTOMXN(totalIntereses);
};

const updateLoanTotalInterests = (loanId) => {
    console.log(`Actualizando total para préstamo: ${loanId}`);

    // Buscar todos los inputs de ese préstamo
    const loanInputs = document.querySelectorAll(`.month-input[data-loan-id="${loanId}"]`);

    let totalLoanInterest = 0;
    loanInputs.forEach(input => {
        let value = parseFloat(input.value) || 0;
        totalLoanInterest += value;
    });

    console.log(`Nuevo total calculado: ${totalLoanInterest}`);

    // Buscar la celda donde se debe actualizar el total
    const totalInterestCell = document.querySelector(`td[data-loan-total="${loanId}"]`);
    
    if (totalInterestCell) {
        totalInterestCell.textContent = parseTOMXN(totalLoanInterest);
        console.log(`Total actualizado en la celda: ${totalInterestCell.textContent}`);
    } else {
        console.warn(`No se encontró la celda de total para el préstamo ${loanId}`);
    }
};




const cleanTotals = () => {
    for (const [month, total] of Object.entries(monthTotals)) {
        const element = document.getElementById(`${month}-total`);
        if (element) {
            element.textContent = `$${total}`;
        }
    }
};

const processInformation = (loans) => {
    const montoTotalPrestado = loans.reduce((accumulator, loan) => {
        return accumulator += loan.Monto;
    }, 0);

    document.getElementById('monto-total-prestamo').innerText = parseTOMXN(montoTotalPrestado);
};

const generateStatusElement = (EstadoPrestamo) => {
    if (EstadoPrestamo == 'Activo') {
        return '<span class="status-active">Activo</span>';
    } else if (EstadoPrestamo == 'Refinanciado') {
        return '<span class="status-refinance">Refinanciado</span>';
    } else {
        return '<span class="status-payed">Pagado</span>';
    }
};

const parseTOMXN = (number) => Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(number || 0);

function regexDate(fechaValue, totalPrestamoValue) {
    const dateRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
    if (dateRegex.test(fechaValue)) {
        return true;
    } else {
        return false;
    }
}