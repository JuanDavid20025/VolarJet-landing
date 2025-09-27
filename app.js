/* ===== VolarJet – Extras y servicios ===== */
const ctx       = JSON.parse(localStorage.getItem("searchCtx") || "{}");   // ruta, pax
const seleccion = JSON.parse(localStorage.getItem("seleccion") || "{}");   // {vuelo, tarifa, precio}
const asientos  = JSON.parse(localStorage.getItem("asientos") || "{}");    // {asientos,totalAsientos}

function COP(n){ return new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0}).format(n) }
function $(sel,root=document){ return root.querySelector(sel); }
function $all(sel,root=document){ return Array.from(root.querySelectorAll(sel)); }

const resumen = $("#resumen");
const boxVuelo= $("#box-vuelo");
const sumPax  = $("#sum-pax");
const sumBags = $("#sum-bags");
const sumPrio = $("#sum-prio");
const sumSeg  = $("#sum-seg");
const sumTotal= $("#sum-total");
const btnNext = $("#continuar");

const paxCount = (ctx?.pax?.adt || 1) + (ctx?.pax?.chd || 0); // infantes no cuentan

// Estado de extras
const state = {
  bag_carry: 0,  // mano 10kg (precio demo 0)
  bag_23: 0,     // 60k c/u
  bag_32: 0,     // 90k c/u
  prio_boarding: false, // 25k por pax
  prio_fast: false,     // 35k por pax
  seguro: "ninguno",    // ninguno/basico/full
};

const PRICES = {
  bag_carry: 0,
  bag_23: 60000,
  bag_32: 90000,
  prio_boarding: 25000,
  prio_fast: 35000,
  seguro: { ninguno:0, basico:12000, full:25000 }
};

function init(){
  // Encabezado
  const v = seleccion?.vuelo || {};
  const ruta = v.o && v.d ? `${v.o} → ${v.d}` : "Ruta no definida";
  const fechaTxt = v.fecha ? new Date(v.fecha).toLocaleDateString("es-CO",{weekday:"long",day:"2-digit",month:"short"}) : "";
  const horaTxt = v.dep && v.arr ? `· ${v.dep} – ${v.arr}` : "";
  resumen.textContent = `${ruta} ${horaTxt} ${fechaTxt ? "· "+fechaTxt : ""}`;

  boxVuelo.innerHTML = `
    <div class="row"><span>Vuelo</span><strong>${v.id || "—"}</strong></div>
    <div class="row"><span>Ruta</span><strong>${ruta}</strong></div>
    <div class="row"><span>Fecha</span><strong>${fechaTxt || "—"}</strong></div>
    <div class="row"><span>Pasajeros</span><strong>${paxCount}</strong></div>
  `;
  sumPax.textContent = String(paxCount);

  // Listeners cantidades equipaje
  $all(".qty").forEach(q=>{
    const key = q.getAttribute("data-key");
    const valEl = $(".qval", q);
    q.addEventListener("click", (e)=>{
      const op = e.target.getAttribute("data-op");
      if(!op) return;
      const cur = state[key] || 0;
      const next = Math.max(0, cur + (op === "+" ? 1 : -1));
      state[key] = next;
      valEl.textContent = String(next);
      render();
    });
  });

  // Prioridad
  $("#prio-boarding").addEventListener("change", e=>{
    state.prio_boarding = e.target.checked;
    render();
  });
  $("#prio-fast").addEventListener("change", e=>{
    state.prio_fast = e.target.checked;
    render();
  });

  // Seguros
  $all('input[name="seguro"]').forEach(r=>{
    r.addEventListener("change", ()=>{
      state.seguro = $('input[name="seguro"]:checked').value;
      render();
    });
  });

  // Continuar
  btnNext.addEventListener("click", ()=>{
    const totals = computeTotals();
    const payload = {
      vuelo: seleccion?.vuelo || null,
      pax: ctx?.pax || null,
      extras: { ...state },
      totals
    };
    localStorage.setItem("extras", JSON.stringify(payload));
    // Ir a pago
    location.href = "../pago_resumen/index.html";
  });

  render();
}

function computeTotals(){
  // Equipaje: suma (cantidad * precio)
  const bags = (state.bag_carry * PRICES.bag_carry) +
               (state.bag_23 * PRICES.bag_23) +
               (state.bag_32 * PRICES.bag_32);
  // Prioridad: precio por pax
  const prio = (state.prio_boarding ? PRICES.prio_boarding * paxCount : 0) +
               (state.prio_fast ? PRICES.prio_fast * paxCount : 0);
  // Seguros: por pax
  const seg = PRICES.seguro[state.seguro] * paxCount;

  return {
    bags, prio, seg,
    total: bags + prio + seg
  };
}

function render(){
  const t = computeTotals();
  sumBags.textContent = COP(t.bags);
  sumPrio.textContent = COP(t.prio);
  sumSeg.textContent  = COP(t.seg);
  sumTotal.textContent= COP(t.total);
}

init();
