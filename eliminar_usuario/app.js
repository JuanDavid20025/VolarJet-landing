/* ===== VolarJet – Eliminar usuario ===== */
const $  = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
const LS_KEY = "usuarios";

const msg = $("#msg");
const result = $("#result");
let current = null; // usuario encontrado

// Eventos
$("#btn-buscar").addEventListener("click", buscar);
$("#btn-delete").addEventListener("click", eliminar);

// Soporta abrir con query ?id=... o ?mail=...
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

function buscar(){
  const id = ($("#q-id").value || "").trim().toUpperCase();
  const mail = ($("#q-mail").value || "").trim().toLowerCase();
  if(!id && !mail){ msg.textContent = "Ingresa ID o correo."; return; }
  msg.textContent = "";

  const users = getUsers();
  let u = null;
  if(id)   u = users.find(x => String(x.id).toUpperCase() === id);
  if(!u && mail) u = users.find(x => String(x.correo||"").toLowerCase() === mail);

  if(!u){
    result.classList.add("hidden");
    current = null;
    msg.textContent = "No se encontró el usuario.";
    return;
  }
  current = u;
  renderUser(u);
}

function renderUser(u){
  $("#r-id").textContent = u.id || "—";
  $("#r-nombre").textContent = u.nombre || "—";
  $("#r-rol").textContent = cap(u.rol || "—");
  $("#r-meta").textContent = `${u.correo || "—"} · ${u.tel || "—"} · ${u.doc || "—"}`;
  $("#r-estado").textContent = (u.estado === "INACTIVO") ? "Inactivo" : "Activo";
  $("#confirm-text").value = "";
  result.classList.remove("hidden");
}

function eliminar(){
  if(!current){ alert("Busca un usuario primero."); return; }
  const confirmText = ($("#confirm-text").value || "").trim().toUpperCase();
  if(confirmText !== String(current.id).toUpperCase()){
    alert("Debes escribir el ID exacto para confirmar."); return;
  }

  // Evitar borrar el último admin
  const all = getUsers();
  const admins = all.filter(x => x.rol === "admin");
  const isLastAdmin = (current.rol === "admin" && admins.length <= 1);
  if(isLastAdmin){
    alert("No puedes eliminar el último administrador."); return;
  }

  // Confirmación extra
  if(!confirm(`¿Eliminar definitivamente a ${current.nombre} (${current.id})? Esta acción no se puede deshacer.`)) return;

  const next = all.filter(x => x.id !== current.id);
  setUsers(next);
  alert("Usuario eliminado ✅");
  current = null;
  result.classList.add("hidden");
  // Redirigir a listado
  location.href = "../usuarios/index.html";
}

function cap(s){ return s ? s[0].toUpperCase()+s.slice(1) : s; }
