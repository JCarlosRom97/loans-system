const LIMIT_PRESTAMO = 250000;
document.addEventListener('DOMContentLoaded', async() => {
    const params = new URLSearchParams(window.location.search);
    const idUser = parseInt(params.get('idUsuario'));
    console.log('idUser', idUser);

    document.getElementById('idUser').value = idUser;

    getLoan();
    getLoanRefinance();

    const fecha = document.getElementById('fecha');
    const monto = document.getElementById('monto');
    const anios = document.getElementById('noAnios');
    const interes = document.getElementById('interes');

    fecha.addEventListener('keyup', async () =>{
        const [fechaValue, totalPrestamoValue] =  await processFormInformation();
        regexDate(fechaValue, totalPrestamoValue)
    })
  
    monto.addEventListener('keyup', async() =>{
        document.getElementById('cantidadMeses').value = document.getElementById('noAnios').value * 12;
        const [fechaValue, totalPrestamoValue] = await processFormInformation();
        regexDate(fechaValue, totalPrestamoValue)
    })


    anios.addEventListener('keyup', async() =>{
        document.getElementById('cantidadMeses').value = document.getElementById('noAnios').value * 12;
        const [fechaValue, totalPrestamoValue] = await processFormInformation();
        regexDate(fechaValue, totalPrestamoValue)
    })


    interes.addEventListener('keyup', async()=>{
        const [fechaValue, totalPrestamoValue] = await processFormInformation();
        regexDate(fechaValue, totalPrestamoValue)
    })
    /* FORMS */
    const form = document.getElementById('formLoan');
    const formPago = document.getElementById('pagosForm');
    const buttonRefinanciar = document.getElementById('refinanciarButton');
    // Form create loan
    form.addEventListener('submit', async(e)=>{
        e.preventDefault();
        const isRefinanciar = await window.db.getLoan({userId:document.getElementById('idUser').value, status:'Activo'});


        const interes = parsefromMXN(document.getElementById('interes').value);
        const interesTotal = interes * document.getElementById('cantidadMeses').value;

        const loanData = {
            id_Usuario_fk: idUser,
            Periodo: document.getElementById('noAnios').value,
            Cantidad_Meses: document.getElementById('cantidadMeses').value,
            Monto: isRefinanciar.length > 0 ? parsefromMXN(document.getElementById('monto').value) + isRefinanciar[0].Monto : document.getElementById('monto').value,
            Fecha_Inicio: document.getElementById('fecha').value,
            Interes: interes, 
            Interes_Total: interesTotal,
            TotalPrestamo: parsefromMXN(document.getElementById('totalPrestamo').value),
            TotalPrestamo_Intereses: parsefromMXN(document.getElementById('interesesPrestamo').value),
            Abono: parsefromMXN(document.getElementById('abono').value),
            Saldo: parsefromMXN(document.getElementById('totalPrestamo').value),
            EstadoPrestamo: 'Activo',
            Pagos_Completados: 0,
            No_Catorcenas: document.getElementById('noCatorcenas').value,
            Total_Pagado_Capital: 0,
            Total_Pagado_Intereses:0
        }

        if(isRefinanciar.length >0){
            console.log('refinanciar');
            const refinancedLoan = await window.db.refinanceLoan({id:isRefinanciar[0].ID, ...loanData});
            console.log(refinancedLoan);
            document.getElementById('idPrestamo').value = refinancedLoan.loan.ID || 0;

            if(refinancedLoan.loan.ID ){
                window.electron.showNotification('Prestamo refinanciado', 
                `El prestamo ha sido refinanciado correctamente!`);
                form.reset()
                const infoDiv = document.getElementById('user-table-body');
                infoDiv.innerHTML = '';

                document.getElementById('tablePagos').classList.add('hidden');
                document.getElementById('tablePagos').classList.remove('visible');

                getLoan();
                getLoanRefinance();
                
            }

        }else{
            try {
                const newLoan = await window.db.addLoan(loanData);
                console.log(newLoan);
                if(newLoan.ID){
                    window.electron.showNotification('Prestamo Agregado', 
                    `El prestamo ha sido agregado correctamente!`);
                    form.reset()
                    const infoDiv = document.getElementById('user-table-body');
                    infoDiv.innerHTML = '';
    
                    document.getElementById('tablePagos').classList.add('hidden');
                    document.getElementById('tablePagos').classList.remove('visible');
    
                    getLoan();
                    
                }
            } catch (error) {
                window.electron.showNotification('Error', 
                `Ha habido un error, intente de nuevo!`);
            }
        }
    })
    // FORM PAGOS
    formPago.addEventListener('submit', async(e) =>{
        e.preventDefault();

        const newLoan = await window.db.getLoan({userId:document.getElementById('idUser').value, status:'Activo'});
        const {Interes_Total} = newLoan[0];
        const monto = parseInt(document.getElementById('montoPago').value);
        const porcentaje = (Interes_Total)/ 100;
        const porcentajeInteres = 1 - porcentaje;
    
        const montoCapital = monto - (monto * porcentaje);
    
        const montoIntereses = monto - (monto *  porcentajeInteres);

        console.log({Interes_Total, monto, porcentaje, porcentajeInteres, montoCapital, montoIntereses});

        const paymentData = {
            id_Prestamo_fk: document.getElementById('idPrestamo').value,
            Fecha_Pago: document.getElementById('fechaPago').value,
            Monto_Pago: monto,
            Periodo_Catorcenal: parseInt(document.getElementById('periodoCatorcenal').value) ,
            Metodo_Pago: document.getElementById('metodoPago').value,
            Monto_Pago_Capital:  parseInt(montoCapital),
            Monto_Pago_Intereses: parseInt(montoIntereses)
        };
        try {
            console.log('paymentData', paymentData);
            const newPayment = await window.db.addPayment(paymentData);
            const loanUpdated = await window.db.updateLoanCapitalIntereses({   
                id:document.getElementById('idPrestamo').value,
                Total_Pagado_Capital:paymentData.Monto_Pago_Capital,  
                Total_Pagado_Intereses: paymentData.Monto_Pago_Intereses
            });

            console.log('Prestamo actualizado con Totales', loanUpdated);

            if(newPayment){
                getLoan();
                formPago.reset()
            }
        } catch (error) {
            console.error(error)
        }
        
    })
    /* FORM REFINANCIAR */
    buttonRefinanciar.addEventListener('click', async()=>{
      
        // SHOW 
        if(document.getElementById('formLoan').classList.contains('hidden')){
            
            const newLoan = await window.db.getLoan({userId:document.getElementById('idUser').value, status:'Activo'});
            // FORM 
            document.getElementById('formLoan').classList.remove('hidden')
            document.getElementById('formLoan').classList.add('visible')
            // Titles
            document.getElementById('nuevoPrestamo').innerText = 'Refinanciar'
            document.getElementById('prestamo-title').innerText ='Refinanciar Prestamo'
            // TOTAL PRESTAMO + SALDO ANTERIOR
            document.getElementById('totalRefinanciadoInput').classList.remove('hidden');
            document.getElementById('totalRefinanciadoInput').classList.add('visible');

            document.getElementById('saldoAnterior').innerText = parseTOMXN(newLoan[0].Saldo);


            const limitNewLoan = LIMIT_PRESTAMO - newLoan[0].Saldo;

            console.log(limitNewLoan, newLoan);

            document.getElementById('montoPagoTitle').innerText = `Monto: max(${parseTOMXN(limitNewLoan)})`
            document.getElementById('monto').setAttribute('max', parseInt(limitNewLoan))

            const totalPrestamoInput = document.getElementById('totalPrestamo');

            totalPrestamoInput.addEventListener('change', ()=>{
                console.log(document.getElementById('totalPrestamo').value)
            })
        }else{
            // HIDE
            document.getElementById('formLoan').classList.remove('visible')
            document.getElementById('formLoan').classList.add('hidden')
            document.getElementById('nuevoPrestamo').innerText = 'Nuevo Prestamo'
            document.getElementById('prestamo-title').innerText ='Nuevo Prestamo'
        }
    })
})

