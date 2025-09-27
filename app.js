/* ===== VolarJet – Pagos ===== */
const $  = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
const COP = n => new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0}).format(n);

let ORDEN = null;     // Orden activa (de nueva_reserva)
let RESERVA = null;   // Reserva relacionada (para estado)
let TOTALS = { sub:0, iva:0, disc:0, total:0 };
let HOLD_T = 600;     // 10 minutos en segundos

/* ==== INIT ==== */
(function init(){
  // Tabs
  $$(".tab").forEach(t => t.addEventListener("click", ()=>{
    $$(".tab").forEach(x=>x.classList.remove("active"));
    t.classList.add("active");
    const tab = t.dataset.tab;
    $$(".form").forEach(f=>f.classList.remove("show"));
    $("#form-"+tab).classList.add("show");
  }));

  // Cargar orden y reserva
  ORDEN = readJSON("orden");
  const pnr = ORDEN?.pnr || localStorage.getItem("pnr") || "";
  const reservas = readJSON("reservas") || [];
  RESERVA = reservas.find(r => String(r.pnr) === String(pnr)) || null;

  if(!ORDEN || !pnr){
    $("#no-orden").classList.remove("hidden");
    $("#checkout").style.display="none";
    return;
  }else{
    $("#no-orden").classList.add("hidden");
    $("#checkout").style.display="";
  }

  // Resumen y cupón (leer de localStorage si vino de bienvenida)
  renderResumen();

  // Prefills / handlers de tarjeta
  $("#c-num").addEventListener("input", formatCard);
  $("#c-exp").addEventListener("input", formatExp);
  $("#btn-pagar").addEventListener("click", pagar);

  $("#aplicar-cupon").addEventListener("click", applyCupon);
  const promoSaved = (localStorage.getItem("promoCode") || "").trim();
  if(promoSaved){ $("#cupon").value = promoSaved; applyCupon(); }

  // Countdown hold
  tickHold();
})();

/* ==== Resumen ==== */
function renderResumen(){
  const o = ORDEN;
  const paxCount = (o?.pax?.adt||0) + (o?.pax?.chd||0) + (o?.pax?.inf||0);
  $("#reserva-info").innerHTML = `
    <div><strong>${o?.vuelo?.o || "—"} → ${o?.vuelo?.d || "—"}</strong> · ${o?.cabina || "Economy"}</div>
    <div class="mini">${formatDate(o?.vuelo?.fecha)} · ${o?.vuelo?.dep||"--:--"}–${o?.vuelo?.arr||"--:--"} · Pasajeros: ${paxCount}</div>
    <div class="mini">PNR <span class="badge">${o?.pnr || "—"}</span></div>
  `;

  const base = Number(o?.totalPagar || 0);
  const iva  = Math.round(base * 0); // ya viene con IVA en la orden; si quisieras recalcular: 0.19
  let disc = 0; // se calcula con cupón
  const total = base - disc;

  TOTALS = { sub: base - iva, iva, disc, total };
  paintTotals();
}

function paintTotals(){
  $("#p-sub").textContent   = COP(TOTALS.sub);
  $("#p-iva").textContent   = COP(TOTALS.iva);
  $("#p-total").textContent = COP(Math.max(0, TOTALS.total));
  if(TOTALS.disc>0){
    $("#p-disc-row").classList.remove("hidden");
    $("#p-disc").textContent = "-" + COP(TOTALS.disc);
  }else{
    $("#p-disc-row").classList.add("hidden");
  }
}

/* ==== Cupón ==== */
function applyCupon(){
  const code = ($("#cupon").value||"").trim().toUpperCase();
  if(!code) return show("#cupon-msg","Escribe un código.");

  // Reglas demo: VJVERDE = 15% (hasta 120.000), otros: inválido
  const base = Number(ORDEN?.totalPagar || 0);
  if(code === "VJVERDE"){
    const disc = Math.min(Math.round(base * 0.15), 120000);
    TOTALS.disc = disc;
    TOTALS.total = Math.max(0, base - disc);
    show("#cupon-msg", `Cupón aplicado: ${COP(disc)} de descuento.`, true);
  }else{
    TOTALS.disc = 0;
    TOTALS.total = base;
    show("#cupon-msg", "Cupón inválido o no aplicable.");
  }
  paintTotals();
}

/* ==== Pagar ==== */
function pagar(){
  if(HOLD_T<=0) return show("#pay-msg","El tiempo de compra expiró. Vuelve a cotizar.", false, true);
  if(!$("#terms").checked) return show("#pay-msg","Debes aceptar Términos y Privacidad.");

  const activeTab = document.querySelector(".tab.active").dataset.tab;

  if(activeTab === "card"){
    const ok = validarTarjeta();
    if(!ok) return;
    processPayment({ method:"CARD", detail:getCardMasked(), cuotas: Number($("#c-cuotas").value) });
  }
  if(activeTab === "pse"){
    const bank = $("#pse-bank").value;
    const doc  = ($("#pse-doc").value||"").trim();
    if(!bank) return show("#pse-msg","Selecciona tu banco.");
    if(!doc)  return show("#pse-msg","Ingresa tu documento.");
    processPayment({ method:"PSE", detail: bank });
  }
  if(activeTab === "wallet"){
    const prov = $("#w-prov").value;
    const phone= ($("#w-phone").value||"").trim();
    if(!/^\+?[\d\s-]{8,}$/.test(phone)) return show("#w-msg","Ingresa un número de celular válido.");
    processPayment({ method:"WALLET", detail: `${prov} ${phone}` });
  }
}

