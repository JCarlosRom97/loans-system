const { ipcRenderer } = require('electron');

document.addEventListener('DOMContentLoaded', () => {
    closeButtonListener();

})


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