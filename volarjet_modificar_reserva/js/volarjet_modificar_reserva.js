// Fallback simple para el logo por si cambia la ruta
(function () {
  const el = document.getElementById('vjLogo');
  if (!el) return;
  const tries = ["../../assets/img/logo.png", "img/logo.png", "../img/logo.png"];
  let i = 0;
  function tryNext() {
    if (i >= tries.length) return;
    const candidate = tries[i++];
    const probe = new Image();
    probe.onload = () => { el.src = candidate; };
    probe.onerror = tryNext;
    probe.src = candidate + "?v=" + Date.now();
  }
  el.addEventListener('error', tryNext, { once: true });
})();

// --- Demo data (puede reemplazarse por backend) ---
const sample = [{
  codigo: "VJ8K2M",
  email: "juan@demo.com",
  apellido: "Perez",
  estado: "Confirmada",
  contacto: "juan@demo.com",
  pasajeros: [{id:"PX1", nombre:"Juan", apellido:"Perez", doc:"12345678"}],
  segmentos: [{id:"S1", origen:"BOG", destino:"MDE", fecha:"2025-11-20", salida:"08:00", llegada:"09:00", cabina:"Economy"}],
  extras: {equipaje:1, asiento:"12C", prioridad:false, seguro:false},
  precio: 280000
}];

// Persistencia local
if(!localStorage.getItem("volarjet_bookings")){
  localStorage.setItem("volarjet_bookings", JSON.stringify(sample));
}

const $ = (s)=>document.querySelector(s);
const bookings = ()=> JSON.parse(localStorage.getItem("volarjet_bookings")||"[]");
const saveBookings = (arr)=> localStorage.setItem("volarjet_bookings", JSON.stringify(arr));

let current = null; // reserva en edición

function formatCOP(v){
  return new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(v);
}

// Buscar
$("#formBuscar").addEventListener("submit", (e)=>{
  e.preventDefault();
  const code = $("#codigo").value.trim().toUpperCase();
  const key  = $("#key").value.trim().toLowerCase();
  const bk = bookings().find(b =>
    b.codigo.toUpperCase() === code &&
    (b.apellido.toLowerCase() === key || (b.email||'').toLowerCase() === key)
  );
  if(!bk){
    alert("No encontramos la reserva. Verifica el código y el correo/apellido.");
    return;
  }
  loadBooking(bk);
});

// Cargar demo
$("#demoLoad").addEventListener("click", ()=> loadBooking(bookings()[0]));

