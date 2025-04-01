/***************************************
 * LÓGICA DE CONTRATO Y SVA
 ***************************************/
let selectedSvaOptions = {
  fono: [],
  mesh: [],
  winbox: [],
  wintv: [],
  winGames: [],
  dgo: []
};

let currentUbigeoValue = "";
let ubigeoDisplayText = ""; // Valor por defecto para mostrar

// Función que actualiza el display del ubigeo a partir del valor ingresado
function updateUbigeoDisplay() {
  const ubigeoInput = document.getElementById("ubigeoInput");
  if (ubigeoInput) {
    const currentUbigeoValue = ubigeoInput.value.trim();
    const parts = [];

    // Si se ingresan al menos 2 dígitos, mostramos el departamento
    if (currentUbigeoValue.length >= 2) {
      const deptCode = currentUbigeoValue.substr(0, 2);
      const deptData = ubigeoData[deptCode];
      if (deptData) {
        parts.push(`Departamento: ${deptData.departamento}`);
        // Con 4 dígitos, agregamos la provincia
        if (currentUbigeoValue.length >= 4) {
          const provCode = currentUbigeoValue.substr(2, 2);
          const provData = deptData.provincias[provCode];
          if (provData) {
            parts.push(`Provincia: ${provData.provincia}`);
            // Con 6 dígitos, mostramos también el distrito
            if (currentUbigeoValue.length >= 6) {
              const distCode = currentUbigeoValue.substr(4, 2);
              const distName = provData.distritos[distCode];
              if (distName) {
                parts.push(`Distrito: ${distName}`);
              }
            }
          }
        }
      }
    }
    const ubigeoDisplay = document.getElementById("ubigeoDisplay");
    if (ubigeoDisplay) {
      ubigeoDisplay.innerText = parts.join(", ");
    }
    // Si deseas actualizar otros elementos al cambiar el ubigeo, descomenta la siguiente línea:
    // updateContract();
  }
}

// Funciones para mostrar la velocidad con el sufijo "Gamer" cuando corresponde
function getDisplaySpeed(speed) {
  if (speed === 210) return 200;
  if (speed === 310) return 300;
  if (speed === 360) return 350;
  if (speed === 610) return 600;
  if (speed === 1010) return 1000;
  return speed;
}

function getSelectSpeedText(speed) {
  if (speed === 210) return "200 Mbps PAGO ADELANTADO";
  if (speed === 310) return "300 Mbps PAGO ADELANTADO";
  if (speed === 360) return "350 Mbps Gamer";
  if (speed === 610) return "600 Mbps Gamer";
  if (speed === 1010) return "1000 Mbps Gamer";
  if (speed === 800) return "800 Mbps VERISURE";
  return speed + " Mbps";
}

function updateFiberSpeeds() {
  const locationSelect = document.getElementById("location");
  const fiberSpeedSelect = document.getElementById("fiberSpeed");
  const selectedLocation = locationSelect.value;
  let speeds = [];
  if (selectedLocation === "lima") {
    speeds = [200, 210, 300, 310, 350, 360, 400, 550, 600, 610, 750, 800, 850, 1000, 1010];
  } else {
    speeds = [350, 360, 550, 610, 850, 1000, 1010];
  }
  fiberSpeedSelect.innerHTML = speeds
    .map(speed => `<option value="${speed}">${getSelectSpeedText(speed)}</option>`)
    .join("");
}

function updateFormSections() {
  const isFibra = document.querySelector('input[name="serviceType"][value="fibra"]').checked;
  const isSva = document.querySelector('input[name="serviceType"][value="sva"]').checked;
  document.getElementById("fiberSpeedSection").classList.toggle("hidden", !isFibra);
  document.getElementById("svaSection").classList.toggle("hidden", !isSva);
}

function updateInstallmentSection() {
  const documentTypeSelect = document.getElementById("documentType");
  const installmentSection = document.getElementById("installmentSection");
  if (documentTypeSelect.value === "ruc") {
    installmentSection.classList.remove("hidden");
  } else {
    installmentSection.classList.add("hidden");
  }
}