const parsefromMXN = (string) => parseInt(string.replace(/[^\d.-]/g, ''));

const parseTOMXN = (number) => Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(number || 0);

const processFormInformation  = async () =>{
    const isRefinanciar = await window.db.getLoan({userId:document.getElementById('idUser').value, status:'Activo'});
    const montoValue =  parseFloat(document.getElementById('monto').value);
    const mesesValue = parseInt(document.getElementById('cantidadMeses').value);
    const interesValue = parseFloat(document.getElementById('interes').value);

    const porcentaje = (interesValue * mesesValue )/ 100;

    const totalPrestamoValue = montoValue + (montoValue * porcentaje);

    const prestamoIntereses = totalPrestamoValue - montoValue;

    document.getElementById('interesesPrestamo').value = parseTOMXN(prestamoIntereses);
    
    const totalPrestamoRefinanciado = parsefromMXN(document.getElementById('saldoAnterior').textContent) + totalPrestamoValue;
    
    console.log(totalPrestamoRefinanciado,prestamoIntereses);
    
    document.getElementById('totalPrestamoRefinanciado').value = parseTOMXN(totalPrestamoRefinanciado - prestamoIntereses);
    
    document.getElementById('totalPrestamo').value = isRefinanciar.length >0 ? parseTOMXN(totalPrestamoRefinanciado): parseTOMXN(totalPrestamoValue);
  
    const fechaValue = document.getElementById('fecha').value; 

    return [fechaValue, isRefinanciar.length >0 ? totalPrestamoRefinanciado: totalPrestamoValue];
}

