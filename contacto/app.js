/* ===== VolarJet – Contacto ===== */
const $  = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
const LS_KEY = "contactos";

/* Prefill desde perfil / sesión / orden */
(function prefill(){
  const perfil = readJSON("perfil") || {};
  const ses = readJSON("session") || {};
  const ord = readJSON("orden") || null;
  const pnrLocal = localStorage.getItem("pnr");

  $("#nombre").value = perfil.nombre || ses.nombre || "";
  $("#mail").value   = perfil.correo || ses.correo || "";
  $("#tel").value    = perfil.tel || "";
  $("#pnr").value    = (ord?.pnr || pnrLocal || "");
})();

/* Contador de caracteres */
$("#mensaje").addEventListener("input", ()=>{
  $("#count").textContent = ($("#mensaje").value || "").length;
});

/* Enviar */
$("#btn-enviar").addEventListener("click", ()=>{
  const motivo = $("#motivo").value;
  const pnr    = ($("#pnr").value||"").trim().toUpperCase();
  const nombre = ($("#nombre").value||"").trim();
  const doc    = ($("#doc").value||"").trim();
  const mail   = ($("#mail").value||"").trim().toLowerCase();
  const tel    = ($("#tel").value||"").trim();
  const msg    = ($("#mensaje").value||"").trim();
  const canal  = $("#canal").value;
  const terms  = $("#terms").checked;

  const show = t => { $("#msg").textContent=t; setTimeout(()=>$("#msg").textContent="",3500); };

  if(!motivo) return show("Selecciona el motivo.");
  if(pnr && !/^[A-Z0-9]{6}$/.test(pnr)) return show("PNR inválido (usa 6 letras/números).");
  if(!nombre) return show("Escribe tu nombre.");
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) return show("Correo inválido.");
  if(msg.length < 10) return show("Cuéntanos con un poco más de detalle (mínimo 10 caracteres).");
  if(!terms) return show("Debes aceptar ser contactado con la respuesta.");

  const ticket = {
    id: genTicketId(),
    motivo, pnr, nombre, doc, correo:mail, tel, canal,
    mensaje: msg,
    estado: "NUEVO",
    prioridad: pnr ? "ALTA" : "NORMAL",
    creada: new Date().toISOString()
  };

  const arr = readJSON(LS_KEY) || [];
  arr.unshift(ticket);
  writeJSON(LS_KEY, arr);

  // Mostrar confirmación
  $("#ok-id").textContent = ticket.id;
  $("#ok").classList.remove("hidden");
  $("#ok").scrollIntoView({behavior:"smooth", block:"center"});

  // Limpia el form
  limpiar(true);
});

/* Copiar ID */
$("#btn-copy").addEventListener("click", async ()=>{
  try{
    await navigator.clipboard.writeText($("#ok-id").textContent);
    alert("ID copiado al portapapeles.");
  }catch{
    alert("No se pudo copiar. Selecciónalo y usa Ctrl/Cmd+C.");
  }
});

/* Utilidades */
function limpiar(keepContact=false){
  if(!keepContact){
    $("#motivo").value = "";
    $("#pnr").value = "";
  }
  // Mantiene nombre/correo/tel si keepContact=true
  $("#doc").value = "";
  $("#mensaje").value = ""; $("#count").textContent = "0";
  $("#terms").checked = false;
  $("#msg").textContent = "";
}
function genTicketId(){
  const n = Math.floor(10000 + Math.random()*90000);
  return `VJT-${n}`;
}
function readJSON(k){ try{ return JSON.parse(localStorage.getItem(k)||"null"); }catch{ return null; } }
function writeJSON(k,v){ localStorage.setItem(k, JSON.stringify(v)); }