// Función para obtener la etiqueta y la descripción de un SVA dado su key
function getSVALabelAndDescription(optionKey, documentType) {
  for (let category in svaConstants) {
    if (svaConstants[category][optionKey]) {
      let description = svaConstants[category][optionKey].description;
      let label = svaConstants[category][optionKey].label;

      if (documentType === 'ruc') {
        description = description.replace(
          /<strong style="font-weight: bold; color: black;">Su nombre completo es<\/strong> <br>/g,
          '<strong style="font-weight: bold; color: black;">Nombre de la empresa (Razón social)</strong> <br>'
        );
        description = description.replace(
          /<strong style="font-weight: bold; color: black;">Su número de Documento de Identidad \/ CE \/ RUC \(10…\)<\/strong><br>/g,
          '<strong style="font-weight: bold; color: black;">Número de RUC (20…)</strong><br>'
        );
      }
      return { label: label, description: description };
    }
  }
  return { label: "", description: "" };
}

function updateContract() {
  moment.locale("es");
  const currentDate = moment();
  const location = document.getElementById("location").value;
  const fiberSpeed = parseInt(document.getElementById("fiberSpeed").value);
  const documentType = document.getElementById("documentType").value;
  const installmentOption = document.getElementById("installmentOption")
    ? document.getElementById("installmentOption").value
    : null;

  // Obtener datos del plan según la configuración
  const plan =
    config.pricing[location] && config.pricing[location][fiberSpeed]
      ? config.pricing[location][fiberSpeed]
      : {};

  const selectedServices = Array.from(
    document.querySelectorAll('input[name="serviceType"]:checked')
  ).map((el) => el.value);

  let planSummaryText = "";
  if (selectedServices.includes("fibra")) {
    const docLabel = documentType === "ruc" ? "RUC 20" : "DNI/CE/RUC 10";
    // Usamos getSelectSpeedText para incluir "Gamer" si aplica
    planSummaryText = `${location.toUpperCase()} - ${docLabel} PLAN: ${getSelectSpeedText(
      fiberSpeed
    )}`;
    if (documentType === "ruc") {
      let installmentText = "";
      if (installmentOption === "1") {
        installmentText = "pago inst. 1 cuota";
      } else if (installmentOption === "3") {
        installmentText = "pago inst. 3 cuotas";
      }
      if (installmentText) {
        planSummaryText += " + " + installmentText;
      }
    }
    if (selectedServices.includes("sva")) {
      let svaSummaryParts = [];
      Object.keys(selectedSvaOptions).forEach((category) => {
        if (selectedSvaOptions[category] && selectedSvaOptions[category].length > 0) {
          const labels = selectedSvaOptions[category].map(
            (key) => svaConstants[category][key].label
          );
          svaSummaryParts.push(labels.join(" / "));
        }
      });
      if (svaSummaryParts.length > 0) {
        planSummaryText += " + " + svaSummaryParts.join(" + ");
      }
    }
  }
  document.getElementById("planSummary").innerHTML = planSummaryText;

  let datosText = "";
  if (documentType === "ruc") {
    datosText = `<p>
        Nombre de la empresa (Razón social)<br>
        Datos del representante legal (Nombre completo, DNI)<br>
        Número de RUC (20…)<br>
        Correo electrónico para el envío de recibos<br>
        Su número de contacto<br>
        Dirección en la que se instalará el servicio
    </p>`;
  } else {
    datosText = `<p>
      Su nombre completo es<br>
      Su número de documento de identidad / CE / RUC (10…)<br>
      <div style="display: flex; align-items: center; margin: 4px 0;">
        <span style="margin-right: 8px;">Lugar y Fecha de Nacimiento</span>
        <input type="text" id="ubigeoInput" placeholder="Ubigeo" oninput="updateUbigeoDisplay()" style="width: 120px; padding: 4px; border: 1px solid #ccc; border-radius: 4px;" value="${currentUbigeoValue}">
        <span id="ubigeoDisplay" style="margin-left: 4px; font-size: 0.875rem; color: #4a5568;">${ubigeoDisplayText}</span>
      </div>
      Correo electrónico para el envío de recibos<br>
      Su número telefónico es<br>
      Dirección en la que se instalará el servicio
    </p>`;
  }

  let pricingText = "";
  if (documentType === "ruc") {
    pricingText = `El precio mensual es de <strong class="bold-keyword"><span style="font-size:1.2em;">S/ ${plan.pb}</span></strong> incluye I.G.V.`;
  } else {
    if (!plan.vbp && !plan.pp) {
      pricingText = `El precio mensual es de <strong class="bold-keyword"><span style="font-size:1.2em;">S/ ${plan.pb}</span></strong> incluye I.G.V.`;
    } else if (plan.vbp && !plan.pp) {
      pricingText = `El precio mensual es de <strong class="bold-keyword"><span style="font-size:1.2em;">S/ ${plan.pb}</span></strong> incluye I.G.V.${(fiberSpeed === 210 || fiberSpeed === 310 ? ' y el precio de instalación es de <strong class="bold-keyword"><span style="font-size:1.2em;">S/ 120.00</span></strong> incluido IGV.' : '')} <br><br>Por promoción, los primeros <strong class="bold-keyword"><span style="font-size:1.2em;">06 meses</span></strong>, incrementamos tu velocidad a <strong class="bold-keyword"><span style="font-size:1.2em;">${plan.vbp} Mbps</span></strong>, con un mínimo garantizado de <strong class="bold-keyword"><span style="font-size:1.2em;">${plan.vmp} Mbps</span></strong> de carga y descarga; vencidos estos plazos, se aplicarán las condiciones regulares de tu plan contratado.`;
    } else if (plan.vbp && plan.pp) {
      pricingText = `El precio mensual es de <strong class="bold-keyword"><span style="font-size:1.2em;">S/ ${plan.pb}</span></strong> incluye I.G.V.${(fiberSpeed === 210 || fiberSpeed === 310 ? ' y el precio de instalación es de <strong class="bold-keyword"><span style="font-size:1.2em;">S/ 120.00</span></strong> incluido IGV.' : '')} <br><br>Por promoción, los primeros <strong class="bold-keyword"><span style="font-size:1.2em;">06 meses</span></strong>, incrementamos tu velocidad a <strong class="bold-keyword"><span style="font-size:1.2em;">${plan.vbp} Mbps</span></strong>, con un mínimo garantizado de <strong class="bold-keyword"><span style="font-size:1.2em;">${plan.vmp} Mbps</span></strong> de carga y descarga, pagarás a un precio promocional de <strong class="bold-keyword"><span style="font-size:1.2em;">S/ ${plan.pp}</span></strong> incluye I.G.V (por los primeros <strong class="bold-keyword"><span style="font-size:1.2em;">03 meses</span></strong>); vencidos estos plazos, se aplicarán las condiciones regulares de tu plan contratado.`;
    } else if (!plan.vbp && plan.pp) {
      pricingText = `El precio mensual es de <strong class="bold-keyword"><span style="font-size:1.2em;">S/ ${plan.pb}</span></strong> incluye I.G.V.${(fiberSpeed === 210 || fiberSpeed === 310 ? ' y el precio de instalación es de <strong class="bold-keyword"><span style="font-size:1.2em;">S/ 120.00</span></strong> incluido IGV.' : '')} <br><br>Por promoción, los primeros <strong class="bold-keyword"><span style="font-size:1.2em;">03 meses</span></strong>, pagarás a un precio promocional de <strong class="bold-keyword"><span style="font-size:1.2em;">S/ ${plan.pp}</span></strong> (incluye I.G.V.); vencidos estos plazos, se aplicarán las condiciones regulares de tu plan contratado.`;
    }
  }

    
  let installationText = "";
  if (documentType === "ruc") {
    if (installmentOption === "1") {
      installationText = `<p>El precio de instalación es de <strong class="bold-keyword">S/ 120.00</strong> incluido IGV, con un precio promocional de <strong class="bold-keyword">S/ 60.00</strong>.</p>`;
    } else if (installmentOption === "3") {
      installationText = `<p>El precio de instalación es de <strong class="bold-keyword">S/ 120.00</strong> incluido IGV, el cual puedes fraccionar en tres (03) cuotas sin intereses.</p>`;
    }
  }

  // Calcular servicios SVA adicionales (excluyendo 'fono')
  const additionalSVA = [];
  Object.keys(selectedSvaOptions).forEach((category) => {
    if (category !== "fono" && selectedSvaOptions[category].length > 0) {
      additionalSVA.push(...selectedSvaOptions[category]);
    }
  });

  // Sección de reconexión: la tarifa de reconexión se muestra siempre, y si se ha seleccionado FONO (dentro de SVA),
  // se inserta el bloque de FONO inmediatamente después.
  let reconnectionSection = `
    <div class="contract-section">
      <p>La tarifa de reconexión es de <strong class="bold-keyword">S/ 10.00</strong>, incluye I.G.V.</p>
  `;
  if (selectedServices.includes("sva") && selectedSvaOptions.fono.length > 0) {
    const option = selectedSvaOptions.fono[0];
    if (option === "fono_10") {
      reconnectionSection += `
        <div class="mt-3">
          <h3 class="font-bold text-base">FIJO</h3>
          <p class="text-gray-900">
            El servicio de telefonía fija VoIP postpago se brinda a través de la red de internet de WIN. Tu servicio incluye un equipo de telefonía analógico en comodato, llamadas ilimitadas dentro de la red de WIN y un paquete mensual de 100 minutos para llamar a todo operador a nivel nacional, no acumulable. El precio mensual del servicio es de <strong class="bold-keyword">S/ 10.00</strong>, incluye I.G.V.
          </p>
          <div class="mt-1 text-gray-500 text-xs">
            <p>(En caso de portabilidad de otro operador)</p>
            <p>Para fines de la portabilidad, se confirma lo siguiente:</p>
            <ul class="list-disc ml-5">
              <li>Concesionario Cedente (Empresa Operadora)</li>
              <li>Número Telefónico Fijo a Portar</li>
              <li>Modalidad de Pago con el Cedente (Postpago/Prepago)</li>
            </ul>
            <p>El trámite es gratuito, tiene un plazo de 24 horas desde la solicitud y se encuentra sujeto a condiciones técnicas de acuerdo al Artículo 5 del Reglamento de Portabilidad Numérica.</p>
          </div>
        </div>
      `;
    } else if (option === "fono_prov_hb") {
      reconnectionSection += `
        <div class="mt-3">
          <h3 class="font-bold text-base">FIJO</h3>
          <p class="text-gray-900">
            El servicio de telefonía fija VoIP postpago se brinda a través de la red de internet de WIN. Incluye un equipo de telefonía analógico en comodato, llamadas ilimitadas dentro de la red de WIN y un paquete mensual de 100 minutos para llamar a todo operador a nivel nacional, no acumulable. El precio mensual del servicio es de <strong class="bold-keyword">S/ 10.00</strong> incluido I.G.V, pagarás a un precio promocional de <strong class="bold-keyword">S/ 1</strong>, incluye I.G.V. por los primeros <strong class="bold-keyword">06 meses</strong>.
          </p>
          <div class="mt-1 text-gray-500 text-xs">
            <p>(En caso de portabilidad de otro operador)</p>
            <p>Para fines de la portabilidad, se confirma lo siguiente:</p>
            <ul class="list-disc ml-5">
              <li>Concesionario Cedente (Empresa Operadora)</li>
              <li>Número Telefónico Fijo a Portar</li>
              <li>Modalidad de Pago con el Cedente (Postpago/Prepago)</li>
            </ul>
            <p>El trámite es gratuito, tiene un plazo de 24 horas desde la solicitud y se encuentra sujeto a condiciones técnicas de acuerdo al Artículo 5 del Reglamento de Portabilidad Numérica.</p>
          </div>
        </div>
      `;
    }
  }
  reconnectionSection += `</div>`;

  let contractText = `
    <div class="space-y-3 fade-in">
      <p class="text-sm">
        Hoy ${currentDate.format("DD")} de ${currentDate.format("MMMM")} del ${currentDate.format("YYYY")}, en la ciudad de LIMA, usted contrata con WIN, para ello me brinda los siguientes datos:
      </p>
      ${datosText}
      
      <!-- Sección FIBRA (si está seleccionada) -->
      <div class="contract-section">
        ${
          selectedServices.includes("fibra")
            ? `
        <h3 class="font-bold text-base">FIBRA</h3>
        <p>
          El servicio de internet fijo postpago de WIN es ilimitado, 100% fibra óptica, con velocidad simétrica de <strong class="bold-keyword"><span style="font-size:1.2em;">${getDisplaySpeed(fiberSpeed)} Mbps</span></strong> de carga y descarga, con un mínimo garantizado de <strong class="bold-keyword"><span style="font-size:1.2em;">${plan.vm} Mbps</span></strong> de carga y descarga, incluye un equipo terminal router y conector en comodato, el cual deberá devolver en buenas condiciones; caso contrario, pagarás su valor. El contrato tendrá plazo indeterminado y podrá ser resuelto de acuerdo a la normativa de condiciones de uso.
        </p>
        <br>
        <p>${pricingText}</p>
        `
            : ""
        }
      </div>
      
      ${documentType === "ruc" ? installationText : ""}
      
      <!-- Sección de TARIFA DE RECONEXIÓN (siempre mostrada) -->
      ${reconnectionSection}
      
      <!-- Sección de Facturación y demás datos -->
      <div class="contract-section">
        <p>
          La fecha de facturación es el <strong class="bold-keyword">12</strong> de cada mes, y la fecha de vencimiento es el <strong class="bold-keyword">28</strong> del mismo mes.
        </p>
        <br>
        <p>
          Le agradeceré que diga fuerte y claramente que <strong class="bold-keyword">SÍ ACEPTA</strong> los términos de la presente contratación. <strong class="bold-keyword">CLIENTE RESPONDE SI</strong>.
        </p>
        <br>
        <p>
          WIN realizará el tratamiento de datos personales para gestiones relacionadas con el servicio, se almacenarán tus datos en nuestro Banco de Datos de clientes de acuerdo a la normativa vigente. Podrás ejercer tus derechos ARCO escribiendo al correo protecciondedatos@win.pe. Para más información visita win.pe/protección-de-datos.
        </p>
        <br>
        <p>
          ¿Declaras conocer la Política de Privacidad y autorizas de forma previa, expresa, informada e inequívoca el tratamiento de datos personales? <strong class="bold-keyword">CLIENTE RESPONDE SI</strong>.
        </p>
        <br>
        <p>
          ¿Aceptas el envío de comunicaciones comerciales, publicitarias y encuestas? <strong class="bold-keyword">CLIENTE RESPONDE SI/NO</strong>.
        </p>
        ${(fiberSpeed === 210 || fiberSpeed === 310) ? `<p>
          <br>Te recordamos que el precio de instalación de <strong class="bold-keyword"><span style="font-size:1.2em;">S/ 120.00</span></strong> incluido IGV deberá ser pagado de forma adelantada y como requisito para la instalación del servicio. ¿Aceptas el pago adelantado? <strong class="bold-keyword">CLIENTE RESPONDE SI</strong>.
        </p>` : ""}
      </div>
      
      <!-- Sección de Servicios Adicionales (para SVA distintos a fono) -->
      ${
        additionalSVA.length > 0
          ? `
        <div class="contract-section">
          <div class="mt-3 border-t pt-3">
            <h4 class="text-base font-semibold">Servicios Adicionales:</h4>
            ${additionalSVA
              .map((sva) => {
                const { label, description } = getSVALabelAndDescription(sva, documentType);
                return `<h3 class="text-lg font-bold mt-2">${label}</h3><p class="mt-1">${description}</p>`;
              })
              .join("")}
          </div>
        </div>
        `
          : ""
      }
      
      <!-- Mensaje final -->
      <div class="contract-section">
        <p class="mt-3 text-center font-bold text-blue-600">BIENVENIDO A LA FAMILIA WIN.</p>
      </div>
    </div>
  `;
  document.getElementById("contractContent").innerHTML = contractText;
}

