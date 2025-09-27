/* ===== VolarJet – Bienvenida ===== */
const $  = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));

/* ===== Saludo dinámico ===== */
(function initGreeting(){
  const h = new Date().getHours();
  const slot = h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";
  $("#timeofday").textContent = slot;

  const perfil = readJSON("perfil") || {};
  const nombre = (perfil.nombre || "").trim();
  if(nombre){
    $("#greet").textContent = `${slot}, ${nombre} 👋`;
    $("#name-form").style.display = "none";
  }else{
    $("#greet").textContent = `${slot}, bienvenido a VolarJet 👋`;
  }

  // Confeti solo la primera vez
  if(!localStorage.getItem("welcomed")){
    localStorage.setItem("welcomed","1");
    confettiBurst(120);
  }
})();

/* ===== Form nombre ===== */
$("#name-form").addEventListener("submit", (e)=>{
  e.preventDefault();
  const name = ($("#name-input").value || "").trim();
  if(!name) return;
  const perfil = readJSON("perfil") || {};
  perfil.nombre = name;
  writeJSON("perfil", perfil);
  $("#greet").textContent = `${$("#timeofday").textContent}, ${name} 👋`;
  $("#name-form").style.display = "none";
  confettiBurst(80);
});

/* ===== Onboarding (tareas y progreso) ===== */
function calcTasks(){
  const perfil    = readJSON("perfil") || {};
  const reservas  = readJSON("reservas") || [];
  const promoOK   = localStorage.getItem("promoOptIn") === "1";

  const filledName = !!(perfil.nombre && perfil.nombre.trim());
  const filledMail = !!(perfil.correo && perfil.correo.includes("@"));
  const filledTel  = !!(perfil.tel && perfil.tel.length >= 7);
  const perfilOK   = filledName && filledMail && filledTel;

  return [
    { id:"t-perfil",   label:"Completa tu perfil (nombre, correo y teléfono)", done: perfilOK, meta: perfilOK ? "¡Listo!" : "Te toma 1 minuto", link:"../perfil/index.html" },
    { id:"t-reserva",  label:"Haz tu primera reserva",                         done: reservas.length > 0, meta: reservas.length>0 ? "Encontramos reservas" : "Explora rutas populares", link:"../buscar_reserva/index.html" },
    { id:"t-promos",   label:"Activa promos y novedades",                      done: promoOK, meta: promoOK ? "Activado" : "Recibe descuentos", link:null },
  ];
}
function renderTasks(){
  const list = $("#onb-tasks");
  const tasks = calcTasks();
  const doneCount = tasks.filter(t=>t.done).length;
  const perc = Math.round((doneCount / tasks.length) * 100);
  $("#onb-perc").textContent = perc + "%";
  $("#onb-bar").style.width = perc + "%";

  list.innerHTML = "";
  tasks.forEach(t=>{
    const li = document.createElement("li");
    li.className = "task" + (t.done ? " done" : "");
    li.innerHTML = `
      <i>${t.done ? "✓" : ""}</i>
      <div>
        <div><strong>${t.label}</strong></div>
        <div class="t-meta">${t.meta}</div>
      </div>
      ${t.link ? `<button class="btn ghost" data-link="${t.link}">Ir</button>` : ""}
    `;
    if(t.link){
      li.querySelector("[data-link]").addEventListener("click", ()=> location.href = t.link);
    }
    list.appendChild(li);
  });

  // Celebración al completar todo
  if(perc === 100 && !sessionStorage.getItem("onbAllDone")){
    sessionStorage.setItem("onbAllDone","1");
    confettiBurst(160);
  }
}
renderTasks();

/* ===== Promo opt-in + cupón ===== */
const promoToggle = $("#promo-optin");
promoToggle.checked = localStorage.getItem("promoOptIn") === "1";
promoToggle.addEventListener("change", ()=>{
  localStorage.setItem("promoOptIn", promoToggle.checked ? "1" : "0");
  renderTasks();
});
function aplicarCupon(code){
  localStorage.setItem("promoCode", code);
  alert(`Cupón ${code} aplicado. Lo verás en el paso de pago.`);
}

/* ===== Utilidades ===== */
function readJSON(key){
  try { return JSON.parse(localStorage.getItem(key) || "null"); }
  catch { return null; }
}
function writeJSON(key, val){
  localStorage.setItem(key, JSON.stringify(val));
}

/* ===== Confeti simple (sin librerías) ===== */
function confettiBurst(count=100){
  const fx = $("#fx");
  for(let i=0;i<count;i++){
    const p = document.createElement("span");
    p.className = "cft";
    // Colores aleatorios
    const colors = ["#0ddb88","#7cf2c0","#22d3ee","#fbbf24","#f472b6"];
    p.style.background = colors[Math.floor(Math.random()*colors.length)];
    p.style.left = Math.random()*100 + "vw";
    p.style.top  = "-10px";
    p.style.opacity = 0.9;
    const size = 6 + Math.random()*6;
    p.style.width = size + "px";
    p.style.height= size*0.6 + "px";
    p.style.transform = `rotate(${Math.random()*360}deg)`;
    p.style.animation = `fall ${2.2 + Math.random()*1.8}s linear forwards`;
    p.style.animationDelay = (Math.random()*0.2)+"s";
    fx.appendChild(p);
    setTimeout(()=> p.remove(), 4500);
  }
}
/* estilos dinámicos de confeti */
const style = document.createElement("style");
style.textContent = `
#fx .cft{position:fixed;z-index:60;border-radius:2px;box-shadow:0 0 0 1px rgba(0,0,0,.04)}
@keyframes fall{
  0%{transform:translateY(0) rotate(0deg)}
  100%{transform:translateY(105vh) rotate(720deg)}
}`;
document.head.appendChild(style);
