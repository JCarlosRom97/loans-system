
// renderer.js
window.addHeader = (path) => {
    // Fetch and inject HTML
    fetch(path)
      .then((response) => response.text())
      .then((data) => {
        document.getElementById('header').innerHTML = data;
  
        const userPageLink = document.getElementById('Usuarios');

        if (userPageLink) {
          userPageLink.addEventListener('click', () => {
            if (window.api) {
              window.api.send('navigate-to', 'src/pages/Users/index.html');
            } else {
              console.error('window.api is not available!');
            }
          });
        }

        const prestamoPageLink = document.getElementById('Prestamo');
        
        if(prestamoPageLink){
          prestamoPageLink.addEventListener('click', ()=>{
            if(window.api){
              window.api.send('navigate-to', 'src/pages/Reports/Loans/index.html')
            }else{
              console.error('window.api is not available!');
            }
          })
        }

        const savingPageLink = document.getElementById('Ahorro');

        if(savingPageLink){
          savingPageLink.addEventListener('click', ()=>{
            if(window.api){
              window.api.send('navigate-to', 'src/pages/Reports/Savings/index.html')
            }else{
              console.error('window.api is not available!');
            }
          })
        }

        const conciliacionBancaria = document.getElementById('conciliacion-bancaria');

        if(conciliacionBancaria){
          conciliacionBancaria.addEventListener('click', ()=>{
            if(window.api){
              window.api.send('navigate-to', 'src/pages/Reports/Conciliacion/index.html')
            }else{
              console.error('window.api is not available!');
            }
          })
        }


        const openModalCheque = document.getElementById('modalCheques');

        if(openModalCheque){
          openModalCheque.addEventListener('click', ()=>{
            if(window.modal){
              window.modal.openCheque();
            }else{
              console.error('window.modal is not available!');
            }
          })
        }

        const openModalCatorcena = document.getElementById('modalCatorcena');

        if(openModalCatorcena){
          openModalCatorcena.addEventListener('click', ()=>{
            if(window.modal){
              window.modal.openCatorcena();
            }else{
              console.error('window.modal is not available!');
            }
          })
        }

      })
      .catch((error) => console.error('Error loading external HTML:', error));
  };