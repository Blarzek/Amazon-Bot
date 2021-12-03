// ==UserScript==
// @name         Amazon-Bot
// @include      https://www.amazon.es/*
// @version      v1.0
// @description  try to take over the world!
// @author       Blarzek
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        window.close
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// ==/UserScript==

'use strict';


//------------------------------------------------------------------------
//                        OPCIONES PERSONALIZABLES
//------------------------------------------------------------------------

// B09L1WNR1V - Elden Ring - Collector's Edition - PS5
// B09L1XZ9RZ - Elden Ring - Collector's Edition - PC
// B09L1X7YFN - Elden Ring - Collector's Edition - PS4
// B09L1WN9N8 - Elden Ring - Collector's Edition - Xbox One
// B08ZTMKDQ4 - Shin Megami Tensei 3 - PlayStation 4

// Listas con las IDs de producto de Amazon y sus respectivos precios
const LISTA_ID_PRODUCTOS = ["B09L1WNR1V", "B09L1XZ9RZ", "B09L1X7YFN", "B09L1WN9N8", "B08ZTMKDQ4"];
const LISTA_PRECIOS_LIMITES = [200, 200, 200, 200, 30];


// No funciona deshabilitarlo con reservas
const USAR_BOTON_COMPRAR_YA = true;
const REPRODUCIR_SONIDOS = true;


// TIEMPOS DE FUNCIONAMIENTO
// Tiempo en segundos que se toma de base para generar el retraso aleatorio
const SEGUNDOS_RETRASO_ACTUALIZACION = 10;

// Tiempo aleatorio en milisegundos que tarda en actualizar la pagina si no se encuentra el producto
// Toma valores entre SEGUNDOS_RETRASO_ACTUALIZACION y SEGUNDOS_RETRASO_ACTUALIZACION + 2
const RETRASO_ACTUALIZACION = ((Math.random() * 2) + SEGUNDOS_RETRASO_ACTUALIZACION) * 1000;

// Tiempo en milisegundos que tarda en realizar operaciones de compra
const TIEMPO_OPERACION = 1000;


//------------------------------------------------------------------------
//                        VARIABLES INTERNAS
//------------------------------------------------------------------------

const URL_ACTUAL = document.URL
const PROMISE = ms => new Promise(res => setTimeout(res, ms));
const REGEXP_PRECIO = /\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2}){1}/g;
const MODO_DEV = false;

// Sonidos

var sonidoCodecCall = new Audio("https://github.com/Blarzek/Amazon-Bot/blob/master/resources/sounds/codeccall.wav?raw=true");
var sonidoCodecOpen = new Audio("https://github.com/Blarzek/Amazon-Bot/blob/master/resources/sounds/codecopen.wav?raw=true");
var sonidoCodecOver = new Audio("https://github.com/Blarzek/Amazon-Bot/blob/master/resources/sounds/codecover.wav?raw=true");
var sonidoDoorBuzz = new Audio("https://github.com/Blarzek/Amazon-Bot/blob/master/resources/sounds/doorbuzz.wav?raw=true");
var sonidoExit = new Audio("https://github.com/Blarzek/Amazon-Bot/blob/master/resources/sounds/exit.wav?raw=true");
var sonidoFound = new Audio("https://github.com/Blarzek/Amazon-Bot/blob/master/resources/sounds/found.wav?raw=true");
var sonidoGameOver = new Audio("https://github.com/Blarzek/Amazon-Bot/blob/master/resources/sounds/gameover.wav?raw=true");
var sonidoItemEquip = new Audio("https://github.com/Blarzek/Amazon-Bot/blob/master/resources/sounds/itemequip.wav?raw=true");
var sonidoItemOpen = new Audio("https://github.com/Blarzek/Amazon-Bot/blob/master/resources/sounds/itemopen.wav?raw=true");
var sonidoItemUsed = new Audio("https://github.com/Blarzek/Amazon-Bot/blob/master/resources/sounds/itemused.wav?raw=true");


