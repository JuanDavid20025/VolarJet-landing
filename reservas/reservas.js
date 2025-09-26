// Utilidades de fechas
const hoyISO = () => {
  const d = new Date();
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60 * 1000);
  return local.toISOString().split("T")[0];
};

window.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-reserva");
  const fechaIda = document.getElementById("fecha-ida");
  const fechaVuelta = document.getElementById("fecha-vuelta");
  const soloIda = document.getElementById("solo-ida");
  const btnLimpiar = document.getElementById("btn-limpiar");

  // Mínimo: hoy
  const hoy = hoyISO();
  fechaIda.min = hoy;
  fechaVuelta.min = hoy;

  // Si marcan "Solo ida", deshabilitar y limpiar vuelta
  const toggleSoloIda = () => {
    if (soloIda.checked) {
      fechaVuelta.value = "";
      fechaVuelta.disabled = true;
    } else {
      fechaVuelta.disabled = false;
    }
  };
  soloIda.addEventListener("change", toggleSoloIda);
  toggleSoloIda();

  // Asegurar que la vuelta sea >= ida
  fechaIda.addEventListener("change", () => {
    if (fechaIda.value) {
      fechaVuelta.min = fechaIda.value;
      if (fechaVuelta.value && fechaVuelta.value < fechaIda.value) {
        fechaVuelta.value = fechaIda.value;
      }
    }
  });

  // Enviar (demo)
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const data = new FormData(form);
    const resumen = {
      origen: data.get("origen"),
      destino: data.get("destino"),
      fechaIda: data.get("fechaIda"),
      fechaVuelta: soloIda.checked ? "—" : (data.get("fechaVuelta") || "—"),
      pasajeros: data.get("pasajeros"),
      cabina: data.get("cabina"),
      soloIda: soloIda.checked ? "Sí" : "No",
    };

    // Aquí consumirí­as tu API. Por ahora, mostramos un resumen.
    alert(
      `Buscando vuelos:\n` +
      `• Origen: ${resumen.origen}\n` +
      `• Destino: ${resumen.destino}\n` +
      `• Ida: ${resumen.fechaIda}\n` +
      `• Vuelta: ${resumen.fechaVuelta}\n` +
      `• Pasajeros: ${resumen.pasajeros}\n` +
      `• Cabina: ${resumen.cabina}\n` +
      `• Solo ida: ${resumen.soloIda}`
    );
  });

  // Limpiar
  btnLimpiar.addEventListener("click", () => {
    form.reset();
    fechaIda.min = hoy;
    fechaVuelta.min = hoy;
    toggleSoloIda();
  });
});
