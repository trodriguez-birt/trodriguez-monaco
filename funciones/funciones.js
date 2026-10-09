/* ==========================================================================
   funciones/funciones.js
   Sitio web: Gran Premio de Mónaco (LMSGI02.2)
   Contiene las 3 funciones JavaScript del sitio, reutilizables en cualquier
   página (si la página no tiene los elementos necesarios, no hacen nada):

     1. modoOscuro()          -> botón para cambiar entre modo claro y oscuro
     2. filtrarTablas()       -> buscador que filtra las filas de las tablas
     3. validarFormularios()  -> validación de los formularios antes de enviar

   Uso: añadir en el <head> de cada página HTML la línea
        <script src="funciones/funciones.js" defer></script>
   ========================================================================== */
"use strict";

/* --------------------------------------------------------------------------
   Utilidades internas (no son una de las 3 funciones del ejercicio)
   -------------------------------------------------------------------------- */

// Inyecta una sola vez los estilos que necesitan las funciones.
function inyectarEstilos() {
  if (document.getElementById("estilos-funciones-js")) return;
  var css = [
    /* Modo oscuro: se invierten los colores de la página y se corrigen las imágenes */
    "html.modo-oscuro { filter: invert(1) hue-rotate(180deg); background: #fff; }",
    "html.modo-oscuro img, html.modo-oscuro svg, html.modo-oscuro video { filter: invert(1) hue-rotate(180deg); }",
    ".boton-modo { position: fixed; top: 10px; right: 10px; z-index: 1000; padding: 8px 14px;",
    "  border: 2px solid #0f3b5f; border-radius: 20px; background: #fff; color: #0f3b5f;",
    "  font: bold 14px Arial, sans-serif; cursor: pointer; }",
    ".boton-modo:hover { background: #0f3b5f; color: #fff; }",
    /* Filtro de tablas */
    ".filtro-tabla { display: block; margin: 10px 0 4px; padding: 8px; width: 100%; max-width: 320px;",
    "  box-sizing: border-box; border: 1px solid #888; border-radius: 4px; font-size: 15px; }",
    ".filtro-info { margin: 0 0 8px; font-size: 13px; color: #555; }",
    /* Validación de formularios */
    ".campo-error { border: 2px solid #c8102e !important; }",
    ".mensaje-error { display: block; margin: 3px 0 8px; color: #c8102e; font-size: 13px; font-weight: bold; }",
    ".resumen-formulario { margin: 10px 0; padding: 10px; border-radius: 4px; font-weight: bold; }",
    ".resumen-formulario.ko { background: #fde8ea; color: #c8102e; border: 1px solid #c8102e; }",
    ".resumen-formulario.ok { background: #e6f4ea; color: #1e7b34; border: 1px solid #1e7b34; }"
  ].join("\n");
  var estilo = document.createElement("style");
  estilo.id = "estilos-funciones-js";
  estilo.textContent = css;
  document.head.appendChild(estilo);
}

// Quita tildes y pasa a minúsculas para comparar textos ("Pérez" == "perez").
function normalizarTexto(texto) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

/* --------------------------------------------------------------------------
   FUNCIÓN 1: modoOscuro()
   Crea un botón fijo arriba a la derecha que alterna entre modo claro y
   oscuro. Recuerda la elección del visitante con localStorage, de modo que
   al cambiar de página se mantiene el mismo modo.
   -------------------------------------------------------------------------- */
function modoOscuro() {
  var raiz = document.documentElement;
  var boton = document.createElement("button");
  boton.type = "button";
  boton.className = "boton-modo";

  function actualizarBoton() {
    var oscuro = raiz.classList.contains("modo-oscuro");
    boton.textContent = oscuro ? "☀️ Modo claro" : "🌙 Modo oscuro";
    boton.setAttribute("aria-pressed", oscuro ? "true" : "false");
  }

  // Recuperar la preferencia guardada (si el navegador permite localStorage)
  try {
    if (localStorage.getItem("modo") === "oscuro") raiz.classList.add("modo-oscuro");
  } catch (e) { /* sin almacenamiento: se usa el modo claro */ }

  boton.addEventListener("click", function () {
    raiz.classList.toggle("modo-oscuro");
    try {
      localStorage.setItem("modo", raiz.classList.contains("modo-oscuro") ? "oscuro" : "claro");
    } catch (e) { /* ignorar */ }
    actualizarBoton();
  });

  actualizarBoton();
  document.body.appendChild(boton);
}

/* --------------------------------------------------------------------------
   FUNCIÓN 2: filtrarTablas()
   Añade encima de cada tabla de la página un cuadro de búsqueda. Al escribir,
   se ocultan las filas que no contienen el texto (sin distinguir mayúsculas
   ni tildes) y se muestra cuántas filas se ven.
   -------------------------------------------------------------------------- */
