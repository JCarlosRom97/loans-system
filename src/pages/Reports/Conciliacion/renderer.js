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
            
    
            console.log(mes, year, saldo);
    
            const resultConciliation = await window.db.getConciliation({mes, year})
    
            console.log('resultConciliation',resultConciliation);

            if(resultConciliation){
                const tableConciliation = document.getElementById('conciliation-table-body');
                tableConciliation.innerHTML = "";
                
                generateConciliationTable(resultConciliation, saldo);
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

function generateConciliationTable(data, saldoInicial) {
    // Obtener el JSON ordenado y procesado
    const records = orderDataConciliation(data);

    console.log(records);

    // Inicializar variables
    let saldoActual = parseInt(saldoInicial); // Inicializar saldo con el valor pasado como parámetro
    let numberRecord = 1; // Contador de registros
    let tableHTML = ''; // HTML de la tabla

    // Recorrer los registros procesados
    records.forEach((record) => {
        const { Fecha, Nombre, Descripcion, TotalMonto, No_Cheque, NumeroTransacciones } = record;

        // Determinar el tipo de transacción basado en la descripción
        let esAhorro = Descripcion.includes('AHORRO');
        let esPago = Descripcion.includes('ABONO A PRESTAMO');
        let esCheque = Descripcion.includes('CHEQUE(S)');
        let esPrestamo = Descripcion.includes('PRÉSTAMO INICIADO');
        let esDesahogo = Descripcion.includes('DESAHOGO');

        // Determinar si el monto debe mostrarse en rojo o verde
        let montoClass = '';
        if (esPrestamo || esDesahogo) {
            montoClass = 'less-red'; // Rojo para préstamos y desahogos
        } else if (esAhorro || esPago || esCheque) {
            montoClass = 'more-green'; // Verde para ahorros, abonos y cheques
        }

        // Ajustar saldo según el tipo de transacción
        if (esCheque || esPago || esAhorro) {
            saldoActual += TotalMonto;
        } else if (esPrestamo || esDesahogo) {
            saldoActual -= TotalMonto;
        }

        // Generar fila de la tabla
        tableHTML += `
            <tr>
                <td>${numberRecord++}</td>
                <td>${Nombre}</td>
                <td>${Fecha}</td>
                <td>${Descripcion}</td>
                <td>${esCheque ? No_Cheque : 'N/A'}</td>
                <td>
                    ${esPrestamo || esDesahogo
                        ? `<span class="${montoClass}">- ${parseTOMXN(TotalMonto)}</span>`
                        : 'N/A'}
                </td>
                <td>
                    ${esAhorro || esPago || esCheque
                        ? `<span class="${montoClass}">+ ${parseTOMXN(TotalMonto)}</span>`
                        : 'N/A'}
                </td>
                <td>${parseTOMXN(saldoActual)}</td>
                <td>N/A</td>
                <td>N/A</td>
            </tr>
        `;
    });

    // Agregar el total al final de la tabla
    tableHTML += `
        <tr>
            <td colspan="6"></td>
            <td><span class="more-green">${parseTOMXN(saldoActual)}</span></td>
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

        if(resultConciliation){
            generateConciliationTable(resultConciliation);
        }
    } catch (error) {
        window.electron.showNotification('Error',  
        error);
    }

}



function orderDataConciliation(data) {
    console.log(data);

    const resultado = {};

    // Función para formatear la fecha desde la base de datos a dd/mm/aaaa
    const formatearFecha = (fecha) => {
        return window.api.formatDateToDisplay(fecha); // Usar la función proporcionada
    };

    // Función para agregar o actualizar un registro en el resultado
    const agregarRegistro = (usuario, fecha, tipo, registro) => {
        const clave = `${usuario}-${fecha}-${tipo}`; // Incluir el tipo en la clave para separar registros

        if (!resultado[clave]) {
            resultado[clave] = {
                NombreCompleto: usuario,
                Fecha: fecha,
                Tipo: tipo, // Tipo de transacción (general, desahogo, corte, cheque)
                TotalMonto: 0, // Suma de montos
                No_Cheque: [], // Lista de números de cheque
                NumeroTransacciones: 0, // Contador de transacciones
                Descripcion: "" // Inicializar descripción
            };
        }

        if (tipo === "cheque") {
            resultado[clave].No_Cheque.push(registro.No_Cheque); // Agregar número de cheque
            resultado[clave].TotalMonto += registro.Monto; // Sumar monto del cheque
            resultado[clave].NumeroTransacciones += 1; // Incrementar contador
        } else if (tipo === "pago") {
            resultado[clave].TotalMonto += registro.Monto_Pago; // Sumar monto del pago
            resultado[clave].NumeroTransacciones += 1; // Incrementar contador
        } else if (tipo === "transaccionAhorro") {
            if (registro.TipoTransaccion === "Ahorro") {
                resultado[clave].TotalMonto += registro.Monto; // Sumar monto de ahorro
                resultado[clave].NumeroTransacciones += 1; // Incrementar contador
            } else if (registro.TipoTransaccion === "Desahogo") {
                // Los desahogos se manejan en un registro separado
            } else if (registro.TipoTransaccion === "Corte") {
                // Los cortes se manejan en un registro separado
            }
        } else if (tipo === "prestamoInicioMes") {
            resultado[clave].TotalMonto += registro.Monto; // Sumar monto del préstamo iniciado
            resultado[clave].NumeroTransacciones += 1; // Incrementar contador
        } else if (tipo === "desahogo") {
            resultado[clave].TotalMonto += registro.Monto; // Sumar monto del desahogo
            resultado[clave].NumeroTransacciones += 1; // Incrementar contador
        } else if (tipo === "corte") {
            resultado[clave].TotalMonto += registro.Monto; // Sumar monto del corte
            resultado[clave].NumeroTransacciones += 1; // Incrementar contador
        }
    };

    // Procesar cheques
    if (data.cheques && Array.isArray(data.cheques)) {
        data.cheques.forEach(cheque => {
            const fecha = formatearFecha(cheque.Fecha); // Formatear fecha a dd/mm/aaaa
            agregarRegistro(cheque.Nombre, fecha, "cheque", cheque); // Tipo "cheque"
        });
    }

    // Procesar pagos
    if (data.pagos && Array.isArray(data.pagos)) {
        data.pagos.forEach(pago => {
            const fecha = formatearFecha(pago.Fecha_Pago); // Formatear fecha a dd/mm/aaaa
            agregarRegistro(pago.NombreCompleto, fecha, "general", pago); // Tipo "general"
        });
    }

    // Procesar transacciones de ahorro
    if (data.transaccionesAhorro && Array.isArray(data.transaccionesAhorro)) {
        data.transaccionesAhorro.forEach(transaccion => {
            const fecha = formatearFecha(transaccion.Fecha); // Formatear fecha a dd/mm/aaaa
            if (transaccion.TipoTransaccion === "Desahogo") {
                agregarRegistro(transaccion.NombreCompleto, fecha, "desahogo", transaccion); // Tipo "desahogo"
            } else if (transaccion.TipoTransaccion === "Corte") {
                agregarRegistro(transaccion.NombreCompleto, fecha, "corte", transaccion); // Tipo "corte"
            } else {
                agregarRegistro(transaccion.NombreCompleto, fecha, "general", transaccion); // Tipo "general"
            }
        });
    }

    // Procesar préstamos iniciados
    if (data.prestamosInicioMes && Array.isArray(data.prestamosInicioMes)) {
        data.prestamosInicioMes.forEach(prestamo => {
            const fecha = formatearFecha(prestamo.Fecha); // Formatear fecha a dd/mm/aaaa
            agregarRegistro(prestamo.NombreCompleto, fecha, "general", prestamo); // Tipo "general"
        });
    }

    // Generar descripción para cada registro
    Object.values(resultado).forEach(registro => {
        const descripciones = [];

        // Agregar cheques (solo para registros de tipo "cheque")
        if (registro.Tipo === "cheque") {
            if (registro.No_Cheque.length > 0) {
                descripciones.push(`CHEQUE(S): ${registro.No_Cheque.join(", ")}`);
            }
            descripciones.push(`MONTO CHEQUE $${registro.TotalMonto}`);
        }

        // Agregar abonos a préstamos (solo para registros de tipo "general")
        if (registro.Tipo === "general") {
            const totalAbonosPrestamos = data.pagos
                .filter(pago => formatearFecha(pago.Fecha_Pago) === registro.Fecha && pago.NombreCompleto === registro.NombreCompleto)
                .reduce((total, pago) => total + pago.Monto_Pago, 0);
            if (totalAbonosPrestamos > 0) {
                descripciones.push(`ABONO A PRESTAMO $${totalAbonosPrestamos}`);
            }
        }

        // Agregar ahorros (solo para registros de tipo "general")
        if (registro.Tipo === "general") {
            const totalAhorros = data.transaccionesAhorro
                .filter(transaccion => formatearFecha(transaccion.Fecha) === registro.Fecha && transaccion.NombreCompleto === registro.NombreCompleto && transaccion.TipoTransaccion === "Ahorro")
                .reduce((total, transaccion) => total + transaccion.Monto, 0);
            if (totalAhorros > 0) {
                descripciones.push(`AHORRO $${totalAhorros}`);
            }
        }

        // Agregar desahogos (solo para registros de tipo "desahogo")
        if (registro.Tipo === "desahogo") {
            const totalDesahogos = data.transaccionesAhorro
                .filter(transaccion => formatearFecha(transaccion.Fecha) === registro.Fecha && transaccion.NombreCompleto === registro.NombreCompleto && transaccion.TipoTransaccion === "Desahogo")
                .reduce((total, transaccion) => total + transaccion.Monto, 0);
            if (totalDesahogos > 0) {
                descripciones.push(`DESAHOGO $${totalDesahogos}`);
            }
        }

        // Agregar cortes (solo para registros de tipo "corte")
        if (registro.Tipo === "corte") {
            const totalCortes = data.transaccionesAhorro
                .filter(transaccion => formatearFecha(transaccion.Fecha) === registro.Fecha && transaccion.NombreCompleto === registro.NombreCompleto && transaccion.TipoTransaccion === "Corte")
                .reduce((total, transaccion) => total + transaccion.Monto, 0);
            if (totalCortes > 0) {
                descripciones.push(`CORTE $${totalCortes}`);
            }
        }

        // Agregar préstamos iniciados (solo para registros de tipo "general")
        if (registro.Tipo === "general") {
            const totalPrestamosIniciados = data.prestamosInicioMes
                .filter(prestamo => formatearFecha(prestamo.Fecha) === registro.Fecha && prestamo.NombreCompleto === registro.NombreCompleto)
                .reduce((total, prestamo) => total + prestamo.Monto, 0);
            if (totalPrestamosIniciados > 0) {
                descripciones.push(`PRÉSTAMO INICIADO $${totalPrestamosIniciados}`);
            }
        }

        // Unir todas las descripciones en una sola cadena
        registro.Descripcion = descripciones.join(" / ");
    });

    // Convertir el objeto de resultado a un array y formatear la salida
    return Object.values(resultado).map(registro => ({
        Fecha: registro.Fecha, // La fecha ya está en formato dd/mm/aaaa
        Nombre: registro.NombreCompleto,
        Descripcion: registro.Descripcion,
        TotalMonto: registro.TotalMonto,
        No_Cheque: registro.No_Cheque.join(", "), // Concatenar números de cheque
        NumeroTransacciones: registro.NumeroTransacciones // Contador de transacciones
    }));
}



const parseTOMXN = (number) => Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(number || 0);

const parsefromMXN = (string) => parseInt(string.replace(/[^\d.-]/g, ''));