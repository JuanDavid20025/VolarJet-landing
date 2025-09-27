/* ===== VolarJet – Cancelar reserva ===== */
const $  = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
const COP = n => new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0}).format(n);

let RES = null;   // reserva actual
let ORD = null;   // orden asociada (opcional)
let POLICY = null; // cálculo vigente

/* Init */
(function init(){
  $("#btn-buscar").addEventListener("click", buscar);
  $("#btn-cancelar").addEventListener("click", confirmar);

  // Recalcular si cambia el destino del reembolso/motivo/checkbox
  $("#motivo").addEventListener("change", ()=>renderPolicy());
  $$("#policy input[name='dest']").forEach(r=> r.addEventListener("change", ()=>renderPolicy()));
  $("#acepto").addEventListener("change", ()=>{/* solo UI */});
})();

/* Buscar por PNR (+ validación opcional por correo contra 'orden') */
function buscar(){
  const pnr  = ($("#q-pnr").value||"").trim().toUpperCase();
  const mail = ($("#q-mail").value||"").trim().toLowerCase();
  if(!pnr) return show("#msg","Escribe tu PNR.");

  const reservas = readJSON("reservas") || [];
  const r = reservas.find(x => String(x.pnr).toUpperCase() === pnr);
  if(!r){ hideAll(); return show("#msg","No encontramos ese PNR."); }

  const ord = readJSON("orden");
  if(mail && ord && ord.pnr === pnr){
    const omail = String(ord.contacto?.mail || "").toLowerCase();
    if(omail && omail !== mail){ hideAll(); return show("#msg","El correo no coincide con la reserva."); }
  }

  RES = {...r};
  ORD = (ord && ord.pnr === pnr) ? ord : null;

  pintarDetalle(RES, ORD);
  renderPolicy();

  $("#detalle").classList.remove("hidden");
  $("#policy").classList.remove("hidden");
  $("#ok").classList.add("hidden");
  show("#msg", `Reserva ${pnr} cargada.`, true);
}

/* Pintar resumen */
function pintarDetalle(r, o){
  $("#d-pnr").textContent = r.pnr;
  $("#d-estado").textContent = "Estado " + (r.estado || "ACTIVA");
  $("#d-meta").textContent   = `Creada ${fmt(r.creada)} · Actualizada ${fmt(r.actualizada)}`;

  const cabina = o?.cabina || "Economy";
  $("#d-cabina").textContent = cabina;

  $("#d-ruta").textContent = `${r.vuelo?.o || "—"} → ${r.vuelo?.d || "—"}`;
  $("#d-fecha").textContent = formatDate(r.vuelo?.fecha);
  $("#d-hora").textContent = `${r.vuelo?.dep || "--:--"} – ${r.vuelo?.arr || "--:--"}`;

  const total = Number(r.total || o?.totalPagar || 0);
  $("#d-total").textContent = COP(total);

  const hrs = hoursToDeparture(r.vuelo?.fecha, r.vuelo?.dep);
  $("#d-count").textContent = hrs === null ? "—" : `${hrs} h`;
}

/* Política y cálculo */
function renderPolicy(){
  if(!RES){ return; }
  const total = Number(RES.total || ORD?.totalPagar || 0);
  const hrs = hoursToDeparture(RES.vuelo?.fecha, RES.vuelo?.dep);
  const band = bandForHours(hrs);

  // Porcentajes y penalidad por banda (demo)
  const rules = {
    A:{ min:48, rate:0.90, fee:20000, label:"≥ 48 h" },
    B:{ min:24, rate:0.75, fee:30000, label:"24–47 h" },
    C:{ min:3,  rate:0.50, fee:40000, label:"3–23 h"  },
    D:{ min:0,  rate:0.00, fee:0,     label:"< 3 h"   },
  };
  const rule = rules[band] || rules.D;

  // Base reembolsable
  let refundable = Math.max(0, Math.round(total * rule.rate) - rule.fee);

  // Método original vs crédito con bono +10% (tope $50.000)
  const dest = ($("input[name='dest']:checked")?.value || "ORIGINAL");
  let bonus = 0;
  if(dest === "CREDITO" && refundable > 0){
    bonus = Math.min(Math.round(refundable * 0.10), 50000);
  }
  const devolver = refundable + bonus;

  // Actualizar UI
  $("#q-base").textContent = COP(total);
  $("#q-pen").textContent  = COP(rule.fee);
  $("#q-rate").textContent = Math.round(rule.rate*100) + "%";
  $("#q-ref").textContent  = COP(devolver);

  POLICY = {
    band, rule, total, refundable, bonus, devolver, dest,
    motivo: $("#motivo").value
  };

  // Bloquear botón si ya está cancelada o fuera de política
  const disabled = (RES.estado === "CANCELADA") || (devolver===0 && band==="D");
  $("#btn-cancelar").disabled = disabled;
}

