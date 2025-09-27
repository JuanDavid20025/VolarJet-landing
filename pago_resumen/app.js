/* ===== VolarJet – Pago y resumen ===== */

function COP(n){ return new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0}).format(n) }
function qs(id){ return document.getElementById(id); }

const ctx        = JSON.parse(localStorage.getItem("searchCtx") || "{}");      // ruta, pax, cabina
const seleccion  = JSON.parse(localStorage.getItem("seleccion") || "{}");      // {vuelo, tarifa, precio}
const asientos   = JSON.parse(localStorage.getItem("asientos") || "{}");       // {asientos:[...], totalAsientos:number}

const resumen    = qs("resumen");
const sumTarifa  = qs("sum-tarifa");
const sumPax     = qs("sum-pax");
const sumSubTar  = qs("sum-subtarifa");
const sumAsi     = qs("sum-asientos");
const sumIVA     = qs("sum-iva");
const sumTotal   = qs("sum-total");
const boxVuelo   = qs("box-vuelo");
const btnPagar   = qs("btn-pagar");

/* ====== INIT ====== */
function init(){
  // Encabezado
  const v = seleccion?.vuelo || {};
  const ruta = v.o && v.d ? `${v.o} → ${v.d}` : "Ruta no definida";
  const fechaTxt = v.fecha ? new Date(v.fecha).toLocaleDateString("es-CO",{weekday:"long",day:"2-digit",month:"short"}) : "";
  const horaTxt = v.dep && v.arr ? `· ${v.dep} – ${v.arr}` : "";
  resumen.textContent = `${ruta} ${horaTxt} ${fechaTxt ? "· "+fechaTxt : ""}`;

  // Caja vuelo
  boxVuelo.innerHTML = `
    <div class="row"><span>Vuelo</span><strong>${v.id || "—"}</strong></div>
    <div class="row"><span>Ruta</span><strong>${ruta}</strong></div>
    <div class="row"><span>Fecha</span><strong>${fechaTxt || "—"}</strong></div>
    <div class="row"><span>Cabina</span><strong>${ctx.cabina || "Economy"}</strong></div>
  `;

  // Cálculos
  const paxCount = (ctx?.pax?.adt || 1) + (ctx?.pax?.chd || 0);
  sumPax.textContent = String(paxCount);

  const tarifaNombre = seleccion?.tarifa || "—";
  sumTarifa.textContent = tarifaNombre;

  const precioUnit = Number(seleccion?.precio || 0);     // por pasajero
  const subtotalTarifa = precioUnit * paxCount;

  const totalAsientos = Number(asientos?.totalAsientos || 0);

  const base = subtotalTarifa + totalAsientos;
  const iva  = Math.round(base * 0.19); // IVA demostrativo

  sumSubTar.innerText = COP(subtotalTarifa);
  sumAsi.innerText    = COP(totalAsientos);
  sumIVA.innerText    = COP(iva);
  sumTotal.innerText  = COP(base + iva);

  // Toggle campos
  qs("chk-ff").addEventListener("change", e=>{
    qs("p-ff").classList.toggle("hidden", !e.target.checked);
  });
  qs("chk-factura").addEventListener("change", e=>{
    qs("c-nit").classList.toggle("hidden", !e.target.checked);
  });

  // Tabs de pago
  document.querySelectorAll(".tab").forEach(t=>{
    t.addEventListener("click", ()=>{
      document.querySelectorAll(".tab").forEach(x=>x.classList.remove("tab-active"));
      t.classList.add("tab-active");
      const mode = t.getAttribute("data-pay");
      document.querySelectorAll(".pay-pane").forEach(p=>p.classList.add("hidden"));
      qs(`pay-${mode}`).classList.remove("hidden");
    });
  });

  // Cupón simple DEMO
  qs("btn-cup").addEventListener("click", ()=>{
    const code = qs("cup-code").value.trim().toUpperCase();
    const msg = qs("cup-msg");
    if(!code){ msg.textContent = "Ingresa un código."; return; }
    if(code === "VOLAR10"){
      // 10% sobre subtotal de tarifas
      const desc = Math.round(subtotalTarifa * 0.10);
      sumSubTar.innerText = COP(subtotalTarifa - desc);
      sumTotal.innerText  = COP(base - desc + iva);
      msg.textContent = `Cupón aplicado: -${COP(desc)}.`;
    }else{
      msg.textContent = "Código inválido o expirado.";
    }
  });

  // Validación básica para habilitar botón pagar
  const required = ["p-nombres","p-apellidos","p-doc","c-email","c-tel"];
  const validate = ()=>{
    const okForm = required.every(id => qs(id).value.trim().length > 1);
    const okTyC  = qs("chk-tyc").checked;
    btnPagar.disabled = !(okForm && okTyC);
  };
  required.forEach(id => qs(id).addEventListener("input", validate));
  qs("chk-tyc").addEventListener("change", validate);

  // Botón pagar (simulado)
  btnPagar.addEventListener("click", ()=>{
    const order = {
      vuelo: v,
      pax: ctx.pax,
      cabina: ctx.cabina,
      tarifa: tarifaNombre,
      precioUnit,
      paxCount,
      subtotalTarifa: parseCurrency(sumSubTar.innerText),
      totalAsientos,
      iva,
      totalPagar: parseCurrency(sumTotal.innerText),
      contacto: {
        nombre: `${qs("p-nombres").value} ${qs("p-apellidos").value}`,
        email: qs("c-email").value,
        tel: qs("c-tel").value,
      }
    };
    localStorage.setItem("orden", JSON.stringify(order));
    alert("Pago aprobado ✅\nSe ha generado tu reserva. Recibirás el itinerario por correo.");
    // location.href = "../confirmacion/index.html";
  });
}

function parseCurrency(str){
  // Convierte "COP $123.456" o "$123.456" a número
  return Number(String(str).replace(/[^\d]/g,"")) || 0;
}

init();
