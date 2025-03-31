const regexYearRange = /^(19|20)\d{2}$/;

document.addEventListener('DOMContentLoaded', async () => {

    const fechaActual = new Date();
    const year = fechaActual.getFullYear();
    const month = fechaActual.getMonth() + 1;

    document.getElementById('mes-search-prestamo').value = month;
    document.getElementById('search-date-year-prestamo').value = year;

    const response = await window.db.getLoanReportByMonth({month, year})

    console.log('Reporte prestamos',response);

    if(response){
        generateTablePrestamos(response);
    }

    const mesFilterPrestamo = document.getElementById('mes-search-prestamo');


    mesFilterPrestamo.addEventListener('change', async() =>{
        search();
    })

    const yearFilterPrestamo = document.getElementById('search-date-year-prestamo');

    yearFilterPrestamo.addEventListener("keyup", () =>{
        search();
    })
    


 });

 const search = async() =>{
     
    const mesFilterPrestamo = document.getElementById('mes-search-prestamo').value;
    const yearFilterPrestamo = document.getElementById('search-date-year-prestamo').value;
    console.log(mesFilterPrestamo, yearFilterPrestamo);

    if(regexYearRange.test(yearFilterPrestamo)){
        const response = await window.db.getLoanReportByMonth({month: mesFilterPrestamo, year: yearFilterPrestamo})

        console.log('Reporte prestamos',response);
    
        if(response){
            generateTablePrestamos(response);
        }
    }
 }


 const generateTablePrestamos = async (prestamos) => {

    // Verificar si hay préstamos
    if (prestamos.length > 0) {
        // Generar el HTML para la tabla
        let tableHTML = '';
        //processInformation(loans)
        // Recorrer los préstamos y agregar filas
        let counter =1;

        let montoTotal = 0;
        let montoTotalPrestamo = 0;
        for (const prestamo of prestamos) {
            try {
                tableHTML += `
                    <tr>
                        <td>${counter}</td>
                        <td>${prestamo.Usuario.Nombre}</td>
                        <td>${prestamo.Usuario.Apellido_Paterno}</td>
                        <td>${prestamo.Usuario.Apellido_Materno}</td>
                        <td>${prestamo.Cantidad_Meses}</td>
                        <td>${parseTOMXN(prestamo.Monto)}</td>
                        <td>${window.api.formatDateToDisplay(prestamo.Fecha_Inicio)}</td>
                        <td>${window.api.formatDateToDisplay(prestamo.Fecha_Termino)}</td>
                        <td>${parseTOMXN(prestamo.TotalPrestamo_Intereses)}</td>
                        <td>${prestamo.Numero_Cheque}</td>
                        <td>${ prestamo.Usuario.Fecha_De_Nacimiento }</td>
                        <td>${prestamo.Usuario.CURP}</td>
                        <td>${prestamo.Usuario.RFC}</td>
                        <td>${prestamo.Usuario.Nacionalidad}</td>
                        <td>${prestamo.Usuario.Domicilio.CodigoPostal}</td>
                        <td>${prestamo.Usuario.Domicilio.Colonia}</td>
                        <td>${prestamo.Usuario.Domicilio.Calle}</td>
                        <td>${prestamo.Usuario.Domicilio.Numero}</td>
                        <td>${prestamo.Usuario.Correo_Electronico}</td>
                    </tr>
                `;
                counter++;
            } catch (error) {
                console.error(`Error al crear la tabla`, error);
            }

            montoTotal += prestamo.Monto;
            montoTotalPrestamo += prestamo.TotalPrestamo_Intereses; 
        
        }
        console.log(montoTotal);
        
        document.getElementById('monto-total-prestamos').textContent = parseTOMXN(montoTotal);
        document.getElementById('monto-total-intereses-prestamos').textContent = parseTOMXN(montoTotalPrestamo);

        // Insertar la tabla en el div con ID "loans-table-body"
        const infoDiv = document.getElementById('loans-monthly-table-body');
        infoDiv.innerHTML = tableHTML;
        document.getElementById('info').innerText = '';
    } else {
        const infoDiv = document.getElementById('loans-monthly-table-body');
        infoDiv.innerHTML = '';
        // Mostrar mensaje si no hay préstamos
        document.getElementById('infoPays').innerText = 'No se encontraron pagos.';
    }
};
 