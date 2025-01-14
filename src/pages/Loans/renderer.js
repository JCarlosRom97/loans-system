document.addEventListener('DOMContentLoaded', async() => {
    const params = new URLSearchParams(window.location.search);
    const idUser = params.get('idUsuario');
    console.log(idUser);

    const fecha = document.getElementById('fechaNacimiento');
    const monto = document.getElementById('monto');
    const anios = document.getElementById('noAnios');
    const interes = document.getElementById('interes');

    fecha.addEventListener('keyup', () =>{
        const [fechaValue, totalPrestamoValue] = processFormInformation();
        regexDate(fechaValue, totalPrestamoValue)
    })
  
    monto.addEventListener('keyup', () =>{
        document.getElementById('cantidadMeses').value = anios.value * 12;
        const [fechaValue, totalPrestamoValue] = processFormInformation();
        regexDate(fechaValue, totalPrestamoValue)
    })


    anios.addEventListener('keyup', () =>{
        document.getElementById('cantidadMeses').value = anios.value * 12;
        const [fechaValue, totalPrestamoValue] = processFormInformation();
        regexDate(fechaValue, totalPrestamoValue)
    })


    interes.addEventListener('keyup', ()=>{
        const [fechaValue, totalPrestamoValue] = processFormInformation();
        regexDate(fechaValue, totalPrestamoValue)
   
    })

    const form = document.getElementById('formLoan');

    form.addEventListener('submit', async(e)=>{
        e.preventDefault();

        const loanData = {
            Monto: parseMXN(document.getElementById('monto').value),
            Interes: parseMXN(document.getElementById('interes').value), 
            TotalPrestamo: parseMXN(document.getElementById('totalPrestamo').value),
            Abono: parseMXN(document.getElementById('abono').value),
            Saldo: parseMXN(document.getElementById('totalPrestamo').value),
            EstadoPrestamo: 'Activo',
            PagosCompletados: 0,
            No_Catorcenas: parseMXN(document.getElementById('noCatorcenas').value),
        }

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
                
            }
        } catch (error) {
            window.electron.showNotification('Error', 
            `Ha habido un error, intente de nuevo!`);
        }
    })
})

const parseMXN = (string) => parseInt(string.replace(/[^\d.-]/g, ''));

const processFormInformation  = () =>{
    const montoValue =  parseFloat(document.getElementById('monto').value);
    const mesesValue = parseInt(document.getElementById('cantidadMeses').value);
    const interesValue = parseFloat(document.getElementById('interes').value);

    const porcentaje = (interesValue * mesesValue )/ 100;

    console.log(porcentaje);

    const totalPrestamoValue = montoValue + (montoValue * porcentaje);

    document.getElementById('totalPrestamo').value = Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(totalPrestamoValue || 0);
  
    const fechaValue = document.getElementById('fechaNacimiento').value; 

    return [fechaValue, totalPrestamoValue];
}

function regexDate (fechaValue, totalPrestamoValue){
    const dateRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
    if (dateRegex.test(fechaValue)) {
        console.log("Valid date format");
        const dates = generateSecondFridays(fechaValue, parseInt(document.getElementById('noAnios').value))
        console.log(dates, dates.length);
        console.log(document.getElementById('tablePagos'));
        document.getElementById('tablePagos').classList.remove('hidden');
        document.getElementById('tablePagos').classList.add('visible');
        
        document.getElementById('noCatorcenas').value = dates.length;
        document.getElementById('abono').value = Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format((totalPrestamoValue / dates.length) || 0);
        
        generateTablePays(dates, document.getElementById('abono').value);
        
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

  const generateTablePays = (dates, pay) =>{
    // Verificar si hay usuarios
    if (dates.length > 0) {
        // Generar el HTML para la tabla
        let tableHTML = ``;

        // Recorrer los usuarios y agregar filas
        dates.forEach((date, index) => {
            console.log(date);
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
  

