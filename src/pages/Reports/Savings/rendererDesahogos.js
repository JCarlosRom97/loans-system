const regexYearRange = /^(19|20)\d{2}$/;
document.addEventListener('DOMContentLoaded', async () => {
    const fechaActual = new Date();
    const year = fechaActual.getFullYear();

    document.getElementById('anio-desahogos').value = year;

    const responseAhorroDesahogo = await window.db.getAllSavingsTransactionsDesahogoReport({NombreCompleto: "", Anio: year })
    console.log('responseAhorroDesahogo', responseAhorroDesahogo);

    if(responseAhorroDesahogo){
        generateTableDesahogo(responseAhorroDesahogo);
    }

    const yearFilterPrestamo = document.getElementById('anio-desahogos');

    yearFilterPrestamo.addEventListener("keyup", () =>{
        search();
    })

    const nameFilterPrestamo = document.getElementById('name-desahogos');

    nameFilterPrestamo.addEventListener("keyup", () =>{
        search();
    })

    
})

const search = async() =>{
     
    const yearFilterPrestamo = document.getElementById('anio-desahogos').value;
    const nameFilterPrestamo = document.getElementById('name-desahogos').value
    console.log(nameFilterPrestamo, yearFilterPrestamo);

    if(regexYearRange.test(yearFilterPrestamo)){
        const responseAhorroDesahogo = await window.db.getAllSavingsTransactionsDesahogoReport({NombreCompleto: nameFilterPrestamo, Anio: yearFilterPrestamo })

        console.log('Reporte prestamos',responseAhorroDesahogo);
    
        if(responseAhorroDesahogo){
            generateTableDesahogo(responseAhorroDesahogo);
        }
    }
 }


const generateTableDesahogo = async (desahogos) => {

    // Verificar si hay préstamos
    if (desahogos.length > 0) {
        // Generar el HTML para la tabla
        let tableHTML = '';
        //processInformation(loans)
        // Recorrer los préstamos y agregar filas
        let counter =1;

        let montoTotal = 0;
        for (const desahogo of desahogos) {
            try {
                tableHTML += `
                    <tr>
                        <td>${counter}</td>
                        <td>${desahogo.codigoEmpleado}</td>
                        <td>${desahogo.nombreCompleto}</td>
                        <td>${desahogo.cantidadDesahogos}</td>
                         <td>${parseTOMXN(desahogo.totalDesahogado)}</td>
                    </tr>
                `;
                counter++;
            } catch (error) {
                console.error(`Error al crear la tabla`, error);
            }

            montoTotal += desahogo.totalDesahogado;

        
        }
        console.log(montoTotal);
        
        document.getElementById('monto-total-prestamos-desahogo').textContent = parseTOMXN(montoTotal);
       
        // Insertar la tabla en el div con ID "loans-table-body"
        const infoDiv = document.getElementById('savings-desahogo-table-body');
        infoDiv.innerHTML = tableHTML;
        document.getElementById('info-desahogos').innerText = '';
    } else {
        const infoDiv = document.getElementById('savings-desahogo-table-body');
        infoDiv.innerHTML = '';
        // Mostrar mensaje si no hay préstamos
        document.getElementById('info-desahogos').innerText = 'No se encontraron usuarios.';

        document.getElementById('monto-total-prestamos-desahogo').textContent = parseTOMXN(0);
    }
};