(function () {
  const messageEl = document.getElementById('message');
  if (!messageEl) return;

  const params = new URLSearchParams(window.location.search);
  const error = params.get('error');
  const mensaje = params.get('mensaje');

  if (error) {
    messageEl.textContent = decodeURIComponent(error.replace(/\+/g, ' '));
    messageEl.classList.add('error');
  } else if (mensaje) {
    messageEl.textContent = decodeURIComponent(mensaje.replace(/\+/g, ' '));
    messageEl.classList.add('success');
  }
})();