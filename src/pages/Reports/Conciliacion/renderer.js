document.addEventListener('DOMContentLoaded', async() => {
    const fechaActual = new Date();
    //  Agregar el +1 despues de hacer pruebas 
    const mes = String(fechaActual.getMonth() +1).padStart(2, '0'); // Mes en formato 'MM'
    const year = fechaActual.getFullYear(); // Año en formato 'YYYY'
    
    
    document.getElementById('mes').value = mes;
    document.getElementById('year').value = year;

    conciliationSearch({mes, year});

    
    
    const formConciliacion = document.getElementById('searchConciliacion');
    formConciliacion.addEventListener('click', async(e) =>{
        
        try {
            e.preventDefault();
            const mes = document.getElementById('mes').value;
            const year= document.getElementById('year').value;
            const saldo = document.getElementById('saldo').value;
            
            const resultConciliation = await window.db.getConciliation({mes, year})
            const resultConciliationGastos = await window.db.getGastos({mes, year});
    
            console.log('resultConciliation',resultConciliation,'resultConciliationGastos', resultConciliationGastos);

            if(resultConciliation || resultConciliationGastos){
                const tableConciliation = document.getElementById('conciliation-table-body');
                tableConciliation.innerHTML = "";
                
                generateConciliationTable(resultConciliation, saldo, resultConciliationGastos);
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

function generateConciliationTable(data, saldoInicial, resultConciliationGastos) {
    console.log(resultConciliationGastos);
    
    // Obtener el JSON ordenado y procesado
    const records = orderDataConciliation(data, resultConciliationGastos);

    console.log('resultConciliationGastos', records);
    
    // Inicializar variables
    let saldoActual = parseInt(saldoInicial);
    let numberRecord = 1;
    let tableHTML = '';

    // Recorrer los registros procesados
    records.forEach((record) => {
        const { Fecha, Nombre, Descripcion, TotalMonto, No_Cheque, CuentaPrestamo, CuentaAhorro } = record;

        // Determinar el tipo de transacción
        let esAhorro = Descripcion.includes('Ahorro');
        let esPago = Descripcion.includes('Pago de préstamo');
        let esCheque = Descripcion.includes('CHEQUE');
        let esPrestamo = Descripcion.includes('Préstamo Iniciado');
        let esDesahogo = Descripcion.includes('Desahogo');
        let isDepositoGasto = Descripcion.includes('Intereses Del Plazo');
        let esGastoConciliado = record.Tipo === "gastoConciliado";

        // Determinar clase de color para el monto
        let montoClass = '';
        if (esAhorro || esPago || isDepositoGasto) {
            montoClass = 'more-green'; // Verde para depósitos (prioridad)
        } else if (esPrestamo || esDesahogo || esCheque || esGastoConciliado) {
            montoClass = 'less-red'; // Rojo para retiros
        }

        // Ajustar saldo según el tipo de transacción
        if (esPago || esAhorro || isDepositoGasto) {
            saldoActual += TotalMonto; // Sumar para depósitos
        } else {
            saldoActual -= TotalMonto; // Restar para retiros
        }

        // Generar fila de la tabla
        tableHTML += `
            <tr>
                <td>${numberRecord++}</td>
                <td>${Nombre}</td>
                <td>${Fecha}</td>
                <td>${Descripcion}</td>
                <td>${No_Cheque || 'N/A'}</td>
                <td>
                    ${esAhorro || esPago || isDepositoGasto 
                        ? `<span class="${montoClass}">+ ${parseTOMXN(TotalMonto)}</span>`
                        : 'N/A'}
                </td>
                <td>
                ${!esAhorro && !esPago && !isDepositoGasto 
                        ? `<span class="${montoClass}">- ${parseTOMXN(TotalMonto)}</span>`
                        : 'N/A'}
                </td>
                <td>${parseTOMXN(saldoActual)}</td>
                <td>${esPago || esPrestamo ? CuentaPrestamo : "N/A"}</td>
                <td>${esAhorro ? CuentaAhorro : "N/A"}</td>
            </tr>
        `;
    });

    // Agregar el total al final de la tabla
    tableHTML += `
        <tr>
            <td colspan="7"></td>
            <td><span class="${saldoActual >= parseInt(saldoInicial) ? 'more-green' : 'less-red'}">${parseTOMXN(saldoActual)}</span></td>
            <td colspan="2"></td>
        </tr>
    `;

    // Insertar el HTML en la tabla
    const tableConciliation = document.getElementById('conciliation-table-body');
    tableConciliation.innerHTML = tableHTML;

    // Actualizar el monto total
    document.getElementById('monto-total').innerText = parseTOMXN(saldoActual);
}



async function conciliationSearch({mes, year}){

    try {
        const resultConciliation = await window.db.getConciliation({mes, year})
        const resultConciliationGastos = await window.db.getGastos({mes, year});

        console.log('resultConciliationGastos', resultConciliationGastos);
        

        

        if(resultConciliation || resultConciliationGastos){
            generateConciliationTable(resultConciliation, 0, resultConciliationGastos);
        }
    } catch (error) {
        window.electron.showNotification('Error',  
        error);
    }

}



function orderDataConciliation(data, resultConciliationGastos = []) {
    console.log(data);

    const resultado = {};

    // Función para formatear la fecha desde la base de datos a dd/mm/aaaa
    const formatearFecha = (fecha) => {
        return window.api.formatDateToDisplay(fecha);
    };

    // Función para convertir fecha dd/mm/aaaa a objeto Date para ordenación
    const parsearFecha = (fechaStr) => {
        const [dia, mes, anio] = fechaStr.split('/');
        return new Date(`${mes}/${dia}/${anio}`);
    };

    // Función para agregar o actualizar un registro en el resultado
    const agregarRegistro = (usuario, fecha, tipo, registro) => {
        // Para préstamos iniciados, siempre creamos registro único
        const clave = tipo === "prestamoIniciado" 
            ? `${usuario}-${fecha}-${tipo}-${registro.ID || Math.random().toString(36).substr(2, 9)}`
            : `${usuario}-${fecha}`;

        let descripcion;
        if (tipo === "gastoConciliado") {
            descripcion = `${registro.Tipo} - ${parseTOMXN(registro.Monto)}`;
        } else if (tipo === "cheque") {
            descripcion = `CHEQUE: ${registro.No_Cheque} - MOTIVO: ${registro.Motivo} - ${parseTOMXN(registro.Monto)}`;
        } else if (tipo === "prestamoIniciado") {
            descripcion = `Préstamo Iniciado - ${parseTOMXN(registro.Monto)}`;
        } else {
            descripcion = `${registro.Motivo} - ${parseTOMXN(registro.Monto)}`;
        }

        // Si es préstamo iniciado o no existe el registro, creamos uno nuevo
        if (tipo === "prestamoIniciado" || !resultado[clave]) {
            resultado[clave] = {
                NombreCompleto: usuario,
                Fecha: fecha,
                FechaOriginal: parsearFecha(fecha),
                Tipo: tipo,
                TotalMonto: registro.Monto,
                No_Cheque: [registro.No_Cheque || "N/A"],
                MotivoCheque: [registro.Motivo || "N/A"],
                NumeroTransacciones: 1,
                Descripcion: descripcion,
                CuentaPrestamo: registro.CTA_CONTABLE_PRESTAMO || "N/A",  // Añadido
                CuentaAhorro: registro.CTA_CONTABLE_AHORRO || "N/A",      // Añadido
                EsPagoPrestamo: tipo === "pago",
                EsAbonoAhorro: tipo === "ahorro",
                EsPrestamoIniciado: tipo === "prestamoIniciado",
                EsCheque: tipo === "cheque",
                EsGastoConciliado: tipo === "gastoConciliado",
                ID: registro.ID || null,
                EsNoCheque: tipo !== "cheque",
                EsUnitario: tipo === "prestamoIniciado" // Marcar como unitario
            };
        } 
        // Para otros tipos, agrupamos por nombre y fecha
        else if (tipo !== "prestamoIniciado") {
            resultado[clave].TotalMonto += registro.Monto;
            resultado[clave].Descripcion += ` / ${descripcion}`;
            resultado[clave].No_Cheque.push(registro.No_Cheque || "N/A");
            resultado[clave].NumeroTransacciones += 1;
            
            // Actualizar tipo si es necesario
            if (tipo === "cheque") resultado[clave].EsCheque = true;
            if (tipo === "gastoConciliado") resultado[clave].EsGastoConciliado = true;
        }
    };

    // [Resto del código de procesamiento permanece igual...]
    // Procesar cheques (siempre individuales)
    if (data.cheques && Array.isArray(data.cheques)) {
        data.cheques.forEach(cheque => {
            const fecha = formatearFecha(cheque.Fecha);
            agregarRegistro(cheque.Nombre, fecha, "cheque", {
                ...cheque,
                CTA_CONTABLE_AHORRO: cheque.CTA_CONTABLE_AHORRO || "N/A",  // Asegurar que exista
                CTA_CONTABLE_PRESTAMO: cheque.CTA_CONTABLE_PRESTAMO || "N/A"
            });
        });
    }

    // Procesar pagos (individuales)
    if (data.pagos && Array.isArray(data.pagos)) {
        data.pagos.forEach(pago => {
            const fecha = formatearFecha(pago.Fecha_Pago);
            agregarRegistro(pago.NombreCompleto, fecha, "pago", {
                ...pago,
                No_Cheque: "N/A",
                Monto: pago.Monto_Pago,
                Motivo: "Pago de préstamo",
                CTA_CONTABLE_PRESTAMO: pago.CTA_CONTABLE_PRESTAMO || "N/A"  // Añadido
            });
        });
    }

    // Procesar transacciones de ahorro (individuales)
    if (data.transaccionesAhorro && Array.isArray(data.transaccionesAhorro)) {
        data.transaccionesAhorro.forEach(transaccion => {
            const fecha = formatearFecha(transaccion.Fecha);
            agregarRegistro(transaccion.NombreCompleto, fecha, "ahorro", {
                ...transaccion,
                No_Cheque: "N/A",
                Motivo: transaccion.TipoTransaccion,
                CTA_CONTABLE_AHORRO: transaccion.CTA_CONTABLE_AHORRO || "N/A"  // Añadido
            });
        });
    }

    // Procesar préstamos iniciados (siempre individuales)
    if (data.prestamosInicioMes && Array.isArray(data.prestamosInicioMes)) {
        data.prestamosInicioMes.forEach(prestamo => {
            const fecha = formatearFecha(prestamo.Fecha);
            agregarRegistro(prestamo.NombreCompleto, fecha, "prestamoIniciado", {
                ...prestamo,
                No_Cheque: "N/A",
                Motivo: "Préstamo iniciado",
                CTA_CONTABLE_PRESTAMO: prestamo.CTA_CONTABLE_PRESTAMO || "N/A"  // Añadido
            });
        });
    }

    // Procesar gastos de conciliación como registros unitarios
    resultConciliationGastos.forEach(gasto => {
        const fecha = formatearFecha(gasto.Fecha);
        agregarRegistro("N/A", fecha, "gastoConciliado", {
            ...gasto,
            Motivo: gasto.Tipo,
            No_Cheque: gasto.No_Cheque || "N/A",
            CTA_CONTABLE_AHORRO: gasto.CTA_CONTABLE_AHORRO || "N/A",      // Añadido
            CTA_CONTABLE_PRESTAMO: gasto.CTA_CONTABLE_PRESTAMO || "N/A"   // Añadido
        });
    });

    // Obtener todos los registros
    const todosRegistros = Object.values(resultado);

    // Separar cheques y no-cheques
    const cheques = todosRegistros.filter(registro => registro.EsCheque);
    const noCheques = todosRegistros.filter(registro => !registro.EsCheque);

    // Ordenar cada grupo por fecha ascendente
    cheques.sort((a, b) => a.FechaOriginal - b.FechaOriginal);
    noCheques.sort((a, b) => a.FechaOriginal - b.FechaOriginal);

    // Combinar con cheques primero y no-cheques después
    const registrosOrdenados = [...cheques, ...noCheques];

    // Mapear los registros finales incluyendo las cuentas contables
    return registrosOrdenados.map(registro => ({
        Fecha: registro.Fecha,
        Nombre: registro.EsGastoConciliado ? "N/A" : registro.NombreCompleto,
        Descripcion: registro.Descripcion,
        TotalMonto: registro.TotalMonto,
        No_Cheque: registro.No_Cheque.filter(n => n !== "N/A").join(", ") || "N/A",
        NumeroTransacciones: registro.NumeroTransacciones,
        CuentaPrestamo: registro.CuentaPrestamo,  // Ya está asignado en agregarRegistro
        CuentaAhorro: registro.CuentaAhorro,      // Ya está asignado en agregarRegistro
        Tipo: registro.Tipo,
        ID: registro.ID,
        EsUnitario: registro.EsUnitario || false,
        CuentaAhorro: registro.CuentaAhorro,  // Alias para compatibilidad
        CuentaPrestamo: registro.CuentaPrestamo // Alias para compatibilidad
    }));
}



const parseTOMXN = (number) => Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(number || 0);

const parsefromMXN = (string) => parseInt(string.replace(/[^\d.-]/g, ''));