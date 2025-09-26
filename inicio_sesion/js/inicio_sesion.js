// === Demo de login (reemplaza por tu backend/Firebase cuando quieras) ===
const VALID_EMAIL = "davidlopez@gmail.com";
const VALID_PASS  = "1234";

const form = document.getElementById("loginForm");
const email = document.getElementById("email");
const password = document.getElementById("password");
const msg = document.getElementById("msg");

form?.addEventListener("submit", (e) => {
  e.preventDefault();

  const emailVal = (email.value || "").trim();
  const passVal  = password.value || "";

  // Validaciones básicas
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal);
  if (!isEmail) {
    msg.textContent = "Correo no válido.";
    msg.className = "error";            // limpia y aplica estado
    msg.classList.add("error");         // (si quieres conservar)
    msg.classList.remove("success");
    msg.className = "msg error";        // clase final
    return;
  }
  if (!passVal) {
    msg.textContent = "Ingresa tu contraseña.";
    msg.className = "msg error";
    return;
  }

  // Lógica de login de demo
  if (emailVal === VALID_EMAIL && passVal === VALID_PASS) {
    msg.textContent = "¡Inicio de sesión exitoso!";
    msg.className = "msg success";
    // Redirigir si quieres:
    // setTimeout(()=> location.href="../pagina_principal/index.html", 800);
  } else {
    msg.textContent = "Correo o contraseña incorrectos";
    msg.className = "msg error";
  }
});