function loadBooking(bk){
  current = JSON.parse(JSON.stringify(bk)); // clone
  $("#bookingWrap").style.display = "block";
  $("#bkHeader").textContent = "Reserva — " + bk.codigo;
  const st = $("#bkStatus");
  st.textContent = bk.estado;
  st.className = "status " + (bk.estado==="Confirmada" ? "confirmed" : "cancelled");

  // Itinerario
  const tbl = $("#tblSeg");
  tbl.innerHTML = "<tr><th>Ruta</th><th>Fecha</th><th>Horario</th><th>Cabina</th><th>Acción</th></tr>";
  bk.segmentos.forEach(seg=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><b>${seg.origen} → ${seg.destino}</b></td>
      <td>${seg.fecha}</td>
      <td>${seg.salida} — ${seg.llegada}</td>
      <td>${seg.cabina}</td>
      <td><button class="btn btn-alt" data-id="${seg.id}">Cambiar</button></td>`;
    tbl.appendChild(tr);
  });
  tbl.querySelectorAll("button").forEach(b=> b.addEventListener("click", ()=> openReprog(b.getAttribute("data-id")) ));

  // Pasajeros
  const pax = $("#pasajeros");
  pax.innerHTML = "";
  bk.pasajeros.forEach(px=>{
    const box = document.createElement("div");
    box.className = "card";
    box.style.padding="12px";
    box.innerHTML = `
      <div class="grid-2">
        <div class="field"><label>Nombre</label><input value="${px.nombre}" data-k="nombre" data-id="${px.id}"></div>
        <div class="field"><label>Apellido</label><input value="${px.apellido}" data-k="apellido" data-id="${px.id}"></div>
        <div class="field"><label>Documento</label><input value="${px.doc}" data-k="doc" data-id="${px.id}"></div>
        <div class="field"><label>Acción</label><button class="btn btn-alt btnDelPax" data-id="${px.id}">Eliminar</button></div>
      </div>`;
    pax.appendChild(box);
  });
  pax.querySelectorAll(".btnDelPax").forEach(b=> b.addEventListener("click", ()=> removePassenger(b.getAttribute("data-id")) ));

  // Extras
  $("#equipaje").value = bk.extras.equipaje;
  $("#asiento").value = bk.extras.asiento || "";
  $("#prioridad").checked = !!bk.extras.prioridad;
  $("#seguro").checked = !!bk.extras.seguro;

  // Contacto
  $("#contacto").value = bk.contacto || bk.email || "";
}

function removePassenger(pid){
  if(!confirm("¿Eliminar pasajero de la reserva?")) return;
  current.pasajeros = current.pasajeros.filter(p=> p.id !== pid);
  const all = bookings().map(b => b.codigo===current.codigo ? current : b);
  saveBookings(all);
  loadBooking(current);
}

// Agregar pasajero (demo)
$("#btnAddPax").addEventListener("click", ()=>{
  const n = prompt("Nombre del pasajero"); if(!n) return;
  const a = prompt("Apellido del pasajero"); if(!a) return;
  current.pasajeros.push({id:"PX"+Math.random().toString(36).slice(2,6), nombre:n, apellido:a, doc:""});
  const all = bookings().map(b => b.codigo===current.codigo ? current : b);
  saveBookings(all);
  loadBooking(current);
});

// Guardar cambios
$("#btnGuardar").addEventListener("click", ()=>{
  if(!current) return;
  // update from form
  current.extras = {
    equipaje: parseInt($("#equipaje").value||"0"),
    asiento: $("#asiento").value.trim(),
    prioridad: $("#prioridad").checked,
    seguro: $("#seguro").checked
  };
  current.contacto = $("#contacto").value.trim();

  // pax edits
  document.querySelectorAll("#pasajeros input").forEach(inp=>{
    const id = inp.getAttribute("data-id"), k = inp.getAttribute("data-k");
    const px = current.pasajeros.find(p=>p.id===id);
    if(px) px[k] = inp.value;
  });

  const all = bookings().map(b => b.codigo===current.codigo ? current : b);
  saveBookings(all);
  alert("Cambios guardados en la reserva.");
});

// Cancelar reserva
$("#btnCancelar").addEventListener("click", ()=>{
  if(!current) return;
  if(!confirm("¿Confirmas la cancelación de la reserva?")) return;
  current.estado = "Cancelada";
  const all = bookings().map(b => b.codigo===current.codigo ? current : b);
  saveBookings(all);
  loadBooking(current);
});

// Imprimir
$("#btnImprimir").addEventListener("click", ()=> window.print());

// Enviar al correo (simulado)
$("#btnEnviar").addEventListener("click", ()=>{
  if(!current) return;
  alert("Se envió la confirmación al correo: " + (current.contacto || current.email) + " (simulado).");
});

// --- Reprogramar ---
const modal = $("#modalReprog");
let segToChange = null;

function openReprog(segId){
  segToChange = segId;
  $("#nuevaFecha").value = current.segmentos.find(s=>s.id===segId).fecha;
  $("#nuevaCabina").value = current.segmentos.find(s=>s.id===segId).cabina;
  suggestOptions();
  modal.classList.add("open");
}
$("#closeReprog").addEventListener("click", ()=> modal.classList.remove("open"));
$("#nuevaFecha").addEventListener("change", suggestOptions);
$("#nuevaCabina").addEventListener("change", suggestOptions);

function suggestOptions(){
  const cont = $("#sugerencias");
  cont.innerHTML = "";
  const seg = current.segmentos.find(s=>s.id===segToChange);
  if(!seg) return;
  const date = $("#nuevaFecha").value || seg.fecha;
  const cab = $("#nuevaCabina").value || seg.cabina;

  // 3 horarios fijos para demo
  const horarios = ["08:00-09:00","14:00-15:00","19:30-20:30"];
  horarios.forEach((h, i)=>{
    const [sal,lleg] = h.split("-");
    const price = 200000 + i*60000 + (cab==="Business"?180000:(cab==="Premium Economy"?80000:0));
    const el = document.createElement("div");
    el.className = "card";
    el.style.padding="10px";
    el.innerHTML = `<b>${seg.origen} → ${seg.destino}</b> • ${date} • ${sal} — ${lleg} • ${cab}
      <span class="badge" style="margin-left:6px">${formatCOP(price)}</span>
      <div class="actions" style="margin-top:6px"><button class="btn btn-primary" data-s="${sal}" data-l="${lleg}" data-p="${price}">Seleccionar</button></div>`;
    el.querySelector("button").addEventListener("click", (e)=>{
      cont.querySelectorAll("button").forEach(b=> b.disabled=false);
      e.target.disabled=true;
      el.dataset.selected = "1";
    });
    cont.appendChild(el);
  });
}

$("#confirmReprog").addEventListener("click", ()=>{
  const seg = current.segmentos.find(s=>s.id===segToChange);
  const selected = Array.from($("#sugerencias").children).find(c=> c.dataset.selected==="1");
  if(!seg || !selected){ alert("Selecciona una opción de horario."); return; }

  // Read selected values
  const btn = selected.querySelector("button");
  seg.fecha = $("#nuevaFecha").value || seg.fecha;
  seg.salida = btn.getAttribute("data-s");
  seg.llegada= btn.getAttribute("data-l");
  seg.cabina = $("#nuevaCabina").value || seg.cabina;

  // Persist
  const all = bookings().map(b => b.codigo===current.codigo ? current : b);
  saveBookings(all);
  modal.classList.remove("open");
  loadBooking(current);
  alert("Vuelo reprogramado correctamente.");
});

// Fechas mínimas
const today = new Date().toISOString().split("T")[0];
$("#nuevaFecha").min = today;
