// ===== Fallback del logo (por si cambia la ruta) =====
(function () {
  for (const id of ['vjLogo', 'vjLogo2']) {
    const el = document.getElementById(id);
    if (!el) continue;
    const tries = [
      "../../assets/img/logo.png","img/logo.png","/img/logo.png","../img/logo.png"
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

// ===== Datos demo (puedes quitar si ya tienes reservas en localStorage) =====
const seed = [
  { id: 1, pnr: 'AB12CD', pasajero: 'Juan Pérez', doc: '1012345678', email: 'juan.p@volarjet.com', tel: '+57 300 111 2233', origen: 'BOG', destino: 'MDE', vuelo: 'VJ123', salida: '2025-10-07T08:40', asiento: '12C', tarifa: 'Economy', clase: 'Y', canal: 'Web', estado: 'confirmada', obs: '' },
  { id: 2, pnr: 'EF34GH', pasajero: 'María Gómez', doc: '1023456789', email: 'maria.g@volarjet.com', tel: '+57 300 222 3344', origen: 'MDE', destino: 'BOG', vuelo: 'VJ456', salida: '2025-10-08T19:15', asiento: '03A', tarifa: 'Plus', clase: 'M', canal: 'App', estado: 'pendiente', obs: '' },
  { id: 3, pnr: 'IJ56KL', pasajero: 'Luis Rodríguez', doc: '1034567890', email: 'luis.r@volarjet.com', tel: '+57 300 333 4455', origen: 'BOG', destino: 'CTG', vuelo: 'VJ789', salida: '2025-10-09T06:10', asiento: '21F', tarifa: 'Economy', clase: 'Y', canal: 'Agencia', estado: 'checkin', obs: 'SSR silla de ruedas' },
  { id: 4, pnr: 'MN78OP', pasajero: 'Ana Martínez', doc: '1045678901', email: 'ana.m@volarjet.com', tel: '+57 300 444 5566', origen: 'CTG', destino: 'BOG', vuelo: 'VJ321', salida: '2025-10-05T12:00', asiento: '08B', tarifa: 'Flex', clase: 'Y', canal: 'Web', estado: 'cancelada', obs: 'reembolso parcial' },
  { id: 5, pnr: 'QR90ST', pasajero: 'Carlos Díaz', doc: '1056789012', email: 'carlos.d@volarjet.com', tel: '+57 300 555 6677', origen: 'BOG', destino: 'SMR', vuelo: 'VJ654', salida: '2025-10-11T14:25', asiento: '—', tarifa: 'Economy', clase: 'Y', canal: 'Web', estado: 'confirmada', obs: '' }
];

// ===== Storage helpers =====
const KEY = 'reservas_volarjet';
function loadAll(){ try{ return JSON.parse(localStorage.getItem(KEY)) || seed.slice(); } catch(e){ return seed.slice(); } }
function saveAll(arr){ localStorage.setItem(KEY, JSON.stringify(arr)); }
function getById(id){ return loadAll().find(r => String(r.id) === String(id)); }
function getByPNR(p){ return loadAll().find(r => String(r.pnr).toUpperCase() === String(p).toUpperCase()); }
function upsert(r){ const arr = loadAll(); const idx = arr.findIndex(x => x.id === r.id); if (idx > -1) arr[idx] = r; else arr.push(r); saveAll(arr); }

// ===== Estado/UI =====
const $ = sel => document.querySelector(sel);
const list = $('#list');
const findView = $('#findView');
const confirmView = $('#confirmView');
const toast = $('#toast');
const fEstado = $('#fEstado');
const q = $('#q');
const bcReturn = $('#bcReturn');
const btnBackList = $('#btnBackList');
function showToast(msg){ toast.textContent = msg; toast.classList.add('show'); setTimeout(()=>toast.classList.remove('show'), 1800); }

let current = null; // reserva seleccionada

// Evita submit real del buscador
const searchForm = document.getElementById('searchForm');
if (searchForm) searchForm.addEventListener('submit', (e)=>e.preventDefault());

// ===== Render list =====
function statusChip(st){
  const cls = { confirmada:'st-confirmada', pendiente:'st-pendiente', cancelada:'st-cancelada', checkin:'st-checkin', volada:'st-volada' }[st] || '';
  return `<span class="status ${cls}">${st}</span>`;
}
function applyFilters(items){
  const s = (q.value || '').trim().toLowerCase();
  const est = fEstado.value;
  return items.filter(r=>{
    const okQ = !s || [r.pnr, r.pasajero, r.email].some(v => String(v).toLowerCase().includes(s));
    const okE = !est || r.estado === est;
    return okQ && okE;
  });
}
function renderList(){
  const rows = applyFilters(loadAll());
  list.setAttribute('aria-busy','true');
  if (!rows.length){ list.innerHTML = '<div class="muted">No hay resultados.</div>'; list.removeAttribute('aria-busy'); return; }
  list.innerHTML = rows.map(r=>`
    <div class="item" data-id="${r.id}">
      <main>
        <strong>${r.pnr} · ${r.pasajero}</strong>
        <small>${r.vuelo} · ${r.origen}→${r.destino} · ${
          new Date(r.salida).toLocaleString('es-CO',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})
        }</small>
      </main>
      ${statusChip(r.estado)}
      <button class="btn btn-line act" data-act="choose">Cancelar</button>
    </div>`).join('');
  list.removeAttribute('aria-busy');
}
q.addEventListener('input', renderList);
fEstado.addEventListener('change', renderList);
list.addEventListener('click',(e)=>{
  const btn = e.target.closest('.act'); if(!btn) return;
  const id = e.target.closest('.item').dataset.id; selectById(id);
});

// ===== Confirm view =====
const dPNR = $('#dPNR'), dPas = $('#dPasajero'), dEmail = $('#dEmail'), dDoc = $('#dDoc');
const dOri = $('#dOri'), dDes = $('#dDes'), dVuelo = $('#dVuelo'), dSalida = $('#dSalida');
const cMotivo = $('#cMotivo'), cRefund = $('#cRefund'), cNotas = $('#cNotas');
const ack = $('#ack');
const btnVolver = $('#btnVolver');
const btnCancel = $('#btnCancel');
const headBox = $('#headBox');
const policyBox = $('#policyBox');

function policySuggestion(r){
  const hours = (new Date(r.salida) - new Date()) / 36e5; // horas hasta salida
  let sug = 'Sin reembolso';
  if (r.tarifa === 'Business') sug = 'Reembolso total';
  else if (hours > 48 && (r.tarifa === 'Flex' || r.tarifa === 'Plus')) sug = 'Reembolso total';
  else if (hours > 24) sug = 'Reembolso parcial';
  return { text:`Sugerencia de política según tarifa/tiempo restante: ${sug}.`, value:sug };
}

function paintConfirm(){
  if (!current) return;
  dPNR.textContent = current.pnr;
  dPas.textContent = current.pasajero;
  dEmail.textContent = current.email || '—';
  dDoc.textContent = current.doc || '—';
  dOri.textContent = current.origen; dDes.textContent = current.destino;
  dVuelo.textContent = current.vuelo;
  dSalida.textContent = new Date(current.salida).toLocaleString('es-CO',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});

  const sug = policySuggestion(current);
  policyBox.textContent = sug.text;
  [...cRefund.options].forEach(opt => { opt.selected = (opt.text === sug.value); });

  let noti = '';
  if (current.estado === 'cancelada') noti = 'Esta reserva ya está cancelada.';
  if (current.estado === 'volada') noti = 'El vuelo ya fue volado; no es cancelable.';
  if (noti){
    headBox.className = 'warn-box';
    headBox.innerHTML = '<b>ℹ️ Aviso.</b> ' + noti;
    btnCancel.disabled = true;
  }else{
    headBox.className = 'danger-box';
    headBox.innerHTML = '<b>⚠️ Acción irreversible.</b> La reserva pasará a estado <b>Cancelada</b>.';
    btnCancel.disabled = !ack.checked;
  }
  ack.checked = false;
}

function selectById(id){
  current = getById(id);
  if (!current){ showToast('No se pudo cargar la reserva'); return; }
  findView.hidden = true; confirmView.hidden = false; paintConfirm();
}

// ===== Acciones =====
ack.addEventListener('change', ()=>{
  if (current && current.estado !== 'cancelada' && current.estado !== 'volada') {
    btnCancel.disabled = !ack.checked;
  }
});
btnVolver.addEventListener('click', ()=>{
  confirmView.hidden = true; findView.hidden = false; renderList();
});

btnCancel.addEventListener('click', ()=>{
  if (!current) return;
  if (!confirm(`¿Cancelar definitivamente la reserva ${current.pnr} para ${current.pasajero}?`)) return;
  current.estado = 'cancelada';
  const mot = cMotivo.value; const rf = cRefund.value; const nt = cNotas.value?.trim();
  current.obs = `Cancelada: ${mot}${nt ? ' · ' + nt : ''} (${rf})`;
  upsert(current);
  showToast('🗑️ Reserva cancelada');
  const params = new URLSearchParams(location.search);
  const back = params.get('return') || 'reservas.html';
  setTimeout(()=> location.href = back, 600);
});

// ===== Navegación =====
const params = new URLSearchParams(location.search);
const returnTo = params.get('return') || 'reservas.html';
bcReturn.addEventListener('click',(e)=>{ e.preventDefault(); location.href = returnTo; });
btnBackList.addEventListener('click', ()=> location.href = returnTo );

// ===== Carga vía query (?id= / ?pnr=) =====
(function init(){
  if (!localStorage.getItem(KEY)) saveAll(loadAll()); // semilla
  const id = params.get('id'); const p = params.get('pnr');
  let r = null; if (id) r = getById(id); else if (p) r = getByPNR(p);
  if (r){ current = r; findView.hidden = true; confirmView.hidden = false; paintConfirm(); }
  else{ renderList(); }
})();
