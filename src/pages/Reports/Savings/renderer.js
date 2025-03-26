document.addEventListener('DOMContentLoaded', async () => {
    const fecha = new Date();
    const Anio = fecha.getFullYear();

    await getSavingsSearch({ NombreCompleto: '', Anio });

    generateHeadTableCatorcenas(Anio);

    document.getElementById('anio').value = Anio;

    const buttonSearchPays = document.getElementById('searchPaysButton');

    buttonSearchPays.addEventListener('click', async () => {
        const NombreCompleto = document.getElementById('name').value;
        const Anio = document.getElementById('anio').value;

        await getSavingsSearch({ NombreCompleto, Anio });

        generateHeadTableCatorcenas(Anio);
    });
});

const getSavingsSearch = async ({ NombreCompleto, Anio }) => {
    try {
        const searchResult = await window.db.getAllSavingsTransactionsReport({ NombreCompleto, Anio });
        generateTableSearch(searchResult, Anio);
    } catch (error) {
        console.error(error);
    }
};

const generateTableSearch = async (savings, year) => {
    // Verificar si hay ahorros
    if (savings.length > 0) {
        // Generar el HTML para la tabla
        let tableHTML = '';
        let counter = 1;

        // Objeto para almacenar los totales por catorcena
        const totalesCatorcenas = {};

        // Procesar los ahorros y calcular los totales por catorcena
        for (const saving of savings) {
            const { totalSumado, totalRestado, total } = calculateSaldoAnterior(saving.TransaccionesAhorro.AnioAnterior, saving.TotalAhorroSaldosAnioAnterior);
            const dates = generateSecondFridays('12/01/2024', year);

            let numbertd = 0;
            if (saving.TransaccionesAhorro.AnioActual.length > 0) {
                numbertd = calculateTHNumber(window.api.formatDateToDisplay(saving.TransaccionesAhorro.AnioActual[0].dataValues.Fecha));
            } else {
                numbertd = dates.length;
            }

            const resttd = dates.length - numbertd - saving.TransaccionesAhorro.AnioActual.length;

            // Calcular el Total Año (suma y resta de transacciones del año actual)
            let totalAnio = 0;
            saving.TransaccionesAhorro.AnioActual.forEach(({ dataValues }) => {
                if (dataValues.TipoTransaccion === 'Ahorro') {
                    totalAnio += dataValues.Monto;
                } else if (dataValues.TipoTransaccion === 'Desahogo') {
                    totalAnio -= dataValues.Monto;
                }
            });

            try {
                tableHTML += `
                    <tr>
                        <td>${counter}</td>
                        <td>${saving.Codigo_Empleado}</td>
                        <td>${saving.Nombre} ${saving.Apellido_Materno} ${saving.Apellido_Paterno}</td>
                        <td>${parseTOMXN(totalSumado)}</td>
                        <td class="less-red">${parseTOMXN(totalRestado) || ''}</td>
                        <td>${parseTOMXN(total) || ''}</td>
                        ${numbertd > 0 ? `<td id="dynamicTd" colspan="${numbertd}"></td>` : ''}
                        ${saving.TransaccionesAhorro.AnioActual.map(({ dataValues }) => {
                            if (dataValues.TipoTransaccion !== 'Corte') {
                                const fechaCatorcena = window.api.formatDateToDisplay(dataValues.Fecha);
                                if (!totalesCatorcenas[fechaCatorcena]) {
                                    totalesCatorcenas[fechaCatorcena] = 0;
                                }
                                if (dataValues.TipoTransaccion === 'Ahorro') {
                                    totalesCatorcenas[fechaCatorcena] += dataValues.Monto;
                                } else if (dataValues.TipoTransaccion === 'Desahogo') {
                                    totalesCatorcenas[fechaCatorcena] -= dataValues.Monto;
                                }
                                return `
                                    <td>
                                        ${dataValues.TipoTransaccion === 'Ahorro'
                                            ? `<span class="more-green">+ ${parseTOMXN(dataValues.Monto)}</span>`
                                            : `<span class="less-red">- ${parseTOMXN(dataValues.Monto)}</span>`}
                                    </td>
                                `;
                            }
                        }).join('')}
                        ${resttd > 0 ? `<td colspan="${resttd}"></td>` : ''}
                        <td>${parseTOMXN(totalAnio)}</td> 
                        <td>${parseTOMXN(saving.MontoAhorro)}</td> 
                    </tr>
                `;

                counter++;
            } catch (error) {
                console.error(`Error al crear la tabla reporte ahorro`, error);
            }
        }

        // Generar la fila de totales
        const dates = generateSecondFridays('12/01/2024', year);
        let totalesHTML = `
            <tr>
                <td colspan="6"><strong>Totales</strong></td>
        `;

        let totalGeneral = 0;
        dates.forEach(date => {
            const totalCatorcena = totalesCatorcenas[date] || 0;
            totalesHTML += `
                <td>
                    <strong>
                        ${totalCatorcena >= 0
                            ? `<span class="more-green">+ ${parseTOMXN(totalCatorcena)}</span>`
                            : `<span class="less-red">- ${parseTOMXN(Math.abs(totalCatorcena))}</span>`}
                    </strong>
                </td>
            `;
            totalGeneral += totalCatorcena;
        });

        // Calcular el total general correctamente
        const totalGeneralCorrecto = savings.reduce((acc, saving) => {
            return acc + saving.MontoAhorro;
        }, 0);

        totalesHTML += `
            <td><strong>${parseTOMXN(totalGeneral)}</strong></td> <!-- Total Año -->
            <td>
                <strong>
                    ${totalGeneralCorrecto >= 0
                        ? `<span class="more-green">+ ${parseTOMXN(totalGeneralCorrecto)}</span>`
                        : `<span class="less-red">- ${parseTOMXN(Math.abs(totalGeneralCorrecto))}</span>`}
                </strong>
            </td>
        </tr>`;

        // Insertar la tabla en el div con ID "savings-table-body"
        const infoDiv = document.getElementById('savings-table-body');
        infoDiv.innerHTML = tableHTML + totalesHTML;
        document.getElementById('info').innerText = '';
    } else {
        const infoDiv = document.getElementById('savings-table-body');
        infoDiv.innerHTML = '';
        // Mostrar mensaje si no hay ahorros
        document.getElementById('info').innerText = 'No se encontraron ahorros.';
    }
};

