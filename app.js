/* ===== Confirmación de reserva – VolarJet ===== */
function COP(n){ return new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0}).format(n) }
function id(x){ return document.getElementById(x); }

const orden = JSON.parse(localStorage.getItem("orden") || "{}");   // guardada en pago_resumen
const asientos = JSON.parse(localStorage.getItem("asientos") || "{}");

function randomPNR(){
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let p = "";
  for(let i=0;i<6;i++){ p += chars[Math.floor(Math.random()*chars.length)]; }
  return p;
}

function init(){
  // PNR (si no viene, lo genero)
  const pnr = orden?.pnr || randomPNR();
  id("pnr").textContent = pnr;
  id("bp-pnr").textContent = pnr;

  // Vuelo / ruta
  const v = orden?.vuelo || {};
  const ruta = v.o && v.d ? `${v.o} → ${v.d}` : "—";
  const fecha = v.fecha ? new Date(v.fecha).toLocaleDateString("es-CO",{weekday:"long",day:"2-digit",month:"short"}) : "—";
  const hora = v.dep && v.arr ? `${v.dep} – ${v.arr}` : "—";

  id("vuelo").innerHTML = `
    <div class="row"><span>Vuelo</span><strong>${v.id || "—"}</strong></div>
    <div class="row"><span>Ruta</span><strong>${ruta}</strong></div>
    <div class="row"><span>Fecha</span><strong>${fecha}</strong></div>
    <div class="row"><span>Hora</span><strong>${hora}</strong></div>
    <div class="row"><span>Cabina</span><strong>${orden?.cabina || "Economy"}</strong></div>
  `;

  // Pasajeros + asientos
  const pax = orden?.pax || { adt:1, chd:0, inf:0 };
  const seatList = (asientos?.asientos || []).map(s => s.id);
  const lista = id("listaPax");
  lista.innerHTML = "";
  const totalPax = (pax.adt||1) + (pax.chd||0);
  for(let i=0;i<totalPax;i++){
    const seat = seatList[i] || "Pendiente";
    const li = document.createElement("li");
    li.innerHTML = `<span>Pasajero ${i+1}</span><strong>${seat}</strong>`;
    lista.appendChild(li);
  }
  if((pax.inf||0) > 0){
    const li = document.createElement("li");
    li.innerHTML = `<span>Infantes</span><strong>${pax.inf}</strong>`;
    lista.appendChild(li);
  }

  // Pago
  const total = orden?.totalPagar || 0;
  id("total").textContent = COP(total);
  id("detallePago").textContent = `Tarifa ${orden?.tarifa || "—"} • Asientos ${COP(orden?.totalAsientos || 0)} • IVA ${COP(orden?.iva || 0)}`;

  // Boarding preview
  id("bp-nombre").textContent = orden?.contacto?.nombre || "Pasajero(a)";
  id("bp-vuelo").textContent  = v.id || "—";
  id("bp-origen").textContent = v.o || "—";
  id("bp-dest").textContent   = v.d || "—";
  id("bp-salida").textContent = v.dep || "—";
  id("bp-seat").textContent   = seatList[0] || "—";

  // Navegación
  id("btn-checkin").addEventListener("click", ()=>{
    alert("Redirigiendo a Check-in (demo).");
    // location.href = "../checkin_web/index.html";
  });
  id("btn-gestionar").addEventListener("click", ()=>{
    alert("Ir a Gestión de reservas (demo).");
    // location.href = "../gestionar_reservas/index.html";
  });
}

init();
