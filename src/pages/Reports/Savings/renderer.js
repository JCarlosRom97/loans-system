document.addEventListener('DOMContentLoaded', async() => {
    getSavingsSearch({Fecha_Inicio:'', Fecha_Final:'', TipoTransaccion:'', MedioPago:''})

    const buttonSearchPays = document.getElementById('searchPaysButton');

    buttonSearchPays.addEventListener('click', async() =>{
        const Fecha_Inicio = document.getElementById('search-date-from').value;
        const Fecha_Final = document.getElementById('search-date-to').value;
        const TipoTransaccion = document.getElementById('search-tipo-transaccion').value;
        const MedioPago = document.getElementById('search-medio-pago').value;
        
        await  getSavingsSearch({Fecha_Inicio, Fecha_Final, TipoTransaccion, MedioPago})

  
    })
    
})

const getSavingsSearch = async({ NombreCompleto, Anio }) =>{
    try {
        const searchResult = await window.db.getAllSavingsTransactionsReport({ NombreCompleto, Anio });
        console.log(searchResult);
        generateTableSearch(searchResult);
    } catch (error) {
        console.error(error)
    }
}

const generateTableSearch = async (savings) => {
    // Verificar si hay préstamos
    if (savings.length > 0) {
        // Generar el HTML para la tabla
        let tableHTML = '';
        //processInformation(savings)
        // Recorrer los préstamos y agregar filas
        let counter = 1;

        processAhorroAmmount(savings);
        for (const saving of savings) {
            try {

                tableHTML += `
                    <tr>
                        <td>${counter}</td>
                        <td>${window.api.formatDateToDisplay(saving.Fecha)}</td>
                        <td>${saving.TipoTransaccion =='Ahorro'? `+ ${parseTOMXN(saving.Monto)}`: 
                        `<span class="less-red">-</span> ${parseTOMXN(saving.Monto)}` }</td>
                        <td>${saving.TipoTransaccion}</td>
                        <td>${saving.MedioPago}</td>

                    </tr>
                `;
                counter ++;
            } catch (error) {
                console.error(`Error al crear la tabla reporte ahorro`, error);
            }
        }

        // Insertar la tabla en el div con ID "saving-table-body"
        const infoDiv = document.getElementById('savings-table-body');
        infoDiv.innerHTML = tableHTML;
        document.getElementById('info').innerText = '';
    } else {
        const infoDiv = document.getElementById('savings-table-body');
        infoDiv.innerHTML = '';
        // Mostrar mensaje si no hay préstamos
        document.getElementById('info').innerText = 'No se encontraron pagos.';
    }
};

const processAhorroAmmount = (pays)=>{
    const counterMovimientosAhorro = pays.reduce((accumulator, pay) =>{
        return accumulator += pay.TipoTransaccion =='Ahorro' ? 1: 0;
    }, 0);

    const totalMovimientosAhorro = pays.reduce((accumulator, pay) =>{
        return accumulator += pay.TipoTransaccion =='Ahorro' ? pay.Monto: 0;
    }, 0);

    const counterMovimientosDesahogo = pays.reduce((accumulator, pay) =>{
        return accumulator += pay.TipoTransaccion =='Desahogo' ? 1: 0;
    }, 0)

    const totalMovimientosDesahogo = pays.reduce((accumulator, pay) =>{
        return accumulator += pay.TipoTransaccion =='Desahogo' ? pay.Monto: 0;
    }, 0)

    document.getElementById('monto-total-pay-ahorro').innerText = 
    `${counterMovimientosAhorro} Movimientos = ${parseTOMXN(totalMovimientosAhorro)}`;

    document.getElementById('desahogo-total-pay').innerText = 
    `${counterMovimientosDesahogo} Movimientos = ${parseTOMXN(totalMovimientosDesahogo)}`;

    document.getElementById('monto-total-pay').innerText =
    `${counterMovimientosAhorro + counterMovimientosDesahogo} Movimientos = ${parseTOMXN(totalMovimientosAhorro - totalMovimientosDesahogo)}`;
    
 
}



const parseTOMXN = (number) => Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(number || 0);
