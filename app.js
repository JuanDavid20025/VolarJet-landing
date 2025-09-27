/* ===== VolarJet – Usuarios (CRUD localStorage) ===== */
const $  = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));

const LS_KEY = "usuarios";
const PAGE_SIZE = 8;

let state = {
  q: "",
  rol: "",
  est: "",
  sort: "nombre-asc",
  page: 1,
  editId: null, // para saber si estamos editando
};

/* ===== Helpers ===== */
const uid = () => "U" + Math.random().toString(36).slice(2, 10).toUpperCase();
const todayISO = () => new Date().toISOString();
const fmtFecha = iso => new Date(iso).toLocaleDateString("es-CO",{day:"2-digit",month:"short",year:"numeric"});

function getUsers(){
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); }
  catch { return []; }
}
function setUsers(arr){
  localStorage.setItem(LS_KEY, JSON.stringify(arr));
}

/* ===== Seed demo ===== */
function seed(){
  const demo = [
    { id:uid(), nombre:"Laura Gómez", correo:"laura@volarjet.com", tel:"+57 3001112233", doc:"CC 10101010", rol:"admin",  estado:"ACTIVO",  creada: todayISO() },
    { id:uid(), nombre:"Carlos Pérez", correo:"carlos@volarjet.com", tel:"+57 3002223344", doc:"CC 20202020", rol:"agente", estado:"ACTIVO",  creada: todayISO() },
    { id:uid(), nombre:"Ana Ramírez", correo:"ana@mail.com",        tel:"+57 3003334455", doc:"CC 30303030", rol:"cliente",estado:"INACTIVO",creada: todayISO() },
    { id:uid(), nombre:"Marta Díaz",  correo:"marta@mail.com",       tel:"+57 3209998877", doc:"CC 40404040", rol:"cliente",estado:"ACTIVO",  creada: todayISO() },
    { id:uid(), nombre:"Agente Norte",correo:"norte@volarjet.com",   tel:"+57 3005556677", doc:"CC 50505050", rol:"agente", estado:"ACTIVO",  creada: todayISO() },
    { id:uid(), nombre:"Admin Ops",   correo:"ops@volarjet.com",     tel:"+57 3111111111", doc:"CC 60606060", rol:"admin",  estado:"INACTIVO",creada: todayISO() },
  ];
  setUsers(demo);
}

/* ===== Render ===== */
function render(){
  const list = $("#list"), empty = $("#empty");
  const all = getUsers();

  // Filtros
  let rows = all.filter(u => {
    const matchesQ = state.q
      ? `${u.nombre} ${u.correo} ${u.tel}`.toLowerCase().includes(state.q)
      : true;
    const matchesRol = state.rol ? u.rol === state.rol : true;
    const matchesEst = state.est ? u.estado === state.est : true;
    return matchesQ && matchesRol && matchesEst;
  });

  // Orden
  rows.sort((a,b)=>{
    if(state.sort === "nombre-asc")  return a.nombre.localeCompare(b.nombre);
    if(state.sort === "nombre-desc") return b.nombre.localeCompare(a.nombre);
    if(state.sort === "fecha-desc")  return (b.creada||"").localeCompare(a.creada||"");
    if(state.sort === "fecha-asc")   return (a.creada||"").localeCompare(b.creada||"");
    if(state.sort === "rol-asc")     return a.rol.localeCompare(b.rol);
    return 0;
  });

  // Paginación
  const total = rows.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  state.page = Math.min(state.page, pages);
  const start = (state.page - 1) * PAGE_SIZE;
  const view = rows.slice(start, start + PAGE_SIZE);

  // Render UI
  list.innerHTML = "";
  empty.style.display = view.length ? "none" : "block";

  view.forEach(u => list.appendChild(card(u)));
  $("#pg-info").textContent = `Página ${state.page} de ${pages} · ${total} usuario(s)`;
  $("#pg-prev").disabled = state.page <= 1;
  $("#pg-next").disabled = state.page >= pages;
}

function card(u){
  const el = document.createElement("article");
  el.className = "user";
  el.innerHTML = `
    <div class="u-head">
      <span class="badge">${u.id}</span>
      <div>
        <div><strong>${u.nombre}</strong> · <span class="role">${cap(u.rol)}</span></div>
        <div class="meta">${u.correo} · ${u.tel || "—"} · ${u.doc || "—"}</div>
        <div class="meta">Creado: ${fmtFecha(u.creada)}</div>
      </div>
    </div>

    <div class="status">
      <span class="dot ${u.estado === "ACTIVO" ? "activo" : "inactivo"}"></span>
      <strong>${u.estado === "ACTIVO" ? "Activo" : "Inactivo"}</strong>
    </div>

    <div class="cta">
      <button class="btn ghost small" data-act="toggle">${u.estado==="ACTIVO"?"Desactivar":"Activar"}</button>
      <button class="btn ghost small" data-act="reset">Reset password</button>
      <button class="btn primary small" data-act="edit">Editar</button>
      <button class="btn small" data-act="delete" style="background:#fee2e2;color:#7f1d1d">Eliminar</button>
    </div>
  `;

  el.querySelectorAll("[data-act]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const act = btn.getAttribute("data-act");
      if(act === "toggle") toggleUser(u.id);
      if(act === "reset")  resetPass(u.id);
      if(act === "edit")   openEdit(u);
      if(act === "delete") removeUser(u.id);
    });
  });
  return el;
}