function updateSelectedSvaDisplay() {
  let displayText = "";
  const isSvaSelected = document.querySelector('input[name="serviceType"][value="sva"]').checked;
  if (isSvaSelected) {
    Object.keys(selectedSvaOptions).forEach((category) => {
      if (selectedSvaOptions[category].length > 0) {
        const labels = selectedSvaOptions[category].map(
          (key) => svaConstants[category][key].label
        );
        displayText += `<strong>${category.toUpperCase()}:</strong> ${labels.join(", ")}<br>`;
      }
    });
  }
  document.getElementById("selectedSvaDisplay").innerHTML = displayText;
}

// Función para reiniciar todos los SVA
function resetSva() {
  selectedSvaOptions = {
    fono: [],
    mesh: [],
    winbox: [],
    wintv: [],
    winGames: [],
    dgo: []
  };
  updateSelectedSvaDisplay();
}

function openSvaModal(category) {
  const modal = document.getElementById("svaModal");
  const modalTitle = document.getElementById("svaModalTitle");
  const modalOptions = document.getElementById("svaModalOptions");

  modalTitle.textContent = `Seleccionar opciones para ${category.toUpperCase()}`;
  const options = svaConstants[category];
  let optionsHtml = "";
  for (const key in options) {
    const checked = selectedSvaOptions[category].includes(key) ? "checked" : "";
    optionsHtml += `
      <div>
        <label class="inline-flex items-center">
          <input type="checkbox" class="sva-modal-option" value="${key}" ${checked} />
          <span class="ml-1">${options[key].label}</span>
        </label>
      </div>
    `;
  }
  modalOptions.innerHTML = optionsHtml;
  modal.setAttribute("data-category", category);

  // Agregar lógica de exclusión mutua según las reglas definidas
  modalOptions.querySelectorAll(".sva-modal-option").forEach((input) => {
    input.addEventListener("change", function () {
      const value = this.value;
      const groups = svaMutualExclusionRules[category] || [];
      groups.forEach((group) => {
        if (group.includes(value) && this.checked) {
          group.forEach((item) => {
            if (item !== value) {
              const otherInput = modalOptions.querySelector(
                `.sva-modal-option[value="${item}"]`
              );
              if (otherInput) {
                otherInput.checked = false;
              }
            }
          });
        }
      });
    });
  });

  modal.classList.remove("hidden");
}

