\
document.addEventListener('DOMContentLoaded', function () {
  const backdrop = document.getElementById('modal-backdrop');
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body');
  const modalClose = document.getElementById('modal-close');

  function abrirModal(desdeId) {
    const template = document.getElementById(desdeId);
    if (!template) return;
    const tempDiv = template.cloneNode(true);
    const h3 = tempDiv.querySelector('h3');
    if (h3) {
      modalTitle.textContent = h3.textContent;
      h3.remove();
    } else {
      modalTitle.textContent = 'Detalles';
    }
    modalBody.innerHTML = tempDiv.innerHTML;
    backdrop.style.display = 'flex';
  }

  function cerrarModal() {
    backdrop.style.display = 'none';
  }

  document.querySelectorAll('.btn-detalles').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-detalle-id');
      if (id) abrirModal(id);
    });
  });

  modalClose.addEventListener('click', cerrarModal);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) cerrarModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') cerrarModal();
  });

  // Lógica del botón COMPRAR AHORA de LOGICSOFT
  const btnLogicsoftComprar = document.getElementById('btn-logicsoft-comprar');
  if (btnLogicsoftComprar) {
    btnLogicsoftComprar.addEventListener('click', function () {
      const mensual = document.getElementById('logicsoft-mensual');
      const anual = document.getElementById('logicsoft-anual');

      let url = '';
      if (mensual && mensual.checked) {
        url = 'https://wa.link/ldnvjy'; // mensual
      } else if (anual && anual.checked) {
        url = 'https://wa.link/yprp9x'; // anual
      } else {
        url = 'https://wa.link/ldnvjy'; // por defecto mensual
      }

      window.open(url, '_blank');
    });
  }

  // Tema claro/oscuro con localStorage
  const themeToggle = document.getElementById('theme-toggle');
  const themeIcon = document.getElementById('theme-icon');
  const themeLabel = document.getElementById('theme-label');
  const themeMeta = document.getElementById('theme-color-meta');

  function aplicarTema(theme) {
    document.body.setAttribute('data-theme', theme);
    const oscuro = theme !== 'light';
    themeIcon.textContent = oscuro ? '🌙' : '☀️';
    themeLabel.textContent = oscuro ? 'Modo oscuro' : 'Modo claro';
    themeMeta.setAttribute('content', oscuro ? '#0b1220' : '#f3f4f6');
  }

  const temaGuardado = localStorage.getItem('pasir-theme');
  if (temaGuardado === 'light' || temaGuardado === 'dark') {
    aplicarTema(temaGuardado);
  } else {
    aplicarTema('dark');
  }

  themeToggle.addEventListener('click', () => {
    const actual = document.body.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    const nuevo = actual === 'light' ? 'dark' : 'light';
    aplicarTema(nuevo);
    localStorage.setItem('pasir-theme', nuevo);
  });

  // Registro del Service Worker (PWA)
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(err => {
        console.log('SW registration failed:', err);
      });
    });
  }

  // Carrusel automático de LOGICSOFT
  const track = document.getElementById('logicsoft-track');
  const dots = Array.from(document.querySelectorAll('.logicsoft-dot'));
  let currentIndex = 0;
  let autoTimer = null;

  function actualizarCarrusel(index) {
    if (!track) return;
    currentIndex = index;
    const offset = -index * 100;
    track.style.transform = `translateX(${offset}%)`;

    dots.forEach((dot, i) => {
      if (i === index) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });
  }

  function siguienteSlide() {
    const total = dots.length || 3;
    const next = (currentIndex + 1) % total;
    actualizarCarrusel(next);
  }

  if (track && dots.length > 0) {
    dots.forEach(dot => {
      dot.addEventListener('click', () => {
        const idx = parseInt(dot.getAttribute('data-index'), 10);
        actualizarCarrusel(idx);
        if (autoTimer) {
          clearInterval(autoTimer);
          autoTimer = setInterval(siguienteSlide, 5000);
        }
      });
    });

    actualizarCarrusel(0);
    autoTimer = setInterval(siguienteSlide, 5000);
  }
});
