/* ===== VolarJet – Perfil ===== */
const $ = (s,r=document)=>r.querySelector(s);
const $$= (s,r=document)=>Array.from(r.querySelectorAll(s));

function loadProfile(){
  const data = JSON.parse(localStorage.getItem("perfil")||"{}");
  $("#nombre").value = data.nombre || "";
  $("#correo").value = data.correo || "";
  $("#tel").value    = data.tel || "";
  renderList("docs", data.docs||[]);
  renderList("cards", data.cards||[]);
  renderList("pax", data.pax||[]);
}

function saveProfile(){
  const data = {
    nombre: $("#nombre").value,
    correo: $("#correo").value,
    tel:    $("#tel").value,
    docs:   getList("docs"),
    cards:  getList("cards"),
    pax:    getList("pax")
  };
  localStorage.setItem("perfil", JSON.stringify(data));
  $("#msg").textContent = "Guardado ✅";
  setTimeout(()=>$("#msg").textContent="",2000);
}

function renderList(id, arr){
  const ul = $("#"+id); ul.innerHTML="";
  arr.forEach(val=>{
    const li = document.createElement("li");
    li.innerHTML = `<span>${val}</span><button class="btn ghost small">❌</button>`;
    li.querySelector("button").addEventListener("click", ()=>{
      li.remove(); saveProfile();
    });
    ul.appendChild(li);
  });
}

function getList(id){
  return $$("#"+id+" li span").map(el=>el.textContent);
}

$("#btn-guardar").addEventListener("click", saveProfile);
$("#btn-doc").addEventListener("click", ()=>{
  const v = $("#new-doc").value.trim();
  if(!v) return;
  const ul = $("#docs"); const li = document.createElement("li");
  li.innerHTML = `<span>${v}</span><button class="btn ghost small">❌</button>`;
  li.querySelector("button").addEventListener("click", ()=>{li.remove();saveProfile();});
  ul.appendChild(li);
  $("#new-doc").value=""; saveProfile();
});
$("#btn-card").addEventListener("click", ()=>{
  const v = $("#new-card").value.trim();
  if(!v) return;
  const ul = $("#cards"); const li = document.createElement("li");
  li.innerHTML = `<span>${v}</span><button class="btn ghost small">❌</button>`;
  li.querySelector("button").addEventListener("click", ()=>{li.remove();saveProfile();});
  ul.appendChild(li);
  $("#new-card").value=""; saveProfile();
});
$("#btn-pax").addEventListener("click", ()=>{
  const v = $("#new-pax").value.trim();
  if(!v) return;
  const ul = $("#pax"); const li = document.createElement("li");
  li.innerHTML = `<span>${v}</span><button class="btn ghost small">❌</button>`;
  li.querySelector("button").addEventListener("click", ()=>{li.remove();saveProfile();});
  ul.appendChild(li);
  $("#new-pax").value=""; saveProfile();
});

function logout(){
  localStorage.removeItem("perfil");
  alert("Sesión cerrada (demo)");
  location.href = "../buscar_reserva/index.html";
}

loadProfile();