/* Confirmar cancelación */
function confirmar(){
  if(!RES) return;
  if(!$("#acepto").checked) return show("#save-msg","Debes aceptar las condiciones.");
  if(RES.estado === "CANCELADA") return show("#save-msg","Esta reserva ya está cancelada.");
  if(!POLICY) return show("#save-msg","No pudimos calcular el reembolso. Vuelve a buscar el PNR.");

  const now = new Date().toISOString();
  const reservas = readJSON("reservas") || [];
  const idx = reservas.findIndex(x => String(x.pnr) === String(RES.pnr));
  if(idx < 0) return show("#save-msg","La reserva ya no existe. Recarga la página.");

  // Actualiza estado
  reservas[idx] = {
    ...reservas[idx],
    estado: "CANCELADA",
    actualizada: now,
    cancelada: now,
    motivoCancel: POLICY.motivo || ""
  };
  writeJSON("reservas", reservas);

  // Registrar reembolso
  const refundId = genId("RFND");
  const refunds = readJSON("reembolsos") || [];
  refunds.unshift({
    id: refundId,
    pnr: RES.pnr,
    amount: POLICY.devolver,
    refundable: POLICY.refundable,
    bonus: POLICY.bonus,
    policyBand: POLICY.band,
    method: POLICY.dest, // ORIGINAL / CREDITO
    status: POLICY.devolver>0 ? "APROBADO" : "NO_APLICA",
    created: now
  });
  writeJSON("reembolsos", refunds);

  // Mostrar éxito
  $("#ok-pnr").textContent = RES.pnr;
  $("#ok-id").textContent  = refundId;
  $("#ok-amt").textContent = COP(POLICY.devolver);
  $("#ok-met").textContent = POLICY.dest === "CREDITO" ? "Crédito VolarJet" : "Método original";
  $("#ok-st").textContent  = POLICY.devolver>0 ? "APROBADO" : "NO APLICA";

  $("#ok").classList.remove("hidden");
  $("#policy").classList.add("hidden");
  $("#detalle").classList.remove("hidden");

  show("#save-msg","Reserva cancelada ✅", true);
}

/* Utilidades */
function readJSON(k){ try{ return JSON.parse(localStorage.getItem(k)||"null"); }catch{ return null; } }
function writeJSON(k,v){ localStorage.setItem(k, JSON.stringify(v)); }
function show(sel, text, ok=false){ const el=$(sel); el.textContent=text; el.style.color = ok ? "#065f46" : "#b91c1c"; setTimeout(()=>{ if(sel!=="#msg") el.textContent=""; }, 3500); }
function fmt(iso){ try{ const d=new Date(iso); return d.toLocaleString("es-CO",{year:"numeric",month:"short",day:"2-digit",hour:"2-digit",minute:"2-digit"}); } catch{ return "—"; } }
function formatDate(iso){ try{ return new Date(iso).toLocaleDateString("es-CO",{weekday:"long",day:"2-digit",month:"short"});}catch{return "—";} }
function hoursToDeparture(fechaISO, depHHMM){
  if(!fechaISO || !depHHMM) return null;
  const [hh,mm] = String(depHHMM).split(":").map(n=>parseInt(n,10));
  const dep = new Date(fechaISO+"T00:00:00");
  dep.setHours(hh||0, mm||0, 0, 0);
  const diffMs = dep.getTime() - Date.now();
  return Math.max(0, Math.round(diffMs / 36e5)); // horas
}
function bandForHours(h){
  if(h===null) return "D";
  if(h >= 48) return "A";
  if(h >= 24) return "B";
  if(h >= 3)  return "C";
  return "D";
}
function genId(prefix="ID"){
  const n = Math.floor(100000 + Math.random()*900000);
  return `${prefix}-${n}`;
}
function hideAll(){ $("#detalle").classList.add("hidden"); $("#policy").classList.add("hidden"); $("#ok").classList.add("hidden"); }
