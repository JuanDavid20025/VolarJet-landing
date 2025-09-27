/* ===== VolarJet – Registro ===== */
const $  = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
const REDIRECT = "../bienvenida/index.html"; // a dónde ir tras registrarte

// Helpers storage
const getUsers = () => { try { return JSON.parse(localStorage.getItem("usuarios") || "[]"); } catch { return []; } };
const setUsers = (arr) => localStorage.setItem("usuarios", JSON.stringify(arr));

// Saludo en nav
(function greet(){
  const h = new Date().getHours();
  // (solo informativo, ya está el diseño)
})();

// Fecha de nacimiento (opcional: limitar a mayores de 14)
(function boundDOB(){
  const el = $("#nac"); if(!el) return;
  const today = new Date();
  const min = new Date(today.getFullYear()-100, today.getMonth(), today.getDate());
  const max = new Date(today.getFullYear()-14, today.getMonth(), today.getDate());
  el.min = min.toISOString().slice(0,10);
  el.max = max.toISOString().slice(0,10);
})();

// Mostrar/ocultar password
$("#toggle-pass").addEventListener("click", ()=>{
  const i = $("#pass"); i.type = i.type === "password" ? "text" : "password";
});
$("#toggle-pass2").addEventListener("click", ()=>{
  const i = $("#pass2"); i.type = i.type === "password" ? "text" : "password";
});

// Fuerza de contraseña
$("#pass").addEventListener("input", ()=>{
  const pwd = $("#pass").value;
  const {score,label} = strength(pwd);
  $("#meter-bar").style.width = (score*25) + "%";
  $("#meter-text").textContent = "Fuerza: " + label;
});

// Crear cuenta
$("#btn-crear").addEventListener("click", ()=>{
  const nombres   = ($("#nombres").value||"").trim();
  const apellidos = ($("#apellidos").value||"").trim();
  const tipo      = $("#tipo-doc").value;
  const numDoc    = ($("#num-doc").value||"").trim();
  const tel       = ($("#tel").value||"").trim();
  const mail      = ($("#mail").value||"").trim().toLowerCase();
  const pass      = $("#pass").value;
  const pass2     = $("#pass2").value;
  const pais      = $("#pais").value;
  const nac       = $("#nac").value;
  const rol       = $("#rol").value || "cliente";
  const estado    = $("#estado").value || "ACTIVO";
  const terms     = $("#terms").checked;

  const show = (t)=>{ $("#msg").textContent = t; setTimeout(()=> $("#msg").textContent="", 4000); };

  if(!nombres || !apellidos) return show("Escribe tus nombres y apellidos.");
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) return show("Correo inválido.");
  if(!numDoc) return show("Escribe tu número de documento.");
  const st = strength(pass);
  if(pass.length<8 || st.score<2) return show("La contraseña debe tener 8+ caracteres y combinar mayúsculas, minúsculas y números.");
  if(pass !== pass2) return show("Las contraseñas no coinciden.");
  if(!terms) return show("Debes aceptar los Términos y la Política.");
  
  const users = getUsers();
  if(users.some(u => String(u.correo||"").toLowerCase() === mail)) return show("Ese correo ya está registrado.");
  if(users.some(u => String(u.doc||"") === `${tipo}-${numDoc}`)) return show("Ese documento ya está registrado.");

  const id = genUserId(users);
  const now = new Date().toISOString();
  const user = {
    id,
    nombre: `${nombres} ${apellidos}`.trim(),
    correo: mail,
    tel,
    doc: `${tipo}-${numDoc}`,
    pais, nac,
    rol, estado,
    creada: now, actualizada: now,
    pass: pass
  };

  users.push(user);
  setUsers(users);

  // Crear sesión y redirigir
  localStorage.setItem("session", JSON.stringify({
    userId: id, nombre: user.nombre, correo: user.correo, rol: user.rol, loginAt: now
  }));

  alert("Cuenta creada. ¡Bienvenido/a!");
  location.href = REDIRECT;
});

/* ===== Utils ===== */
function strength(pwd=""){
  let score = 0;
  if(pwd.length >= 8) score++;
  if(/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
  if(/\d/.test(pwd)) score++;
  if(/[^\w\s]/.test(pwd)) score++; // símbolos
  const labels = ["Muy débil","Débil","Media","Fuerte","Excelente"];
  return {score, label: labels[score] || labels[0]};
}
function genUserId(existing){
  const taken = new Set(existing.map(u=>String(u.id)));
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id;
  do{
    id = "U" + Array.from({length:7}, ()=> chars[Math.floor(Math.random()*chars.length)]).join("");
  }while(taken.has(id));
  return id;
}
