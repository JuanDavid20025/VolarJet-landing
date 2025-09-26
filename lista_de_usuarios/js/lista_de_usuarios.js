// ===== Logo fallback (por si cambia la ruta) =====
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

// ===== Datos de ejemplo (puedes reemplazar por fetch a tu backend) =====
const data = [
  { id: 1, nombres: 'Juan', apellidos: 'Pérez', email: 'juan.perez@volarjet.com', doc: '1012345678', tel: '+57 300 111 2233', rol: 'Administrador', verif: true, estado: 'activo', createdAt: '2025-04-01' },
  { id: 2, nombres: 'María', apellidos: 'Gómez', email: 'maria.gomez@volarjet.com', doc: '1023456789', tel: '+57 300 222 3344', rol: 'Agente', verif: true, estado: 'activo', createdAt: '2025-05-12' },
  { id: 3, nombres: 'Luis', apellidos: 'Rodríguez', email: 'luis.rod@volarjet.com', doc: '1034567890', tel: '+57 300 333 4455', rol: 'Agente', verif: false, estado: 'inactivo', createdAt: '2025-03-21' },
  { id: 4, nombres: 'Ana', apellidos: 'Martínez', email: 'ana.martinez@volarjet.com', doc: '1045678901', tel: '+57 300 444 5566', rol: 'Cliente', verif: true, estado: 'activo', createdAt: '2025-06-02' },
  { id: 5, nombres: 'Carlos', apellidos: 'Díaz', email: 'carlos.diaz@volarjet.com', doc: '1056789012', tel: '+57 300 555 6677', rol: 'Cliente', verif: false, estado: 'activo', createdAt: '2025-02-14' },
  { id: 6, nombres: 'Paola', apellidos: 'Ramos', email: 'paola.r@volarjet.com', doc: '1067890123', tel: '+57 300 666 7788', rol: 'Administrador', verif: true, estado: 'activo', createdAt: '2025-07-15' },
  { id: 7, nombres: 'Diego', apellidos: 'Suárez', email: 'diego.suarez@volarjet.com', doc: '1078901234', tel: '+57 300 777 8899', rol: 'Agente', verif: true, estado: 'activo', createdAt: '2025-07-25' },
  { id: 8, nombres: 'Laura', apellidos: 'Mejía', email: 'laura.mejia@volarjet.com', doc: '1089012345', tel: '+57 300 888 9900', rol: 'Cliente', verif: true, estado: 'inactivo', createdAt: '2025-01-05' },
  { id: 9, nombres: 'Esteban', apellidos: 'Cano', email: 'esteban.c@volarjet.com', doc: '1090123456', tel: '+57 300 123 4567', rol: 'Cliente', verif: false, estado: 'activo', createdAt: '2025-08-01' },
  { id: 10, nombres: 'Valentina', apellidos: 'López', email: 'val.lopez@volarjet.com', doc: '1101234567', tel: '+57 301 234 5678', rol: 'Agente', verif: true, estado: 'activo', createdAt: '2025-08-28' },
  { id: 11, nombres: 'Santiago', apellidos: 'Quintero', email: 'san.qui@volarjet.com', doc: '1102234567', tel: '+57 302 234 5678', rol: 'Cliente', verif: false, estado: 'activo', createdAt: '2025-09-05' },
  { id: 12, nombres: 'Camila', apellidos: 'Arango', email: 'cam.arango@volarjet.com', doc: '1103234567', tel: '+57 303 234 5678', rol: 'Cliente', verif: true, estado: 'activo', createdAt: '2025-08-10' }
];

// ===== Estado de UI =====
let state = {
  sortKey: 'createdAt',
  sortDir: 'desc',
  q: '', rol: '', estado: '', verif: '',
  page: 1, pageSize: 25,
  editingId: null
};

const $ = sel => document.querySelector(sel);
const tbody = $('#tbody');
const pagination = $('#pagination');

// ===== Utilidades =====
const fmtDate = s => new Date(s).toLocaleDateString('es-CO',{year:'numeric',month:'2-digit',day:'2-digit'});
const initials = (n,a)=> (n?.[0]||'') + (a?.[0]||'');

