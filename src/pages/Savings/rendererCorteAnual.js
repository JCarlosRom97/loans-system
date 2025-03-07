var idUser = null;
document.addEventListener('DOMContentLoaded', ()=>{


    const params = new URLSearchParams(window.location.search);
    idUser = params.get('idUsuario');


    const interesesCheck = document.getElementById('intereses-anuales-check');
    // Corte anual show hide component
    interesesCheck.addEventListener("change", async(e) =>{
        e.preventDefault();
        const interesesCheckValue =  document.getElementById('intereses-anuales-check');
        if(interesesCheckValue.checked){
            formCorteAhorro.style.display = 'block';
            const {totalAhorro} = await window.db.getTotalSavingCorte({userId:idUser, year:new Date().getFullYear()-1});
            document.getElementById('monto-ahorro').value = parseTOMXN(totalAhorro);
            document.getElementById('total-multa-ahorro').value = parseTOMXN(totalAhorro);
            document.getElementById('year-ahorro').value = new Date().getFullYear()-1;

            const {ID} = await window.db.getAmmountSaving(idUser);

            const responseSaldos = await window.db.getAhorroSaldoById(ID);

            fetchAndDisplaySaldos(responseSaldos);
        }else{
            formCorteAhorro.style.display = 'none';
        }     
    })

    const formCorteAhorro = document.getElementById('form-intereses-anuales');
    if (formCorteAhorro) {
        formCorteAhorro.style.display = 'none';
    }

    formCorteAhorro.addEventListener('submit', async(e) =>{
        e.preventDefault();

        const percentage = document.getElementById('interes-prestamo-acumulado').value /100;
        const Monto_Generado  = parsefromMXN(document.getElementById('total-multa-ahorro').value) * percentage;

        console.log(Monto_Generado);

        const corteData = {
            ID_Usuario:parseInt(idUser), 
            saveCorteAhorro: parsefromMXN(document.getElementById('monto-ahorro').value), 
            Periodo: document.getElementById('year-ahorro').value, 
            Multa: parseInt(document.getElementById('multa-ahorro').value),
            SubTotal: parsefromMXN(document.getElementById('total-multa-ahorro').value),
            Interes: parseInt(document.getElementById('interes-prestamo-acumulado').value), 
            Total: parsefromMXN(document.getElementById('total-ahorro').value),
            Monto_Generado
        }

        console.log(corteData);

      
        const responseCorte = await window.db.saveCorteAhorro(corteData)

        console.log(responseCorte);

        if(responseCorte){
            
            window.electron.showNotification('Corte Exitoso', 
            `El corte anual ha sido exitosamente ingresado de la cuenta!`);
            

            formCorteAhorro.reset();
            const {ID}  = await getSavingInfo();
            fetchAndDisplaySavings(ID);

            const {totalAhorro} = await window.db.getTotalSavingCorte({userId:idUser, year:new Date().getFullYear()-1});
            document.getElementById('monto-ahorro').value = parseTOMXN(totalAhorro);
            document.getElementById('year-ahorro').value = new Date().getFullYear()-1;

            const responseSaldos = await window.db.getAhorroSaldoById(ID);

            fetchAndDisplaySaldos(responseSaldos);
        }
    })


    const yearAhorroCorte = document.getElementById('year-ahorro');

    yearAhorroCorte.addEventListener('keyup', async(e) =>{
        e.preventDefault();
        const yearAhorroCorteValue = document.getElementById('year-ahorro').value;
        if(regexDate(yearAhorroCorteValue)){
            generateCorteInformation(yearAhorroCorteValue)
        }
    

    })

    const interesAhorroCorte = document.getElementById('interes-prestamo-acumulado');

    interesAhorroCorte.addEventListener('keyup', (e) =>{
        e.preventDefault();
        const yearAhorroCorteValue = document.getElementById('year-ahorro').value;
        if(regexDate(yearAhorroCorteValue) ){
            generateCorteInformation(yearAhorroCorteValue)
        }
    })

    const multaInput = document.getElementById('multa-ahorro');

    multaInput.addEventListener('keyup', (e) =>{
        const multa = document.getElementById('multa-ahorro').value;
        const ahorro = parsefromMXN(document.getElementById('monto-ahorro').value);
        if(multa ==""){
            document.getElementById('total-multa-ahorro').value  = parseTOMXN(ahorro)
            return
        }

        document.getElementById('total-multa-ahorro').value = 
        parseTOMXN(parseInt(ahorro) - parseInt(multa)); 
    })

})

async function generateCorteInformation (year){
    const {totalAhorro} = await window.db.getTotalSavingCorte({userId:idUser, year});
    const multa = document.getElementById('total-multa-ahorro').value;
    const percentage = document.getElementById('interes-prestamo-acumulado').value /100;
    const total = parsefromMXN(multa);

    document.getElementById('monto-ahorro').value = parseTOMXN(totalAhorro);
    document.getElementById('total-ahorro').value  = parseTOMXN( total+(total*percentage));
}

function regexDate (fechaValue){
    const dateRegex = /^\d{4}$/;
    return dateRegex.test(fechaValue);
}

const parsefromMXN = (string) => parseInt(string.replace(/[^\d.-]/g, ''));

const parseTOMXN = (number) => Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(number || 0);


// Función para obtener y mostrar los usuarios en una tabla
async function fetchAndDisplaySaldos(saldos) {
    try {

        if (saldos.length > 0) {
            // Generar el HTML para la tabla
            let tableHTML = ``;
            // Recorrer los usuarios y agregar filas
            saldos.forEach(saving => {
              
            tableHTML += `
                <tr>
                    <td>${saving.Periodo}</td>
                    <td>${parseTOMXN(saving.Ahorro)}</td>
                    <td><span class="less-red">- ${parseTOMXN(saving.Multa)}</span></td>
                    <td>${parseTOMXN(saving.SubTotal)}</td>
                    <td>${saving.Interes}%</td>
                    <td>${parseTOMXN(saving.TotalGenerado)}</td>
                    <td>${parseTOMXN(saving.Total)}</td>
                </tr>
            `;
            });
    
            tableHTML += '</tbody></table>';
    
            // Insertar la tabla en el div con ID "info"
            const infoDiv = document.getElementById('saving-saldo-table-body');
            infoDiv.innerHTML = tableHTML;
            document.getElementById('info-table-saldo').innerText = '';
   
        } else {
            const infoDiv = document.getElementById('saving-saldo-table-body');
            infoDiv.innerHTML = "";
            // Mostrar mensaje si no hay usuarios
            document.getElementById('info-table-saldo').innerText = 'No se encontraron cortes.';
        }
        } catch (error) {
        // Manejar errores
        console.error('Error al obtener usuarios:', error);
        document.getElementById('info-table-saldo').innerText = 'Error al cargar los cortes.';
    }
}
