document.addEventListener('DOMContentLoaded', async() => {


    const fecha = new Date();
    const Anio = fecha.getFullYear();

    await  getSavingsSearch({NombreCompleto:'', Anio})

    generateHeadTableCatorcenas(Anio);

    document.getElementById('anio').value = Anio;


    const buttonSearchPays = document.getElementById('searchPaysButton');

    buttonSearchPays.addEventListener('click', async() =>{
        const NombreCompleto = document.getElementById('name').value;
        const Anio = document.getElementById('anio').value;
        
        await  getSavingsSearch({NombreCompleto, Anio})

        generateHeadTableCatorcenas(Anio);
    })
    
})

const getSavingsSearch = async({ NombreCompleto, Anio }) =>{
    try {
        const searchResult = await window.db.getAllSavingsTransactionsReport({ NombreCompleto, Anio });
        generateTableSearch(searchResult, Anio);
    } catch (error) {
        console.error(error)
    }
}

const generateTableSearch = async (savings, year) => {
    // Verificar si hay préstamos
    if (savings.length > 0) {
        // Generar el HTML para la tabla
        let tableHTML = '';
        //processInformation(savings)
        // Recorrer los préstamos y agregar filas
        let counter = 1;

        processAhorroAmmount(savings);
        for (const saving of savings) {
            const { totalSumado, totalRestado, total } = calculateSaldoAnterior(saving.TransaccionesAhorro.AnioAnterior);
            const dates = generateSecondFridays('12/01/2024', year)


            let numbertd = 0;
            if(saving.TransaccionesAhorro.AnioActual.length >0){
                numbertd = calculateTHNumber(window.api.formatDateToDisplay(saving.TransaccionesAhorro.AnioActual[0].dataValues.Fecha));
            }else{
                numbertd = dates.length;
            }

            console.log(dates.length , numbertd , saving.TransaccionesAhorro.AnioActual.length);

            const resttd = dates.length - numbertd - saving.TransaccionesAhorro.AnioActual.length;

 

            try {

                tableHTML += `
                    <tr>
                        <td>${counter}</td>
                        <td>${saving.Codigo_Empleado}</td>
                        <td>${saving.Nombre} ${saving.Apellido_Materno} ${saving.Apellido_Paterno}</td>
                        <td>${parseTOMXN(totalSumado)}</td>
                        <td class="less-red">${parseTOMXN(totalRestado) || ''}</td>
                        <td>${parseTOMXN(total) || ''}</td>
                        ${numbertd>0 ?`<td id="dynamicTd" colspan="${numbertd}"></td>`:''}
                        ${saving.TransaccionesAhorro.AnioActual.map(({dataValues}) => (`
                        <td>${parseTOMXN(dataValues.Monto) }</td>
                    `)).join('')}
                     ${resttd>0 ?`<td  colspan="${resttd}"></td>`:''}
                     <td>${parseTOMXN(saving.MontoAhorro)}</td>
                    </tr>
                `;

     /*            <td>${saving.TipoTransaccion =='Ahorro'? `+ ${parseTOMXN(saving.Monto)}`: 
                `<span class="less-red">-</span> ${parseTOMXN(saving.Monto)}` }</td> */

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


function generateHeadTableCatorcenas(year){
    const trTable = document.getElementById('tr-saving');

    trTable.innerHTML =`      
        <th>No.</th>
        <th>Numero de Empleado</th>
        <th>Nombre</th>
        <th>Año Anterior</th>
        <th>Desahogo</th>
        <th>Subtotal</th>
    `;

    const dates = generateSecondFridays('12/01/2024', year)
    

    let tableSavingCatorcentaHTML = ''
    dates.map((date) =>{
        tableSavingCatorcentaHTML +=`
            <th>${date}</th>
        `
    })

    tableSavingCatorcentaHTML +=`
        <th>Total</th>
    `

    trTable.insertAdjacentHTML('beforeend', tableSavingCatorcentaHTML);

}

function generateSecondFridays(startDate, year) {
 
    const dates = [];

    // Convertir la fecha inicial de formato dd/mm/aaaa a objeto Date
    const [startDay, startMonth, startYear] = startDate.split('/').map(Number);
    let currentDate = new Date(startYear, startMonth - 1, startDay);

    // Obtener el último día del año especificado como límite
    const endDate = new Date(year, 11, 31);

    // Generar fechas hasta el final del año especificado
    while (currentDate <= endDate) {
        if (currentDate.getFullYear() == year) {
            // Formatear la fecha como dd/mm/aaaa
            const formattedDate = currentDate.toLocaleDateString("es-MX", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
            });
            dates.push(formattedDate);
        }
        currentDate.setDate(currentDate.getDate() + 14); // Sumar 14 días exactos
    }

    return dates;
}



function calculateSaldoAnterior(saving) {
    let totalSumado = 0;
    let totalRestado = 0;
    
    if (saving.length > 0) {
        const total = saving.reduce((accumulator, { dataValues }) => {
            if (dataValues.TipoTransaccion === 'Ahorro' || dataValues.TipoTransaccion === 'Corte') {
                totalSumado += dataValues.Monto;
                return accumulator + dataValues.Monto;
            } else {
                totalRestado += dataValues.Monto;
                return accumulator - dataValues.Monto;
            }
        }, 0);
        
        return { totalSumado, totalRestado, total };
    }
    
    return { totalSumado: 0, totalRestado: 0, total: 0 };
}




function calculateTHNumber(fecha) {
    console.log(fecha);
    const fechaInicio = '12/01/2024'; // Primera catorcena del 2025
    const [startDay, startMonth, startYear] = fechaInicio.split('/').map(Number);
    let currentDate = new Date(startYear, startMonth - 1, startDay);
    
    const [day, month, inputYear] = fecha.split('/').map(Number);
    let targetDate = new Date(inputYear, month - 1, day);
    

    let count = 0;
    while (currentDate <= targetDate) {
        if (
            currentDate.getDate() === targetDate.getDate() &&
            currentDate.getMonth() === targetDate.getMonth() &&
            currentDate.getFullYear() === targetDate.getFullYear()
        ) {
            return count;
        }
        if(currentDate.getFullYear() === targetDate.getFullYear()){
            count++;
            console.log(currentDate, targetDate, count);
        }
        currentDate.setDate(currentDate.getDate() + 14);
    }
    return -1; // Si la fecha no coincide con una catorcena exacta
}





const parseTOMXN = (number) => Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(number || 0);
