const { ipcRenderer } = require('electron');


document.addEventListener('DOMContentLoaded', () => {
    console.log('Loaded!');

    closeButtonListener();
    getCheques()
    const formCheque = document.getElementById('form-cheque');
  
    formCheque.addEventListener('submit', async(e) => {
      e.preventDefault();
  
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
            formCheque.reset()
            getCheques()
        }
      } catch (error) {
        console.error(error)
      }
    });
});


const closeButtonListener = () =>{
    const closeModalButton = document.getElementById('close-modal');
    console.log(closeModalButton);
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

const getCheques = async() =>{
    const Cheques = await ipcRenderer.invoke('db:getCheques');
    console.log(Cheques);

    // Verificar si hay usuarios
    if (Cheques.length > 0) {
    // Generar el HTML para la tabla
    let tableHTML = ``;

    // Recorrer los usuarios y agregar filas
    Cheques.forEach((cheque, index) => {
        console.log(cheque);
    tableHTML += `
        <tr>
            <td>${index + 1}</td>
            <td>${cheque.No_Cheque}</td>
            <td>${cheque.Nombre}</td>
            <td>${cheque.Motivo}</td>
            <td>${formatDateToDisplay(cheque.Fecha, 0)}</td>
            <td>${parseTOMXN(cheque.Monto)}</td>
            <td>
                <button type="button" class="button-delete" data-id="${cheque.ID}">X</button>
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
        infoDiv.innerHTML = 'No se encontraron cheques. '

        const table = document.getElementById('user-table-body-cheques');
        table.innerHTML = '';
    }
}

const deleteCheque = async(id) =>{
    console.log(id);
    const responseDeleteCheque = await ipcRenderer.invoke('db:deleteCheque', id);
    if(responseDeleteCheque.success){
        alert('Cheque Eliminado Correctamente!')
        getCheques();
    }
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