const getLoan = async () => {
    console.log(document.getElementById('idUser').value);
    const newLoan = await window.db.getLoan({userId:document.getElementById('idUser').value, status:'Activo'});

    console.log('getLoan',newLoan);

    if(newLoan.length >0){
        // Detail Loan
        document.getElementById('detailLoanSection').classList.add('visible')
        document.getElementById('detailLoanSection').classList.remove('hidden')
        //form new loan
        document.getElementById('formLoan').classList.remove('visible')
        document.getElementById('formLoan').classList.add('hidden')
        // form pay
        document.getElementById('pagosForm').classList.add('visible')
        document.getElementById('pagosForm').classList.remove('hidden')

        if(newLoan[0].Saldo < LIMIT_PRESTAMO){
            // Refinanciar button 
            document.getElementById('refinanciarButton').classList.add('visible');
            document.getElementById('refinanciarButton').classList.remove('hidden')
        }else{
            document.getElementById('refinanciarButton').classList.add('hidden');
            document.getElementById('refinanciarButton').classList.remove('visible')
        }


        fillLoanDataUI(newLoan);
    }else{
        document.getElementById('detailLoanSection').classList.add('hidden')
        document.getElementById('detailLoanSection').classList.remove('visible')
        //form new loan
        document.getElementById('formLoan').classList.remove('hidden')
        document.getElementById('formLoan').classList.add('visible')
        //Form pay 
        document.getElementById('pagosForm').classList.add('hidden')
        document.getElementById('pagosForm').classList.remove('visible')
        // Refinanciar button
        document.getElementById('refinanciarButton').classList.add('hidden');
        document.getElementById('refinanciarButton').classList.remove('visible')
    }

    document.getElementById('idPrestamo').value = newLoan[0].ID;
}

const getLoanRefinance = async() =>{
    const loansRefinance = await window.db.getLoan({userId:document.getElementById('idUser').value, status:'Refinanciado'});
    console.log('accordion-body', loansRefinance[0]);
    if(loansRefinance.length >0){
         // Generar el HTML para la tabla
         let tableHTML = ``;

         // Recorrer los usuarios y agregar filas
        loansRefinance.forEach((loan, index) => {
            tableHTML += `
            <div class="accordion-item">
                <button class="accordion-header" aria-expanded="false">Préstamo Refinanciado ${index+1}</button>
                <div class="accordion-body">
                    <div class="section">
                        <div class="info-item">
                            <p><strong>Fecha de Inicio:</strong> ${loan.Fecha_Inicio}</p>
                        </div>
                        <div class="info-item">
                            <p><strong>Monto Original:</strong> ${parseTOMXN(loan.Monto)}</p>
                        </div>
                        <div class="info-item">
                            <p><strong>Interés Préstamo:</strong> ${parseTOMXN(loan.TotalPrestamo_Intereses)}</p>
                        </div>
                    </div>
                    <div class="section">
                        <div class="info-item">
                            <p><strong>Total Préstamo:</strong> ${parseTOMXN(loan.TotalPrestamo)}</p>
                        </div>
                        <div class="info-item">
                            <p><strong>Saldo Anterior:</strong> ${parseTOMXN(loan.Saldo)}</p>
                        </div>
                        <div class="info-item">
                            <p><strong>Total Pagado Interés:</strong> ${parseTOMXN(loan.Total_Pagado_Intereses)}</p>
                        </div>
                    </div>
                    <div class="section">
                        <div class="info-item">
                            <p><strong>Total Pagado Capital:</strong> ${parseTOMXN(loan.Total_Pagado_Capital)}</p>
                        </div>
                        <div class="info-item">
                            <p><strong>Periodo:</strong> ${loan.Periodo}</p>
                        </div>
                        <div class="info-item">
                            <p><strong>Interés:</strong> ${loan.Interes}</p>
                        </div>
                    </div>
                    <div class="section">
                        <div class="info-item">
                            <p><strong>Pagos Completados:</strong> ${loan.Pagos_Completados}</p>
                        </div>
                        <div class="info-item">
                            <p><strong>Estado:</strong> ${loan.EstadoPrestamo}</p>
                        </div>
                        <div class="info-item">
                           
                        </div>
                    </div>
                    <div class="table-container" >
                        <table class="user-table">
                        <thead>
                            <tr>
                                <th>No.</th>
                                <th>Periodo Catorcenal</th>
                                <th>Fecha</th>
                                <th>Monto</th>
                                <th>Monto a Capital</th>
                                <th>Monto a Intereses</th>
                                <th>Método de Pago</th>
                                <th>Saldo Actual</th>
                            </tr>
                        </thead>
                        <tbody id="pays-table-body-refinance${loan.ID}">
                            <!-- Aquí se insertarán los usuarios dinámicamente -->
                        </tbody>
                        </table>
                        <div id="info"></div>
                    </div>
                </div>
            </div>
            `;

            generateTablePays(loan.ID, `pays-table-body-refinance${loan.ID}`);
        });
 
 
         // Insertar la tabla en el div con ID "info"
         const accordionBody = document.getElementById('accordion-body');
         accordionBody.innerHTML = tableHTML;

           // Acordeón
        document.querySelectorAll('.accordion-header').forEach(button => {
            button.addEventListener('click', () => {
                const expanded = button.getAttribute('aria-expanded') === 'true';
                button.setAttribute('aria-expanded', !expanded);

                const body = button.nextElementSibling;
                if (!expanded) {
                    body.style.maxHeight = body.scrollHeight + 'px';
                } else {
                    body.style.maxHeight = 0;
                }
            });
        });
    }else{
        const accordionBody = document.getElementById('accordion-body');
        accordionBody.innerHTML = '';
    }

}

