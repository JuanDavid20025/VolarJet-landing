/* ===== VolarJet – Editar usuario ===== */
const $  = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));

let CURRENT = null; // usuario cargado

/* ==== Init ==== */
(function init(){
  // Buscar
  $("#btn-buscar").addEventListener("click", buscar);
  $("#btn-limpiar").addEventListener("click", limpiar);

  // Toggle pass
  $("#toggle-p1").addEventListener("click", ()=>toggle("#e-pass1"));
  $("#toggle-p2").addEventListener("click", ()=>toggle("#e-pass2"));
  $("#e-pass1").addEventListener("input", onPassInput);

  // Guardar / activar-inactivar
  $("#btn-guardar").addEventListener("click", guardar);
  $("#btn-toggle").addEventListener("click", toggleEstado);

  // Limitar fecha de nacimiento (14–100 años)
  boundDOB("#e-nac");
})();

/* ==== Buscar usuario ==== */
function buscar(){
  const id   = ($("#q-id").value||"").trim().toUpperCase();
  const mail = ($("#q-mail").value||"").trim().toLowerCase();
  const tdoc = $("#q-tdoc").value;
  const docN = ($("#q-doc").value||"").trim();

  const users = getUsers();
  if(users.length===0) return show("#msg","No hay usuarios registrados.");

  let u = null;
  if(id){ u = users.find(x => String(x.id).toUpperCase() === id); }
  if(!u && mail){ u = users.find(x => String(x.correo||"").toLowerCase() === mail); }
  if(!u && tdoc && docN){ u = users.find(x => String(x.doc||"") === `${tdoc}-${docN}`); }

  if(!u){
    $("#editor").classList.add("hidden");
    return show("#msg","No encontramos usuario con esos datos.");
  }
  CURRENT = {...u};
  pintar(u);
  $("#editor").classList.remove("hidden");
  show("#msg",`Usuario ${u.id} cargado.`, true);
}

function pintar(u){
  $("#e-id").value        = u.id || "";
  $("#e-estado").textContent = u.estado || "ACTIVO";
  $("#e-estado-sel").value   = u.estado || "ACTIVO";
  const [nombres, ...ap] = String(u.nombre||"").split(" ");
  $("#e-nombres").value  = (nombres||"") + (ap.length>0?"":""); // si solo guardaron nombre completo, lo separamos simple
  $("#e-apellidos").value= ap.join(" ");

  const [tipo, num] = String(u.doc||"").split("-");
  $("#e-tdoc").value     = tipo || "CC";
  $("#e-doc").value      = num || "";
  $("#e-mail").value     = u.correo || "";
  $("#e-tel").value      = u.tel || "";
  $("#e-pais").value     = u.pais || "Colombia";
  $("#e-nac").value      = u.nac || "";
  $("#e-rol").value      = u.rol || "cliente";
  $("#e-upd").textContent= "Actualizado " + fmt(u.actualizada || u.creada || new Date().toISOString());

  // Reset área de password
  $("#e-pass1").value = ""; $("#e-pass2").value = "";
  $("#meter-bar").style.width = "0%"; $("#meter-text").textContent = "Fuerza: —";

  // Botón activar/desactivar
  $("#btn-toggle").textContent = (u.estado === "INACTIVO") ? "Activar" : "Desactivar";
}

