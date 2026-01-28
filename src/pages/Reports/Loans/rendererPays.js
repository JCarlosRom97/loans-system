document.addEventListener('DOMContentLoaded', async() => {

    const allPays = await window.db.getPaymentsReport({Fecha_Inicio:'', Fecha_Final:''});

    generateTablePaySearch(allPays);
  
    const buttonPaySearch = document.getElementById('searchPaysButton');

    buttonPaySearch.addEventListener('click', async(e)=> {
        e.preventDefault();
        const Fecha_Inicio = document.getElementById('search-date-from-pays').value;
        const Fecha_Final = document.getElementById('search-date-to-pays').value;

        if(regexDate(Fecha_Inicio) && regexDate(Fecha_Final)){
            const pays = await window.db.getPaymentsReport({Fecha_Inicio, Fecha_Final});
            console.log(pays);
            generateTablePaySearch(pays);
        }

    });

    const searchDatePaysFrom = document.getElementById('search-date-from-pays');
    let lastValidDateFrom ='';
    
    searchDatePaysFrom.addEventListener('keyup', (e) =>{
        const current = searchDatePaysFrom.value;
        console.log(current);
        
        // If what the user typed breaks the dd/mm/aaaa structure → revert
        if (!window.api.formatInputDate(current)) {
            searchDatePaysFrom.value = lastValidDateFrom;
          return;
        }
      
        // If full date is written, validate logical date
        if (current.length === 10 && !window.api.formatInputDate(current)) {
            searchDatePaysFrom.value = lastValidDateFrom;
          return;
        }
      
        // Save valid value
        lastValidDateFrom = current;
        e.preventDefault();
    });

    const searchDatePaysTo = document.getElementById('search-date-to-pays');
    let lastValidDateTo ='';
    
    searchDatePaysTo.addEventListener('keyup', (e) =>{
        const current = searchDatePaysTo.value;
        console.log(current);
        
        // If what the user typed breaks the dd/mm/aaaa structure → revert
        if (!window.api.formatInputDate(current)) {
            searchDatePaysTo.value = lastValidDateTo;
          return;
        }
      
        // If full date is written, validate logical date
        if (current.length === 10 && !window.api.formatInputDate(current)) {
            searchDatePaysTo.value = lastValidDateTo;
          return;
        }
      
        // Save valid value
        lastValidDateTo = current;
        e.preventDefault();
    });
})

const generateTablePaySearch = async ({pagos}) => {
    processPayInformation(pagos);
    // Verificar si hay préstamos
    if (pagos.length > 0) {
        // Generar el HTML para la tabla
        let tableHTML = '';
        //processInformation(loans)
        // Recorrer los préstamos y agregar filas
        let counter =1;
        for (const pay of pagos) {
            try {
                tableHTML += `
                    <tr>
                        <td>${counter}</td>
                        <td>${window.api.formatDateToDisplay(pay.Fecha_Pago)}</td>
                        <td>${parseTOMXN(pay.Monto_Pago)}</td>
                        <td>${parseTOMXN(pay.Monto_Pago_Capital)}</td>
                        <td>${parseTOMXN(pay.Monto_Pago_Intereses)}</td>
                        <td>${pay.Periodo_Catorcenal}</td>
                        <td>${pay.Metodo_Pago}</td>
                        <td>${parseTOMXN(pay.Saldo_Actual)}</td>
                    </tr>
                `;
                counter++;
            } catch (error) {
                console.error(`Error al obtener el usuario con ID ${loan.id_Usuario_fk}:`, error);
            }
        }

        // Insertar la tabla en el div con ID "loans-table-body"
        const infoDiv = document.getElementById('pays-table-body');
        infoDiv.innerHTML = tableHTML;
        document.getElementById('info').innerText = '';
    } else {
        const infoDiv = document.getElementById('pays-table-body');
        infoDiv.innerHTML = '';
        // Mostrar mensaje si no hay préstamos
        document.getElementById('infoPays').innerText = 'No se encontraron pagos.';
    }
};
 
const processPayInformation = (pays) =>{
    const montoTotalPay = pays.reduce((accumulator ,pay) => {
        return accumulator += pay.Monto_Pago;
    }, 0)

    const montoIntereses = pays.reduce((accumulator, pay)=>{
        return accumulator += pay.Monto_Pago_Intereses;
    }, 0)

    const montoTotalCapital = pays.reduce((accumulator ,pay) => {
        return accumulator += pay.Monto_Pago_Capital;
    }, 0)


    document.getElementById('monto-total-pay').innerText = parseTOMXN(montoTotalPay);
    document.getElementById('monto-total-pay-intereses').innerText = parseTOMXN(montoIntereses);
    document.getElementById('intereses-total-pay').innerText = parseTOMXN(montoTotalCapital);
    
}

function regexDate (fechaValue){
    const dateRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
    return dateRegex.test(fechaValue);
}
