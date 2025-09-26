// ===== Fallback del logo (intenta rutas alternativas) =====
(function () {
  for (const id of ['vjLogo', 'vjLogo2']) {
    const el = document.getElementById(id);
    if (!el) continue;
    const tries = [
      "../../assets/img/logo.png",
      "img/logo.png",
      "../img/logo.png"
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

// ===== Dataset demo + persistencia =====
const seedUsers = [
  { id: 1, nombres: 'Juan', apellidos: 'Pérez', email: 'juan.perez@volarjet.com', doc: '1012345678', tel: '+57 300 111 2233', rol: 'Administrador', verif: true, estado: 'activo', createdAt: '2025-04-01', updatedAt: '2025-08-01' },
  { id: 2, nombres: 'María', apellidos: 'Gómez', email: 'maria.gomez@volarjet.com', doc: '1023456789', tel: '+57 300 222 3344', rol: 'Agente', verif: true, estado: 'activo', createdAt: '2025-05-12', updatedAt: '2025-08-12' },
  { id: 3, nombres: 'Luis', apellidos: 'Rodríguez', email: 'luis.rod@volarjet.com', doc: '1034567890', tel: '+57 300 333 4455', rol: 'Agente', verif: false, estado: 'inactivo', createdAt: '2025-03-21', updatedAt: '2025-06-10' },
  { id: 4, nombres: 'Ana', apellidos: 'Martínez', email: 'ana.martinez@volarjet.com', doc: '1045678901', tel: '+57 300 444 5566', rol: 'Cliente', verif: true, estado: 'activo', createdAt: '2025-06-02', updatedAt: '2025-06-20' }
];

const KEY = 'usuarios_volarjet';
function loadAll(){ try{ return JSON.parse(localStorage.getItem(KEY)) || seedUsers.slice(); } catch(e){ return seedUsers.slice(); } }
function saveAll(arr){ localStorage.setItem(KEY, JSON.stringify(arr)); }
function getUserById(id){ return loadAll().find(u => String(u.id) === String(id)); }
function deleteUser(id){ const arr = loadAll().filter(u => String(u.id) !== String(id)); saveAll(arr); }

// ===== Utils =====
const $ = s => document.querySelector(s);
const avatar = $('#avatar'); const whoName = $('#whoName'); const whoMail = $('#whoMail');
const vDoc = $('#vDoc'); const vRol = $('#vRol'); const vEstado = $('#vEstado');
const title = $('#title'); const subtitle = $('#subtitle'); const toast = $('#toast');
const selCard = $('#selector'); const listEl = $('#list'); const btnContinue = $('#btnContinue');
const confirmCard = $('#confirm'); const btnDelete = $('#btnDelete'); const btnChoose = $('#btnChoose'); const ack = $('#ack');
const q = $('#q'); const rol = $('#rol'); const est = $('#estado');

function initials(n, a){ return (n?.[0]||'').toUpperCase() + (a?.[0]||'').toUpperCase(); }
function showToast(msg){ toast.textContent = msg; toast.classList.add('show'); setTimeout(()=> toast.classList.remove('show'), 2000); }

// ===== Estado =====
let all = loadAll();
if(!localStorage.getItem(KEY)) saveAll(all); // inicializa storage si vacío
let current = null; // usuario seleccionado

// ===== Filtro/selector =====
function applyFilters(){
  const s = (q.value || '').trim().toLowerCase();
  return all.filter(u=>{
    const okQ = !s || [u.nombres, u.apellidos, u.email, u.doc].some(v => String(v).toLowerCase().includes(s));
    const okR = !rol.value || u.rol === rol.value;
    const okE = !est.value || u.estado === est.value;
    return okQ && okR && okE;
  });
}
function renderList(){
  const rows = applyFilters();
  listEl.setAttribute('aria-busy','true');
  if(!rows.length){
    listEl.innerHTML = '<div class="muted">No hay usuarios que coincidan.</div>';
    btnContinue.disabled = true;
    listEl.removeAttribute('aria-busy');
    return;
  }
  listEl.innerHTML = rows.map(u=>`
    <div class="item" data-id="${u.id}">
      <div class="avatar">${initials(u.nombres, u.apellidos)}</div>
      <main>
        <strong>${u.nombres} ${u.apellidos}</strong>
        <small>${u.email}</small>
      </main>
      <button class="btn btn-line pick" type="button">Elegir</button>
    </div>
  `).join('');
  listEl.removeAttribute('aria-busy');
}
q.addEventListener('input', renderList);
rol.addEventListener('change', renderList);
est.addEventListener('change', renderList);
listEl.addEventListener('click', (e)=>{
  const btn = e.target.closest('.pick'); if(!btn) return;
  const id = e.target.closest('.item').dataset.id;
  selectById(id);
});
btnContinue.addEventListener('click', ()=>{ if(current) showConfirm(); });

function selectById(id){
  current = getUserById(id);
  btnContinue.disabled = !current;
  if(current){ subtitle.textContent = `${current.email} · (seleccionado)`; }
}

// ===== Confirmación =====
function paintConfirm(){
  if(!current) return;
  title.textContent = 'Eliminar usuario #' + current.id;
  subtitle.textContent = current.email;
  avatar.textContent = initials(current.nombres, current.apellidos);
  whoName.textContent = `${current.nombres} ${current.apellidos}`;
  whoMail.textContent = current.email;
  vDoc.textContent = current.doc || '—';
  vRol.textContent = current.rol || '—';
  vEstado.textContent = current.estado || '—';
  ack.checked = false; btnDelete.disabled = true;
}
function showConfirm(){ paintConfirm(); selCard.hidden = true; confirmCard.hidden = false; }

btnChoose.addEventListener('click', ()=>{ confirmCard.hidden = true; selCard.hidden = false; });
ack.addEventListener('change', ()=> btnDelete.disabled = !ack.checked);

// ===== Eliminar =====
btnDelete.addEventListener('click', ()=>{
  if(!current) return;
  if(!confirm(`¿Eliminar definitivamente a ${current.nombres} ${current.apellidos}?`)) return;
  deleteUser(current.id);
  showToast('🗑️ Usuario eliminado');
  const params = new URLSearchParams(location.search);
  const back = params.get('return') || '../lista_de_usuarios/index.html';
  setTimeout(()=> location.href = back, 500);
});

// ===== Arranque =====
(function init(){
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  if(id){ current = getUserById(id); }

  if(!current){
    // Mostrar selector
    selCard.hidden = false; confirmCard.hidden = true; renderList();
    const first = all[0]; if(first){ selectById(first.id); }
  } else {
    // Ir directo a confirmación
    selCard.hidden = true; confirmCard.hidden = false; paintConfirm();
  }
})();