function cap(s){ return s ? s[0].toUpperCase()+s.slice(1) : s; }

/* ===== CRUD ===== */
function upsertUser(payload){
  const arr = getUsers();
  if(payload.id){
    const i = arr.findIndex(x=>x.id===payload.id);
    if(i>=0){ arr[i] = { ...arr[i], ...payload }; }
  }else{
    arr.unshift({ ...payload, id: uid(), creada: todayISO() });
  }
  setUsers(arr); render();
}

function removeUser(id){
  if(!confirm("¿Eliminar este usuario?")) return;
  setUsers(getUsers().filter(x=>x.id!==id));
  render();
}

function toggleUser(id){
  const arr = getUsers();
  const i = arr.findIndex(x=>x.id===id);
  if(i<0) return;
  arr[i].estado = arr[i].estado==="ACTIVO" ? "INACTIVO" : "ACTIVO";
  setUsers(arr); render();
}

function resetPass(id){
  const tmp = Math.random().toString(36).slice(2,8).toUpperCase();
  alert(`Password temporal para ${id}: ${tmp} (demo)`);
}

/* ===== Modal ===== */
const dlg = $("#dlg");
function openNew(){
  state.editId = null;
  $("#dlg-title").textContent = "Nuevo usuario";
  $("#u-nombre").value = "";
  $("#u-correo").value = "";
  $("#u-tel").value = "";
  $("#u-doc").value = "";
  $("#u-rol").value = "cliente";
  $("#u-estado").value = "ACTIVO";
  dlg.showModal();
}
function openEdit(u){
  state.editId = u.id;
  $("#dlg-title").textContent = `Editar: ${u.nombre}`;
  $("#u-nombre").value = u.nombre || "";
  $("#u-correo").value = u.correo || "";
  $("#u-tel").value    = u.tel || "";
  $("#u-doc").value    = u.doc || "";
  $("#u-rol").value    = u.rol || "cliente";
  $("#u-estado").value = u.estado || "ACTIVO";
  dlg.showModal();
}
$("#btn-save").addEventListener("click", (e)=>{
  e.preventDefault();
  const payload = {
    id: state.editId,
    nombre: $("#u-nombre").value.trim(),
    correo: $("#u-correo").value.trim(),
    tel: $("#u-tel").value.trim(),
    doc: $("#u-doc").value.trim(),
    rol: $("#u-rol").value,
    estado: $("#u-estado").value,
  };
  if(!payload.nombre || !payload.correo){
    alert("Nombre y correo son obligatorios."); return;
  }
  upsertUser(payload);
  dlg.close();
});

/* ===== Import/Export ===== */
function exportJSON(){
  const data = JSON.stringify(getUsers(), null, 2);
  const blob = new Blob([data], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "usuarios.json"; a.click();
  URL.revokeObjectURL(url);
}
async function importJSON(file){
  try{
    const text = await file.text();
    const rows = JSON.parse(text);
    if(!Array.isArray(rows)) throw new Error("Formato inválido");
    // Normalización mínima
    const norm = rows.map(x => ({
      id: x.id || uid(),
      nombre: String(x.nombre||"").trim(),
      correo: String(x.correo||"").trim(),
      tel: x.tel||"",
      doc: x.doc||"",
      rol: ["admin","agente","cliente"].includes(x.rol) ? x.rol : "cliente",
      estado: x.estado==="INACTIVO" ? "INACTIVO" : "ACTIVO",
      creada: x.creada || todayISO(),
    }));
    setUsers(norm); state.page = 1; render();
    alert("Usuarios importados ✅");
  }catch(err){
    alert("Error al importar: " + err.message);
  }
}

/* ===== Eventos UI ===== */
$("#btn-new").addEventListener("click", openNew);
$("#btn-seed").addEventListener("click", ()=>{ seed(); state.page=1; render(); });
$("#btn-export").addEventListener("click", exportJSON);
$("#file-import").addEventListener("change", e=>{
  const f = e.target.files[0]; if(f) importJSON(f); e.target.value="";
});
$("#btn-limpiar").addEventListener("click", ()=>{
  $("#q").value=""; $("#f-rol").value=""; $("#f-estado").value=""; $("#f-sort").value="nombre-asc";
  state = { ...state, q:"", rol:"", est:"", sort:"nombre-asc", page:1 };
  render();
});
$("#q").addEventListener("input", e=>{ state.q = e.target.value.trim().toLowerCase(); state.page=1; render(); });
$("#f-rol").addEventListener("change", e=>{ state.rol = e.target.value; state.page=1; render(); });
$("#f-estado").addEventListener("change", e=>{ state.est = e.target.value; state.page=1; render(); });
$("#f-sort").addEventListener("change", e=>{ state.sort = e.target.value; render(); });

$("#pg-prev").addEventListener("click", ()=>{ state.page = Math.max(1, state.page-1); render(); });
$("#pg-next").addEventListener("click", ()=>{ state.page = state.page+1; render(); });

/* ===== Inicio ===== */
render();
