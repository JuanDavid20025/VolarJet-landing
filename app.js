/* ===== VolarJet – Gestionar reservas ===== */
const $ = (s, r=document) => r.querySelector(s);
const $all = (s, r=document) => Array.from(r.querySelectorAll(s));
const COP = n => new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0}).format(n);

// Demo: leemos orden/selección/asientos guardados en el flujo
const orden     = JSON.parse(localStorage.getItem("orden") || "{}");
const seleccion = JSON.parse(localStorage.getItem("seleccion") || "{}");
const asientos  = JSON.parse(localStorage.getItem("asientos") || "{}");

// BUSCAR
$("#btn-buscar").addEventListener("click", ()=>{
  const pnr = ($("#q-pnr").value || "").trim().toUpperCase();
  const ln  = ($("#q-last").value || "").trim().toUpperCase();
  const savedPNR = (orden?.pnr) ? String(orden.pnr).toUpperCase() : (localStorage.getItem("pnr") || "ABC123");
  const titular = (orden?.contacto?.nombre || "Pasajero Demo").split(" ").slice(-1)[0].toUpperCase();

  if(!pnr){ $("#msg").textContent = "Ingresa el PNR."; return; }
  if(ln && ln !== titular){ $("#msg").textContent = "Apellido no coincide."; return; }

  if(pnr !== savedPNR.toUpperCase()){ $("#msg").textContent = "Reserva no encontrada."; return; }

  $("#msg").textContent = "Reserva encontrada ✅";
  renderReserva();
});

function renderReserva(){
  $("#resultado").classList.remove("hidden");
  const v = orden?.vuelo || seleccion?.vuelo || {};
  const pax = orden?.pax || { adt:1, chd:0, inf:0 };
  const tarifa = orden?.tarifa || seleccion?.tarifa || "—";

  $("#r-pnr").textContent = (orden?.pnr) || (localStorage.getItem("pnr") || "ABC123");
  $("#r-tarifa").textContent = tarifa;

  // Detalle vuelo
  const ruta = v.o && v.d ? `${v.o} → ${v.d}` : "—";
  const fecha = v.fecha ? new Date(v.fecha).toLocaleDateString("es-CO",{weekday:"long",day:"2-digit",month:"short"}) : "—";
  const hora = v.dep && v.arr ? `${v.dep} – ${v.arr}` : "—";
  $("#r-box").innerHTML = `
    <div class="row"><span>Vuelo</span><strong>${v.id || "—"}</strong></div>
    <div class="row"><span>Ruta</span><strong>${ruta}</strong></div>
    <div class="row"><span>Fecha</span><strong>${fecha}</strong></div>
    <div class="row"><span>Hora</span><strong>${hora}</strong></div>
    <div class="row"><span>Cabina</span><strong>${orden?.cabina || "Economy"}</strong></div>
  `;

  // Pasajeros
  const totalPax = (pax.adt||1)+(pax.chd||0);
  const seats = (asientos?.asientos||[]).map(s=>s.id);
  const ul = $("#r-pax"); ul.innerHTML = "";
  for(let i=0;i<totalPax;i++){
    const li = document.createElement("li");
    li.innerHTML = `<span>Pasajero ${i+1}</span><strong>${seats[i] || "—"}</strong>`;
    ul.appendChild(li);
  }
  if((pax.inf||0)>0){
    const li = document.createElement("li");
    li.innerHTML = `<span>Infantes</span><strong>${pax.inf}</strong>`;
    ul.appendChild(li);
  }

  // Estimación de costos de cambio (DEMO)
  const precioUnit = Number(seleccion?.precio || 0);
  const dif = Math.round(precioUnit * 0.15);   // 15% demo
  const pen = tarifa === "Plus" ? 0 : tarifa === "Flex" ? 0 : 45000; // demo
  $("#r-dif").textContent = COP(dif);
  $("#r-pen").textContent = COP(pen);
  $("#r-total").textContent = COP(dif + pen);

  bindActions(v, tarifa, dif, pen);
}

// ACCIONES
function bindActions(vuelo, tarifa, dif, pen){
  // Ver itinerario
  $("#btn-itin").onclick = ()=>{
    const d = $("#dlg-itin");
    const fecha = vuelo.fecha ? new Date(vuelo.fecha).toLocaleDateString("es-CO",{weekday:"long",day:"2-digit",month:"short"}) : "—";
    $("#itin-box").innerHTML = `
      <div class="row"><span>Vuelo</span><strong>${vuelo.id || "—"}</strong></div>
      <div class="row"><span>Ruta</span><strong>${vuelo.o || "—"} → ${vuelo.d || "—"}</strong></div>
      <div class="row"><span>Fecha</span><strong>${fecha}</strong></div>
      <div class="row"><span>Hora</span><strong>${vuelo.dep || "—"} – ${vuelo.arr || "—"}</strong></div>
      <div class="row"><span>Cabina</span><strong>${orden?.cabina || "Economy"}</strong></div>
    `;
    d.showModal();
  };

  // Cambiar asientos
  $("#btn-asientos").onclick = ()=>{
    location.href = "../seleccion_asientos/index.html";
  };

  // Cambiar vuelo (fecha/hora)
  $("#btn-cambiar").onclick = ()=>{
    const d = $("#dlg-cambio");
    const today = new Date().toISOString().slice(0,10);
    $("#chg-fecha").min = today;
    d.showModal();
  };
  $("#do-cambiar").onclick = (e)=>{
    e.preventDefault();
    const f = $("#chg-fecha").value;
    const h = $("#chg-hora").value;
    if(!f || !h){ alert("Selecciona fecha y hora."); return; }
    // DEMO: aplicar cambio, sumar costos estimados
    const newVuelo = { ...(orden?.vuelo || vuelo), fecha: f, dep: h, arr: estHoraLlegada(h) };
    const newOrden = { ...orden, vuelo: newVuelo, cambio: { dif, pen, total: dif+pen } };
    localStorage.setItem("orden", JSON.stringify(newOrden));
    $("#dlg-cambio").close();
    alert("Cambio aplicado (demo). Se ha actualizado la fecha/hora.");
    renderReserva();
  };

  // Cancelar → voucher o reembolso (demo)
  $("#btn-cancelar").onclick = ()=>{
    const d = $("#dlg-confirm");
    $("#conf-title").textContent = "Cancelar reserva";
    $("#conf-text").textContent = tarifa==="Plus"
      ? "¿Deseas cancelar? Generaremos un voucher por el 100% para usar en 12 meses."
      : "¿Deseas cancelar? Aplican penalidades y se generará un voucher parcial (demo).";
    d.showModal();
    $("#conf-yes").onclick = ()=>{
      const voucher = "VJ-" + Math.random().toString(36).slice(2,8).toUpperCase();
      const o = JSON.parse(localStorage.getItem("orden")||"{}");
      o.estado = "CANCELADA";
      o.voucher = voucher;
      localStorage.setItem("orden", JSON.stringify(o));
      $("#dlg-confirm").close();
      alert(`Reserva cancelada. Voucher: ${voucher}`);
      renderReserva();
    };
  };
}

function estHoraLlegada(hhmm){
  // sumar 1h25m demo
  const [hh,mm] = hhmm.split(":").map(Number);
  const d = new Date(); d.setHours(hh, mm, 0, 0);
  d.setMinutes(d.getMinutes() + 85);
  return d.toTimeString().slice(0,5);
}
