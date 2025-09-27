/* ===== VolarJet – Landing ===== */
const $  = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));

const AIRPORTS = [
  { code:"BOG", name:"Bogotá (BOG)" },
  { code:"MDE", name:"Medellín (MDE)" },
  { code:"CTG", name:"Cartagena (CTG)" },
  { code:"CLO", name:"Cali (CLO)" },
  { code:"SMR", name:"Santa Marta (SMR)" },
];

// Ofertas demo (breve)
const OFFERS = [
  { o:"BOG", d:"CTG", titulo:"Bogotá → Cartagena", precio:119900, antes:189900, off:37, vence:"2025-10-10", code:"VJVERDE" },
  { o:"BOG", d:"MDE", titulo:"Bogotá → Medellín",  precio:109900, antes:159900, off:31, vence:"2025-10-12", code:"BANCOX10" },
  { o:"MDE", d:"SMR", titulo:"Medellín → Sta. Marta", precio:129900, antes:209900, off:38, vence:"2025-10-09", code:"VJVERDE" },
];

function COP(n){ return new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0}).format(n); }
function fmtFecha(iso){ return new Date(iso).toLocaleDateString("es-CO",{day:"2-digit",month:"short"}); }

/* ===== Init selects y fechas ===== */
(function init(){
  const so = $("#q-origen"), sd = $("#q-destino");
  AIRPORTS.forEach(a => {
    so.add(new Option(a.name, a.code));
    sd.add(new Option(a.name, a.code));
  });
  so.value = "BOG"; sd.value = "CTG";

  const today = new Date().toISOString().slice(0,10);
  $("#q-salida").min = today;
  $("#q-regreso").min = today;
  $("#q-salida").value = today;

  // Render ofertas destacadas
  const list = $("#offers");
  OFFERS.forEach(x=>{
    const el = document.createElement("article");
    el.className = "card offer";
    el.innerHTML = `
      <div class="offer-head">
        <strong>${x.titulo}</strong>
        <span class="badge">${x.off}% OFF</span>
      </div>
      <div class="offer-meta">${x.o} → ${x.d} · Vence ${fmtFecha(x.vence)}</div>
      <div>
        <span class="offer-price">${COP(x.precio)}</span>
        <span class="offer-cut">${COP(x.antes)}</span>
      </div>
      <div class="offer-footer">
        <span class="mini">Código: <strong>${x.code}</strong></span>
        <div>
          <button class="btn ghost" onclick="aplicarCupon('${x.code}')">Usar cupón</button>
          <button class="btn primary" onclick="prefillAndGo('${x.o}','${x.d}')">Reservar</button>
        </div>
      </div>
    `;
    list.appendChild(el);
  });

  // Evento submit buscador rápido
  $("#quick-form").addEventListener("submit", onQuickSearch);
})();

/* ===== Buscar (guarda contexto y navega) ===== */
function onQuickSearch(e){
  e.preventDefault();
  const o = $("#q-origen").value;
  const d = $("#q-destino").value;
  const salida = $("#q-salida").value;
  const regreso = $("#q-regreso").value;
  const adt = Math.max(1, Number($("#q-adt").value||1));
  const chd = Math.max(0, Number($("#q-chd").value||0));
  const inf = Math.max(0, Number($("#q-inf").value||0));
  const cabina = $("#q-cabina").value;
  const msg = $("#q-msg");

  if(!o || !d || o===d){ msg.textContent = "Selecciona origen y destino distintos."; return; }
  if(!salida){ msg.textContent = "Selecciona fecha de salida."; return; }
  msg.textContent = "";

  const ctx = { o, d, fecha: salida, regreso: regreso || null, pax:{ adt, chd, inf }, cabina };
  localStorage.setItem("searchCtx", JSON.stringify(ctx));
  // Puedes ir directo a resultados o al buscador detallado:
  location.href = "./resultados_vuelos/index.html";
}

/* Prefill desde tarjetas de ciudades/ofertas */
function prefillAndGo(o,d){
  const today = new Date().toISOString().slice(0,10);
  const ctx = { o, d, fecha: today, pax:{adt:1,chd:0,inf:0}, cabina:"Economy" };
  localStorage.setItem("searchCtx", JSON.stringify(ctx));
  location.href = "./buscar_reserva/index.html";
}

/* Cupón rápido */
function aplicarCupon(code){
  localStorage.setItem("promoCode", code);
  alert(`Cupón ${code} aplicado. Lo verás en el paso de pago.`);
}
