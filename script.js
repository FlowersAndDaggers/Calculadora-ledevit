const kilosInput = document.getElementById('kilosInput');
const buttonAgregar = document.getElementById('buttonAgregar');
const buttonCalcular = document.getElementById('buttonCalcular');
const listaProduccion = document.getElementById('listaProduccion');
const listaIngredientes = document.getElementById('listaIngredientes');
const zonaResultados = document.getElementById('zonaResultados');
const radioBatches = document.getElementById('modoBatches');
const labelInput = document.getElementById('labelInput');
const selectorProducto = document.getElementById('selectorProducto');

// ESTADO DEL SISTEMA
let colaDeProduccion = []; 
let conversionesActivas = {}; 

// --- DEFINICIÓN DE IMÁGENES PNG ---
// AQUI ESTÁ EL CAMBIO: El bolson usa la clase "icono-bolson", el resto "icono-prod"
// --- DEFINICIÓN DE IMÁGENES PNG ---
const iconBolson     = `<img src="img/bolson.png" class="icono-bolson" alt="Bolsón">`;
const iconBolsa      = `<img src="img/bolsa.png" class="icono-prod" alt="Bolsa">`;
const iconPallet     = `<img src="img/pallet.png" class="icono-prod" alt="Pallet">`;

// ACÁ ESTÁ EL CAMBIO: Ahora usa class="icono-balanza"
const iconBalanza    = `<img src="img/balanza.png" class="icono-balanza" alt="Balanza">`; 

const iconPrepesada  = `<img src="img/prepesada.png" class="icono-prod" alt="Prepesada">`;


const todasLasRecetas = {
    "pastelera60": {
        nombre: "Pastelera Código 60",
        batchTotal: 1547,
        premezclas: [ 
            "Bolsa Polvo 1 (Pre-pesada Pastelera 4kg)", 
            "Bolsa Polvo 2 (Pre-pesada Pastelera 4kg)" 
        ],
        ingredientes: {
            "Azúcar Impalpable (Granel)": { base: 1048, usaBigBag: true, pesoBigBag: 1000, pesoBolsa: 25, bolsasPallet: 40 },
            "Azúcar Impalpable (Bolsas/Limpieza)": { base: 75, usaBigBag: false, pesoBolsa: 25, bolsasPallet: 40 },
            "Almidón Paselli / Emjel": { base: 250, pesoBolsa: 25, bolsasPallet: 40 },
            "Leche Entera en Polvo": { base: 125, pesoBolsa: 25, bolsasPallet: 40 },
            "Alginato de Sodio": { base: 33.75, pesoBolsa: 25, bolsasPallet: 40 },
            "Goma Guar": { base: 8.25, pesoBolsa: 25, bolsasPallet: 40 }
        }
    },
    "pasteleraFacturera": {
        nombre: "Pastelera Facturera 4 kg",
        batchTotal: 1547,
        premezclas: [ 
            "Bolsa Polvo 1 (Pre-pesada Pastelera Facturera 4kg)", 
            "Bolsa Polvo 2 (Pre-pesada Pastelera Facturera 4kg)" 
        ],
        ingredientes: {
            "Azúcar Impalpable (Granel)": { base: 752, usaBigBag: true, pesoBigBag: 1000, pesoBolsa: 25, bolsasPallet: 40 },
            "Azúcar Impalpable (Bolsas/Limpieza)": { base: 75, usaBigBag: false, pesoBolsa: 25, bolsasPallet: 40 },
            "Azúcar Refinada": { base: 250, pesoBolsa: 25, bolsasPallet: 40 },
            "Almidón Glutagel": { base: 250, pesoBolsa: 25, bolsasPallet: 40 },
            "Leche Entera en Polvo": { base: 175, pesoBolsa: 25, bolsasPallet: 40 },
            "Goma Guar": { base: 8.25, pesoBolsa: 25, bolsasPallet: 40 },
            "Alginato de Sodio": { base: 30, pesoBolsa: 25, bolsasPallet: 40 }
        }
    }
};

