var idUser = null;
document.addEventListener('DOMContentLoaded', async() => {
    
    const params = new URLSearchParams(window.location.search);
    idUser = params.get('idUsuario');
    console.log(idUser);

    const idAhorro = await getSavingInfo();

    const user = await window.db.getUser(idUser);

    document.getElementById('Nombre').innerText = `${user.Nombre} ${user.Apellido_Paterno} ${user.Apellido_Materno} `;
    document.getElementById('cuenta_contable_ahorro').innerText = `${user.CTA_CONTABLE_AHORRO} `;

    console.log(user);

    fetchAndDisplaySavings(idAhorro);

    const formSavings = document.getElementById("formSavings");

    formSavings.addEventListener("submit",async(event)=>{
        event.preventDefault();
        const typeTransaction = document.getElementById('selectTypeTransaction').value; 
        const amount = document.getElementById("amount").value;
        const medioPago = 'Cheque';
        const fecha = document.getElementById('fecha').value;
        const numeroCheque = typeTransaction =="Desahogo" ?
         document.getElementById('numero-cheque').value:
         "";

        const saveObject = {
            idUsuario: idUser,
            Numero_Cheque: numeroCheque,
            monto: amount,
            tipo: typeTransaction,
            medioPago,
            Fecha: window.api.formatDateForModel(fecha)
        }

        console.log(saveObject);

          // Add the user to the database via the main process
        try {
            const newSaving = await window.db.addSavings(saveObject);
            console.log('Saving added:', newSaving);
            
        
            if(newSaving){
                // Show Notification
                if(newSaving.TipoTransaccion === 'Deposito'){
                    window.electron.showNotification('Ahorro Agregado', 
                    `El ahorro ha sido exitosamente añadido a su cuenta!`);
                }else{
                    window.electron.showNotification('Retiro Exitoso', 
                    `El ahorro ha sido exitosamente retirado de su cuenta!`);
                }

                formSavings.reset();
                const idAhorro = await getSavingInfo();
                fetchAndDisplaySavings(idAhorro);
        
            }
           

        } catch (error) {
            console.log(error.message);
       
            if (error.message === "Fondos insuficientes para retirar.") {
                window.electron.showNotification("Fondos Insuficientes", 
                `Fondos insuficientes para retirar.`);
            } else {
                window.electron.showNotification("Error", 
                `Ha ocurrido un error. Intenta nuevamente.`);
            }
            
        } finally {
            isSubmitting = false; // Reset flag after the operation completes
        }
    })

    const selectTransaction = document.getElementById('selectTypeTransaction');

    selectTransaction.addEventListener("change", () =>{
        const selectTransactionValue = document.getElementById('selectTypeTransaction').value;
        if (selectTransactionValue == "Ahorro") {
            let inputCheque = document.getElementById("numero-cheque");
            inputCheque.hidden = true;
            inputCheque.removeAttribute("required"); // Eliminar 'required' al ocultar
        } else if (selectTransactionValue == "Desahogo") {
            let inputCheque = document.getElementById("numero-cheque");
            inputCheque.removeAttribute("hidden");
            inputCheque.setAttribute("required", ""); // Volver a agregar 'required' al mostrar
        }
    })


});

// Función para obtener y mostrar los usuarios en una tabla
async function fetchAndDisplaySavings(idAhorro) {
    try {
        console.log(idAhorro);
        const savings = await window.db.getSavings(idAhorro);
        // Verificar si hay usuarios
        if (savings.length > 0) {
            // Generar el HTML para la tabla
            let tableHTML = ``;
    
            // Recorrer los usuarios y agregar filas
            savings.forEach(saving => {
                console.log(saving);
            tableHTML += `
                <tr>
                    <td>${window.api.formatDateToDisplay(saving.Fecha, 0)}</td>
                    <td>${saving.Numero_Cheque || 'N/A'}</td>
                    <td>${saving.TipoTransaccion}</td>
                    <td>${saving.TipoTransaccion =='Ahorro'? `<span class="more-green">+</span> ${Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(saving.Monto)}`: 
                    `<span class="less-red">-</span> ${Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(saving.Monto)}` }</td>
                    <td>${saving.MedioPago || 'N/A'}</td>
                    <td>
                        <button class="delete-btn" id="${saving.ID}" onclick="deleteTransaction(${saving.ID})"  >Eliminar</button>
                    </td>
                </tr>
            `;
            });
    
            tableHTML += '</tbody></table>';
    
            // Insertar la tabla en el div con ID "info"
            const infoDiv = document.getElementById('saving-table-body');
            infoDiv.innerHTML = tableHTML;
            document.getElementById('infoTable').innerText = '';
   
        } else {
            const infoDiv = document.getElementById('saving-table-body');
            infoDiv.innerHTML = "";
            // Mostrar mensaje si no hay usuarios
            document.getElementById('infoTable').innerText = 'No se encontraron registros.';
        }
        } catch (error) {
        // Manejar errores
        console.error('Error al obtener usuarios:', error);
        document.getElementById('infoTable').innerText = 'Error al cargar los registros.';
    }
}


async function getSavingInfo () {
    console.log(idUser);
    const dataSaving = await window.db.getAmmountSaving(idUser);

    console.log('dataSaving', dataSaving);

    document.getElementById('totalAmount').innerText = `${Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(dataSaving?.Monto || 0)}`;

    return dataSaving?.ID;
}

async function deleteTransaction (idUser) {
    console.log(idUser);
    const deletedSaving = await window.db.removeSavingTransaction(idUser);
    console.log(deletedSaving);
    const idAhorro = await getSavingInfo();
    fetchAndDisplaySavings(idAhorro)
}