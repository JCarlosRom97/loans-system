const { ipcRenderer } = require('electron');
const yearRegex = /^(19|20)\d{2}$/;

document.addEventListener('DOMContentLoaded', () => {

    // Obtener la fecha actual
    const fechaActual = new Date();

    // Obtener el mes actual (0-11, donde 0 es enero y 11 es diciembre)
    const mesActual = fechaActual.getMonth()+1;

    // Obtener el año actual
    const anioActual = fechaActual.getFullYear();


    document.getElementById('mes').value = mesActual;

    document.getElementById('year').value = anioActual; 

    console.log(mesActual, anioActual);
    

    closeButtonListener();
    getChequesGastos(mesActual, anioActual)

    const formGastos = document.getElementById('form-gastos');
  
    formGastos.addEventListener('submit', async(e) => {
      e.preventDefault();

      const tipo = document.getElementById('tipo').value;
      
      if(tipo == "Cheque"){
        const newChequeData = {
            No_Cheque: document.getElementById('no-cheque').value,
            Nombre: document.getElementById('nombre').value,
            Motivo: document.getElementById('motivo').value,
            Fecha: formatDateForModel(document.getElementById('fecha').value),
            Monto: document.getElementById('monto').value,
        };

        try {
            const newChequeResponse = await ipcRenderer.invoke('db:addCheque', newChequeData);

            if(newChequeResponse){
                alert('El cheque ha sido registrado correctamente!')
                formGastos.reset()
                getChequesGastos(document.getElementById('mes').value, document.getElementById('year').value)
            }
        } catch (error) {
            console.error(error)
        }
     
      }else{
        const newGastoData = {
            No_Cheque: document.getElementById('no-cheque').value,
            Tipo: document.getElementById('tipo').value,
            Fecha: formatDateForModel(document.getElementById('fecha').value),
            Monto: document.getElementById('monto').value,
        };

        try {
            const newGastoResponse = await ipcRenderer.invoke('db:addGasto', newGastoData);

            if(newGastoResponse){
                alert('El gasto ha sido registrado correctamente!')
                formGastos.reset()
                getChequesGastos(document.getElementById('mes').value, document.getElementById('year').value)
            }
        } catch (error) {
            console.error(error)
        }
      }
  
    });

    const mesFilter = document.getElementById('mes');

    mesFilter.addEventListener('change', ()=>{
        const mesFilter = document.getElementById('mes').value;
        const yearFilterValue = document.getElementById('year').value;
        console.log(mesFilter, yearFilter);

        if (yearRegex.test(yearFilterValue)) {
            // Solo ejecutamos si ambos filtros tienen valores válidos
            if (mesFilter && yearFilterValue) {
                getChequesGastos(mesFilter, yearFilterValue);
            }
        } else {
            console.error('Año inválido. Debe ser un año entre 1900-2099 en formato YYYY');
            // Opcional: Mostrar mensaje al usuario
            // alert('Por favor ingrese un año válido entre 1900 y 2099');
        }
        
    })

    const yearFilter = document.getElementById('year');

    yearFilter.addEventListener('change', () => {
        const mesFilter = document.getElementById('mes').value;
        const yearFilterValue = document.getElementById('year').value;
        console.log(mesFilter, yearFilterValue);
        
        if (yearRegex.test(yearFilterValue)) {
            // Solo ejecutamos si ambos filtros tienen valores válidos
            if (mesFilter && yearFilterValue) {
                getChequesGastos(mesFilter, yearFilterValue);
            }
        } else {
            console.error('Año inválido. Debe ser un año entre 1900-2099 en formato YYYY');
            // Opcional: Mostrar mensaje al usuario
            // alert('Por favor ingrese un año válido entre 1900 y 2099');
        }
    });



    const selectTipo = document.getElementById('tipo');

    selectTipo.addEventListener('change', (e) =>{
        e.preventDefault();
        const tipo = document.getElementById('tipo').value;
        const inputMotivo = document.getElementById('motivo');
        const inputNombre = document.getElementById('nombre');
        if(tipo == "Cheque"){
            document.getElementById('nombre-input-section').style.display ='flex';
            document.getElementById('motivo-input-section').style.display ='flex';
            inputMotivo.setAttribute('required', '');
            inputNombre.setAttribute('required', '');
        }else{
            document.getElementById('nombre-input-section').style.display ='none';
            document.getElementById('motivo-input-section').style.display ='none';
            inputMotivo.removeAttribute('required');
            inputNombre.removeAttribute('required');
        }
        
    })
});


