const { ipcRenderer } = require('electron');


document.addEventListener('DOMContentLoaded', () => {
    console.log('Loaded!');
    const closeModalButton = document.getElementById('close-modal');
    console.log(closeModalButton);
    if (closeModalButton) {
        closeModalButton.addEventListener('click', async () => {
            console.log('Intentando cerrar el modal...');
            try {
                ipcRenderer.invoke('modal:close');
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

    const formActividad = document.getElementById("ActividadForm");
    formActividad.addEventListener("submit", async (event)=>{
        event.preventDefault();
        const ActividadEconomica = document.getElementById('ActividadEconomica').value
        console.log(ActividadEconomica);
        const Actividad =  await ipcRenderer.invoke('db:addActividad', ActividadEconomica);
        formActividad.reset();
        // Show Notification
        document.getElementById('info').innerText = `¡La actividad ${Actividad} ha sido exitosamente añadida!`;
        setTimeout(() =>{
            document.getElementById('info').innerText = ``;
        }, 3000)
     
    })
});