function closeSvaModal() {
  const modal = document.getElementById("svaModal");
  modal.classList.add("hidden");
}

document.addEventListener("DOMContentLoaded", function () {
  updateFiberSpeeds();
  updateFormSections();
  updateInstallmentSection();
  updateContract();
  updateSelectedSvaDisplay();

  // Eventos para los elementos del formulario
  const formElements = document.querySelectorAll(
    "#contractForm select, #contractForm input"
  );
  formElements.forEach((el) => {
    el.addEventListener("change", function () {
      if (el.id === "location") updateFiberSpeeds();
      if (el.id === "documentType") {
        updateInstallmentSection();
      }
      // Al cambiar la velocidad, reiniciamos todos los SVA
      if (el.id === "fiberSpeed") {
        resetSva();
      }
      updateFormSections();
      updateContract();
    });
  });

  // Evento para el checkbox de SVA: al cambiar, reinicia la selección
  const svaCheckbox = document.querySelector('input[name="serviceType"][value="sva"]');
  if (svaCheckbox) {
    svaCheckbox.addEventListener("change", function () {
      resetSva();
      updateContract();
      updateSelectedSvaDisplay();
    });
  }

  // Eventos para los botones de ofertas del sidebar derecho
  document.querySelectorAll(".offer-button").forEach((button) => {
    button.addEventListener("click", function () {
      const fiber = parseInt(button.getAttribute("data-fiber"));
      const svaData = JSON.parse(button.getAttribute("data-sva"));
      const fiberSpeedSelect = document.getElementById("fiberSpeed");
      if (fiberSpeedSelect) {
        fiberSpeedSelect.value = fiber;
      }
      // Reiniciamos los SVA al aplicar una oferta
      resetSva();
      svaData.forEach((optionKey) => {
        for (const category in svaConstants) {
          if (svaConstants[category][optionKey]) {
            selectedSvaOptions[category].push(optionKey);
            break;
          }
        }
      });
      document.querySelector('input[name="serviceType"][value="fibra"]').checked = true;
      document.querySelector('input[name="serviceType"][value="sva"]').checked = svaData.length > 0;
      updateFormSections();
      updateContract();
      updateSelectedSvaDisplay();
    });
  });

  // Eventos para los botones de categoría SVA del sidebar izquierdo
  document.querySelectorAll(".sva-category-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const category = button.getAttribute("data-category");
      openSvaModal(category);
    });
  });

  // Botón cancelar del modal
  document.getElementById("svaModalCancel").addEventListener("click", function () {
    closeSvaModal();
  });

  // Botón guardar del modal
  document.getElementById("svaModalSave").addEventListener("click", function () {
    const modal = document.getElementById("svaModal");
    const category = modal.getAttribute("data-category");
    const checkedOptions = Array.from(
      document.querySelectorAll("#svaModalOptions .sva-modal-option:checked")
    ).map((input) => input.value);
    selectedSvaOptions[category] = checkedOptions;
    updateSelectedSvaDisplay();
    updateContract();
    closeSvaModal();
  });
});