function processPayment({method, detail, cuotas=1}){
  // Demo: aprobamos siempre si total > 0 y hold no expiró
  const amount = Math.max(0, TOTALS.total);
  if(amount<=0) return show("#pay-msg","El total debe ser mayor a $0.");

  // Generar transacción
  const payId = genId("PAY");
  const auth  = genAuth();
  const now   = new Date().toISOString();

  // Guardar en 'pagos'
  const pagos = readJSON("pagos") || [];
  pagos.unshift({
    id: payId, pnr: ORDEN.pnr, amount, currency:"COP",
    method, detail, cuotas,
    status:"APROBADO", auth, created: now
  });
  writeJSON("pagos", pagos);

  // Actualizar reserva a CONFIRMADA
  const reservas = readJSON("reservas") || [];
  const idx = reservas.findIndex(r => String(r.pnr) === String(ORDEN.pnr));
  if(idx>=0){
    reservas[idx].estado = "CONFIRMADA";
    reservas[idx].pagada = true;
    reservas[idx].total  = amount; // total pagado (post-descuento)
    reservas[idx].actualizada = now;
    writeJSON("reservas", reservas);
  }

  // Persistir factura/orden final
  ORDEN.totalPagar = amount;
  writeJSON("orden", ORDEN);

  // Mostrar éxito
  $("#ok-pnr").textContent = ORDEN.pnr;
  $("#ok-id").textContent  = payId;
  $("#ok-auth").textContent= auth;
  $("#ok").classList.remove("hidden");
  $("#checkout").style.display = "none";
  $("#ok").scrollIntoView({behavior:"smooth", block:"center"});
}

/* ==== Validaciones tarjeta ==== */
function validarTarjeta(){
  const name = ($("#c-name").value||"").trim();
  const num  = clean($("#c-num").value);
  const exp  = ($("#c-exp").value||"").trim();
  const cvv  = ($("#c-cvv").value||"").trim();

  if(!name) return show("#card-msg","Escribe el nombre del titular.");
  if(num.length<13 || !luhn(num)) return show("#card-msg","Número de tarjeta inválido.");
  if(!/^\d{2}\/\d{2}$/.test(exp)) return show("#card-msg","Vencimiento inválido (usa MM/AA).");
  const [mm,yy] = exp.split("/").map(x=>parseInt(x,10));
  if(mm<1 || mm>12) return show("#card-msg","Mes inválido.");
  if(!validExpiry(mm,yy)) return show("#card-msg","La tarjeta está vencida.");
  if(!/^\d{3,4}$/.test(cvv)) return show("#card-msg","CVV inválido.");

  // Guardar últimos 4 si el usuario desea
  if($("#c-save").checked){
    localStorage.setItem("last_card", JSON.stringify({ last4: num.slice(-4), name }));
  }
  return true;
}
function getCardMasked(){
  const saved = readJSON("last_card");
  const last4 = saved?.last4 || clean($("#c-num").value).slice(-4);
  return `**** **** **** ${last4}`;
}

/* ==== Inputs máscara ==== */
function formatCard(e){
  let v = clean(e.target.value).slice(0,16);
  e.target.value = v.replace(/(.{4})/g,"$1 ").trim();
}
function formatExp(e){
  let v = e.target.value.replace(/[^\d]/g,"").slice(0,4);
  if(v.length>=3) v = v.slice(0,2) + "/" + v.slice(2);
  e.target.value = v;
}

/* ==== Hold timer ==== */
function tickHold(){
  const t = setInterval(()=>{
    HOLD_T--;
    if(HOLD_T<=0){
      clearInterval(t);
      $("#hold").textContent = "00:00";
      show("#pay-msg","El tiempo expiró. Vuelve a cotizar antes de pagar.", false, true);
      $("#btn-pagar").disabled = true;
      return;
    }
    const m = String(Math.floor(HOLD_T/60)).padStart(2,"0");
    const s = String(HOLD_T%60).padStart(2,"0");
    $("#hold").textContent = `${m}:${s}`;
  }, 1000);
}

/* ==== Utils ==== */
function show(sel, text, ok=false, warn=false){
  const el = $(sel); el.textContent = text; el.style.color = ok ? "#065f46" : (warn ? "#b45309" : "#b91c1c");
  setTimeout(()=>{ if(sel!=="#pay-msg") el.textContent=""; }, 4000);
}
function readJSON(k){ try{ return JSON.parse(localStorage.getItem(k) || "null"); }catch{ return null; } }
function writeJSON(k,v){ localStorage.setItem(k, JSON.stringify(v)); }
function clean(s){ return String(s||"").replace(/\D/g,""); }
function luhn(num){
  let sum=0, alt=false;
  for(let i=num.length-1;i>=0;i--){
    let n = parseInt(num[i],10);
    if(alt){ n*=2; if(n>9) n-=9; }
    sum += n; alt = !alt;
  }
  return sum % 10 === 0;
}
function validExpiry(mm,yy){
  // yy en formato AA: convertimos a 2000+AA
  const y = 2000 + yy;
  const last = new Date(y, mm, 0, 23,59,59); // último día del mes
  return last >= new Date();
}
function genId(prefix="ID"){
  const n = Math.floor(100000 + Math.random()*900000);
  return `${prefix}-${n}`;
}
function genAuth(){
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({length:8}, ()=> chars[Math.floor(Math.random()*chars.length)]).join("");
}
function formatDate(iso){
  if(!iso) return "—";
  try{
    const d = new Date(iso);
    return d.toLocaleDateString("es-CO",{weekday:"long",day:"2-digit",month:"short"});
  }catch{ return "—"; }
}
