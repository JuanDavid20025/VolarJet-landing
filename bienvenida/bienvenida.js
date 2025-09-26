// Helpers
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];

// Pasajeros
const paxInput = $('#pax');
const paxLabel = $('#paxLabel');
$$('.step').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const step = Number(btn.dataset.step);
    let value = Math.max(1, Math.min(9, Number(paxInput.value) + step));
    paxInput.value = value;
    paxLabel.textContent = value;
  });
});

// Solo ida
const soloIda = $('#soloIda');
const vuelta = $('#vuelta');
soloIda.addEventListener('change', ()=>{
  vuelta.disabled = soloIda.checked;
  if (soloIda.checked) vuelta.value = '';
});

// Buscar vuelos (demo)
$('#formVuelos').addEventListener('submit', e=>{
  e.preventDefault();
  const origen = $('#origen').value.trim();
  const destino = $('#destino').value.trim();
  const ida = $('#ida').value;
  if(!origen || !destino || !ida){ alert('Completa origen, destino y fecha de ida.'); return; }
  if(origen === destino){ alert('El origen y el destino no pueden ser iguales.'); return; }
  alert('🔎 Búsqueda enviada (ver consola).');
  console.log({
    origen, destino, ida, vuelta: vuelta.value,
    pax: Number($('#pax').value), cabina: $('#cabina').value,
    soloIda: soloIda.checked
  });
});

// Newsletter
$('#formMail').addEventListener('submit', e=>{
  e.preventDefault();
  const email = $('#emailOfertas').value.trim();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
    $('#mailMsg').textContent = 'Correo inválido.'; return;
  }
  $('#mailMsg').textContent = '¡Gracias! Te enviaremos nuestras mejores ofertas.';
  e.target.reset();
});