const fillLoanDataUI = (loan) =>{
    const fechaPago = getDateAfterPays( loan[0].Fecha_Inicio,loan[0].Pagos_Completados);;
    document.getElementById('fecha-inicio').innerText = loan[0].Fecha_Inicio;
    document.getElementById('fecha-pago').innerText = fechaPago;
    document.getElementById('loan-amount').innerText = parseTOMXN(loan[0].Monto);
    document.getElementById('loan-interest').innerText = `${loan[0].Interes}%`;
    document.getElementById('loan-total').innerText = parseTOMXN(loan[0].TotalPrestamo);
    document.getElementById('loan-abono').innerText = parseTOMXN(loan[0].Abono);
    document.getElementById('loan-saldo').innerText = parseTOMXN(loan[0].Saldo); 
    document.getElementById('loan-status').innerText = loan[0].EstadoPrestamo;
    document.getElementById('loan-payments').innerText = loan[0].Pagos_Completados;
    document.getElementById('loan-catorcenas').innerText = loan[0].No_Catorcenas;
    
    document.getElementById('periodoCatorcenal').value = loan[0].Pagos_Completados +1;
    document.getElementById('fechaPago').value = fechaPago;

    console.log('fillLoanDataUI', loan[0].Resto_Abono);

    generateTablePays(loan[0].ID, 'user-table-body-pays');

    if(loan[0].Resto_Abono > 0){
        document.getElementById('restanteAbonoSection').classList.add('visible');
        document.getElementById('restanteAbonoSection').classList.remove('hidden');
        document.getElementById('restanteAbono').value = parseTOMXN(loan[0].Resto_Abono);
    }else{
        document.getElementById('restanteAbonoSection').classList.add('hidden');
        document.getElementById('restanteAbonoSection').classList.remove('visible');
        document.getElementById('restanteAbono').value = 0;
    }
}

function regexDate (fechaValue, totalPrestamoValue){
    const dateRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
    if (dateRegex.test(fechaValue)) {
        console.log("Valid date format");
        const dates = generateSecondFridays(fechaValue, parseInt(document.getElementById('noAnios').value))
        document.getElementById('tablePagos').classList.remove('hidden');
        document.getElementById('tablePagos').classList.add('visible');
        
        document.getElementById('noCatorcenas').value = dates.length;
        document.getElementById('abono').value = parseTOMXN(totalPrestamoValue / dates.length);
        
        generateTableCatorcena(dates, document.getElementById('abono').value);
        
    } else {
        console.log("Invalid date format");
    }
}

