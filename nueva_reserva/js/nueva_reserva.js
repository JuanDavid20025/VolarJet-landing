// ===== Fallback de logo (rutas alternativas) =====
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

// ===== Storage y utilidades =====
const KEY = 'reservas_volarjet';
function loadAll(){ try { return JSON.parse(localStorage.getItem(KEY)) || [] } catch(e){ return [] } }
function saveAll(arr){ localStorage.setItem(KEY, JSON.stringify(arr)); }
function upsert(r){ const arr = loadAll(); const i = arr.findIndex(x=>x.id===r.id); if (i>-1) arr[i]=r; else arr.unshift(r); saveAll(arr); }

const $ = s => document.querySelector(s);
const toast = $('#toast');
function showToast(msg){ toast.textContent = msg; toast.classList.add('show'); setTimeout(()=>toast.classList.remove('show'), 1800); }
const pad = n => String(n).padStart(2,'0');

// ===== Generación de PNR único =====
function genPNR(){
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  function rnd(n){ return Array.from({length:n}, ()=> chars[Math.floor(Math.random()*chars.length)]).join(''); }
  const used = new Set(loadAll().map(r=>r.pnr));
  let p; do { p = rnd(6); } while (used.has(p));
  return p;
}

// ===== Validaciones =====
function validate(){
  const pasajero = $('#pasajero').value.trim();
  const ori = $('#ori').value; const des = $('#des').value; const fecha = $('#fecha').value; const hora = $('#hora').value; const vuelo = $('#vuelo').value.trim();
  if (!pasajero || !ori || !des || !fecha || !hora || !vuelo) return 'Completa los campos obligatorios.';
  if (ori === des) return 'Origen y destino no pueden ser iguales.';
  return '';
}

// ===== Asientos =====
const letters = ['A','B','C','D','E','F'];
const modalAsiento = document.getElementById('modalAsiento');
const formAsiento  = document.getElementById('formAsiento');
const seatmap      = document.getElementById('seatmap');
const seatInfo     = document.getElementById('seatInfo');
let selectedSeat = null;

function seatCells(vuelo, currentSeat){
  const occ = new Set(loadAll().filter(r=>r.vuelo===vuelo).map(r=>r.asiento).filter(Boolean));
  const cells = [];
  // fila de leyenda
  cells.push(`<div class="seat legend"></div>${letters.map(l=>`<div class="seat legend">${l}</div>`).join('')}`);
  for(let row=1; row<=30; row++){
    const rowCells = [`<div class="seat legend"><b>${row}</b></div>`];
    for (const l of letters){
      const code = `${row}${l}`;
      const isOcc = occ.has(code) && code !== currentSeat; // permitir el actual
      const cls = ['seat', isOcc ? 'occ' : '', code===currentSeat ? 'sel' : ''].join(' ');
      rowCells.push(`<div class="${cls}" data-seat="${code}">${code}</div>`);
    }
    cells.push(rowCells.join(''));
  }
  return cells.join('');
}

function openSeat(){
  const vuelo = $('#vuelo').value.trim(); const ori = $('#ori').value; const des = $('#des').value; const fecha = $('#fecha').value; const hora = $('#hora').value;
  if (!vuelo || !ori || !des || !fecha || !hora) return alert('Completa origen, destino, fecha, hora y vuelo antes de asignar asiento.');
  selectedSeat = $('#asiento').value || null;
  seatInfo.textContent = `Vuelo ${vuelo} · ${ori}→${des} · ${fecha} ${hora}`;
  seatmap.innerHTML = seatCells(vuelo, selectedSeat);
  seatmap.onclick = (e)=>{
    const cell = e.target.closest('.seat'); if (!cell || cell.classList.contains('occ') || cell.classList.contains('legend')) return;
    seatmap.querySelectorAll('.seat.sel').forEach(s=>s.classList.remove('sel'));
    cell.classList.add('sel'); selectedSeat = cell.dataset.seat;
  };
  modalAsiento.showModal();
}

formAsiento.addEventListener('submit', (e)=>{
  if (e.submitter && e.submitter.value==='cancel'){ modalAsiento.close(); return; }
  e.preventDefault();
  if (!selectedSeat) return alert('Elige un asiento.');
  $('#asiento').value = selectedSeat;
  modalAsiento.close();
});

// ===== Eventos UI =====
document.getElementById('btnSeat').addEventListener('click', openSeat);
document.getElementById('btnLimpiar').addEventListener('click', ()=>{
  document.getElementById('form').reset();
  $('#asiento').value = '';
});

const params = new URLSearchParams(location.search);
// por defecto volvemos al listado de reservas
const returnTo = params.get('return') || '../gestionar_reservas/index.html';
document.getElementById('bcReturn').addEventListener('click', (e)=>{ e.preventDefault(); location.href = returnTo; });
document.getElementById('btnVolver').addEventListener('click', ()=>{ location.href = returnTo; });

document.getElementById('btnGuardar').addEventListener('click', ()=>{
  document.getElementById('form').requestSubmit();
});

document.getElementById('form').addEventListener('submit', (e)=>{
  e.preventDefault();
  const err = validate(); if (err){ alert(err); return; }

  const pasajero = $('#pasajero').value.trim();
  const doc = $('#doc').value.trim();
  const email = $('#email').value.trim();
  const tel = $('#tel').value.trim();
  const origen = $('#ori').value; const destino = $('#des').value;
  const fecha = $('#fecha').value; const hora = $('#hora').value;
  const vuelo = $('#vuelo').value.trim();
  const canal = $('#canal').value; const tarifa = $('#tarifa').value; const clase = $('#clase').value; const estado = $('#estado').value;
  const asiento = $('#asiento').value || '—';
  const obs = $('#obs').value;

  const all = loadAll();
  const id = Math.max(0, ...all.map(x => x.id || 0)) + 1;
  const pnr = genPNR();
  const salida = `${fecha}T${hora}`;

  const reserva = { id, pnr, pasajero, doc, email, tel, origen, destino, vuelo, salida, asiento, tarifa, clase, canal, estado, obs };
  upsert(reserva);
  showToast('✅ Reserva creada · PNR ' + pnr);

  setTimeout(()=> location.href = returnTo, 600);
});

// ===== UX: hint dinámico =====
function refreshHint(){
  const ok = $('#ori').value && $('#des').value && $('#fecha').value && $('#hora').value && $('#vuelo').value.trim();
  const hint = document.getElementById('hint');
  if (ok){ hint.textContent = 'Todo listo. Puedes asignar asiento o guardar la reserva.'; hint.className = 'status ok'; }
  else   { hint.textContent = 'Completa origen, destino, fecha, hora y vuelo para generar PNR y asientos.'; hint.className = 'status warn'; }
}
['ori','des','fecha','hora','vuelo'].forEach(id => document.getElementById(id).addEventListener('input', refreshHint));
refreshHint();