function filtrarTablas() {
  var tablas = document.querySelectorAll("table");

  tablas.forEach(function (tabla, indice) {
    if (tabla.dataset.filtroActivo) return; // evitar duplicados
    tabla.dataset.filtroActivo = "si";

    // Filas de datos: las del <tbody>; si no hay, todas menos la primera
    var filas = Array.prototype.slice.call(tabla.querySelectorAll("tbody tr"));
    if (filas.length === 0) filas = Array.prototype.slice.call(tabla.rows).slice(1);
    if (filas.length < 2) return; // no merece la pena filtrar una tabla de 1 fila

    var entrada = document.createElement("input");
    entrada.type = "search";
    entrada.className = "filtro-tabla";
    entrada.id = "filtro-tabla-" + indice;
    entrada.placeholder = "🔍 Buscar en la tabla...";
    entrada.setAttribute("aria-label", "Buscar en la tabla");

    var info = document.createElement("p");
    info.className = "filtro-info";
    info.setAttribute("aria-live", "polite");

    function filtrar() {
      var busqueda = normalizarTexto(entrada.value);
      var visibles = 0;
      filas.forEach(function (fila) {
        var coincide = normalizarTexto(fila.textContent).indexOf(busqueda) !== -1;
        fila.style.display = coincide ? "" : "none";
        if (coincide) visibles++;
      });
      info.textContent = busqueda === ""
        ? ""
        : "Mostrando " + visibles + " de " + filas.length + " filas";
    }

    entrada.addEventListener("input", filtrar);
    tabla.parentNode.insertBefore(info, tabla);
    tabla.parentNode.insertBefore(entrada, info);
  });
}

/* --------------------------------------------------------------------------
   FUNCIÓN 3: validarFormularios()
   Valida cualquier <form> de la página antes de enviarlo: campos vacíos,
   longitud mínima, formato de correo electrónico y casillas obligatorias.
   Muestra un mensaje de error junto a cada campo incorrecto y, si todo es
   correcto, deja que el formulario se envíe normalmente (p. ej. con mailto:).
   -------------------------------------------------------------------------- */
function validarFormularios() {
  var formularios = document.querySelectorAll("form");
  var patronCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  formularios.forEach(function (formulario) {
    formulario.noValidate = true; // usamos nuestra validación en lugar de la del navegador

    var resumen = document.createElement("div");
    resumen.className = "resumen-formulario";
    resumen.setAttribute("role", "alert");
    resumen.style.display = "none";
    formulario.insertBefore(resumen, formulario.firstChild);

    function nombreCampo(campo) {
      var etiqueta = campo.id ? formulario.querySelector('label[for="' + campo.id + '"]') : null;
      if (etiqueta) return etiqueta.textContent.replace(/[:*]/g, "").trim();
      return campo.name || "Este campo";
    }

    function limpiarErrores() {
      formulario.querySelectorAll(".mensaje-error").forEach(function (m) { m.remove(); });
      formulario.querySelectorAll(".campo-error").forEach(function (c) { c.classList.remove("campo-error"); });
    }

    function marcarError(campo, texto) {
      campo.classList.add("campo-error");
      var mensaje = document.createElement("span");
      mensaje.className = "mensaje-error";
      mensaje.textContent = texto;
      campo.insertAdjacentElement("afterend", mensaje);
    }

    formulario.addEventListener("submit", function (evento) {
      limpiarErrores();
      var errores = 0;
      var campos = formulario.querySelectorAll("input, textarea, select");

      campos.forEach(function (campo) {
        var tipo = (campo.type || "").toLowerCase();
        if (["submit", "reset", "button", "hidden", "radio"].indexOf(tipo) !== -1) return;

        var valor = campo.value.trim();
        var nombre = nombreCampo(campo);

        if (tipo === "checkbox") {
          if (!campo.checked && (campo.required || campo.dataset.obligatorio)) {
            marcarError(campo, "Debes marcar la casilla: " + nombre + ".");
            errores++;
          }
        } else if (valor === "") {
          marcarError(campo, "El campo «" + nombre + "» es obligatorio.");
          errores++;
        } else if (tipo === "email" && !patronCorreo.test(valor)) {
          marcarError(campo, "Escribe un correo válido, por ejemplo nombre@dominio.com.");
          errores++;
        } else if (campo.tagName === "TEXTAREA" && valor.length < 10) {
          marcarError(campo, "El mensaje debe tener al menos 10 caracteres (ahora " + valor.length + ").");
          errores++;
        } else if (tipo === "text" && valor.length < 2) {
          marcarError(campo, "«" + nombre + "» debe tener al menos 2 caracteres.");
          errores++;
        }
      });

      resumen.style.display = "block";
      if (errores > 0) {
        evento.preventDefault(); // no se envía hasta corregir
        resumen.className = "resumen-formulario ko";
        resumen.textContent = "Hay " + errores + (errores === 1 ? " error" : " errores") + " en el formulario. Revísalo e inténtalo de nuevo.";
        var primero = formulario.querySelector(".campo-error");
        if (primero) primero.focus();
      } else {
        resumen.className = "resumen-formulario ok";
        resumen.textContent = "✔ Formulario correcto. Se abrirá tu programa de correo para enviarlo.";
      }
    });

    // Al escribir de nuevo en un campo erróneo, se quita su aviso
    formulario.addEventListener("input", function (evento) {
      var campo = evento.target;
      if (campo.classList && campo.classList.contains("campo-error")) {
        campo.classList.remove("campo-error");
        var siguiente = campo.nextElementSibling;
        if (siguiente && siguiente.classList.contains("mensaje-error")) siguiente.remove();
      }
    });
  });
}

/* --------------------------------------------------------------------------
   Arranque: se ejecutan las 3 funciones cuando la página ya está cargada
   -------------------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", function () {
  inyectarEstilos();
  modoOscuro();
  filtrarTablas();
  validarFormularios();
});