/* ==== Guardar ==== */
function guardar(){
  if(!CURRENT) return alert("Primero busca un usuario.");

  const nombres   = ($("#e-nombres").value||"").trim();
  const apellidos = ($("#e-apellidos").value||"").trim();
  const tdoc      = $("#e-tdoc").value;
  const docN      = ($("#e-doc").value||"").trim();
  const tel       = ($("#e-tel").value||"").trim();
  const mail      = ($("#e-mail").value||"").trim().toLowerCase();
  const pais      = $("#e-pais").value;
  const nac       = $("#e-nac").value;
  const rol       = $("#e-rol").value;
  const estado    = $("#e-estado-sel").value;

  const pass1     = $("#e-pass1").value;
  const pass2     = $("#e-pass2").value;

  const showErr = t => show("#save-msg", t);

  if(!nombres || !apellidos) return showErr("Escribe nombres y apellidos.");
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) return showErr("Correo inválido.");
  if(!tdoc || !docN) return showErr("Completa el documento.");

  if(pass1 || pass2){
    if(pass1.length < 8) return showErr("La nueva contraseña debe tener 8+ caracteres.");
    if(pass1 !== pass2)  return showErr("Las contraseñas no coinciden.");
    const {score} = strength(pass1);
    if(score < 2) return showErr("Usa mayúsculas, minúsculas y números para mayor seguridad.");
  }

  // Unicidad correo y documento (excluye al propio usuario)
  const users = getUsers();
  if(users.some(u => u.id !== CURRENT.id && String(u.correo||"").toLowerCase() === mail)){
    return showErr("Ese correo ya está usado por otro usuario.");
  }
  if(users.some(u => u.id !== CURRENT.id && String(u.doc||"") === `${tdoc}-${docN}`)){
    return showErr("Ese documento ya está usado por otro usuario.");
  }

  // Actualizar
  const now = new Date().toISOString();
  const idx = users.findIndex(u => u.id === CURRENT.id);
  if(idx < 0) return showErr("El usuario ya no existe. Recarga la página.");

  const updated = {
    ...users[idx],
    nombre: `${nombres} ${apellidos}`.trim(),
    correo: mail,
    tel,
    doc: `${tdoc}-${docN}`,
    pais, nac,
    rol, estado,
    actualizada: now
  };
  if(pass1) updated.pass = pass1;

  users[idx] = updated;
  setUsers(users);

  // Si es el usuario en sesión, refresca session + perfil (para bienvenida)
  const ses = readJSON("session");
  if(ses?.userId === CURRENT.id){
    ses.nombre = updated.nombre;
    ses.correo = updated.correo;
    writeJSON("session", ses);

    const perfil = readJSON("perfil") || {};
    perfil.nombre = updated.nombre;
    perfil.correo = updated.correo;
    perfil.tel    = updated.tel || perfil.tel;
    writeJSON("perfil", perfil);
  }

  CURRENT = {...updated};
  pintar(updated);
  show("#save-msg","Cambios guardados ✅", true);
}

/* ==== Activar / Desactivar ==== */
function toggleEstado(){
  if(!CURRENT) return;
  const users = getUsers();
  const idx = users.findIndex(u => u.id === CURRENT.id);
  if(idx < 0) return;

  const nuevo = (users[idx].estado === "INACTIVO") ? "ACTIVO" : "INACTIVO";
  users[idx].estado = nuevo;
  users[idx].actualizada = new Date().toISOString();
  setUsers(users);

  CURRENT.estado = nuevo;
  $("#e-estado").textContent = nuevo;
  $("#e-estado-sel").value = nuevo;
  $("#btn-toggle").textContent = (nuevo === "INACTIVO") ? "Activar" : "Desactivar";
  show("#save-msg", `Estado cambiado a ${nuevo} ✅`, true);
}

/* ==== Helpers UI ==== */
function limpiar(){
  $("#q-id").value=""; $("#q-mail").value=""; $("#q-tdoc").value=""; $("#q-doc").value="";
  $("#msg").textContent="";
  $("#editor").classList.add("hidden");
  CURRENT = null;
}
function onPassInput(){
  const pwd = $("#e-pass1").value;
  const {score,label} = strength(pwd);
  $("#meter-bar").style.width = (score*25) + "%";
  $("#meter-text").textContent = "Fuerza: " + label;
}
function toggle(sel){
  const i = $(sel); i.type = i.type === "password" ? "text" : "password";
}

/* ==== Utilidades ==== */
function strength(pwd=""){
  let score = 0;
  if(pwd.length >= 8) score++;
  if(/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
  if(/\d/.test(pwd)) score++;
  if(/[^\w\s]/.test(pwd)) score++; // símbolos
  const labels = ["Muy débil","Débil","Media","Fuerte","Excelente"];
  return {score, label: labels[score] || labels[0]};
}
function boundDOB(selector){
  const el = $(selector); if(!el) return;
  const today = new Date();
  const min = new Date(today.getFullYear()-100, today.getMonth(), today.getDate());
  const max = new Date(today.getFullYear()-14, today.getMonth(), today.getDate());
  el.min = min.toISOString().slice(0,10);
  el.max = max.toISOString().slice(0,10);
}
function fmt(iso){
  try{ const d=new Date(iso); return d.toLocaleString("es-CO",{year:"numeric",month:"short",day:"2-digit",hour:"2-digit",minute:"2-digit"}); }
  catch{ return "—"; }
}
function show(sel, text, ok=false){
  const el = $(sel); el.textContent = text; el.style.color = ok ? "#065f46" : "#b91c1c";
  setTimeout(()=>{ if(sel!=="#msg") el.textContent=""; }, 3500);
}

/* Storage */
function getUsers(){ try{ return JSON.parse(localStorage.getItem("usuarios") || "[]"); }catch{ return []; } }
function setUsers(arr){ localStorage.setItem("usuarios", JSON.stringify(arr)); }
function readJSON(k){ try{ return JSON.parse(localStorage.getItem(k) || "null"); }catch{ return null; } }
function writeJSON(k,v){ localStorage.setItem(k, JSON.stringify(v)); }