// VENTANA DE INFORMACION
function crearVentanaInfo(info, status, ID_PRODUCTO, PRECIO_LIMITE, COMPRA_FINALIZADA) {

        const $contenedor = document.createElement("div");

        const $cabecera = document.createElement("p");
        const $separador = document.createElement("p");
        const $info = document.createElement("p");
        const $status = document.createElement("p");
        const $loadingSpinner = document.createElement("p");

        // Textos
        if (ID_PRODUCTO != null && PRECIO_LIMITE != null) {
                $cabecera.innerText = "Amazon-Bot   -   ID del producto: " + ID_PRODUCTO + "   -   Precio limite: " + PRECIO_LIMITE;
        } else {
                $cabecera.innerText = "Amazon-Bot";
        }
        $separador.innerText = ("------------------------------------------------------------------------------------------------------------------------------------ ");
        $info.innerText = info;
        $status.innerText = status;
        $loadingSpinner.innerText = "■";

        // Aplicamos clases
        $contenedor.className = "contenedor";
        $cabecera.className = "cabecera";
        $separador.className = "separador";
        $info.className = "infoText";
        $status.className = "statusText";
        $loadingSpinner.className = "loadingSpinner rotating";

        var styleCss = `
                .contenedor {
                        position: fixed;
                        left: 0;
                        bottom: 0;
                        width: 823px;
                        height: 190px;
                        background: #232f3e;
                        border: 1px solid #131921;
                        border-radius: 10px;
                        box-shadow: 0 10px 16px 0 rgb(0 0 0 / 20%), 0 6px 20px 0 rgb(0 0 0 / 19%);
                }

                .cabecera {
                        position: absolute;
                        display: block;
                        top: 13px;
                        left: 50px;
                        background: transparent;
                        color: #ffbe68;
                        font-weight: bold;
                }

                .separador {
                        position: absolute;
                        display: block;
                        top: 32px;
                        left: 50px;
                        background: transparent;
                        color: #a6e7cf;
                }

                .infoText {
                        position: absolute;
                        display: block;
                        top: 53px;
                        left: 50px;
                        background: transparent;
                        color: white;
                }

                .statusText {
                        position: absolute;
                        display: block;
                        top: 74px;
                        left: 50px;
                        background: transparent;
                        color: white;
                }

                .loadingSpinner {
                        position: absolute;
                        display: block;
                        top: 120px;
                        left: 398px;
                        color: white;
                        font-size: 30pt;
                        -webkit-animation: rotating 2s linear infinite;
                        animation: rotating 2s linear infinite;
                }

                @-webkit-keyframes rotating {
                        from {
                                -webkit-transform: rotate(0deg);
                                transform: rotate(0deg);
                        }
                        to {
                                -webkit-transform: rotate(360deg);
                                transform: rotate(360deg);
                        }
                }
        `;

        var styleSheet = document.createElement("style");
        styleSheet.innerText = styleCss;
        $contenedor.appendChild(styleSheet);

        // Agregamos los elementos al contenedor
        $contenedor.appendChild($cabecera);
        $contenedor.appendChild($separador);
        $contenedor.appendChild($info);
        $contenedor.appendChild($status);

        if (!COMPRA_FINALIZADA) {
                $contenedor.appendChild($loadingSpinner);
        }

        return $contenedor;
}

function mostrarVentanaInfo(info, status, ID_PRODUCTO, PRECIO_LIMITE, COMPRA_FINALIZADA) {
        var $ventana = crearVentanaInfo(info, status, ID_PRODUCTO, PRECIO_LIMITE, COMPRA_FINALIZADA);
        document.body.appendChild($ventana);
        $ventana.style.transform = "translate(0, 0)";
}


//------------------------------------------------------------------------
//                        PAGINA DE CAPTCHA
//------------------------------------------------------------------------

if (document.getElementsByClassName("a-box a-alert a-alert-info a-spacing-base").length > 0) {

        // Notificar aparicion de Captcha
        if (REPRODUCIR_SONIDOS) {
                sonidoFound.play();
        }

        if (MODO_DEV) {
                console.log('Debes introducir un Captcha.')
        }

        alert("Debes introducir un Captcha.");

}