window.activarConversion = function(nombreIngrediente) {
    conversionesActivas[nombreIngrediente] = true;
    calcularTotales(); 
};

window.borrarItem = function(index) {
    colaDeProduccion.splice(index, 1);
    actualizarListaVisual();
    zonaResultados.style.display = 'none'; 
};

function actualizarLabel() {
    if (radioBatches.checked) {
        labelInput.innerText = "Inserte cantidad de BATCHES:";
        kilosInput.placeholder = "Ej: 1, 2, 0.5";
    } else {
        labelInput.innerText = "Inserte KILOS a producir:";
        const recetaActual = todasLasRecetas[selectorProducto.value];
        kilosInput.placeholder = `Ej: ${recetaActual.batchTotal}`;
    }
}

document.querySelectorAll('input[name="modoCalculo"]').forEach(el => {
    el.addEventListener('change', actualizarLabel);
});
selectorProducto.addEventListener('change', actualizarLabel);

buttonAgregar.addEventListener('click', () => {
    const valor = parseFloat(kilosInput.value);
    if (!valor || valor <= 0) { alert("Ingresá un número válido"); return; }

    const codigo = selectorProducto.value;
    const esPorBatches = radioBatches.checked;
    const receta = todasLasRecetas[codigo];

    const item = {
        nombreProducto: receta.nombre,
        codigoProducto: codigo,
        cantidad: valor,
        modo: esPorBatches ? "Batches" : "Kilos"
    };

    colaDeProduccion.push(item);
    
    kilosInput.value = "";
    kilosInput.focus();
    actualizarListaVisual();
    zonaResultados.style.display = 'none'; 
});

