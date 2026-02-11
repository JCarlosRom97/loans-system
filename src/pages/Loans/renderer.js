const LIMIT_PRESTAMO = 250000;

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const idUser = parseInt(params.get('idUsuario'));

    document.getElementById('idUser').value = idUser;

    const user = await window.db.getUser(idUser);

    document.getElementById('name-user').innerText =
        `${user.Nombre} ${user.Apellido_Paterno} ${user.Apellido_Materno}`

    console.log(user);

    getLoan();
    getLoanRefinance();
    getLoanPagados();

    const fecha = document.getElementById('fecha');
    const monto = document.getElementById('monto');
    const anios = document.getElementById('noAnios');
    const interes = document.getElementById('interes');
    let lastValidDate = '';

    fecha.addEventListener('keyup', async (e) => {
        const current = fecha.value;
        console.log(current);
        
        // If what the user typed breaks the dd/mm/aaaa structure → revert
        if (!window.api.formatInputDate(current)) {
          fecha.value = lastValidDate;
          return;
        }
      
        // If full date is written, validate logical date
        if (current.length === 10 && !window.api.formatInputDate(current)) {
          fecha.value = lastValidDate;
          return;
        }
      
        // Save valid value
        lastValidDate = current;

        e.preventDefault();
        const [fechaValue, totalPrestamoValue] = await processFormInformation();
        regexDate(fechaValue, totalPrestamoValue)
    })

    const fechaPago = document.getElementById('fecha-deposito');
    let lastValidDatePays ='';
    
    fechaPago.addEventListener('keyup', (e) =>{
        const current = fechaPago.value;

        // If what the user typed breaks the dd/mm/aaaa structure → revert
        if (!window.api.formatInputDate(current)) {
            fechaPago.value = lastValidDatePays;
          return;
        }
      
        // If full date is written, validate logical date
        if (current.length === 10 && !window.api.formatInputDate(current)) {
            fechaPago.value = lastValidDatePays;
          return;
        }
      
        // Save valid value
        lastValidDatePays = current;
        e.preventDefault();
    });

    monto.addEventListener('keyup', async () => {
        document.getElementById('cantidadMeses').value = document.getElementById('noAnios').value * 12;
        const [fechaValue, totalPrestamoValue] = await processFormInformation();
        regexDate(fechaValue, totalPrestamoValue)
    })


    anios.addEventListener('keyup', async () => {
        document.getElementById('cantidadMeses').value = document.getElementById('noAnios').value * 12;
        const [fechaValue, totalPrestamoValue] = await processFormInformation();
        regexDate(fechaValue, totalPrestamoValue)
    })


    interes.addEventListener('keyup', async () => {
        const [fechaValue, totalPrestamoValue] = await processFormInformation();
        regexDate(fechaValue, totalPrestamoValue)
    })


    /* FORMS */
    const form = document.getElementById('formLoan');
    const formPago = document.getElementById('pagosForm');
    const buttonRefinanciar = document.getElementById('refinanciarButton');
    const eliminarPrestamoButton = document.getElementById('eliminarButton');
    // Form create loan
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const isRefinanciar = await window.db.getLoan({ userId: document.getElementById('idUser').value, status: 'Activo' });
        const interes = parsefromMXN(document.getElementById('interes').value);
        const interesTotal = interes * document.getElementById('cantidadMeses').value;

        const loanData = {
            id_Usuario_fk: idUser,
            Numero_Prestamo: document.getElementById('numero-prestamo').value,
            Numero_Cheque: document.getElementById('numero-cheque-input').value,
            Periodo: document.getElementById('noAnios').value,
            Cantidad_Meses: document.getElementById('cantidadMeses').value,
            Monto: isRefinanciar.length > 0 ? parsefromMXN(document.getElementById('Capital').value) : document.getElementById('monto').value,
            Total_Capital: isRefinanciar.length > 0 ? parsefromMXN(document.getElementById('Capital').value) : parsefromMXN(document.getElementById('monto').value),
            Fecha_Inicio: formatDateForModel(document.getElementById('fecha').value),
            Fecha_Termino: formatDateForModel(document.getElementById('fecha-termino-input').value),
            Interes: interes,
            Interes_Total: interesTotal,
            TotalPrestamo: parsefromMXN(document.getElementById('totalPrestamo').value),
            TotalPrestamo_Intereses: parsefromMXN(document.getElementById('interesesPrestamo').value),
            Abono: parsefromMXN(document.getElementById('abono').value),
            Ultimo_Abono: parsefromMXN(document.getElementById('last-pay').textContent),
            Saldo: parsefromMXN(document.getElementById('totalPrestamo').value),
            EstadoPrestamo: 'Activo',
            Pagos_Completados: 0,
            No_Catorcenas: document.getElementById('noCatorcenas').value,
            Total_Pagado_Capital: 0,
            Total_Pagado_Intereses: 0
        }
        console.log(loanData);

        if (isRefinanciar.length > 0) {

            const refinancedLoan = await window.db.refinanceLoan({ id: isRefinanciar[0].ID, ...loanData });

            document.getElementById('idPrestamo').value = refinancedLoan.loan.ID || 0;

            if (refinancedLoan.loan.ID) {
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

        } else {
            try {
                const newLoan = await window.db.addLoan(loanData);

                if (newLoan.ID) {
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
    formPago.addEventListener('submit', async (e) => {
        e.preventDefault();

        const newLoan = await window.db.getLoan({ userId: document.getElementById('idUser').value, status: 'Activo' });
        const { No_Catorcenas, Monto, TotalPrestamo_Intereses, Abono } = newLoan[0];
        const monto = parseInt(document.getElementById('montoPago').value);

        // Calcular el porcentaje del pago en relación con el abono
        const porcentajePago = monto / Abono;

        // Calcular el monto capital ajustado por el porcentaje del pago
        const montoCapital = Math.floor((Monto / No_Catorcenas) * porcentajePago);

        // Calcular el monto intereses ajustado por el porcentaje del pago
        const montoIntereses = Math.floor((TotalPrestamo_Intereses / No_Catorcenas) * porcentajePago);

        console.log(`Porcentaje de pago: ${Math.round(porcentajePago * 100)}%`);
        console.log(`Monto capital: ${montoCapital}`);
        console.log(`Monto intereses: ${montoIntereses}`);

        const paymentData = {
            id_Prestamo_fk: document.getElementById('idPrestamo').value,
            Fecha_Catorcena: formatDateForModel(document.getElementById('fechaPagoCatorcena').value),
            Fecha_Pago: formatDateForModel(document.getElementById('fecha-deposito').value),
            Monto_Pago: monto,
            Periodo_Catorcenal: parseInt(document.getElementById('periodoCatorcenal').value),
            Metodo_Pago: document.getElementById('metodoPago').value,
            Monto_Pago_Capital: parseInt(montoCapital),
            Monto_Pago_Intereses: parseInt(montoIntereses) + 1
        };

        console.log('paymentData', paymentData);
        try {

            const newPayment = await window.db.addPayment(paymentData);
            await window.db.updateLoanCapitalIntereses({
                id: document.getElementById('idPrestamo').value,
                Total_Pagado_Capital: paymentData.Monto_Pago_Capital,
                Total_Pagado_Intereses: paymentData.Monto_Pago_Intereses
            });

            if (newPayment) {
                getLoan();
                formPago.reset()
            }
        } catch (error) {
            console.error(error)
        }

    })
    // Show or hide edit Loan 
    const showEditLoanBtn = document.getElementById('showEditLoanBtn');

    showEditLoanBtn.addEventListener('click', (e)=>{
        e.preventDefault();
        
        const editSection = document.getElementById('editLoanSection');

        const isHidden =
        editSection.style.display === "none" ||
        editSection.style.display === "";

        console.log(document.getElementById('editLoanSection').style.display);
        
        console.log(isHidden);
        
        if(isHidden){
            document.getElementById('editLoanSection').style.display = 'block';
            return;
        }
        document.getElementById('editLoanSection').style.display = 'none';
    });

    const editButton = document.getElementById('editButton');

    editButton.addEventListener("click", async(e)=>{
        e.preventDefault();
        console.log('Edit');
        const numeroPrestamoEdit = document.getElementById('numero-prestamo-input-edit').value;
        const numeroChequeEdit = document.getElementById('numero-cheque-input-edit').value;

        console.log(numeroPrestamoEdit, numeroChequeEdit);
        const loanUpdated = await window.db.updateLoan(
        {
            id: document.getElementById('idPrestamo').value, 
            Numero_Prestamo: numeroPrestamoEdit, 
            Numero_Cheque: numeroChequeEdit
        });

        if(loanUpdated.message == 'Préstamo actualizado exitosamente.'){
            window.electron.showNotification('Prestamo Actualizado',
                `El prestamo ha sido actualizado correctamente!`);

            document.getElementById('editLoanSection').style.display = 'none';
            document.getElementById('numero-prestamo-input-edit').value = "";
            document.getElementById('numero-cheque-input-edit').value = "";
            getLoan();
        }else{
            window.electron.showNotification('Error',
                `Error al actualizar prestamo, intenta de nuevo.!`);
        }
    });
    /* FORM REFINANCIAR */
    buttonRefinanciar.addEventListener('click', async () => {

        // SHOW 
        if (document.getElementById('formLoan').classList.contains('hidden')) {

            const newLoan = await window.db.getLoan({ userId: document.getElementById('idUser').value, status: 'Activo' });
            //o FORM 
            document.getElementById('formLoan').classList.remove('hidden')
            document.getElementById('formLoan').classList.add('visible')
            // Titles
            document.getElementById('nuevoPrestamo').innerText = 'Refinanciar';
            document.getElementById('prestamo-title').innerText = 'Refinanciar Prestamo';
            // CAPITAL INPUT
            document.getElementById('capital-input-container').classList.remove('hidden');
            document.getElementById('capital-input-container').classList.add('visible');
            // TOTAL PRESTAMO + SALDO ANTERIOR
            document.getElementById('saldoAnterior').innerText = ` + Saldo Anterior: ${parseTOMXN(newLoan[0].Total_Capital)}`;

            document.getElementById('monto').value = parseTOMXN(newLoan[0].Total_Capital);


            const limitNewLoan = LIMIT_PRESTAMO - newLoan[0].Total_Capital;

            console.log('limitNewLoan', limitNewLoan);

            document.getElementById('montoPagoTitle').innerText = `Monto: max(${parseTOMXN(limitNewLoan)})`
            document.getElementById('monto').setAttribute('max', parseInt(limitNewLoan));

            document.getElementById('Capital').value = parseTOMXN(newLoan[0].Total_Capital);

            lastValidDate = '';


        } else {
            // HIDE
            document.getElementById('formLoan').classList.remove('visible')
            document.getElementById('formLoan').classList.add('hidden')
            document.getElementById('nuevoPrestamo').innerText = 'Nuevo Prestamo'
            document.getElementById('prestamo-title').innerText = 'Nuevo Prestamo'
        }
    })
    /* FORM ELIMINAR */
    eliminarPrestamoButton.addEventListener('click', async () => {

        try {
            const confirmDelete = confirm('¿Estás seguro que deseas eliminar este prestamo? Esta acción no se puede deshacer.');

            if (!confirmDelete) return;
            const newLoan = await window.db.deleteLoan({ idPrestamo: document.getElementById('idPrestamo').value, status: 'Eliminado' });
            if (newLoan.message === 'Préstamo Eliminado Exitosamente.') {
                window.electron.showNotification('Prestamo Eliminado',
                    `El prestamo ha sido eliminado correctamente!`);

                getLoan();
            }

        } catch (error) {
            window.electron.showNotification('Error',
                `El prestamo no se pudo eliminar, por favor intenta de nuevo.`);
        }
    })

})

const parsefromMXN = (string) => parseInt(string.replace(/[^\d.-]/g, ''));

const parseTOMXN = (number) => Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(number || 0);

const processFormInformation = async () => {
    // Prestamo Refinanciado
    const isRefinanciar = await window.db.getLoan({ userId: document.getElementById('idUser').value, status: 'Activo' });
    /* VALORES */
    const montoValue = parseFloat(document.getElementById('monto').value);
    const mesesValue = parseInt(document.getElementById('cantidadMeses').value);
    const interesValue = parseFloat(document.getElementById('interes').value);

    /* CÁLCULOS */

    const porcentaje = (interesValue * mesesValue) / 100;
    let totalPrestamoValue = 0;
    let prestamoIntereses = 0;

    if (isRefinanciar.length > 0) {

        document.getElementById('Capital').value = parseTOMXN(isRefinanciar[0].Total_Capital + (montoValue || 0));
        console.log(isRefinanciar[0].Total_Capital, montoValue, porcentaje);
        totalPrestamoValue = (isRefinanciar[0].Total_Capital + montoValue) + ((isRefinanciar[0].Total_Capital + montoValue) * porcentaje);
        prestamoIntereses = totalPrestamoValue - parsefromMXN(document.getElementById('Capital').value);
    } else {
        totalPrestamoValue = montoValue + (montoValue * porcentaje)
        prestamoIntereses = totalPrestamoValue - montoValue;
    }

    document.getElementById('interesesPrestamo').value = parseTOMXN(prestamoIntereses);

    const totalPrestamoRefinanciado = totalPrestamoValue;


    document.getElementById('totalPrestamo').value = isRefinanciar.length > 0 ? parseTOMXN(totalPrestamoRefinanciado) : parseTOMXN(totalPrestamoValue);

    const fechaValue = document.getElementById('fecha').value;

    return [fechaValue, isRefinanciar.length > 0 ? totalPrestamoRefinanciado : totalPrestamoValue];
}

const getLoan = async () => {

    const newLoan = await window.db.getLoan({ userId: document.getElementById('idUser').value, status: 'Activo' });
    console.log('newLoan', newLoan);
    
    if (newLoan.length > 0) {
        // Detail Loan
        document.getElementById('detailLoanSection').classList.add('visible')
        document.getElementById('detailLoanSection').classList.remove('hidden')
        //form new loan
        document.getElementById('formLoan').classList.remove('visible')
        document.getElementById('formLoan').classList.add('hidden')
        // form pay
        document.getElementById('pagosForm').classList.add('visible')
        document.getElementById('pagosForm').classList.remove('hidden')

        if (newLoan[0].Total_Capital < LIMIT_PRESTAMO && window.api.hasOneYearPassed(newLoan[0].Fecha_Inicio)) {
            // Refinanciar button 
            document.getElementById('refinanciarButton').classList.add('visible');
            document.getElementById('refinanciarButton').classList.remove('hidden')
        } else {
            document.getElementById('refinanciarButton').classList.add('hidden');
            document.getElementById('refinanciarButton').classList.remove('visible')
        }


        fillLoanDataUI(newLoan);
    } else {
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

    document.getElementById('idPrestamo').value = newLoan[0]?.ID || 0;
}

const getLoanPagados = async () => {
    const loansPagados = await window.db.getLoan({ userId: document.getElementById('idUser').value, status: 'Pagado' });
    console.log(loansPagados);
    if (loansPagados.length > 0) {

        document.getElementById('accordion-body-title-pagados').classList.remove('hidden');
        document.getElementById('accordion-body-title-pagados').classList.remove('visible');

        // Generar el HTML para la tabla
        let tableHTML = ``;

        // Recorrer los usuarios y agregar filas
        loansPagados.forEach((loan, index) => {
            tableHTML += `
            <div class="accordion-item">
                <button class="accordion-header-pagados" aria-expanded="false">Préstamo Pagado ${index + 1}</button>
                <div class="accordion-body">
                    <div class="section">
                        <div class="info-item">
                            <p><strong>Fecha de Inicio:</strong> ${window.api.formatDateToDisplay(loan.Fecha_Inicio)}</p>
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
                            <p><strong>Capital:</strong> ${parseTOMXN(loan.Total_Capital)}</p>
                        </div>
                    </div>
                    <div class="section">
                         <div class="info-item">
                            <p><strong>Número de Prestamo:</strong> ${loan.Numero_Prestamo}</p>
                        </div>
                        <div class="info-item">
                            <p><strong>Número de Cheque:</strong> ${loan.Numero_Cheque}</p>
                        </div>
                        <div class="info-item">
                            <p><strong>Fecha de Termino:</strong> ${window.api.formatDateToDisplay(loan.Fecha_Termino)}</p>
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
                        <tbody id="pays-table-body-pagados${loan.ID}">
                            <!-- Aquí se insertarán los usuarios dinámicamente -->
                        </tbody>
                        </table>
                        <div id="info"></div>
                    </div>
                </div>
            </div>
            `;

            generateTablePays(loan.ID, `pays-table-body-pagados${loan.ID}`, true);
        });


        // Insertar la tabla en el div con ID "info"
        const accordionBody = document.getElementById('accordion-body-pagado');
        accordionBody.innerHTML = tableHTML;

        // Acordeón
        document.querySelectorAll('.accordion-header-pagados').forEach(button => {
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
    } else {
        const accordionBody = document.getElementById('accordion-body-pagado');
        accordionBody.innerHTML = '';
    }

}

const getLoanRefinance = async () => {
    const loansRefinance = await window.db.getLoan({ userId: document.getElementById('idUser').value, status: 'Refinanciado' });
    console.log(loansRefinance,'refinance');
    
    if (loansRefinance.length > 0) {

        document.getElementById('prestamos-refinanciados-section').classList.remove('hidden');
        document.getElementById('prestamos-refinanciados-section').classList.remove('visible');

        // Generar el HTML para la tabla
        let tableHTML = ``;


        // Recorrer los usuarios y agregar filas
        loansRefinance.forEach((loan, index) => {
            tableHTML += `
            <div class="accordion-item">
                <button class="accordion-header-refinanciado" aria-expanded="false">Préstamo Refinanciado ${index + 1}</button>
                <div class="accordion-body">
                    <div class="section">
                        <div class="info-item">
                            <p><strong>Fecha de Inicio:</strong> ${window.api.formatDateToDisplay(loan.Fecha_Inicio)}</p>
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
                            <p><strong>Capital:</strong> ${parseTOMXN(loan.Total_Capital)}</p>
                        </div>
                    </div>
                    <div class="section">
                       <div class="info-item">
                            <p><strong>Número de Prestamo:</strong> ${loan.Numero_Prestamo}</p>
                        </div>
                        <div class="info-item">
                            <p><strong>Número de Cheque:</strong> ${loan.Numero_Cheque}</p>
                        </div>
                        <div class="info-item">
                            <p><strong>Fecha de Termino:</strong> ${window.api.formatDateToDisplay(loan.Fecha_Termino)}</p>
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

        });


        const accordionBody = document.getElementById('accordion-body-refinanciado');
        // Insertar la tabla en el div con ID "info"
        accordionBody.innerHTML = tableHTML;




        // Acordeón
        document.querySelectorAll('.accordion-header-refinanciado').forEach(button => {
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

        loansRefinance.forEach((loan, index) => {
            generateTablePays(loan.ID, `pays-table-body-refinance${loan.ID}`, true);
        });
    } else {
        const accordionBody = document.getElementById('accordion-body-refinanciado');
        accordionBody.innerHTML = '';
    }

}

const fillLoanDataUI = (loan) => {

    // Convertir la fecha inicial de formato dd/mm/aaaa a objeto Date
    const formattedDateDisplay = window.api.formatDateToDisplay(loan[0].Fecha_Inicio);
    const fechaPago = window.api.getDateAfterPays(formattedDateDisplay, loan[0].Pagos_Completados);
    document.getElementById('numero-prestamo-label').innerText = `${loan[0].Numero_Prestamo}`;
    document.getElementById('periodo').innerText = `${loan[0].Periodo} años`;
    document.getElementById('loan-numero-cheque').innerText = loan[0].Numero_Cheque;
    document.getElementById('fecha-inicio').innerText = window.api.formatDateToDisplay(loan[0].Fecha_Inicio);
    document.getElementById('fecha-termino').innerText = window.api.formatDateToDisplay(loan[0].Fecha_Termino);
    document.getElementById('fecha-pago').innerText = fechaPago;
    document.getElementById('loan-amount').innerText = parseTOMXN(loan[0].Monto);
    document.getElementById('loan-interest').innerText = `${loan[0].Interes}% mensual`;
    document.getElementById('loan-interest-ammount').innerText = `${parseTOMXN(loan[0].TotalPrestamo_Intereses)}`;
    document.getElementById('loan-total').innerText = parseTOMXN(loan[0].TotalPrestamo);
    document.getElementById('loan-abono').innerText = parseTOMXN(loan[0].Abono);
    document.getElementById('loan-saldo').innerText = parseTOMXN(loan[0].Saldo);
    document.getElementById('loan-capital').innerText = parseTOMXN(loan[0].Total_Capital)
    document.getElementById('loan-status').innerText = loan[0].EstadoPrestamo;
    document.getElementById('loan-payments').innerText = loan[0].Pagos_Completados;
    document.getElementById('loan-catorcenas').innerText = loan[0].No_Catorcenas;
    document.getElementById('loan-ultima-catorcena').innerText = parseTOMXN(loan[0].Ultimo_Abono);

    document.getElementById('periodoCatorcenal').value = loan[0].Pagos_Completados + 1;
    document.getElementById('fechaPagoCatorcena').value = fechaPago;

    generateTablePays(loan[0].ID, 'user-table-body-pays');

    if (loan[0].Resto_Abono > 0) {
        document.getElementById('restanteAbonoSection').classList.add('visible');
        document.getElementById('restanteAbonoSection').classList.remove('hidden');
        document.getElementById('restanteAbono').value = parseTOMXN(loan[0].Resto_Abono);
    } else {
        document.getElementById('restanteAbonoSection').classList.add('hidden');
        document.getElementById('restanteAbonoSection').classList.remove('visible');
        document.getElementById('restanteAbono').value = 0;
    }
}

function regexDate(fechaValue, totalPrestamoValue) {
    const dateRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
    if (dateRegex.test(fechaValue)) {
        console.log("Valid date format");
        const dates = generateSecondFridays(fechaValue, parseInt(document.getElementById('noAnios').value) * 26)
        document.getElementById('tablePagos').classList.remove('hidden');
        document.getElementById('tablePagos').classList.add('visible');

        document.getElementById('noCatorcenas').value = dates.length;
        const abono = parseTOMXN(parseInt(totalPrestamoValue / dates.length) + 1);
        document.getElementById('abono').value = abono;


        const differenceLastPay = (parsefromMXN(abono) * dates.length) - totalPrestamoValue;

        document.getElementById('fecha-termino-input').value = dates[dates.length - 1] || 'N/A';

        generateTableCatorcena(dates, document.getElementById('abono').value, differenceLastPay);

    } else {
        console.log("Invalid date format");
    }
}

function generateSecondFridays(startDate, count) {
    const dates = [];

    // Convertir la fecha inicial de formato dd/mm/aaaa a objeto Date
    const [startDay, startMonth, startYear] = startDate.split('/').map(Number);
    let currentDate = new Date(startYear, startMonth - 1, startDay);

    // Generar las fechas sumando exactamente 14 días cada vez
    for (let i = 0; i < count; i++) {
        // Formatear la fecha como dd/mm/aaaa
        const formattedDate = currentDate.toLocaleDateString("es-MX", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });

        dates.push(formattedDate);
        currentDate.setDate(currentDate.getDate() + 14); // Sumar 14 días exactos
    }

    return dates;
}

const generateTableCatorcena = (dates, pay, differenceLastPay) => {
    const numberPays = dates.length;
    console.log(differenceLastPay);
    // Verificar si hay usuarios
    if (dates.length > 0) {
        // Generar el HTML para la tabla
        let tableHTML = ``;

        // Recorrer los usuarios y agregar filas
        dates.forEach((date, index) => {
            if (index != numberPays - 1) {
                tableHTML += `
                    <tr>
                            <td>${index + 1}</td>
                            <td>${date}</td>
                            <td>${pay}</td>
                     
                    </tr>
                `;
            } else {
                tableHTML += `
                <tr>
                        <td>${index + 1}</td>
                        <td>${date}</td>
                        <td>${parseTOMXN(parsefromMXN(pay) - differenceLastPay)}</td>
                 
                </tr>
                `;
                document.getElementById('last-pay').innerText = parseTOMXN(parsefromMXN(pay) - differenceLastPay);
            }
        });

        tableHTML += '</tbody></table>';

        // Insertar la tabla en el div con ID "info"
        const infoDiv = document.getElementById('user-table-body');
        infoDiv.innerHTML = tableHTML;
    }
}

const generateTablePays = async (idPrestamo, idTable, isShowOldLoans = false) => {

    const { pagos } = await window.db.getPayments(idPrestamo);


    // Verificar si hay usuarios
    if (pagos.length > 0) {
        // Generar el HTML para la tabla
        let tableHTML = ``;

        // Recorrer los usuarios y agregar filas
        pagos.forEach((pago, index) => {
            tableHTML += `
            <tr>
                <td>${pago.Periodo_Catorcenal}</td>
                <td>${window.api.formatDateToDisplay(pago.Fecha_Catorcena, 0)}</td>
                <td>${window.api.formatDateToDisplay(pago.Fecha_Pago, 0)}</td>
                <td>${parseTOMXN(pago.Monto_Pago)}</td>
                <td>${parseTOMXN(pago.Monto_Pago_Capital)}</td>
                <td>${parseTOMXN(pago.Monto_Pago_Intereses)}</td>
                <td>${pago.Metodo_Pago}</td>
                <td>${parseTOMXN(pago.Saldo_Actual)}</td>
                ${!isShowOldLoans ? `
                <td>
                    <button type="button" class="button-delete" id="addButton" onclick="deletePay(${pago.ID})">X</button>
                </td>
                `: ''}
               
            </tr>
        `;
        });

        /*     <td>
            <button class="button-delete" id="deleteButton" onclick="deletePay(${pago.ID})">Eliminar</button>
            </td> */

        tableHTML += '</tbody></table>';

        // Insertar la tabla en el div con ID "info"
        console.log(idTable);
        const infoDiv = document.getElementById(idTable);
        infoDiv.innerHTML = tableHTML;

        const tablePagosPrestamos = document.getElementById('tablePagosPrestamos');

        tablePagosPrestamos.classList.remove('hidden');
        tablePagosPrestamos.classList.add('visible');
    }
}

const deletePay = async (idPay) => {

    const confirmDelete = confirm('¿Estás seguro que deseas eliminar este prestamo? Esta acción no se puede deshacer.');

    if(!confirmDelete) return;
    const response = await window.db.removePayment(idPay);

    if (response) {
        generateTablePays(document.getElementById('idPrestamo').value, 'user-table-body-pays');
        getLoan()
        const tablePagosPrestamos = document.getElementById('tablePagosPrestamos');
        tablePagosPrestamos.classList.remove('visible');
        tablePagosPrestamos.classList.add('hidden');
    }
}

const formatDateForModel = (dateString) => {
    if (!dateString) {
        throw new Error("La fecha no puede estar vacía.");
    }

    const parts = dateString.split('/');
    if (parts.length !== 3) {
        throw new Error("El formato de fecha debe ser dd/mm/aaaa.");
    }

    const [day, month, year] = parts;

    // Validar que día, mes y año son numéricos
    if (isNaN(day) || isNaN(month) || isNaN(year)) {
        throw new Error("El día, mes o año no son válidos.");
    }

    // Validar valores de día, mes y año
    if (+day < 1 || +day > 31 || +month < 1 || +month > 12 || +year < 1000) {
        throw new Error("El rango de día, mes o año no es válido.");
    }

    // Crear un objeto Date en UTC y ajustar a CST (UTC-6)
    const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0)); // Mes es 0-indexado
    date.setUTCHours(date.getUTCHours() + 6); // Ajuste a CST

    // Retornar en formato aaaa-mm-dd con horario CST
    const formattedDate = date.toISOString().replace('T', ' ').split('.')[0];

    return `${formattedDate} -06:00`;
};





