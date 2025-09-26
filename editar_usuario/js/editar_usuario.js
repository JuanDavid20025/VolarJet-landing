// ===== Fallback del logo (por si cambia la ruta) =====
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
      if (i >= tries.length) { return; }
      const candidate = tries[i++];
      const probe = new Image();
      probe.onload = () => { el.src = candidate; };
      probe.onerror = tryNext;
      probe.src = candidate + "?v=" + Date.now();
    }
    el.addEventListener('error', tryNext, { once: true });
  }
})();

// ===== Dataset de ejemplo + persistencia local =====
const seedUsers = [
  { id: 1, nombres: 'Juan', apellidos: 'Pérez', email: 'juan.perez@volarjet.com', doc: '1012345678', tel: '+57 300 111 2233', rol: 'Administrador', verif: true, estado: 'activo', createdAt: '2025-04-01', updatedAt: '2025-08-01' },
  { id: 2, nombres: 'María', apellidos: 'Gómez', email: 'maria.gomez@volarjet.com', doc: '1023456789', tel: '+57 300 222 3344', rol: 'Agente', verif: true, estado: 'activo', createdAt: '2025-05-12', updatedAt: '2025-08-12' },
  { id: 3, nombres: 'Luis', apellidos: 'Rodríguez', email: 'luis.rod@volarjet.com', doc: '1034567890', tel: '+57 300 333 4455', rol: 'Agente', verif: false, estado: 'inactivo', createdAt: '2025-03-21', updatedAt: '2025-06-10' },
  { id: 4, nombres: 'Ana', apellidos: 'Martínez', email: 'ana.martinez@volarjet.com', doc: '1045678901', tel: '+57 300 444 5566', rol: 'Cliente', verif: true, estado: 'activo', createdAt: '2025-06-02', updatedAt: '2025-06-20' }
];

const KEY = 'usuarios_volarjet';
function loadAll() {
  try { return JSON.parse(localStorage.getItem(KEY)) || seedUsers.slice(); }
  catch (e) { return seedUsers.slice(); }
}
function saveAll(arr) { localStorage.setItem(KEY, JSON.stringify(arr)); }
function getUserById(id) { return loadAll().find(u => String(u.id) === String(id)); }
function upsertUser(user) {
  const arr = loadAll();
  const idx = arr.findIndex(u => String(u.id) === String(user.id));
  if (idx > -1) arr[idx] = user; else arr.unshift(user);
  saveAll(arr);
}
function deleteUser(id) { const arr = loadAll().filter(u => String(u.id) !== String(id)); saveAll(arr); }

// ===== Utilidades =====
const $ = sel => document.querySelector(sel);
const avatar = $('#avatar');
const whoName = $('#whoName');
const badgeEstado = $('#badgeEstado');
const badgeVerif = $('#badgeVerif');
const audit = $('#audit');
const toast = $('#toast');
const form = $('#formUser');

function initials(n, a) { return (n?.[0] || '').toUpperCase() + (a?.[0] || '').toUpperCase(); }
function fmtDate(s) { if (!s) return '—'; try { return new Date(s).toLocaleDateString('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit' }); } catch (e) { return s } }
function showToast(msg) { toast.textContent = msg; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 2000); }

// ===== Carga inicial =====
const params = new URLSearchParams(location.search);
const userId = params.get('id') || 1; // por defecto 1 si no envían id
let user = getUserById(userId);
if (!user) { user = seedUsers[0]; }

function paint() {
  $('#title').textContent = 'Editar usuario #' + user.id;
  $('#subtitle').textContent = user.email;
  whoName.textContent = `${user.nombres} ${user.apellidos}`;
  avatar.textContent = initials(user.nombres, user.apellidos);
  badgeEstado.textContent = user.estado;
  badgeEstado.className = 'status ' + (user.estado === 'activo' ? 'ok' : 'off');
  badgeVerif.textContent = user.verif ? 'Verificado' : 'Sin verificar';
  badgeVerif.className = 'status ' + (user.verif ? 'verif' : '');

  audit.textContent = `Creado: ${fmtDate(user.createdAt)} · Última actualización: ${fmtDate(user.updatedAt)}`;

  $('#nombres').value = user.nombres || '';
  $('#apellidos').value = user.apellidos || '';
  $('#email').value = user.email || '';
  $('#doc').value = user.doc || '';
  $('#tel').value = user.tel || '';
  $('#rol').value = user.rol || 'Cliente';
  $('#estado').value = user.estado || 'activo';
  $('#verif').value = user.verif ? 'si' : 'no';
}
paint();

// ===== Listeners =====
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const now = new Date().toISOString().slice(0, 10);
  const updated = {
    ...user,
    nombres: $('#nombres').value.trim(),
    apellidos: $('#apellidos').value.trim(),
    email: $('#email').value.trim(),
    doc: $('#doc').value.trim(),
    tel: $('#tel').value.trim(),
    rol: $('#rol').value,
    estado: $('#estado').value,
    verif: $('#verif').value === 'si',
    updatedAt: now
  };
  user = updated;
  upsertUser(updated);
  paint();
  showToast('✅ Cambios guardados');
});

document.getElementById('btnReset').addEventListener('click', () => {
  if (confirm('¿Enviar enlace de restablecimiento a ' + user.email + '?')) {
    // Aquí llamarías a tu API real
    showToast('🔒 Enlace de restablecimiento enviado');
  }
});

document.getElementById('btnDelete').addEventListener('click', () => {
  if (confirm('¿Eliminar definitivamente a ' + user.nombres + ' ' + user.apellidos + '?')) {
    deleteUser(user.id);
    showToast('🗑️ Usuario eliminado');
    setTimeout(() => {
      const back = document.referrer || params.get('return') || '../losta_de_usuarios/index.html';
      location.href = back;
    }, 400);
  }
});