//------------------------------------------------------------------------
//                        OPERACIONES PRINCIPALES
//------------------------------------------------------------------------

for (let i = 0; i < LISTA_ID_PRODUCTOS.length; i++) {

        const ID_PRODUCTO = LISTA_ID_PRODUCTOS[i]
        const PRECIO_LIMITE = LISTA_PRECIOS_LIMITES[i]



        // Si la URL_ACTUAL contiene la ID_PRODUCTO, se ejecuta el codigo principal
        if (URL_ACTUAL.includes(ID_PRODUCTO)) {

                // ACTUALIZACION DE LA VENTANA DE INFORMACION
                mostrarVentanaInfo("Iniciando...", "Inicializando...", ID_PRODUCTO, PRECIO_LIMITE);

                if (MODO_DEV) {
                        // DEBUG
                        console.log('ID de producto: ' + ID_PRODUCTO);
                        console.log('Precio limite: ' + PRECIO_LIMITE);

                        // Obtenemos el nombre del producto
                        var nombreProducto = document.getElementsByClassName("a-size-large product-title-word-break");
                        console.log('Nombre del producto: ' + nombreProducto[0].innerHTML.trim());
                        console.log('-----------------------------------------------------------------------------');
                }

                // Pagina principal del producto
                // Si nos encontramos en la pagina principal del producto, ¿el producto tiene precio disponible?
                if (document.getElementById("priceblock_ourprice") || document.getElementById("priceblock_dealprice")) {

                        if (REPRODUCIR_SONIDOS) {
                                sonidoCodecOpen.play();
                        }

                        if (MODO_DEV) {
                                console.log("¡Producto en stock!");
                                console.log("Obteniendo precio del producto...");
                        }

                        // Obtenemos el precio desde la pagina principal del producto
                        if (document.getElementById("priceblock_ourprice")) {
                                var precioProducto = document.getElementById("priceblock_ourprice").innerHTML;
                        }
                        if (document.getElementById("priceblock_dealprice")) {
                                precioProducto = document.getElementById("priceblock_dealprice").innerHTML;
                        }

                        // Parseamos el precio del producto
                        precioProducto = precioProducto.match(REGEXP_PRECIO).join('');
                        precioProducto = parseFloat(precioProducto.toString().replace(',', '.'));

                        var precioProductoText = 'Precio del producto: ' + precioProducto;
                        mostrarVentanaInfo(precioProductoText, 'Procesando...', ID_PRODUCTO, PRECIO_LIMITE);

                        if (MODO_DEV) {
                                console.log('#################################################################################');
                                console.log('Precio del producto: ' + precioProducto + ' - PRECIO_LIMITE: ' + PRECIO_LIMITE);
                                console.log('Precio dentro del limite: ' + (precioProducto <= PRECIO_LIMITE ? 'Si' : 'No'));
                                console.log('#################################################################################');
                        }

                        if (precioProducto <= PRECIO_LIMITE) {

                                if (MODO_DEV) {
                                        console.log('Agregando a la cesta...');
                                }

                                if (REPRODUCIR_SONIDOS) {
                                        sonidoItemEquip.play();
                                }

                                setTimeout(function() {
                                        if (USAR_BOTON_COMPRAR_YA) {
                                                // Hacemos clic en el boton de "Comprar ya"
                                                document.getElementsByName("submit.buy-now")[0].click();
                                        } else {
                                                // Hacemos clic en el boton
                                                document.getElementsByName("submit.add-to-cart")[0].click();
                                        }
                                }, TIEMPO_OPERACION)

                        } else {

                                if (MODO_DEV) {
                                        console.log('El precio supera el limite');
                                }

                                // Refrescamos la pagina del producto
                                setTimeout(function() {
                                        location.href = "https://www.amazon.es/dp/" + ID_PRODUCTO + "/"
                                }, RETRASO_ACTUALIZACION)
                        }

                } else {

                        var tiempo = RETRASO_ACTUALIZACION / 1000;
                        tiempo = Math.round((tiempo + Number.EPSILON) * 100) / 100;

                        mostrarVentanaInfo('Producto no disponible', "Refrescando en " + tiempo + " segundos...", ID_PRODUCTO, PRECIO_LIMITE);

                        if (MODO_DEV) {
                                console.log('No se pudo obtener el precio del producto');

                                if (REPRODUCIR_SONIDOS) {
                                        sonidoDoorBuzz.play();
                                }
                        }

                        // Refrescamos la pagina del producto
                        setTimeout(function() {
                                location.href = "https://www.amazon.es/dp/" + ID_PRODUCTO + "/"
                        }, RETRASO_ACTUALIZACION)

                }

        }

}