function generateSecondFridays(startDate, years) {
    console.log(startDate, years);
    const dates = [];
  
    // Convertir la fecha inicial de formato dd/mm/aaaa a objeto Date
    const [startDay, startMonth, startYear] = startDate.split('/').map(Number);
    let currentFriday = new Date(startYear, startMonth - 1, startDay);
  
    // Calcular la fecha final sumando los años al inicio
    const finalDate = new Date(startYear + years, startMonth - 1, startDay);
  
    // Asegurarse de que la fecha inicial sea un viernes
    while (currentFriday.getDay() !== 5) {
      currentFriday.setDate(currentFriday.getDate() + 1);
    }
  
    // Generar fechas hasta la fecha final
    while (currentFriday <= finalDate) {
      dates.push(
        `${currentFriday.getDate().toString().padStart(2, '0')}/` +
        `${(currentFriday.getMonth() + 1).toString().padStart(2, '0')}/` +
        `${currentFriday.getFullYear()}`
      ); // Formatea la fecha como dd/mm/aaaa
      currentFriday.setDate(currentFriday.getDate() + 14); // Avanza 14 días
    }
  
    return dates;
}

function getDateAfterPays(startDate, pays) {
    // Convertir la fecha inicial de formato dd/mm/aaaa a objeto Date
    const [startDay, startMonth, startYear] = startDate.split('/').map(Number);
    let currentFriday = new Date(startYear, startMonth - 1, startDay);

    // Asegurarse de que la fecha inicial sea un viernes
    while (currentFriday.getDay() !== 5) {
        currentFriday.setDate(currentFriday.getDate() + 1);
    }

    // Calcular la fecha después de recorrer las catorcenas
    const daysToAdd = pays * 14; // Cada catorcena son 14 días
    currentFriday.setDate(currentFriday.getDate() + daysToAdd);

    // Formatear la fecha resultante como dd/mm/aaaa
    const formattedDate = 
        `${currentFriday.getDate().toString().padStart(2, '0')}/` +
        `${(currentFriday.getMonth() + 1).toString().padStart(2, '0')}/` +
        `${currentFriday.getFullYear()}`;

    return formattedDate;
}

const generateTableCatorcena = (dates, pay) =>{
    // Verificar si hay usuarios
    if (dates.length > 0) {
        // Generar el HTML para la tabla
        let tableHTML = ``;

        // Recorrer los usuarios y agregar filas
        dates.forEach((date, index) => {
        tableHTML += `
            <tr>
                    <td>${index +1}</td>
                    <td>${date}</td>
                    <td>${pay}</td>
             
            </tr>
        `;
        });

        tableHTML += '</tbody></table>';

        // Insertar la tabla en el div con ID "info"
        const infoDiv = document.getElementById('user-table-body');
        infoDiv.innerHTML = tableHTML;
    }
}

const generateTablePays = async(idPrestamo, idTable)=>{
    console.log(idPrestamo, idTable);
    const {pagos} = await window.db.getPayments(idPrestamo);
    console.log('generateTablePays', pagos);

       // Verificar si hay usuarios
    if (pagos.length > 0) {
        // Generar el HTML para la tabla
        let tableHTML = ``;

        // Recorrer los usuarios y agregar filas
        pagos.forEach((pago, index) => {
        tableHTML += `
            <tr>
                <td>${index + 1}</td>
                <td>${pago.Periodo_Catorcenal}</td>
                <td>${pago.Fecha_Pago}</td>
                <td>${parseTOMXN(pago.Monto_Pago)}</td>
                <td>${parseTOMXN(pago.Monto_Pago_Capital)}</td>
                <td>${parseTOMXN(pago.Monto_Pago_Intereses)}</td>
                <td>${pago.Metodo_Pago}</td>
                <td>${parseTOMXN(pago.Saldo_Actual)}</td>
            </tr>
        `;
        });

    /*     <td>
        <button class="button-delete" id="deleteButton" onclick="deletePay(${pago.ID})">Eliminar</button>
        </td> */

        tableHTML += '</tbody></table>';

        // Insertar la tabla en el div con ID "info"
        const infoDiv = document.getElementById(idTable);
        infoDiv.innerHTML = tableHTML;

        const tablePagosPrestamos = document.getElementById('tablePagosPrestamos');

        tablePagosPrestamos.classList.remove('hidden');
        tablePagosPrestamos.classList.add('visible');
    }else{
        const infoDiv = document.getElementById(idTable);
        infoDiv.innerHTML = ""
    }
}

const deletePay  = async(idPay) =>{
    const response = await window.db.removePayment(idPay);
    console.log(response);
    if(response){
        generateTablePays(document.getElementById('idPrestamo').value, 'user-table-body-pays');
        getLoan()
        const tablePagosPrestamos = document.getElementById('tablePagosPrestamos');
        tablePagosPrestamos.classList.remove('visible');
        tablePagosPrestamos.classList.add('hidden');
    }
}



  