const processAhorroAmmount = (savings) => {
    let counterMovimientosAhorro = 0;
    let totalMovimientosAhorro = 0;
    let counterMovimientosDesahogo = 0;
    let totalMovimientosDesahogo = 0;

    savings.forEach(saving => {
        // Procesar transacciones del año actual
        if (saving.TransaccionesAhorro.AnioActual) {
            saving.TransaccionesAhorro.AnioActual.forEach(transaccion => {
                if (transaccion.TipoTransaccion === 'Ahorro') {
                    counterMovimientosAhorro++;
                    totalMovimientosAhorro += transaccion.Monto;
                } else if (transaccion.TipoTransaccion === 'Desahogo') {
                    counterMovimientosDesahogo++;
                    totalMovimientosDesahogo += transaccion.Monto;
                }
            });
        }

        // Procesar transacciones del año anterior (si es necesario)
        if (saving.TransaccionesAhorro.AnioAnterior) {
            saving.TransaccionesAhorro.AnioAnterior.forEach(transaccion => {
                if (transaccion.TipoTransaccion === 'Ahorro') {
                    counterMovimientosAhorro++;
                    totalMovimientosAhorro += transaccion.Monto;
                } else if (transaccion.TipoTransaccion === 'Desahogo') {
                    counterMovimientosDesahogo++;
                    totalMovimientosDesahogo += transaccion.Monto;
                }
            });
        }
    });

    // Actualizar los elementos del DOM con los totales calculados
    document.getElementById('monto-total-pay-ahorro').innerText =
        `${counterMovimientosAhorro} Movimientos = ${parseTOMXN(totalMovimientosAhorro)}`;

    document.getElementById('desahogo-total-pay').innerText =
        `${counterMovimientosDesahogo} Movimientos = ${parseTOMXN(totalMovimientosDesahogo)}`;

    document.getElementById('monto-total-pay').innerText =
        `${counterMovimientosAhorro + counterMovimientosDesahogo} Movimientos = ${parseTOMXN(totalMovimientosAhorro - totalMovimientosDesahogo)}`;
};

function generateHeadTableCatorcenas(year) {
    const trTable = document.getElementById('tr-saving');

    trTable.innerHTML = `      
        <th>No.</th>
        <th>Numero de Empleado</th>
        <th>Nombre</th>
        <th>Año Anterior</th>
        <th>Desahogo</th>
        <th>Subtotal</th>
    `;

    const dates = generateSecondFridays('12/01/2024', year);

    let tableSavingCatorcentaHTML = '';
    dates.map((date) => {
        tableSavingCatorcentaHTML += `
            <th>${date}</th>
        `;
    });

    tableSavingCatorcentaHTML += `
        <th>Total Año</th>
        <th class="total-ahorro-table">Total</th>
    `;

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

function calculateSaldoAnterior(saving, totalAhorroSaldosAnioAnterior = null) {
    let totalSumado = 0;
    let totalRestado = 0;

    // Si TotalAhorroSaldosAnioAnterior existe, usarlo como totalSumado
    if (totalAhorroSaldosAnioAnterior !== null) {
        totalSumado = totalAhorroSaldosAnioAnterior;
    } else if (saving.length > 0) {
        // Si no existe, calcular totalSumado y totalRestado
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

    // Si no hay transacciones, retornar valores por defecto
    return { totalSumado, totalRestado, total: totalSumado - totalRestado };
}

function calculateTHNumber(fecha) {
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
        if (currentDate.getFullYear() === targetDate.getFullYear()) {
            count++;
        }
        currentDate.setDate(currentDate.getDate() + 14);
    }
    return -1; // Si la fecha no coincide con una catorcena exacta
}

const parseTOMXN = (number) => Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(number || 0);