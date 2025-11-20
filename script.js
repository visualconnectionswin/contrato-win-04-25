/***************************************
 * LÓGICA DE CONTRATO Y SVA
 ***************************************/
let selectedSvaOptions = {
  fono: [],
  tv: [],
  mesh: [],
  winbox: []
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
  }
}

// Función para obtener el texto del selector de velocidad
function getSelectSpeedText(speed, tipo) {
  if (speed === 600) return "600 Mbps Gamer";
  if (speed === 850.1) return "850 Mbps PROMO CONDOMINIO ESTRENO";
  if (speed === 1000.1) return tipo === "lima" ? "1000 Mbps PROMO CONDOMINIO ESTRENO" : "1000 Mbps PROMO CONDOMINIO ESTRENO";
  if (speed === 1000.2) return "1000 Mbps Gamer";
  if (speed === 1500) return "1.5 GB";
  if (speed === 2000) return "2.0 GB";
  if (speed === 2500) return "2.5 GB";
  return speed + " Mbps";
}

// Función para obtener la velocidad a mostrar en el contrato
function getDisplaySpeed(speed) {
  if (speed === 850.1) return 850;
  if (speed === 1000.1 || speed === 1000.2) return 1000;
  if (speed === 1500) return "1.5 GB";
  if (speed === 2000) return "2.0 GB";
  if (speed === 2500) return "2.5 GB";
  return speed;
}