//------------------------------------------------------------------------
//                        FINALIZAR COMPRA
//------------------------------------------------------------------------

// Pagina Tramitar pedido
if (URL_ACTUAL.includes('/gp/buy/spc/handlers/')) {

        mostrarVentanaInfo("Tramitar pedido", "Finalizando compra...");

        if (REPRODUCIR_SONIDOS) {
                sonidoItemUsed.play();
        }

        setTimeout(function() {
                if (MODO_DEV) {
                        alert("Has completado tu pedido.");
                } else {
                        // Finalizamos la compra
                        document.getElementsByName("placeYourOrder1")[0].click();
                }
        }, TIEMPO_OPERACION)

}

// Pagina Cesta
else if (URL_ACTUAL.includes('/gp/cart/view')) {

        mostrarVentanaInfo("Cesta", "Tramitando pedido...");

        setTimeout(function() {

                // Comprobamos si hay algun producto en la cesta si se puede obtener un elemento con la clase que tiene el precio del producto
                if (document.getElementsByClassName("a-size-medium a-color-base sc-price sc-white-space-nowrap").length > 0) {

                        setTimeout(function() {
                                // Redireccionamos a la pantalla de "Tramitar pedido"
                                location.href = 'https://www.amazon.es/gp/buy/spc/handlers/display.html?hasWorkingJavascript=1'
                        }, TIEMPO_OPERACION)

                } else if (typeof document.getElementById("g") !== 'undefined' && document.getElementById("g") !== null && document.getElementById("g").innerHTML.includes('ref=cs_503_link') == true) {

                        // Error en cesta
                        if (MODO_DEV) {
                                console.log('Amazon 503 Cart error');
                        }

                        if (REPRODUCIR_SONIDOS) {
                                sonidoDoorBuzz.play();
                        }

                        setTimeout(function() {
                                // Redireccionamos a la Cesta
                                location.href = 'https://www.amazon.es/gp/cart/view.html'
                        }, TIEMPO_OPERACION)

                } else if (MODO_DEV) {
                        console.log('Cesta de Amazon vacia')
                }

        }, TIEMPO_OPERACION)

}

// Manejador de caja de compra
else if (URL_ACTUAL.includes('/gp/product/handle-buy-box')) {

        location.href = 'https://www.amazon.es/gp/huc/view.html'

}

// Pagina de confirmacion de agregado a la cesta
else if (URL_ACTUAL.includes('/gp/huc/view')) {

        mostrarVentanaInfo("Cesta", "Producto agregado a la cesta");

        if (MODO_DEV) {
                console.log(URL_ACTUAL);
        }

        if (REPRODUCIR_SONIDOS) {
                sonidoItemOpen.play();
        }

        setTimeout(function() {
                if (document.getElementsByClassName("a-color-price hlb-price a-inline-block a-text-bold")) {
                        if (MODO_DEV) {
                                console.log('*** Tramitar pedido ***');
                        }

                        document.getElementById("hlb-ptc-btn-native").click();
                }
        }, TIEMPO_OPERACION)

}

// Pagina de Pedido realizado
else if (URL_ACTUAL.includes('/gp/buy/thankyou/handlers')) {

        mostrarVentanaInfo("¡Enhorabuena!", "¡Pedido realizado!", null, null, true);

        if (REPRODUCIR_SONIDOS) {
                sonidoCodecOver.play();
        }

}
