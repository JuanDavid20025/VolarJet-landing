// ===== Tabs =====
const btns = document.querySelectorAll('.tab-btn');
const bodies = [...document.querySelectorAll('.tab-body')].reduce((acc, el) => (acc[el.id] = el, acc), {});
btns.forEach(b => {
  b.addEventListener('click', () => {
    btns.forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    Object.values(bodies).forEach(x => x.hidden = true);
    bodies[b.dataset.tab].hidden = false;
  });
});

// ===== Carousel control =====
const car = document.getElementById('carousel');
document.getElementById('prev').onclick = () => car.scrollBy({ left: -300, behavior: 'smooth' });
document.getElementById('next').onclick = () => car.scrollBy({ left: 300, behavior: 'smooth' });

// ===== Demos de formularios =====
document.getElementById('formVuelos').addEventListener('submit', e => {
  e.preventDefault();
  const o = document.getElementById('origen').value || '-';
  const d = document.getElementById('destino').value || '-';
  alert(`🔎 Buscando vuelos: ${o} → ${d}`);
});
document.getElementById('formEstado').addEventListener('submit', e => {
  e.preventDefault();
  alert('📡 Estado de vuelo consultado (demo).');
});
document.getElementById('formCheck').addEventListener('submit', e => {
  e.preventDefault();
  alert('🧾 Check-in iniciado (demo).');
});
document.getElementById('formGest').addEventListener('submit', e => {
  e.preventDefault();
  alert('🛠️ Gestión de reserva (demo).');
});
document.getElementById('susBtn').addEventListener('click', () => {
  const mail = document.getElementById('mailN').value || '';
  if (!mail) return alert('Ingresa tu correo para suscribirte.');
  alert('🎉 ¡Suscripción exitosa! Te enviaremos ofertas.');
});

// ===== Fallback de logo (opcional) =====
(function () {
  for (const id of ['vjLogo', 'vjLogo2']) {
    const el = document.getElementById(id);
    if (!el) continue;
    const tries = [
      "../../assets/img/logo.png",
      "img/logo.png", "../img/logo.png"
    ];
    let i = 0;
    function tryNext() {
      if (i >= tries.length) return;
      const candidate = tries[i++];
      const probe = new Image();
      probe.onload = () => { el.src = candidate; };
      probe.onerror = tryNext;
      probe.src = candidate + "?v=" + Date.now();
    }
    el.addEventListener('error', tryNext, { once: true });
  }
})();
