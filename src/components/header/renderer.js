
// renderer.js
window.addHeader = (path) => {
    // Fetch and inject HTML
    fetch(path)
      .then((response) => response.text())
      .then((data) => {
        document.getElementById('header').innerHTML = data;
  
        const userPageLink = document.getElementById('Usuarios');
        const modalOpenActividad = document.getElementById('actividadModal');
        if (userPageLink) {
          userPageLink.addEventListener('click', () => {
            if (window.api) {
              window.api.send('navigate-to', 'src/pages/Users/index.html');
            } else {
              console.error('window.api is not available!');
            }
          });
        }

        if (modalOpenActividad) {
          modalOpenActividad.addEventListener('click', () => {
            window.modal.open([]);
          });
        }
      })
      .catch((error) => console.error('Error loading external HTML:', error));
  };