function actualizarListaVisual() {
    listaProduccion.innerHTML = "";
    if (colaDeProduccion.length === 0) {
        listaProduccion.innerHTML = '<li style="text-align:center; color:#999; border: 2px dashed #ddd;">(Lista vacía)</li>';
        return;
    }

    colaDeProduccion.forEach((item, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${item.cantidad} ${item.modo} - ${item.nombreProducto}</span>
            <button class="btn-borrar" onclick="borrarItem(${index})">❌</button>
        `;
        listaProduccion.appendChild(li);
    });
}

function calcularTotales() {
    if (colaDeProduccion.length === 0) { alert("¡Agregá algo a la lista primero!"); return; }

    let totalIngredientes = {}; 
    let totalPremezclas = {};   

    colaDeProduccion.forEach(pedido => {
        const receta = todasLasRecetas[pedido.codigoProducto];
        
        let kilosRealesPedido = pedido.cantidad;
        if (pedido.modo === "Batches") {
            kilosRealesPedido = pedido.cantidad * receta.batchTotal;
        }
        
        const ratioBatches = kilosRealesPedido / receta.batchTotal;

        for (let nombre in receta.ingredientes) {
            const datosIng = receta.ingredientes[nombre];
            const kilosNecesarios = (datosIng.base / receta.batchTotal) * kilosRealesPedido;

            if (!totalIngredientes[nombre]) {
                totalIngredientes[nombre] = {
                    kilos: 0,
                    datos: datosIng 
                };
            }
            totalIngredientes[nombre].kilos += kilosNecesarios;
        }

        for (let nombrePre of receta.premezclas) {
            if (!totalPremezclas[nombrePre]) totalPremezclas[nombrePre] = 0;
            totalPremezclas[nombrePre] += ratioBatches;
        }
    });

    listaIngredientes.innerHTML = "";
    zonaResultados.style.display = 'block';

    const tituloMat = document.createElement('h3');
    tituloMat.innerText = "🏭 Materias Primas Consolidadas:";
    listaIngredientes.appendChild(tituloMat);
    
    let bolsasPendientesDeSumar = 0;

    for (let nombre in totalIngredientes) {
        const obj = totalIngredientes[nombre];
        const kilosTotales = obj.kilos;
        const datos = obj.datos;

        let partes = [];

        if (datos.usaBigBag) {
            const quiereUsarBolsas = conversionesActivas[nombre] === true;
            let cantBigBags;
            let bolsasSobrantes = 0;

            if (quiereUsarBolsas) {
                cantBigBags = Math.floor(kilosTotales / datos.pesoBigBag);
                let kilosRestantes = kilosTotales - (cantBigBags * datos.pesoBigBag);
                bolsasSobrantes = Math.ceil(kilosRestantes / datos.pesoBolsa);
                bolsasPendientesDeSumar = bolsasSobrantes;
            } else {
                cantBigBags = Math.ceil(kilosTotales / datos.pesoBigBag);
                let capacidadTotal = cantBigBags * datos.pesoBigBag;
                let kilosQueSobran = capacidadTotal - kilosTotales;
                
                if (kilosQueSobran > 0 && cantBigBags > 0) {
                     partes.push(`<button class="btn-alerta" onclick="activarConversion('${nombre}')">⚠️ Sobran ${kilosQueSobran.toFixed(0)}kg (Usar Bolsas)</button>`);
                }
            }

            const txtBolson = (cantBigBags === 1) ? "Bolsón" : "Bolsones";
            
            // USAMOS EL ICONO BOLSON (GIGANTE)
            if (cantBigBags > 0) partes.unshift(`${iconBolson} <strong>${cantBigBags} ${txtBolson} (1000kg)</strong>`);
            else partes.unshift(`${iconBolson} <strong>0 Bolsones</strong>`);

        } else {
            const esImpalpable = nombre.includes("Azúcar Impalpable");
            let totalBolsas = Math.floor(kilosTotales / datos.pesoBolsa);
            let kilosSueltos = kilosTotales % datos.pesoBolsa;
            
            if (esImpalpable && kilosSueltos > 0.01) {
                totalBolsas += 1;
                kilosSueltos = 0; 
            }

            let totalPallets = Math.floor(totalBolsas / datos.bolsasPallet);
            let bolsasSueltas = totalBolsas % datos.bolsasPallet;

            let textoExtra = "";
            if (bolsasPendientesDeSumar > 0) {
                textoExtra = ` <span style="color:#27ae60; font-weight:bold;">+ ${bolsasPendientesDeSumar} bolsas (para completar bolsón)</span>`;
                bolsasSueltas += bolsasPendientesDeSumar;
                bolsasPendientesDeSumar = 0; 
            }

            const txtPallet = (totalPallets === 1) ? "Pallet" : "Pallets";
            const txtBolsa = (bolsasSueltas === 1) ? "Bolsa" : "Bolsas";

            // USAMOS LOS ICONOS NORMALES (CHICOS)
            if (totalPallets > 0) partes.push(`${iconPallet} <strong>${totalPallets} ${txtPallet}</strong>`);
            if (bolsasSueltas > 0) partes.push(`${iconBolsa} <strong>${bolsasSueltas} ${txtBolsa}</strong>${textoExtra}`);
            if (kilosSueltos > 0.01) partes.push(`${iconBalanza} <strong>${kilosSueltos.toFixed(2)} kg</strong> (Pesar)`);
        }

        let textoFinal = partes.join(" + ");
        textoFinal += ` <br><span style="color:gray; font-size:14px; margin-left: 45px;">(Acumulado: ${kilosTotales.toFixed(2)} kg)</span>`;

        const renglon = document.createElement('li');
        renglon.innerHTML = `<strong>${nombre}:</strong><br> ${textoFinal}`;
        listaIngredientes.appendChild(renglon);
    }

    const tituloPre = document.createElement('h3');
    tituloPre.innerText = "📦 Pre-Pesadas Totales:";
    listaIngredientes.appendChild(tituloPre);

    for (let nombre in totalPremezclas) {
        const item = document.createElement("li");
        const cantidad = parseFloat(totalPremezclas[nombre].toFixed(2));
        const palabra = (cantidad === 1) ? "bolsa" : "bolsas";
        
        item.innerHTML = `${iconPrepesada} <strong>${nombre}:</strong> ${cantidad} ${palabra}`;
        listaIngredientes.appendChild(item);
    }
}

buttonCalcular.addEventListener('click', () => {
    conversionesActivas = {}; 
    calcularTotales();
});
