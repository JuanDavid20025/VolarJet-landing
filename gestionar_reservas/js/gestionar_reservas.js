// ===== Fallback del logo (rutas alternativas opcionales) =====
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

// ===== Datos de ejemplo (puedes reemplazar por fetch a tu backend) =====
const demo = [
  { id:1, pnr:'AB12CD', pasajero:'Juan Pérez', doc:'1012345678', email:'juan.p@volarjet.com', tel:'+57 300 111 2233', origen:'BOG', destino:'MDE', vuelo:'VJ123', salida:'2025-10-07T08:40', asiento:'12C', tarifa:'Economy', clase:'Y', canal:'Web', estado:'confirmada', obs:'' },
  { id:2, pnr:'EF34GH', pasajero:'María Gómez', doc:'1023456789', email:'maria.g@volarjet.com', tel:'+57 300 222 3344', origen:'MDE', destino:'BOG', vuelo:'VJ456', salida:'2025-10-08T19:15', asiento:'03A', tarifa:'Plus', clase:'M', canal:'App', estado:'pendiente', obs:'' },
  { id:3, pnr:'IJ56KL', pasajero:'Luis Rodríguez', doc:'1034567890', email:'luis.r@volarjet.com', tel:'+57 300 333 4455', origen:'BOG', destino:'CTG', vuelo:'VJ789', salida:'2025-10-09T06:10', asiento:'21F', tarifa:'Economy', clase:'Y', canal:'Agencia', estado:'checkin', obs:'SSR: asistencia silla de ruedas' },
  { id:4, pnr:'MN78OP', pasajero:'Ana Martínez', doc:'1045678901', email:'ana.m@volarjet.com', tel:'+57 300 444 5566', origen:'CTG', destino:'BOG', vuelo:'VJ321', salida:'2025-10-05T12:00', asiento:'08B', tarifa:'Flex', clase:'Y', canal:'Web', estado:'cancelada', obs:'reembolso parcial' },
  { id:5, pnr:'QR90ST', pasajero:'Carlos Díaz', doc:'1056789012', email:'carlos.d@volarjet.com', tel:'+57 300 555 6677', origen:'BOG', destino:'SMR', vuelo:'VJ654', salida:'2025-10-11T14:25', asiento:'—', tarifa:'Economy', clase:'Y', canal:'Web', estado:'confirmada', obs:'' }
];

const KEY = 'reservas_volarjet';
function loadAll(){ try { return JSON.parse(localStorage.getItem(KEY)) || demo.slice(); } catch(e){ return demo.slice(); } }
function saveAll(arr){ localStorage.setItem(KEY, JSON.stringify(arr)); }

// ===== Estado de UI =====
let state = {
  sortKey:'salida', sortDir:'asc',
  q:'', ori:'', des:'', desde:'', hasta:'', estado:'', canal:'',
  page:1, pageSize:25,
  editingId:null, seatForId:null, cancelForId:null
};

const $ = sel => document.querySelector(sel);
const tbody = $('#tbody');
const pagination = $('#pagination');
const toast = $('#toast');