const closeButtonListener = () =>{
    const closeModalButton = document.getElementById('close-modal');

    if (closeModalButton) {
        closeModalButton.addEventListener('click', async () => {
            console.log('Intentando cerrar el modal...');
            try {
                ipcRenderer.invoke('modalCheque:close');
                if (response.success) {
                    console.log('Modal cerrado correctamente:', response.message);
                } else {
                    console.error('Error al cerrar el modal:', response.message);
                }
            } catch (err) {
                console.error('Error al cerrar el modal:', err);
            }
        });
    } else {
        console.error('No se encontró el botón de cerrar modal');
    }
}

const getChequesGastos = async(mesActual, anioActual) =>{
    const Cheques = await ipcRenderer.invoke('db:getCheques',{mes:mesActual, year:anioActual});
    const Gastos = await ipcRenderer.invoke('db:getGastos',{mes:mesActual, year:anioActual})
    console.log(Cheques, Gastos);

    const gastosCheques = orderDataTable(Cheques, Gastos);
    console.log('gastosCheques', gastosCheques);
    
    // Verificar si hay usuarios
    if (gastosCheques.length > 0) {
    // Generar el HTML para la tabla
    let tableHTML = ``;

    // Recorrer los usuarios y agregar filas
    gastosCheques.forEach((gastos, index) => {

    tableHTML += `
        <tr>
            <td>${index + 1}</td>
            <td>${formatDateToDisplay(gastos.Fecha, 0)}</td>
            <td>${gastos.No_Cheque || "N/A"}</td>
            <td>${gastos.Tipo.replace(/([a-z0-9])([A-Z])/g, '$1 $2')}</td>
            <td>${gastos.Nombre || "N/A"}</td>
            <td>${gastos.Motivo || "N/A"}</td>
            <td>${parseTOMXN(gastos.Monto)}</td>
            <td>
                <button type="button" class="button-delete" data-id="${gastos.ID}">X</button>
            </td>

            
        </tr>
    `;
    });



        tableHTML += '</tbody></table>';


        const table = document.getElementById('user-table-body-cheques');
        table.innerHTML = tableHTML;

        document.querySelectorAll('.button-delete').forEach(button => {
            button.addEventListener('click', async function () {
                const chequeId = this.getAttribute('data-id'); // Obtener el ID del cheque
                await deleteCheque(chequeId);
            });
        });

        const infoDiv = document.getElementById('info');
        infoDiv.innerHTML = ''

    }else{
        const infoDiv = document.getElementById('info');
        infoDiv.innerHTML = 'No se encontraron gastos. '

        const table = document.getElementById('user-table-body-cheques');
        table.innerHTML = '';
    }
}

const deleteCheque = async(id) =>{
    console.log(id);
    const responseDeleteCheque = await ipcRenderer.invoke('db:deleteCheque', id);
    if(responseDeleteCheque.success){
        alert('Cheque Eliminado Correctamente!')
        getChequesGastos(document.getElementById('mes').value, document.getElementById('year').value);
    }
}

const orderDataTable = (cheques, gastos) =>{
    // 1. Agregar Tipo: "Cheque" a cada objeto en el array de cheques
    const chequesConTipo = cheques.map(cheque => ({
        ...cheque,
        Tipo: "Cheque"
    }));

    // 2. Unir los arrays (cheques con tipo + gastos)
    const todosLosRegistros = [...chequesConTipo, ...gastos];

    // 3. Ordenar por fecha (más reciente primero)
    const registrosOrdenados = todosLosRegistros.sort((a, b) => {
        return new Date(b.Fecha) - new Date(a.Fecha);
    });

    return registrosOrdenados;
}

const parseTOMXN = (number) => Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(number || 0);

const formatDateToDisplay = (dateInput) => {

if (!dateInput) {
    throw new Error("La fecha no puede estar vacía.");
}

const date = new Date(dateInput);

if (isNaN(date.getTime())) {
    throw new Error("Formato de fecha no válido.");
}

const day = String(date.getDate()).padStart(2, '0'); // Día con dos dígitos
const month = String(date.getMonth() + 1).padStart(2, '0'); // Mes con dos dígitos (0 indexado)
const year = date.getFullYear(); // Año completo

return `${day}/${month}/${year}`;
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

