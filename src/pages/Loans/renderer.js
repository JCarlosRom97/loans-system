document.addEventListener('DOMContentLoaded', async() => {
    
    const params = new URLSearchParams(window.location.search);
    const idUser = params.get('idUsuario');
    console.log(idUser);

    const monto = document.getElementById('monto');
    const interes = parseInt(document.getElementById('interes').value);

    monto.addEventListener("keyup",()=>{
        const montoValue = parseInt(document.getElementById('monto').value);
        const totalPrestamo = montoValue + (montoValue * interes /100);
        document.getElementById('totalPrestamo').value = totalPrestamo;
    })

    const numeroCatorcenas = document.getElementById('noCatorcenas');

    numeroCatorcenas.addEventListener("keyup", () =>{
        const totalPrestamo = document.getElementById('totalPrestamo').value;
        const totalAbonos =  parseInt(totalPrestamo/numeroCatorcenas.value);
        console.log(totalAbonos);
        document.getElementById('abono').value = Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(totalAbonos || 0); 
    })

})