// Filtro + orden
function applyFilters(items){
  const q = state.q.trim().toLowerCase();
  let out = items.filter(u=>{
    const hayQ = !q || [u.nombres,u.apellidos,u.email,u.doc].some(v => String(v).toLowerCase().includes(q));
    const okRol = !state.rol || u.rol === state.rol;
    const okEst = !state.estado || u.estado === state.estado;
    const okVer = !state.verif || (state.verif==='si' ? u.verif : !u.verif);
    return hayQ && okRol && okEst && okVer;
  });
  out.sort((a,b)=>{
    const dir = state.sortDir==='asc'?1:-1;
    const k = state.sortKey;
    const va = k==='name' ? `${a.nombres} ${a.apellidos}`.toLowerCase() : a[k];
    const vb = k==='name' ? `${b.nombres} ${b.apellidos}`.toLowerCase() : b[k];
    return (va>vb?1:va<vb?-1:0)*dir;
  });
  return out;
}

// Paginación
function paginate(items){
  const total = items.length; const size = state.pageSize; const pages = Math.max(1, Math.ceil(total/size));
  state.page = Math.min(state.page, pages);
  const start = (state.page-1)*size;
  return { total, pages, slice: items.slice(start, start+size) };
}

// Render principal
function render(){
  const filtered = applyFilters(data);
  const { pages, slice } = paginate(filtered);

  // cuerpo
  tbody.innerHTML = slice.map(u=>{
    const badgeRol = `<span class="chip">${u.rol}</span>`;
    const badgeVer = `<span class="status ${u.verif?'verif':''}">${u.verif?'Verificado':'Sin verificar'}</span>`;
    const badgeEst = `<span class="status ${u.estado==='activo'?'ok':'off'}">${u.estado}</span>`;
    return `<tr data-id="${u.id}">
      <td><input type="checkbox" class="rowCheck" /></td>
      <td>
        <div style="display:flex;align-items:center;gap:10px;">
          <div class="avatar" aria-hidden="true">${initials(u.nombres,u.apellidos)}</div>
          <div>
            <div style="font-weight:900">${u.nombres} ${u.apellidos}</div>
            <div class="muted">${u.tel || ''}</div>
          </div>
        </div>
      </td>
      <td>${u.email}</td>
      <td>${u.doc}</td>
      <td>${badgeRol}</td>
      <td>${badgeVer}</td>
      <td>${badgeEst}</td>
      <td class="num">${fmtDate(u.createdAt)}</td>
      <td>
        <div class="row-actions">
          <button class="icon-btn" data-act="view" title="Ver">👁️</button>
          <button class="icon-btn" data-act="edit" title="Editar">✏️</button>
          <button class="icon-btn" data-act="reset" title="Reiniciar contraseña">🔒</button>
          <button class="icon-btn" data-act="del" title="Eliminar">🗑️</button>
        </div>
      </td>
    </tr>`;
  }).join('');

  // paginación
  pagination.innerHTML = '';
  const prev = document.createElement('button'); prev.className='page-btn'; prev.textContent='Anterior';
  prev.disabled = state.page===1; prev.onclick = ()=>{ state.page--; render(); };
  const next = document.createElement('button'); next.className='page-btn'; next.textContent='Siguiente';
  next.disabled = state.page===pages; next.onclick = ()=>{ state.page++; render(); };

  pagination.appendChild(prev);
  for(let p=1; p<=pages; p++){
    const b = document.createElement('button');
    b.className='page-btn'; b.textContent=p;
    b.setAttribute('aria-current', p===state.page?'page':'false');
    b.onclick = ()=>{ state.page=p; render(); };
    pagination.appendChild(b);
  }
  pagination.appendChild(next);
}

// Ordenamiento
document.querySelectorAll('th.sortable').forEach(th=>{
  th.addEventListener('click', ()=>{
    const k = th.dataset.k;
    if(state.sortKey===k){ state.sortDir = state.sortDir==='asc'?'desc':'asc'; }
    else{ state.sortKey = k; state.sortDir='asc'; }
    render();
  });
});

// Filtros
$('#q').addEventListener('input', e=>{ state.q=e.target.value; state.page=1; render(); });
$('#fRol').addEventListener('change', e=>{ state.rol=e.target.value; state.page=1; render(); });
$('#fEstado').addEventListener('change', e=>{ state.estado=e.target.value; state.page=1; render(); });
$('#fVerif').addEventListener('change', e=>{ state.verif=e.target.value; state.page=1; render(); });
$('#pageSize').addEventListener('change', e=>{ state.pageSize=+e.target.value; state.page=1; render(); });

// Selección múltiple
const checkAll = document.getElementById('checkAll');
checkAll.addEventListener('change', ()=>{
  document.querySelectorAll('.rowCheck').forEach(c=> c.checked = checkAll.checked);
});