function updateFiberSpeeds() {
  const locationSelect = document.getElementById("location");
  const documentTypeSelect = document.getElementById("documentType");
  const fiberSpeedSelect = document.getElementById("fiberSpeed");
  const selectedLocation = locationSelect.value;
  const selectedDocType = documentTypeSelect.value;
  
  let speeds = [];
  if (selectedLocation === "lima") {
    if (selectedDocType === "ruc") {
      // RUC 20 en Lima: 500, 750, 850, 1000
      speeds = [500, 750, 850, 1000];
    } else {
      // DNI en Lima: todos los planes
      speeds = [500, 600, 750, 850, 850.1, 1000, 1000.1, 1000.2, 1500, 2000, 2500];
    }
  } else {
    if (selectedDocType === "ruc") {
      // RUC 20 en Provincia: 550, 750, 1000
      speeds = [550, 750, 1000];
    } else {
      // DNI en Provincia: todos los planes
      speeds = [550, 750, 1000, 1000.1];
    }
  }
  
  fiberSpeedSelect.innerHTML = speeds
    .map(speed => `<option value="${speed}">${getSelectSpeedText(speed, selectedLocation)}</option>`)
    .join("");
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

// Función para generar el SPEECH con los precios y servicios correctos
function generateSpeech(plan, fiberSpeed, documentType, selectedSvaOptions, installmentOption) {
  // Obtener el nombre del plan
  const planName = getDisplaySpeed(fiberSpeed);
  
  // Determinar si es plan Gamer
  const isGamer = plan.tipo === "gamer_descuento50" || fiberSpeed === 600 || fiberSpeed === 1000.2;
  
  // Calcular precios
  let precioFibraBase = plan.pb || 0;
  let precioFibraDescuento = 0;
  let tieneDctoFibra = false;
  let mesesDescuentoFibra = 1;
  let textoDuracionDescuento = "el primer mes";
  
  // Determinar si hay descuento en fibra y cuántos meses (SOLO PARA DNI/CE/RUC 10)
  if (documentType !== "ruc") {
    if (plan.tipo === "descuento50" || plan.tipo === "gamer_descuento50") {
      tieneDctoFibra = true;
      precioFibraDescuento = plan.pb_promo || 0;
      mesesDescuentoFibra = 1;
      textoDuracionDescuento = "el primer mes";
    } else if (plan.tipo === "promo_condominio") {
      tieneDctoFibra = true;
      precioFibraDescuento = 1;
      mesesDescuentoFibra = 2;
      textoDuracionDescuento = "los primeros 2 meses";
    }
  }
  
  // Array para almacenar servicios
  let servicios = [];
  
  // Calcular precios de TV
  let precioTvBase = 0;
  let precioTvDescuento = 0;
  let servicioTv = "";
  let tieneDctoTv = false;
  
  if (selectedSvaOptions.tv && selectedSvaOptions.tv.length > 0) {
    const tvKey = selectedSvaOptions.tv[0];
    servicioTv = svaConstants.tv[tvKey].label;
    servicios.push(servicioTv);
    
    // Extraer precio de TV
    const tvDesc = svaConstants.tv[tvKey].description;
    const matchPrecio = tvDesc.match(/El precio mensual de la suscripción es de <strong class="bold-keyword">S\/ ([0-9.]+)<\/strong>/);
    if (matchPrecio) {
      precioTvBase = parseFloat(matchPrecio[1]);
      
      // Aplicar descuento del 50% solo si NO es promo_condominio Y NO es RUC 20
      if (documentType !== "ruc" && (plan.tipo === "descuento50" || plan.tipo === "gamer_descuento50")) {
        tieneDctoTv = true;
        precioTvDescuento = precioTvBase * 0.5;
      } else {
        precioTvDescuento = precioTvBase;
      }
    }
  }
  
  // Calcular precios de Fono
  let precioFonoBase = 0;
  let precioFonoDescuento = 0;
  let servicioFono = "";
  let tieneDctoFono = false;
  
  if (selectedSvaOptions.fono && selectedSvaOptions.fono.length > 0) {
    const fonoKey = selectedSvaOptions.fono[0];
    // Simplificar el nombre de Fono
    servicioFono = "Fonowin";
    servicios.push(servicioFono);
    
    // Fono siempre cuesta S/10
    precioFonoBase = 10;
    
    // Verificar si es el fono con promoción
    if (fonoKey === "fono_1_promo") {
      tieneDctoFono = true;
      precioFonoDescuento = 1;
    } else {
      precioFonoDescuento = 10;
    }
  }
  
  // Calcular precios de equipos (Mesh y Winbox en alquiler)
  let equipos = [];
  let precioEquipos = 0;
  let cantidadMesh = 0;
  let cantidadWinbox = 0;
  
  // Mesh - contar cantidad total
  if (selectedSvaOptions.mesh && selectedSvaOptions.mesh.length > 0) {
    selectedSvaOptions.mesh.forEach(meshKey => {
      if (meshKey === "mesh_1_15") {
        cantidadMesh += 1;
        precioEquipos += 15;
      } else if (meshKey === "mesh_2_20") {
        cantidadMesh += 2;
        precioEquipos += 20;
      } else if (meshKey === "mesh_gratis") {
        cantidadMesh += 1;
        // No suma al precio
      }
    });
  }
  
  // Agregar mesh al array de equipos de forma resumida
  if (cantidadMesh > 0) {
    equipos.push(cantidadMesh === 1 ? "1 Mesh" : `${cantidadMesh} Mesh`);
  }
  
  // Winbox - contar cantidad
  if (selectedSvaOptions.winbox && selectedSvaOptions.winbox.length > 0) {
    selectedSvaOptions.winbox.forEach(winboxKey => {
      if (winboxKey === "winbox_1_15") {
        cantidadWinbox += 1;
        precioEquipos += 15;
      } else if (winboxKey === "winbox_2_30") {
        cantidadWinbox += 2;
        precioEquipos += 30;
      }
    });
  }
  
  // Agregar winbox al array de equipos
  if (cantidadWinbox > 0) {
    equipos.push(cantidadWinbox === 1 ? "1 Winbox" : `${cantidadWinbox} Winbox`);
  }
  
  // Calcular totales
  let precioRegularTotal = precioFibraBase + precioTvBase + precioFonoBase + precioEquipos;
  let precioDescuentoTotal = 0;
  
  if (tieneDctoFibra || tieneDctoTv || tieneDctoFono) {
    if (plan.tipo === "promo_condominio") {
      // En promo condominio, el S/1 es solo para fibra+TV, Fono y equipos se suman aparte
      precioDescuentoTotal = 1 + precioFonoDescuento + precioEquipos;
    } else {
      // En otros descuentos, el descuento aplica a fibra, TV y Fono, los equipos se suman
      precioDescuentoTotal = precioFibraDescuento + precioTvDescuento + precioFonoDescuento + precioEquipos;
    }
  }
  
  // Construir el texto del SPEECH
  let speechText = `<strong>(Nombre del cliente)</strong>, queremos asegurarnos de que tengas toda la información clara desde el inicio. Antes de la lectura del contrato, voy a confirmarte `;
  
  // Determinar si dice "plan y servicios" o "plan, servicios y equipos"
  if (equipos.length > 0) {
    speechText += `el plan, servicios y equipos contratados:<br><br>`;
  } else {
    speechText += `el plan y servicios contratados:<br><br>`;
  }
  
  // Construir descripción del plan
  if (isGamer) {
    speechText += `Es un plan Gamer de <strong class="bold-keyword">${planName} Mbps</strong>`;
  } else {
    speechText += `Es un plan de <strong class="bold-keyword">${planName} Mbps</strong>`;
  }
  
  // Agregar servicios (TV y/o Fono) si existen
  if (servicios.length > 0) {
    if (servicios.length === 1) {
      speechText += `, con el servicio de <strong class="bold-keyword">${servicios[0]}</strong>`;
    } else {
      speechText += `, con los servicios de <strong class="bold-keyword">${servicios.join(" y ")}</strong>`;
    }
  }
  
  // Agregar equipos si existen
  if (equipos.length > 0) {
    speechText += `, y los equipos <strong class="bold-keyword">${equipos.join(" y ")}</strong>`;
  }
  
  // Agregar información de precios mensuales
  if (documentType === "ruc") {
    // Para RUC 20, solo precio regular sin promociones
    speechText += `. El precio mensual es de <strong class="bold-keyword">S/ ${precioRegularTotal.toFixed(2)}</strong>`;
  } else {
    // Para DNI/CE/RUC 10
    if (tieneDctoFibra || tieneDctoTv || tieneDctoFono) {
      speechText += `, por un precio promocional de <strong class="bold-keyword">S/ ${precioDescuentoTotal.toFixed(2)}</strong> durante ${textoDuracionDescuento}. Luego de este periodo, pagarás el precio regular de <strong class="bold-keyword">S/ ${precioRegularTotal.toFixed(2)}</strong>`;
    } else {
      speechText += `, por un precio regular de <strong class="bold-keyword">S/ ${precioRegularTotal.toFixed(2)}</strong>`;
    }
  }
  
  // Agregar información de instalación para RUC 20
  if (documentType === "ruc") {
    if (installmentOption === "1") {
      speechText += ` y el precio de instalación es de <strong class="bold-keyword">S/ 120.00</strong> incluido IGV, con un precio promocional de <strong class="bold-keyword">S/ 60.00</strong>`;
    } else if (installmentOption === "3") {
      speechText += ` y el precio de instalación es de <strong class="bold-keyword">S/ 120.00</strong> incluido IGV, el cual puedes fraccionar en tres (03) cuotas sin intereses`;
    }
  }
  
  speechText += `.<br><br>`;
  
  // Agregar nota sobre TV si aplica
  if (servicioTv) {
    if (servicioTv.includes("WINTV")) {
      speechText += `También, comentarte que el servicio de televisión digital que brinda WIN incluye únicamente acceso a <strong class="bold-keyword">WINTV</strong>.<br>`;
    } else if (servicioTv.includes("DGO")) {
      speechText += `También, comentarte que el servicio de televisión digital que brinda WIN incluye únicamente acceso a <strong class="bold-keyword">DGO</strong>.<br>`;
    }
  }
  
  speechText += `<br>¿Es correcto?<br><strong class="bold-keyword">(CLIENTE RESPONDE).</strong><br><br>Ahora procederé con la lectura de contrato.`;
  
  return speechText;
}

function updateContract() {
  moment.locale("es");
  const currentDate = moment();
  const location = document.getElementById("location").value;
  const fiberSpeed = parseFloat(document.getElementById("fiberSpeed").value);
  const documentType = document.getElementById("documentType").value;
  const installmentOption = document.getElementById("installmentOption")
    ? document.getElementById("installmentOption").value
    : null;

  // Obtener datos del plan según la configuración
  const plan =
    config.pricing[location] && config.pricing[location][fiberSpeed]
      ? config.pricing[location][fiberSpeed]
      : {};

  // Siempre están seleccionados tanto fibra como sva
  const selectedServices = ["fibra", "sva"];

  let planSummaryText = "";
  const docLabel = documentType === "ruc" ? "RUC 20" : "DNI/CE/RUC 10";
  planSummaryText = `${location.toUpperCase()} - ${docLabel} PLAN: ${getSelectSpeedText(fiberSpeed, location)}`;
  
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
  
  // Agregar SVA al resumen
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

  // Determinar el precio y promociones
  let pricingText = "";
  
  if (documentType === "ruc") {
    // Para RUC 20, precio base sin promociones
    pricingText = `El precio mensual es de <strong class="bold-keyword"><span style="font-size:1.2em;">S/ ${plan.pb}</span></strong> incluye I.G.V.`;
  } else {
    // Para DNI/CE/RUC 10
    if (plan.tipo === "descuento50" || plan.tipo === "gamer_descuento50") {
      // Planes con 50% descuento en el primer mes
      pricingText = `El precio mensual es de <strong class="bold-keyword"><span style="font-size:1.2em;">S/ ${plan.pb}</span></strong> incluye I.G.V.<br><br>Por promoción, el primer <strong class="bold-keyword"><span style="font-size:1.2em;">01 mes</span></strong>, pagarás a un precio promocional de <strong class="bold-keyword"><span style="font-size:1.2em;">S/ ${plan.pb_promo}</span></strong> (incluye I.G.V.); vencidos estos plazos, se aplicarán las condiciones regulares de tu plan contratado.`;
    } else if (plan.tipo === "promo_condominio") {
      // Planes promoción condominio estreno
      pricingText = `El precio mensual es de <strong class="bold-keyword"><span style="font-size:1.2em;">S/ ${plan.pb}</span></strong> incluye I.G.V.<br><br>Por promoción, los dos primeros <strong class="bold-keyword"><span style="font-size:1.2em;">02 meses</span></strong>, pagarás a un precio promocional de <strong class="bold-keyword"><span style="font-size:1.2em;">S/ 1</span></strong> (incluye I.G.V.); vencidos estos plazos, se aplicarán las condiciones regulares de tu plan contratado.`;
    } else {
      // Planes normales sin promoción
      pricingText = `El precio mensual es de <strong class="bold-keyword"><span style="font-size:1.2em;">S/ ${plan.pb}</span></strong> incluye I.G.V.`;
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

  // Calcular servicios SVA por categoría para ordenarlos
  const tvSVA = [];
  const meshSVA = [];
  const winboxSVA = [];
  
  Object.keys(selectedSvaOptions).forEach((category) => {
    if (selectedSvaOptions[category].length > 0) {
      selectedSvaOptions[category].forEach((optionKey) => {
        if (category === "tv") {
          tvSVA.push(optionKey);
        } else if (category === "mesh") {
          meshSVA.push(optionKey);
        } else if (category === "winbox") {
          winboxSVA.push(optionKey);
        }
      });
    }
  });

  // Sección de reconexión: la tarifa de reconexión se muestra siempre, y si se ha seleccionado FONO (dentro de SVA),
  // se inserta el bloque de FONO inmediatamente después.
  let reconnectionSection = `
    <div class="contract-section">
      <p>La tarifa de reconexión es de <strong class="bold-keyword">S/ 6.01</strong>, incluye I.G.V.</p>
  `;
  
  if (selectedSvaOptions.fono.length > 0) {
    const option = selectedSvaOptions.fono[0];
    const { label, description } = getSVALabelAndDescription(option, documentType);
    reconnectionSection += `
      <div class="mt-3">
        <h3 class="font-bold text-base">FIJO</h3>
        <p class="text-gray-900">${description}</p>
      </div>
    `;
  }
  reconnectionSection += `</div>`;
  
  // Construir las secciones de SVA en orden: TV, Mesh, Winbox
  let svaOrderedSections = "";
  
  // 1. Sección de TV (WinTV y DGO)
  if (tvSVA.length > 0) {
    svaOrderedSections += `<div class="contract-section"><div class="mt-3 border-t pt-3">`;
    tvSVA.forEach((sva) => {
      const { label, description } = getSVALabelAndDescription(sva, documentType);
      // Aplicar descuento del 50% en primer mes de TV SOLO si NO es promo_condominio Y NO es RUC 20
      let finalDescription = description;
      if (documentType !== "ruc" && (plan.tipo === "descuento50" || plan.tipo === "gamer_descuento50")) {
        finalDescription = description.replace(
          /El precio mensual de la suscripción es de <strong class="bold-keyword">S\/ ([0-9.]+)<\/strong> incluido IGV\./g,
          (match, price) => {
            const discountedPrice = (parseFloat(price) * 0.5).toFixed(2);
            return `El precio mensual de la suscripción es de <strong class="bold-keyword">S/ ${price}</strong> incluido IGV.<br><br>Por promoción, el primer <strong class="bold-keyword">01 mes</strong>, pagarás a un precio promocional de <strong class="bold-keyword">S/ ${discountedPrice}</strong> (incluye I.G.V.); vencido este plazo, se aplicarán las condiciones regulares de tu plan contratado.`;
          }
        );
      }
      // Si es promo_condominio o RUC 20, NO aplicar descuento (usar descripción original)
      svaOrderedSections += `<h3 class="text-lg font-bold mt-2">${label}</h3><p class="mt-1">${finalDescription}</p>`;
    });
    svaOrderedSections += `</div></div>`;
  }
  
  // 2. Sección de Mesh
  if (meshSVA.length > 0) {
    svaOrderedSections += `<div class="contract-section"><div class="mt-3 border-t pt-3">`;
    meshSVA.forEach((sva) => {
      const { label, description } = getSVALabelAndDescription(sva, documentType);
      svaOrderedSections += `<h3 class="text-lg font-bold mt-2">${label}</h3><p class="mt-1">${description}</p>`;
    });
    svaOrderedSections += `</div></div>`;
  }
  
  // 3. Sección de Winbox
  if (winboxSVA.length > 0) {
    svaOrderedSections += `<div class="contract-section"><div class="mt-3 border-t pt-3">`;
    winboxSVA.forEach((sva) => {
      const { label, description } = getSVALabelAndDescription(sva, documentType);
      svaOrderedSections += `<h3 class="text-lg font-bold mt-2">${label}</h3><p class="mt-1">${description}</p>`;
    });
    svaOrderedSections += `</div></div>`;
  }

  let contractText = `
    <div class="space-y-3 fade-in">
      <!-- Sección SPEECH -->
      <div class="contract-section speech-section">
        <p class="font-bold text-base mb-2">SPEECH:</p>
        <p>${generateSpeech(plan, fiberSpeed, documentType, selectedSvaOptions, installmentOption)}</p>
      </div>
      
      <p class="text-sm">
        Hoy ${currentDate.format("DD")} de ${currentDate.format("MMMM")} del ${currentDate.format("YYYY")}, en la ciudad de LIMA, usted contrata con WIN, para ello me brinda los siguientes datos:
      </p>
      ${datosText}
      
      <!-- Sección FIBRA (siempre visible) -->
      <div class="contract-section">
        <h3 class="font-bold text-base">FIBRA</h3>
        <p>
          El servicio de internet fijo postpago de WIN es ilimitado, 100% fibra óptica, con velocidad simétrica de <strong class="bold-keyword"><span style="font-size:1.2em;">${getDisplaySpeed(fiberSpeed)} Mbps</span></strong> de carga y descarga, con un mínimo garantizado de <strong class="bold-keyword"><span style="font-size:1.2em;">${plan.vm} Mbps</span></strong> de carga y descarga, incluye un equipo terminal router y conector en comodato, el cual deberá devolver en buenas condiciones; caso contrario, pagarás su valor. El contrato tendrá plazo indeterminado y podrá ser resuelto de acuerdo a la normativa de condiciones de uso.
        </p>
        <br>
        <p>${pricingText}</p>
      </div>
      
      ${documentType === "ruc" ? installationText : ""}
      
      <!-- Sección de TARIFA DE RECONEXIÓN (siempre mostrada) -->
      ${reconnectionSection}
      
      <!-- Sección de Facturación y demás datos -->
      <div class="contract-section">
        <p>
          La fecha de facturación es el <strong class="bold-keyword">14</strong> de cada mes, y la fecha de vencimiento es el <strong class="bold-keyword">28</strong> del mismo mes.
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
      </div>
      
      <!-- Sección de Servicios Adicionales ordenados: TV, Mesh, Winbox -->
      ${svaOrderedSections}
      
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
  Object.keys(selectedSvaOptions).forEach((category) => {
    if (selectedSvaOptions[category].length > 0) {
      const labels = selectedSvaOptions[category].map(
        (key) => svaConstants[category][key].label
      );
      displayText += `<strong>${category.toUpperCase()}:</strong> ${labels.join(", ")}<br>`;
    }
  });
  document.getElementById("selectedSvaDisplay").innerHTML = displayText;
}

// Función para reiniciar todos los SVA
function resetSva() {
  selectedSvaOptions = {
    fono: [],
    tv: [],
    mesh: [],
    winbox: []
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
  updateInstallmentSection();
  updateContract();
  updateSelectedSvaDisplay();

  // Eventos para los elementos del formulario
  const formElements = document.querySelectorAll(
    "#contractForm select, #contractForm input"
  );
  formElements.forEach((el) => {
    el.addEventListener("change", function () {
      if (el.id === "location" || el.id === "documentType") {
        updateFiberSpeeds();
      }
      if (el.id === "documentType") {
        updateInstallmentSection();
      }
      // Al cambiar la velocidad, reiniciamos todos los SVA
      if (el.id === "fiberSpeed") {
        resetSva();
      }
      updateContract();
    });
  });

  // Eventos para los botones de ofertas del sidebar derecho
  document.querySelectorAll(".offer-button").forEach((button) => {
    button.addEventListener("click", function () {
      const fiber = parseFloat(button.getAttribute("data-fiber"));
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
