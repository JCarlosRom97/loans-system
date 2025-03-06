document.addEventListener('DOMContentLoaded', async() => {
    const fechaActual = new Date();
    //  Agregar el +1 despues de hacer pruebas 
    const mes = String(fechaActual.getMonth()).padStart(2, '0'); // Mes en formato 'MM'
    const year = fechaActual.getFullYear(); // Año en formato 'YYYY'
    
    document.getElementById('mes').value = mes;
    document.getElementById('year').value = year;

    defaultSearch({mes, year});

    
    
    const formConciliacion = document.getElementById('searchConciliacion');
    formConciliacion.addEventListener('click', async(e) =>{
        
        try {
            e.preventDefault();
            const mes = document.getElementById('mes').value;
            const year= document.getElementById('year').value;
            const saldo = document.getElementById('saldo').value;
            
    
            console.log(mes, year, saldo);
    
            const resultConciliation = await window.db.getConciliation({mes, year})
    
            console.log('resultConciliation',resultConciliation);

            if(resultConciliation){
                generateTableAhorroTransacciones(resultConciliation, saldo);
            }
            
        } catch (error) {
            window.electron.showNotification('Error', 
            error);
        }
    })

    const saldo = document.getElementById('saldo');

    saldo.addEventListener('keyup', (e) =>{
        e.preventDefault();
        console.log();
        document.getElementById('saldo-mxn').textContent = parseTOMXN(document.getElementById('saldo').value)
    })
})

function generateTableAhorroTransacciones(records, saldo) {
    // Verificar si hay usuarios
    let saldoActual = parseInt(saldo); // Inicializar saldo con el valor pasado como parámetro
    let numberRecord = 1; 
    if (records.transaccionesAhorro.length > 0) {
        // Generar el HTML para la tabla
        let tableHTML = ``;
        // Recorrer los usuarios y agregar filas
        records.transaccionesAhorro.forEach((record) => {
            
            let monto = record.Monto_Generado || record.Monto;
            let esAhorroOCorte = record.TipoTransaccion === 'Ahorro' || record.TipoTransaccion === 'Corte';
            
            // Ajustar saldo según el tipo de transacción
            saldoActual += esAhorroOCorte ? monto : -monto;
            
            tableHTML += `
                <tr>
                    <td>${numberRecord++}</td>
                    <td>${record.NombreCompleto}</td>
                    <td>${window.api.formatDateToDisplay(record.Fecha)}</td>
                    <td>${record.TipoTransaccion}</td>
                    <td>${record.Numero_Cheque || "N/A"}</td>
                    <td>
                        ${esAhorroOCorte
                            ? `<span class="more-green">+ ${parseTOMXN(monto)}</span> `
                            : `<span class="less-red">- ${parseTOMXN(monto)}</span>`}
                    </td>
                    <td>${parseTOMXN(saldoActual)}</td>
                    <td>${record.CTA_CONTABLE_PRESTAMO}</td>
                    <td>${record.CTA_CONTABLE_AHORRO}</td>
                </tr>
            `;
        });
        //Poner esto en la funcion final 
        //tableHTML += '</tbody></table>';

        const tableConciliation = document.getElementById('conciliation-table-body');
        tableConciliation.innerHTML = tableHTML;

        generateTablePagos(records, saldoActual, numberRecord)
    }
}

function generateTablePagos(records, saldo, numberRecord) {
    // Verificar si hay usuarios
    let saldoActual = parseInt(saldo); // Inicializar saldo con el valor pasado como parámetro
    if (records.pagos.length > 0) {
        // Generar el HTML para la tabla
        let tableHTML = ``;

        // Recorrer los usuarios y agregar filas
        records.pagos.forEach((record) => {
            
            let monto = record.Monto_Pago;
         
            // Ajustar saldo según el tipo de transacción
            saldoActual += monto ;
            
            tableHTML += `
                <tr>
                    <td>${numberRecord ++}</td>
                    <td>${record.NombreCompleto || 'N/A'}</td>
                    <td>${window.api.formatDateToDisplay(record.Fecha_Pago)}</td>
                    <td>Abono a prestamo</td>
                    <td>N/A</td>
                    <td> <span class="more-green">+ ${parseTOMXN(record.Monto_Pago)}</span></td>
                    <td>${parseTOMXN(saldoActual)}</td>
                    <td>${record.CTA_CONTABLE_PRESTAMO}</td>
                    <td>${record.CTA_CONTABLE_AHORRO}</td>
                </tr>
            `;
        });

        //tableHTML += '</tbody></table>';

        const tableConciliation = document.getElementById('conciliation-table-body');
        tableConciliation.innerHTML += tableHTML;

    }

    generateTableCheques(records.cheques, saldoActual, numberRecord)
}

function generateTableCheques(cheques, saldo, numberRecord) {

    let saldoActual = parseInt(saldo); // Inicializar saldo con el valor pasado como parámetro
    // Verificar si hay usuarios
    if (cheques.length > 0) {
        // Generar el HTML para la tabla
        let tableHTML = ``;

        // Recorrer los usuarios y agregar filas
        cheques.forEach((record) => {
            console.log(record);
            let monto = record.Monto;
         
            // Ajustar saldo según el tipo de transacción
            saldoActual += monto ;
            
            tableHTML += `
                <tr>
                    <td>${numberRecord ++}</td>
                    <td>${record.Nombre}</td>
                    <td>${window.api.formatDateToDisplay(record.Fecha)}</td>
                    <td>Cheque: ${record.Motivo}</td>
                    <td>${record.No_Cheque}</td>
                    <td><span class="more-green">+ ${parseTOMXN(record.Monto)}</span></td>
                    <td>${parseTOMXN(saldoActual)}</td>
                    <td>N/A</td>
                    <td>N/A</td>
                </tr>
            `;
        });

        //tableHTML += '</tbody></table>';

        const tableConciliation = document.getElementById('conciliation-table-body');
        tableConciliation.innerHTML += tableHTML;
    }

    let totalTable = `
        <tr>
            <td colspan="6"></td>
            <td><span class="more-green">${parseTOMXN(saldoActual)}</span></td>
            <td colspan="2"></td>
        </tr>
    `;

    const tableConciliation = document.getElementById('conciliation-table-body');
    tableConciliation.innerHTML += totalTable;
    document.getElementById('monto-total').innerText = parseTOMXN(saldoActual);
}



async function defaultSearch({mes, year}){

    try {
        const resultConciliation = await window.db.getConciliation({mes, year})

        if(resultConciliation){
            generateTableAhorroTransacciones(resultConciliation);
        }
    } catch (error) {
        window.electron.showNotification('Error', 
        error);
    }

}

const parseTOMXN = (number) => Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(number || 0);

const parsefromMXN = (string) => parseInt(string.replace(/[^\d.-]/g, ''));