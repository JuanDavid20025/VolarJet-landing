/* ===== VolarJet – Login ===== */
const $  = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));

/* Ajusta el destino post-login si quieres */
const REDIRECT_URL = "../bienvenida/index.html";

/* Saludo dinámico */
(function greet(){
  const h = new Date().getHours();
  $("#timeofday").textContent = h<12 ? "Buenos días" : h<19 ? "Buenas tardes" : "Buenas noches";
})();

/* Tabs */
$$(".tab").forEach(t=>{
  t.addEventListener("click", ()=>{
    $$(".tab").forEach(x=>x.classList.remove("active"));
    t.classList.add("active");
    const tab = t.getAttribute("data-tab");
    $("#form-pass").classList.toggle("show", tab==="pass");
    $("#form-code").classList.toggle("show", tab==="code");
  });
});
$("#go-code").addEventListener("click", ()=>{
  document.querySelector('.tab[data-tab="code"]').click();
});

/* Mostrar / ocultar contraseña */
$("#toggle-pass").addEventListener("click", ()=>{
  const input = $("#password");
  input.type = input.type === "password" ? "text" : "password";
});

/* Detección Caps Lock */
$("#password").addEventListener("keyup", (e)=>{
  const caps = e.getModifierState && e.getModifierState("CapsLock");
  $("#caps-msg").style.display = caps ? "block" : "none";
});

/* Recordarme (prefill) */
(function prefill(){
  const saved = localStorage.getItem("rememberEmail") || "";
  if(saved){ $("#email").value = saved; $("#email-code").value = saved; $("#remember").checked = true; }
})();

/* Redirección si ya hay sesión */
(function checkSession(){
  const ses = readJSON("session");
  if(ses && ses.userId){
    // si quieres redirigir automáticamente, descomenta la siguiente línea
    // location.href = REDIRECT_URL;
  }
})();

/* ====== LOGIN CON CONTRASEÑA ====== */
$("#form-pass").addEventListener("submit", (e)=>{
  e.preventDefault();
  const email = ($("#email").value||"").trim().toLowerCase();
  const pass  = ($("#password").value||"").trim();
  const remember = $("#remember").checked;

  if(!validateEmail(email)){ return showMsg("#msg-pass","Correo inválido"); }
  if(pass.length < 4){ return showMsg("#msg-pass","La contraseña debe tener al menos 4 caracteres"); }

  const users = getUsers();
  const u = users.find(x => String(x.correo||"").toLowerCase() === email);
  if(!u){ return showMsg("#msg-pass","Usuario no encontrado. Verifica el email."); }
  if(u.estado === "INACTIVO"){ return showMsg("#msg-pass","Tu usuario está inactivo. Contacta a soporte."); }

  // Password demo:
  // - Si el usuario tiene 'pass' en localStorage, se valida contra ese valor.
  // - Si NO tiene 'pass', aceptamos "123456" como clave demo.
  const storedPass = (u.pass || "").trim();
  const valid = storedPass ? (pass === storedPass) : (pass === "123456" || pass === "volarjet");
  if(!valid){ return showMsg("#msg-pass","Contraseña incorrecta"); }

  if(remember) localStorage.setItem("rememberEmail", email);
  else localStorage.removeItem("rememberEmail");

  loginSuccess(u);
});

/* ====== LOGIN CON CÓDIGO (OTP DEMO) ====== */
$("#send-code").addEventListener("click", ()=>{
  const email = ($("#email-code").value || $("#email").value || "").trim().toLowerCase();
  if(!validateEmail(email)){ showStatus("Ingresa un email válido"); return; }
  const users = getUsers();
  const u = users.find(x => String(x.correo||"").toLowerCase() === email);
  if(!u){ showStatus("No encontramos ese email"); return; }
  if(u.estado === "INACTIVO"){ showStatus("Usuario inactivo"); return; }

  const code = genCode();
  sessionStorage.setItem("otp:"+email, JSON.stringify({ code, exp: Date.now() + 10*60*1000 }));
  showStatus("Código enviado (demo): " + code); // En producción: envía por correo/SMS
  $("#email-code").value = email;
});

$("#form-code").addEventListener("submit", (e)=>{
  e.preventDefault();
  const email = ($("#email-code").value||"").trim().toLowerCase();
  const otp   = ($("#otp").value||"").trim();
  if(!validateEmail(email)){ return showMsg("#msg-code","Correo inválido"); }
  if(!/^\d{6}$/.test(otp)){ return showMsg("#msg-code","Ingresa el código de 6 dígitos"); }

  const rec = sessionStorage.getItem("otp:"+email);
  if(!rec){ return showMsg("#msg-code","Solicita el código primero"); }
  try{
    const { code, exp } = JSON.parse(rec);
    if(Date.now() > exp) return showMsg("#msg-code","El código expiró. Pide uno nuevo.");
    if(otp !== String(code)) return showMsg("#msg-code","Código incorrecto");
  }catch{ return showMsg("#msg-code","Error con el código. Solicítalo de nuevo."); }

  const u = getUsers().find(x => String(x.correo||"").toLowerCase() === email);
  if(!u) return showMsg("#msg-code","Usuario no encontrado");
  loginSuccess(u);
});

/* ===== Utilidades ===== */
function getUsers(){
  try { return JSON.parse(localStorage.getItem("usuarios") || "[]"); }
  catch { return []; }
}
function setUsers(arr){ localStorage.setItem("usuarios", JSON.stringify(arr)); }

function loginSuccess(u){
  // Guarda sesión
  const session = {
    userId: u.id || null,
    nombre: u.nombre || "",
    correo: u.correo || "",
    rol: u.rol || "cliente",
    loginAt: new Date().toISOString(),
  };
  localStorage.setItem("session", JSON.stringify(session));

  // Actualizar última actividad del usuario
  const arr = getUsers();
  const i = arr.findIndex(x => x.id === u.id);
  if(i>=0){ arr[i].ultima = session.loginAt; setUsers(arr); }

  // Redirigir
  location.href = REDIRECT_URL;
}

function validateEmail(e){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }
function genCode(){ return String(Math.floor(100000 + Math.random()*900000)); }

function showMsg(sel, text){
  const el = $(sel);
  el.textContent = text;
  setTimeout(()=> el.textContent = "", 3500);
}
function showStatus(text){
  const el = $("#code-status");
  el.textContent = text;
  setTimeout(()=> el.textContent = "", 6000);
}

/* Prefiere el email del tab de contraseña si ya estaba escrito */
$("#email").addEventListener("input", ()=> { if(!$("#email-code").value) $("#email-code").value = $("#email").value; });
