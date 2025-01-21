
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
      })
      .catch((error) => console.error('Error loading external HTML:', error));
  };