// ===== Utilidades =====
const fmtDate = (s) => new Date(s).toLocaleString('es-CO',{ year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' });
const fmtDay  = (s) => new Date(s).toISOString().slice(0,10);
function showToast(msg){ toast.textContent = msg; toast.classList.add('show'); setTimeout(()=>toast.classList.remove('show'), 2000); }
function stBadge(estado){
  const cls = { confirmada:'st-confirmada', pendiente:'st-pendiente', cancelada:'st-cancelada', checkin:'st-checkin', volada:'st-volada' }[estado] || '';
  return `<span class="status ${cls}">${estado}</span>`;
}

function applyFilters(items){
  const q = state.q.trim().toLowerCase();
  let out = items.filter(r=>{
    const hayQ = !q || [r.pnr, r.pasajero, r.doc, r.email, r.vuelo].some(v => String(v).toLowerCase().includes(q));
    const okOri = !state.ori || r.origen === state.ori;
    const okDes = !state.des || r.destino === state.des;
    const okEst = !state.estado || r.estado === state.estado;
    const okCan = !state.canal || r.canal === state.canal;
    const okDesde = !state.desde || fmtDay(r.salida) >= state.desde;
    const okHasta = !state.hasta || fmtDay(r.salida) <= state.hasta;
    return hayQ && okOri && okDes && okEst && okCan && okDesde && okHasta;
  });
  out.sort((a,b)=>{
    const dir = state.sortDir === 'asc' ? 1 : -1;
    const k = state.sortKey; const va=a[k]; const vb=b[k];
    return (va>vb?1:va<vb?-1:0) * dir;
  });
  return out;
}

function paginate(items){
  const total = items.length; const size = state.pageSize; const pages = Math.max(1, Math.ceil(total/size));
  state.page = Math.min(state.page, pages);
  const start = (state.page-1)*size;
  return { total, pages, slice: items.slice(start, start+size) };
}

function render(){
  const data = loadAll();
  const filtered = applyFilters(data);
  const { total, pages, slice } = paginate(filtered);

  // cuerpo
  tbody.innerHTML = slice.map(r=>{
    const ruta = `${r.origen} → ${r.destino}`;
    return `<tr data-id="${r.id}">
      <td><input type="checkbox" class="rowCheck" /></td>
      <td><b>${r.pnr}</b></td>
      <td>${r.pasajero}<div class="muted">${r.email}</div></td>
      <td>${r.vuelo}</td>
      <td>${ruta}</td>
      <td>${fmtDate(r.salida)}</td>
      <td>${r.asiento || '—'}</td>
      <td>${r.tarifa} <span class="muted">(${r.clase})</span></td>
      <td>${stBadge(r.estado)}</td>
      <td>
        <div class="row-actions">
          <button class="icon-btn" data-act="view" title="Ver / Editar">✏️</button>
          <button class="icon-btn" data-act="seat" title="Asignar asiento">💺</button>
          <button class="icon-btn" data-act="checkin" title="Hacer check-in">🛄</button>
          <button class="icon-btn" data-act="cancel" title="Cancelar reserva">🗑️</button>
        </div>
      </td>
    </tr>`;
  }).join('');

  // paginación
  pagination.innerHTML = '';
  const prev = document.createElement('button'); prev.className='page-btn'; prev.textContent='Anterior'; prev.disabled = state.page===1; prev.onclick=()=>{ state.page--; render(); };
  const next = document.createElement('button'); next.className='page-btn'; next.textContent='Siguiente'; next.disabled = state.page===pages; next.onclick=()=>{ state.page++; render(); };
  pagination.appendChild(prev);
  for(let p=1;p<=pages;p++){
    const b = document.createElement('button'); b.className='page-btn'; b.textContent=p; b.setAttribute('aria-current', p===state.page ? 'page' : 'false'); b.onclick=()=>{ state.page=p; render(); };
    pagination.appendChild(b);
  }
  pagination.appendChild(next);
}

// ===== Ordenamiento =====
document.querySelectorAll('th.sortable').forEach(th=>{
  th.addEventListener('click', ()=>{
    const k = th.dataset.k;
    if (state.sortKey===k){ state.sortDir = state.sortDir==='asc' ? 'desc' : 'asc'; }
    else { state.sortKey = k; state.sortDir='asc'; }
    render();
  });
});

// ===== Filtros =====
$('#q').addEventListener('input', e=>{ state.q=e.target.value; state.page=1; render(); });
$('#fOri').addEventListener('change', e=>{ state.ori=e.target.value; state.page=1; render(); });
$('#fDes').addEventListener('change', e=>{ state.des=e.target.value; state.page=1; render(); });
$('#fDesde').addEventListener('change', e=>{ state.desde=e.target.value; state.page=1; render(); });
$('#fHasta').addEventListener('change', e=>{ state.hasta=e.target.value; state.page=1; render(); });
$('#fEstado').addEventListener('change', e=>{ state.estado=e.target.value; state.page=1; render(); });
$('#fCanal').addEventListener('change', e=>{ state.canal=e.target.value; state.page=1; render(); });
$('#pageSize').addEventListener('change', e=>{ state.pageSize=+e.target.value; state.page=1; render(); });

// ===== Selección múltiple =====
const checkAll = document.getElementById('checkAll');
checkAll.addEventListener('change', ()=>{
  document.querySelectorAll('.rowCheck').forEach(c=> c.checked = checkAll.checked);
});

// ===== Acciones por fila =====
const tbodyEl = document.getElementById('tbody');
tbodyEl.addEventListener('click', (e)=>{
  const btn = e.target.closest('button'); if (!btn) return;
  const tr = e.target.closest('tr'); const id = +tr.dataset.id; const r = loadAll().find(x => x.id === id);
  const act = btn.dataset.act;
  if (act==='view'){ openReserva(r); }
  if (act==='seat'){ openSeat(r); }
  if (act==='checkin'){
    if (r.estado==='cancelada') return showToast('No puedes hacer check-in: reserva cancelada');
    r.estado='checkin'; upsert(r); render(); showToast('✅ Check-in realizado');
  }
  if (act==='cancel'){ openCancel(r); }
});

// ===== Acciones de toolbar =====
document.getElementById('btnExport').addEventListener('click', ()=>{
  const rows = [['PNR','Pasajero','Documento','Correo','Teléfono','Origen','Destino','Vuelo','Salida','Asiento','Tarifa','Clase','Canal','Estado','Observaciones']]
    .concat(applyFilters(loadAll()).map(r=>[
      r.pnr, r.pasajero, r.doc||'', r.email||'', r.tel||'', r.origen, r.destino, r.vuelo,
      new Date(r.salida).toISOString(), r.asiento||'', r.tarifa, r.clase, r.canal, r.estado, r.obs||''
    ]));
  const csv = rows.map(r => r.map(v => `"${String(v).replaceAll('"','""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download='reservas_volarjet.csv'; a.click(); URL.revokeObjectURL(a.href);
});

document.getElementById('btnCancelSel').addEventListener('click', ()=>{
  const ids = [...document.querySelectorAll('.rowCheck')]
    .map(c => c.checked ? +c.closest('tr').dataset.id : null)
    .filter(Boolean);
  if (!ids.length) return alert('Selecciona al menos una reserva.');
  if (!confirm('¿Cancelar ' + ids.length + ' reservas seleccionadas?')) return;
  const all = loadAll();
  for (const id of ids){ const r = all.find(x=>x.id===id); if (r) r.estado='cancelada'; }
  saveAll(all); render(); showToast('🗑️ Reservas canceladas'); checkAll.checked = false;
});

document.getElementById('btnNueva').addEventListener('click', ()=>{
  const all = loadAll();
  const newId = Math.max(0, ...all.map(x=>x.id)) + 1;
  const now = new Date(); now.setDate(now.getDate()+7);
  const pad = n => String(n).padStart(2,'0');
  const pnr = (Math.random().toString(36).slice(2,4) + Math.random().toString(36).slice(2,4)).toUpperCase().slice(0,6);
  const r = { id:newId, pnr, pasajero:'Nuevo Pasajero', doc:'', email:'', tel:'', origen:'BOG', destino:'MDE',
    vuelo:'VJ'+Math.floor(Math.random()*900+100),
    salida: `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T09:00`,
    asiento:'—', tarifa:'Economy', clase:'Y', canal:'Web', estado:'pendiente', obs:'' };
  all.unshift(r); saveAll(all); render(); openReserva(r);
});

// ===== Persistencia helpers =====
function upsert(r){
  const arr = loadAll();
  const idx = arr.findIndex(x=>x.id===r.id);
  if (idx>-1) arr[idx]=r; else arr.unshift(r);
  saveAll(arr);
}

// ===== Modal Reserva =====
const modalReserva = document.getElementById('modalReserva');
const formReserva  = document.getElementById('formReserva');
const rPNR = document.getElementById('rPNR');
const rPasajero = document.getElementById('rPasajero');
const rDoc = document.getElementById('rDoc');
const rEmail = document.getElementById('rEmail');
const rTel = document.getElementById('rTel');
const rCanal = document.getElementById('rCanal');
const rOri = document.getElementById('rOri');
const rDes = document.getElementById('rDes');
const rVuelo = document.getElementById('rVuelo');
const rFecha = document.getElementById('rFecha');
const rHora = document.getElementById('rHora');
const rAsiento = document.getElementById('rAsiento');
const rTarifa = document.getElementById('rTarifa');
const rClase = document.getElementById('rClase');
const rEstado = document.getElementById('rEstado');
const rObs = document.getElementById('rObs');

function openReserva(r){
  state.editingId = r.id;
  document.getElementById('modalTitle').textContent = `Reserva ${r.pnr}`;
  rPNR.value = r.pnr; rPasajero.value = r.pasajero; rDoc.value = r.doc || ''; rEmail.value = r.email || ''; rTel.value = r.tel || '';
  rCanal.value = r.canal; rOri.value = r.origen; rDes.value = r.destino; rVuelo.value = r.vuelo;
  const d = new Date(r.salida); rFecha.value = d.toISOString().slice(0,10); rHora.value = d.toTimeString().slice(0,5);
  rAsiento.value = r.asiento || ''; rTarifa.value = r.tarifa; rClase.value = r.clase; rEstado.value = r.estado; rObs.value = r.obs || '';
  modalReserva.showModal();
}

formReserva.addEventListener('submit', (e)=>{
  if (e.submitter && e.submitter.value==='cancel'){ modalReserva.close(); return; }
  e.preventDefault();
  const all = loadAll();
  const r = all.find(x=>x.id===state.editingId); if (!r) return modalReserva.close();
  const salida = `${rFecha.value}T${rHora.value}`;
  Object.assign(r, {
    pasajero:rPasajero.value.trim(), doc:rDoc.value.trim(), email:rEmail.value.trim(), tel:rTel.value.trim(),
    canal:rCanal.value, origen:rOri.value, destino:rDes.value, vuelo:rVuelo.value.trim(), salida,
    asiento:rAsiento.value.trim() || '—', tarifa:rTarifa.value, clase:rClase.value, estado:rEstado.value, obs:rObs.value
  });
  saveAll(all); modalReserva.close(); render(); showToast('💾 Reserva actualizada');
});

// ===== Modal Asiento =====
const modalAsiento = document.getElementById('modalAsiento');
const seatInfo = document.getElementById('seatInfo');
const seatmap = document.getElementById('seatmap');
const formAsiento = document.getElementById('formAsiento');

const letters = ['A','B','C','D','E','F'];
const flightSeats = {
  'VJ123':['1A','1B','2C','12C','14D','21F'],
  'VJ456':['1A','3A','7C','9D','10F'],
  'VJ789':['2B','4C','6D','21F','22E'],
  'VJ321':['1C','1D','8B','12A'],
  'VJ654':['5E','5F','6A','12C']
};

let selectedSeat = null;

function seatCells(vuelo, currentSeat){
  const occ = new Set((flightSeats[vuelo] || []).concat(currentSeat ? [] : []));
  const cells = [];
  // legend row
  cells.push(`<div class="seat legend"></div>${letters.map(l=>`<div class="seat legend">${l}</div>`).join('')}`);
  for(let row=1; row<=30; row++){
    const rowCells = [`<div class="seat legend"><b>${row}</b></div>`];
    for (const l of letters){
      const code = `${row}${l}`;
      const isOcc = occ.has(code) && code !== currentSeat; // permitir seleccionar el actual
      const cls = ['seat', isOcc ? 'occ' : '', code===currentSeat ? 'sel' : ''].join(' ');
      rowCells.push(`<div class="${cls}" data-seat="${code}">${code}</div>`);
    }
    cells.push(rowCells.join(''));
  }
  return cells.join('');
}

function openSeat(r){
  state.seatForId = r.id;
  selectedSeat = r.asiento && r.asiento !== "—" ? r.asiento : null;
  seatInfo.textContent = `${r.pasajero} · Vuelo ${r.vuelo} · ${r.origen}→${r.destino}`;
  seatmap.innerHTML = seatCells(r.vuelo, selectedSeat);
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
  const all = loadAll(); const r = all.find(x=>x.id===state.seatForId); if (!r){ modalAsiento.close(); return; }
  if (!selectedSeat){ return alert('Elige un asiento.'); }
  r.asiento = selectedSeat; saveAll(all); modalAsiento.close(); render(); showToast('💺 Asiento asignado');
});

// ===== Modal Cancelación =====
const modalCancel = document.getElementById('modalCancel');
const cMotivo = document.getElementById('cMotivo');
const cRefund = document.getElementById('cRefund');
const cNotas = document.getElementById('cNotas');

function openCancel(r){ state.cancelForId = r.id; modalCancel.showModal(); }
document.getElementById('formCancel').addEventListener('submit', (e)=>{
  if (e.submitter && e.submitter.value==='cancel'){ modalCancel.close(); return; }
  e.preventDefault();
  const all = loadAll(); const r = all.find(x=>x.id===state.cancelForId); if (!r){ modalCancel.close(); return; }
  r.estado='cancelada';
  r.obs = `Cancelada: ${cMotivo.value}${cNotas.value ? ' · ' + cNotas.value : ''} (${cRefund.value})`;
  saveAll(all); modalCancel.close(); render(); showToast('🗑️ Reserva cancelada');
  cNotas.value = '';
});

// ===== Inicialización =====
if (!localStorage.getItem(KEY)) saveAll(loadAll());
render();
