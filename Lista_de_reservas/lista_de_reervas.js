// ===== Logo fallback =====
(function () {
  for (const id of ['vjLogo', 'vjLogo2']) {
    const el = document.getElementById(id);
    if (!el) continue;
    const tries = ["img.logo.png","./img.logo.png","/img.logo.png","img/logo.png","/img/logo.png","../img.logo.png","../img/logo.png"];
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

// ===== Storage =====
const KEY = 'reservas_volarjet';
function loadAll(){ try{ return JSON.parse(localStorage.getItem(KEY)) || []; }catch(e){ return []; } }
function saveAll(arr){ localStorage.setItem(KEY, JSON.stringify(arr)); }

// ===== Seed (opcional si está vacío) =====
if(!localStorage.getItem(KEY)){
  const seed = [
    { id:1, pnr:'AB12C3', pasajero:'Juan Pérez', doc:'1012345678', email:'juan@demo.com', tel:'+57 300 111 2233',
      origen:'BOG', destino:'MDE', vuelo:'VJ123', salida:'2025-11-20T08:00', asiento:'12C', tarifa:'Economy', clase:'Y', canal:'Web', estado:'confirmada', obs:''},
    { id:2, pnr:'ZK8M4P', pasajero:'María Gómez', doc:'1023456789', email:'maria@demo.com', tel:'+57 300 222 3344',
      origen:'CTG', destino:'BOG', vuelo:'VJ456', salida:'2025-11-22T14:30', asiento:'—', tarifa:'Flex', clase:'M', canal:'App', estado:'pendiente', obs:''},
    { id:3, pnr:'QW9RT7', pasajero:'Luis Rodríguez', doc:'1034567890', email:'luis@demo.com', tel:'+57 300 333 4455',
      origen:'SMR', destino:'CLO', vuelo:'VJ789', salida:'2025-12-01T19:15', asiento:'3A', tarifa:'Business', clase:'J', canal:'Agencia', estado:'checkin', obs:''}
  ];
  saveAll(seed);
}

// ===== Estado UI =====
let state = {
  sortKey: 'salida',
  sortDir: 'asc',
  q: '', ori: '', des: '', estado: '',
  desde: '', hasta: '',
  page: 1, pageSize: 25,
  current: null
};

const $ = sel => document.querySelector(sel);
const tbody = $('#tbody');
const pagination = $('#pagination');
const modal = document.getElementById('modal');
const mTitle = document.getElementById('mTitle');
const mBody  = document.getElementById('mBody');
const mClose = document.getElementById('mClose');
const mImprimir = document.getElementById('mImprimir');
const mEliminar  = document.getElementById('mEliminar');
const mCancelar  = document.getElementById('mCancelar');

// ===== Utilidades =====
function fmtDateTime(isoLike){
  if(!isoLike) return '—';
  // acepta 'YYYY-MM-DDTHH:mm'
  const d = new Date(isoLike);
  if(Number.isNaN(d.getTime())) return isoLike;
  const f = new Intl.DateTimeFormat('es-CO',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});
  return f.format(d);
}
const statusChip = (st)=>{
  const map = {
    confirmada: ['st-ok','Confirmada'],
    pendiente:  ['st-pend','Pendiente'],
    checkin:    ['st-co','Check-in'],
    cancelada:  ['st-can','Cancelada']
  };
  const [cls, label] = map[st] || ['','—'];
  return `<span class="status ${cls}">${label}</span>`;
};

// ===== Filtros + orden =====
function applyFilters(items){
  const q = state.q.trim().toLowerCase();
  const desde = state.desde ? new Date(state.desde+'T00:00') : null;
  const hasta = state.hasta ? new Date(state.hasta+'T23:59') : null;

  let out = items.filter(r=>{
    const hayQ = !q || [
      r.pnr, r.pasajero, r.vuelo, r.doc, r.email, r.tel, r.origen, r.destino
    ].some(v => String(v||'').toLowerCase().includes(q));

    const okOri = !state.ori || r.origen === state.ori;
    const okDes = !state.des || r.destino === state.des;
    const okEst = !state.estado || r.estado === state.estado;

    const d = r.salida ? new Date(r.salida) : null;
    const okDesde = !desde || (d && d >= desde);
    const okHasta = !hasta || (d && d <= hasta);

    return hayQ && okOri && okDes && okEst && okDesde && okHasta;
  });

  out.sort((a,b)=>{
    const dir = state.sortDir==='asc'?1:-1;
    let va, vb;
    switch(state.sortKey){
      case 'salida': va = a.salida; vb = b.salida; break;
      case 'pasajero': va = (a.pasajero||'').toLowerCase(); vb = (b.pasajero||'').toLowerCase(); break;
      case 'pnr': va = a.pnr; vb = b.pnr; break;
      case 'vuelo': va = a.vuelo; vb = b.vuelo; break;
      case 'estado': va = a.estado; vb = b.estado; break;
      default: va = a[state.sortKey]; vb = b[state.sortKey];
    }
    return (va>vb?1:va<vb?-1:0)*dir;
  });

  return out;
}

function paginate(items){
  const total = items.length; const size = state.pageSize; const pages = Math.max(1, Math.ceil(total/size));
  state.page = Math.min(state.page, pages);
  const start = (state.page-1)*size;
  return { total, pages, slice: items.slice(start, start+size) };
}

// ===== Render =====
function render(){
  const all = loadAll();
  const filtered = applyFilters(all);
  const { pages, slice } = paginate(filtered);

  tbody.innerHTML = slice.map(r=>{
    return `<tr data-id="${r.id}">
      <td><input type="checkbox" class="rowCheck" /></td>
      <td><b>${r.pnr}</b></td>
      <td>${r.pasajero || '—'}</td>
      <td><b>${r.origen}</b> → <b>${r.destino}</b></td>
      <td>${fmtDateTime(r.salida)}</td>
      <td>${r.vuelo}</td>
      <td>${r.asiento || '—'}</td>
      <td>${statusChip(r.estado)}</td>
      <td>
        <div class="row-actions">
          <button class="icon-btn" data-act="ver" title="Ver">👁️</button>
          <a class="icon-btn" href="nueva_reserva.html?return=reservas.html" title="Nueva">➕</a>
          <button class="icon-btn" data-act="cancel" title="Cancelar">⛔</button>
          <button class="icon-btn" data-act="del" title="Eliminar">🗑️</button>
        </div>
      </td>
    </tr>`;
  }).join('') || `<tr><td colspan="9" class="muted">No hay reservas que coincidan.</td></tr>`;

  // paginación
  pagination.innerHTML = '';
  const prev = document.createElement('button'); prev.className='page-btn'; prev.textContent='Anterior';
  prev.disabled = state.page===1; prev.onclick = ()=>{ state.page--; render(); };
  const next = document.createElement('button'); next.className='page-btn'; next.textContent='Siguiente';
  next.disabled = state.page===pages; next.onclick = ()=>{ state.page++; render(); };
  pagination.appendChild(prev);
  for(let p=1;p<=pages;p++){
    const b = document.createElement('button'); b.className='page-btn'; b.textContent=p;
    b.setAttribute('aria-current', p===state.page?'page':'false');
    b.onclick = ()=>{ state.page=p; render(); };
    pagination.appendChild(b);
  }
  pagination.appendChild(next);
}

// ===== Listeners: orden =====
document.querySelectorAll('th.sortable').forEach(th=>{
  th.addEventListener('click', ()=>{
    const k = th.dataset.k;
    if(state.sortKey===k){ state.sortDir = state.sortDir==='asc'?'desc':'asc'; }
    else { state.sortKey=k; state.sortDir='asc'; }
    render();
  });
});

// ===== Filtros =====
$('#q').addEventListener('input', e=>{ state.q=e.target.value; state.page=1; render(); });
$('#fOri').addEventListener('change', e=>{ state.ori=e.target.value; state.page=1; render(); });
$('#fDes').addEventListener('change', e=>{ state.des=e.target.value; state.page=1; render(); });
$('#fEstado').addEventListener('change', e=>{ state.estado=e.target.value; state.page=1; render(); });
$('#fDesde').addEventListener('change', e=>{ state.desde=e.target.value; state.page=1; render(); });
$('#fHasta').addEventListener('change', e=>{ state.hasta=e.target.value; state.page=1; render(); });
$('#pageSize').addEventListener('change', e=>{ state.pageSize=+e.target.value; state.page=1; render(); });

// ===== Selección múltiple =====
const checkAll = document.getElementById('checkAll');
checkAll.addEventListener('change', ()=>{
  document.querySelectorAll('.rowCheck').forEach(c=> c.checked = checkAll.checked);
});

// ===== Acciones por fila =====
tbody.addEventListener('click', (e)=>{
  const btn = e.target.closest('button'); if(!btn) return;
  const tr = e.target.closest('tr'); const id = +tr.dataset.id;
  const act = btn.dataset.act;
  let all = loadAll();
  const idx = all.findIndex(r=> +r.id === id);
  if(idx<0) return;

  if(act==='ver'){
    state.current = all[idx];
    openModal(state.current);
  }

  if(act==='cancel'){
    const r = all[idx];
    if(r.estado==='cancelada'){ alert('La reserva ya está cancelada.'); return; }
    if(confirm(`¿Cancelar la reserva ${r.pnr}?`)){
      all[idx] = {...r, estado:'cancelada'};
      saveAll(all); render();
    }
  }

  if(act==='del'){
    const r = all[idx];
    if(confirm(`¿Eliminar definitivamente la reserva ${r.pnr}?`)){
      all.splice(idx,1); saveAll(all); render();
    }
  }
});

// ===== Bulk delete =====
document.getElementById('btnBulkDel').addEventListener('click', ()=>{
  const ids = [...document.querySelectorAll('.rowCheck')]
    .map(c => c.checked ? +c.closest('tr').dataset.id : null)
    .filter(Boolean);
  if(!ids.length) return alert('Selecciona al menos una reserva.');
  if(!confirm(`¿Eliminar ${ids.length} reservas seleccionadas?`)) return;
  const remaining = loadAll().filter(r => !ids.includes(+r.id));
  saveAll(remaining); checkAll.checked = false; render();
});

// ===== Export CSV =====
document.getElementById('btnExport').addEventListener('click', ()=>{
  const rows = [['ID','PNR','Pasajero','Documento','Correo','Teléfono','Origen','Destino','Vuelo','Salida','Asiento','Tarifa','Clase','Canal','Estado','Obs']]
    .concat(applyFilters(loadAll()).map(r=>[
      r.id,r.pnr,r.pasajero||'',r.doc||'',r.email||'',r.tel||'',r.origen||'',r.destino||'',
      r.vuelo||'',r.salida||'',r.asiento||'',r.tarifa||'',r.clase||'',r.canal||'',r.estado||'',r.obs||''
    ]));
  const csv = rows.map(r => r.map(v => `"${String(v).replaceAll('"','""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'reservas_volarjet.csv';
  a.click(); URL.revokeObjectURL(a.href);
});

// ===== Modal detalle =====
function openModal(r){
  mTitle.textContent = `Reserva · ${r.pnr}`;
  mBody.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div><b>Pasajero</b><div>${r.pasajero||'—'} (${r.doc||'—'})</div></div>
      <div><b>Contacto</b><div>${r.email||'—'} · ${r.tel||'—'}</div></div>
      <div><b>Ruta</b><div>${r.origen} → ${r.destino}</div></div>
      <div><b>Vuelo</b><div>${r.vuelo} · ${fmtDateTime(r.salida)}</div></div>
      <div><b>Asiento</b><div>${r.asiento||'—'}</div></div>
      <div><b>Tarifa / Clase</b><div>${r.tarifa||'—'} / ${r.clase||'—'}</div></div>
      <div><b>Canal</b><div>${r.canal||'—'}</div></div>
      <div><b>Estado</b><div>${statusChip(r.estado)}</div></div>
      <div style="grid-column:1/-1"><b>Observaciones</b><div>${r.obs||'—'}</div></div>
    </div>
  `;
  modal.showModal();
}
mClose.addEventListener('click', ()=> modal.close());
mImprimir.addEventListener('click', ()=> window.print());
mEliminar.addEventListener('click', ()=>{
  const r = state.current; if(!r) return;
  if(confirm(`¿Eliminar definitivamente la reserva ${r.pnr}?`)){
    const next = loadAll().filter(x => +x.id !== +r.id);
    saveAll(next); modal.close(); render();
  }
});
mCancelar.addEventListener('click', ()=>{
  const r = state.current; if(!r) return;
  if(r.estado==='cancelada'){ alert('La reserva ya está cancelada.'); return; }
  if(confirm(`¿Cancelar la reserva ${r.pnr}?`)){
    const all = loadAll(); const idx = all.findIndex(x=>+x.id===+r.id);
    if(idx>-1){ all[idx] = {...all[idx], estado:'cancelada'}; saveAll(all); }
    modal.close(); render();
  }
});

// ===== Navegación rápida =====
document.getElementById('toUsuarios').addEventListener('click', ()=> {
  // Ajusta si tu archivo de usuarios tiene otro nombre/ruta
  location.href = 'index.html';
});

// ===== Inicialización =====
render();
