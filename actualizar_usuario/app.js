/* ===== VolarJet – Actualizar usuario ===== */
const $  = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
const LS_KEY = "usuarios";

const msg = $("#msg");
const formCard = $("#form-card");
const saveMsg = $("#save-msg");

let current = null; // usuario cargado

// Eventos
$("#btn-buscar").addEventListener("click", buscar);
$("#btn-guardar").addEventListener("click", guardar);

// Permitir abrir con ?id=... o ?mail=...
(function initFromURL(){
  const p = new URLSearchParams(location.search);
  const id = p.get("id"); const mail = p.get("mail");
  if(id){ $("#q-id").value = id; buscar(); }
  else if(mail){ $("#q-mail").value = mail; buscar(); }
})();

function getUsers(){
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); }
  catch { return []; }
}
function setUsers(arr){
  localStorage.setItem(LS_KEY, JSON.stringify(arr));
}

/* === Buscar === */
function buscar(){
  const id = ($("#q-id").value || "").trim().toUpperCase();
  const mail = ($("#q-mail").value || "").trim().toLowerCase();
  if(!id && !mail){ msg.textContent = "Ingresa ID o correo."; return; }
  msg.textContent = "";

  const users = getUsers();
  let u = null;
  if(id) u = users.find(x => String(x.id).toUpperCase() === id);
  if(!u && mail) u = users.find(x => String(x.correo||"").toLowerCase() === mail);

  if(!u){
    formCard.classList.add("hidden");
    current = null;
    msg.textContent = "No se encontró el usuario.";
    return;
  }
  current = u;
  renderForm(u);
}

/* === Render === */
function renderForm(u){
  $("#u-id").textContent = u.id || "—";
  $("#u-fechas").textContent = `Creado: ${fmt(u.creada)} · Última actualización: ${fmt(u.actualizada)}`;

  $("#u-nombre").value = u.nombre || "";
  $("#u-correo").value = u.correo || "";
  $("#u-tel").value    = u.tel || "";
  $("#u-doc").value    = u.doc || "";
  $("#u-rol").value    = u.rol || "cliente";
  $("#u-estado").value = u.estado || "ACTIVO";

  // Link rápido a eliminar con el ID ya en la URL
  const del = document.getElementById("link-eliminar");
  del.href = `../eliminar_usuario/index.html?id=${encodeURIComponent(u.id)}`;

  formCard.classList.remove("hidden");
  saveMsg.textContent = "";
}

/* === Guardar === */
function guardar(){
  if(!current){ alert("Busca un usuario primero."); return; }
  const payload = {
    id: current.id,
    nombre: $("#u-nombre").value.trim(),
    correo: $("#u-correo").value.trim(),
    tel: $("#u-tel").value.trim(),
    doc: $("#u-doc").value.trim(),
    rol: $("#u-rol").value,
    estado: $("#u-estado").value,
  };

  // Validaciones mínimas
  if(!payload.nombre){ alert("El nombre es obligatorio."); return; }
  if(!validateEmail(payload.correo)){ alert("Correo inválido."); return; }

  const all = getUsers();

  // Correo único (excluyendo al propio usuario)
  const emailTaken = all.some(u => u.id !== current.id && String(u.correo||"").toLowerCase() === payload.correo.toLowerCase());
  if(emailTaken){ alert("Ese correo ya está registrado en otro usuario."); return; }

  // Evitar dejar el sistema sin admins:
  // 1) Cambiar rol del último admin a no-admin
  // 2) Desactivar (INACTIVO) al último admin
  const admins = all.filter(u => u.rol === "admin");
  const isLastAdmin = (current.rol === "admin" && admins.length <= 1);

  const roleBecomesNonAdmin = (current.rol === "admin" && payload.rol !== "admin");
  const deactivating = (payload.estado === "INACTIVO");

  if(isLastAdmin && (roleBecomesNonAdmin || deactivating)){
    alert("No puedes dejar el sistema sin administradores. Crea otro admin antes de cambiar este.");
    return;
  }

  // Persistir
  const idx = all.findIndex(u => u.id === current.id);
  if(idx >= 0){
    all[idx] = {
      ...all[idx],
      ...payload,
      actualizada: new Date().toISOString(),
    };
    setUsers(all);
    current = all[idx];
    renderForm(current);
    saveMsg.textContent = "Cambios guardados ✅";
    setTimeout(()=> saveMsg.textContent = "", 2500);
  }else{
    alert("El usuario ya no existe (refresca la página).");
  }
}

/* === Utils === */
function fmt(iso){
  if(!iso) return "—";
  try{
    const d = new Date(iso);
    return d.toLocaleString("es-CO", {year:"numeric",month:"short",day:"2-digit",hour:"2-digit",minute:"2-digit"});
  }catch{ return "—"; }
}
function validateEmail(e){
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}