// Acciones por fila
tbody.addEventListener('click', (e)=>{
  const btn = e.target.closest('button'); if(!btn) return;
  const tr = e.target.closest('tr'); const id = +tr.dataset.id; const user = data.find(u=>u.id===id);
  const act = btn.dataset.act;

  if(act==='view'){ openModal(user, true); }
  if(act==='edit'){ openModal(user, false); }
  if(act==='reset'){ alert('🔒 Se enviaría link de restablecimiento a ' + user.email + ' (demo).'); }
  if(act==='del'){
    if(confirm('¿Eliminar a ' + user.nombres + ' ' + user.apellidos + '?')){
      const idx = data.findIndex(u=>u.id===id); if(idx>-1){ data.splice(idx,1); render(); }
    }
  }
});

// Toolbar: nuevo / bulk delete / export
document.getElementById('btnAdd').addEventListener('click', ()=> openModal());
document.getElementById('btnBulkDel').addEventListener('click', ()=>{
  const ids = [...document.querySelectorAll('.rowCheck')]
    .map(c => c.checked ? +c.closest('tr').dataset.id : null)
    .filter(Boolean);
  if(!ids.length) return alert('Selecciona al menos un usuario.');
  if(confirm('¿Eliminar ' + ids.length + ' usuarios seleccionados?')){
    for(const id of ids){ const idx = data.findIndex(u=>u.id===id); if(idx>-1) data.splice(idx,1); }
    render(); checkAll.checked = false;
  }
});

document.getElementById('btnExport').addEventListener('click', ()=>{
  const rows = [['ID','Nombres','Apellidos','Correo','Documento','Teléfono','Rol','Verificado','Estado','Creado']]
    .concat(applyFilters(data).map(u=>[
      u.id,u.nombres,u.apellidos,u.email,u.doc,u.tel||'',u.rol,u.verif?'SI':'NO',u.estado,u.createdAt
    ]));
  const csv = rows.map(r => r.map(v => `"${String(v).replaceAll('"','""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'usuarios_volarjet.csv';
  a.click(); URL.revokeObjectURL(a.href);
});

// ===== Modal =====
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modalTitle');
const formUser = document.getElementById('formUser');
const uNombres = document.getElementById('uNombres');
const uApellidos = document.getElementById('uApellidos');
const uEmail = document.getElementById('uEmail');
const uDoc = document.getElementById('uDoc');
const uTel = document.getElementById('uTel');
const uRol = document.getElementById('uRol');
const uEstado = document.getElementById('uEstado');
const uVerif = document.getElementById('uVerif');

function openModal(user=null, readOnly=false){
  state.editingId = user?.id ?? null;
  modalTitle.textContent = readOnly ? 'Ver usuario' : (user ? 'Editar usuario' : 'Nuevo usuario');
  uNombres.value = user?.nombres || '';
  uApellidos.value = user?.apellidos || '';
  uEmail.value = user?.email || '';
  uDoc.value = user?.doc || '';
  uTel.value = user?.tel || '';
  uRol.value = user?.rol || 'Cliente';
  uEstado.value = user?.estado || 'activo';
  uVerif.value = user?.verif ? 'si' : 'no';

  // read-only
  [uNombres,uApellidos,uEmail,uDoc,uTel,uRol,uEstado,uVerif].forEach(el => el.disabled = readOnly);
  document.getElementById('btnSave').style.display = readOnly ? 'none' : '';

  modal.showModal();
}

formUser.addEventListener('submit', (e)=>{
  if(e.submitter && e.submitter.value==='cancel'){ modal.close(); return; }
  e.preventDefault();

  const payload = {
    id: state.editingId ?? (Math.max(0, ...data.map(x=>x.id)) + 1),
    nombres: uNombres.value.trim(),
    apellidos: uApellidos.value.trim(),
    email: uEmail.value.trim(),
    doc: uDoc.value.trim(),
    tel: uTel.value.trim(),
    rol: uRol.value,
    verif: uVerif.value === 'si',
    estado: uEstado.value,
    createdAt: state.editingId ? data.find(x=>x.id===state.editingId).createdAt : new Date().toISOString().slice(0,10)
  };

  if(state.editingId){
    const idx = data.findIndex(u=>u.id===state.editingId); if(idx>-1) data[idx] = payload;
  }else{
    data.unshift(payload);
  }
  modal.close(); render();
});

// ===== Inicialización =====
render();
