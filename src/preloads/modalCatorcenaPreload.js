const { ipcRenderer } = require('electron');

const fechaInicial = '12/01/2024';

document.addEventListener('DOMContentLoaded', () => {
    closeButtonListener();

    const year = document.getElementById('year');

    year.addEventListener('keyup', (e) =>{

        e.preventDefault();

        const yearInput = document.getElementById('year').value;

        console.log(yearInput);

        if(regexYear(yearInput)){
            const dates = generateCatorcenas(fechaInicial, yearInput);
        
            generateTableCatorcena(dates);
            console.log('dates', dates);
        }

    })
})

const generateTableCatorcena = (dates) => {
    const table = document.getElementById('catorcena-table-body-cheques');
    const thead = document.querySelector('.catorcena-table thead tr');
    const infoDiv = document.getElementById('info');

    if (dates.length > 0) {
        let tableHTML = '';
        const columns = 3; // Número de columnas fijas
        const rows = Math.ceil(dates.length / columns); // Número de filas necesarias

        // Generar encabezados dinámicos con "No." y "Fecha" en cada columna
        let headerHTML = '';
        for (let i = 0; i < columns; i++) {
            headerHTML += `<th>No.</th><th>Fecha</th>`;
        }
        thead.innerHTML = `<tr>${headerHTML}</tr>`;

        // Construir las filas con datos ordenados por columna
        for (let row = 0; row < rows; row++) {
            tableHTML += '<tr>';
            for (let col = 0; col < columns; col++) {
                const index = row + col * rows; // Calcular el índice para llenar en columnas
                if (index < dates.length) {
                    tableHTML += `
                        <td>${index + 1}</td>
                        <td>${dates[index]}</td>
                    `;
                } else {
                    tableHTML += '<td></td><td></td>'; // Espacios vacíos si faltan elementos
                }
            }
            tableHTML += '</tr>';
        }

        table.innerHTML = tableHTML;
        infoDiv.innerHTML = '';
    } else {
        table.innerHTML = '';
        thead.innerHTML = '<tr><th>No.</th><th>Fecha</th></tr>'; // Restaurar encabezados por defecto
        infoDiv.innerHTML = 'No se encontraron catorcenas.';
    }
};

function generateCatorcenas(startDate, year) {
    console.log(`Fecha de inicio: ${startDate}, Año objetivo: ${year}`);

    const dates = [];

    // Convertir la fecha inicial de formato dd/mm/yyyy a objeto Date
    const [startDay, startMonth, startYear] = startDate.split('/').map(Number);
    let currentDate = new Date(startYear, startMonth - 1, startDay);

    // Mientras la fecha generada esté dentro del año especificado
    while (currentDate.getFullYear() <= year) {

        // Formatear la fecha antes de agregarla al array
        if(currentDate.getFullYear() === parseInt(year)){
            const formattedDate = currentDate.toLocaleDateString("es-MX", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
            });
            
            dates.push(formattedDate);

        }
        // Sumar 14 días exactos
        currentDate.setDate(currentDate.getDate() + 14);
    }

    return dates;
}

const closeButtonListener = () =>{
    const closeModalButton = document.getElementById('close-modal-cheque');
    console.log(closeModalButton);
    if (closeModalButton) {
        closeModalButton.addEventListener('click', async () => {
            console.log('Intentando cerrar el modal...');
            try {
                ipcRenderer.invoke('modalCatorcena:close');
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

function regexYear(fechaValue) {
    const yearRegex = /\b\d{4}\b/; // Busca un año en formato YYYY dentro del string
    return yearRegex.test(fechaValue);
}