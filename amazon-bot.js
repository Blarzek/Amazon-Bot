// ==UserScript==
// @name     Amazon-Bot
// @include  https://www.amazon.es/*
// @include  http://localhost:800*
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
//                        CONSTANTES
//------------------------------------------------------------------------

// B09L1WNR1V - Elden Ring - Collector's Edition - PS5
// B09L1XZ9RZ - Elden Ring - Collector's Edition - PC
// B09L1X7YFN - Elden Ring - Collector's Edition - PS4
// B09L1WN9N8 - Elden Ring - Collector's Edition - Xbox One
// B08ZTMKDQ4 - Shin Megami Tensei 3 - PlayStation 4

// Listas con las IDs de producto de Amazon y sus respectivos precios
const LISTA_ID_PRODUCTOS = ["B09L1WNR1V", "B09L1XZ9RZ", "B09L1X7YFN", "B09L1WN9N8", "B08ZTMKDQ4"];
const LISTA_PRECIOS_LIMITES = [200, 200, 200, 200, 30];


//------------------------------------------------------------------------
//                        OPCIONES PERSONALIZABLES
//------------------------------------------------------------------------

// No funciona deshabilitarlo con reservas
const USAR_BOTON_COMPRAR_YA = false;
const REPRODUCIR_SONIDOS = true;


// TIEMPOS DE FUNCIONAMIENTO

const SEGUNDOS_RETRASO_ACTUALIZACION = 10;

// Tiempo aleatorio en milisegundos que tarda en actualizar la pagina si no se encuentra el producto
// Toma valores entre SEGUNDOS_RETRASO_ACTUALIZACION y SEGUNDOS_RETRASO_ACTUALIZACION + 2
const RETRASO_ACTUALIZACION = ((Math.random() * 2) + SEGUNDOS_RETRASO_ACTUALIZACION) * 1000;

// Tiempo en milisegundos que tarda en realizar operaciones de compra
const TIEMPO_OPERACION = 3000;


//------------------------------------------------------------------------
//                        VARIABLES INTERNAS
//------------------------------------------------------------------------

const URL_ACTUAL = document.URL
const promise = ms => new Promise(res => setTimeout(res, ms));
const REGEXP_PRECIO = /\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2}){1}/g;

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


//------------------------------------------------------------------------
//                        PAGINA DE CAPTCHA
//------------------------------------------------------------------------

if (document.getElementsByClassName("a-box a-alert a-alert-info a-spacing-base").length > 0) {

        console.log(document.getElementsByClassName("a-box a-alert a-alert-info a-spacing-base"))
        console.log('Debes introducir un Captcha.')

        if (REPRODUCIR_SONIDOS) {
                sonidoFound.play();
        }

}

//------------------------------------------------------------------------
//                        OPERACIONES PRINCIPALES
//------------------------------------------------------------------------

for (let i = 0; i < LISTA_ID_PRODUCTOS.length; i++) {

        const ID_PRODUCTO = LISTA_ID_PRODUCTOS[i]
        const PRECIO_LIMITE = LISTA_PRECIOS_LIMITES[i]

        // VENTANA DE INFORMACION
        function crearVentanaInfo(mode, status, ht = 160) {

                const $contenedor = document.createElement("div");
                const $fondo = document.createElement("div");

                const $texto = document.createElement("P");
                const $borde = document.createElement("P");
                const $mode = document.createElement("P");
                const $status = document.createElement("P");

                var TITULO_VENTANA = ("Amazon-Bot   -   ID del producto: " + ID_PRODUCTO + "   -   Precio limite: " + PRECIO_LIMITE);
                $borde.innerText = ("------------------------------------------------------------------------------------------------------------------------------------ ");
                $texto.innerText = TITULO_VENTANA;
                $mode.innerText = mode;
                $status.innerText = status;

                // Estilo
                $contenedor.style.cssText = "position:fixed; left:0; bottom:0; width:950px; height:" + ht + "px; background: #232f3e; border: 1px solid #FFF";
                $fondo.style.cssText = "position:absolute; left:-100%; top:0; width:60px; height:350px; background: #1111; box-shadow: 0px 0 10px #060303; border: 1px solid #FFF; border-radius: 3px;";
                $texto.style.cssText = "position:absolute; display:block; top:3px; left: 50px; background: transparent; color: white;";
                $borde.style.cssText = "position:absolute; display:block; top:22px; left: 50px; background: transparent; color: #a6e7cf;";
                $mode.style.cssText = "position:absolute; display:block; top:43px; left: 50px; background: transparent; color: white;";
                $status.style.cssText = "position:absolute; display:block; top:64px; left: 50px; background: transparent; color: white;";

                // Agregamos los elementos al contenedor
                $contenedor.appendChild($texto);
                $contenedor.appendChild($borde);
                $contenedor.appendChild($mode);
                $contenedor.appendChild($status)
                return $contenedor;
        }


        // Si la URL_ACTUAL contiene la ID_PRODUCTO, se ejecuta el codigo principal
        if (URL_ACTUAL.includes(ID_PRODUCTO)) {

                // ACTUALIZACION DE LA VENTANA
                var $ventana = crearVentanaInfo("Iniciando...", "Inicializando...");
                document.body.appendChild($ventana);
                $ventana.style.transform = "translate(0, 0)";

                // DEBUG
                console.log('ID de producto: ' + ID_PRODUCTO);
                console.log('Precio limite: ' + PRECIO_LIMITE);

                // Obtenemos el nombre del producto
                var nombreProducto = document.getElementsByClassName("a-size-large product-title-word-break");
                console.log('Nombre del producto: ' + nombreProducto[0].innerHTML.trim());
                console.log('-----------------------------------------------------------------------------');

                // Pagina principal del producto
                // Si nos encontramos en la pagina principal del producto, ¿el producto tiene precio disponible?
                if (document.getElementById("priceblock_ourprice") || document.getElementById("priceblock_dealprice")) {

                        console.log("¡Producto en stock!");

                        if (REPRODUCIR_SONIDOS) {
                                sonidoCodecOpen.play();
                        }

                        console.log("Obteniendo precio del producto...");

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
                        const $badge = crearVentanaInfo(precioProductoText, 'Procesando...');
                        document.body.appendChild($badge);
                        $badge.style.transform = "translate(0, 0)";

                        console.log('#################################################################################');
                        console.log('Precio del producto: ' + precioProducto + ' - PRECIO_LIMITE: ' + PRECIO_LIMITE);
                        console.log('Precio dentro del limite: ' + (precioProducto <= PRECIO_LIMITE ? 'Si' : 'No'));
                        console.log('#################################################################################');

                        if (precioProducto <= PRECIO_LIMITE) {

                                console.log('Agregando a la cesta...');

                                if (REPRODUCIR_SONIDOS) {
                                        sonidoItemEquip.play();
                                }

                                if (USAR_BOTON_COMPRAR_YA) {
                                        // Hacemos clic en el boton de "Comprar ya"
                                        document.getElementsByName("submit.buy-now")[0].click();
                                } else {
                                        // Hacemos clic en el boton
                                        document.getElementsByName("submit.add-to-cart")[0].click();
                                }

                        } else {

                                console.log('El precio supera el limite');

                                // Refrescamos la pagina del producto
                                setTimeout(function() {
                                        location.href = "https://www.amazon.es/dp/" + ID_PRODUCTO + "/"
                                }, RETRASO_ACTUALIZACION)
                        }

                } else {

                        var tiempo = RETRASO_ACTUALIZACION / 1000;
                        tiempo = Math.round((tiempo + Number.EPSILON) * 100) / 100;
                        const $ventana = crearVentanaInfo('Producto no disponible', "Refrescando en " + tiempo + " segundos...");
                        console.log('No se pudo obtener el precio del producto');
                        document.body.appendChild($ventana);
                        $ventana.style.transform = "translate(0, 0)"

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
if (document.URL.includes('/gp/buy/spc/handlers/')) {

        if (REPRODUCIR_SONIDOS) {
                sonidoItemUsed.play();
        }

        setTimeout(function() {
                // Finalizamos la compra
                console.log('Comprar ahora');
                document.getElementsByName("placeYourOrder1")[0].click();
        }, TIEMPO_OPERACION)

}

// Pagina Cesta
else if (document.URL.includes('/gp/cart/view')) {

        console.log("URL: " + document.URL + " - Incluye (/gp/cart/view): " + document.URL.includes('/gp/cart/view'))

        setTimeout(function() {

                // Comprobamos si hay algun producto en la cesta si se puede obtener un elemento con la clase que tiene el precio del producto
                if (document.getElementsByClassName("a-size-medium a-color-base sc-price sc-white-space-nowrap").length > 0) {
                        // Redireccionamos a la pantalla de "Tramitar pedido"
                        location.href = 'https://www.amazon.es/gp/buy/spc/handlers/display.html?hasWorkingJavascript=1'

                } else if (typeof document.getElementById("g") !== 'undefined' && document.getElementById("g") !== null && document.getElementById("g").innerHTML.includes('ref=cs_503_link') == true) {

                        // Error en cesta
                        console.log('Amazon 503 Cart error');

                        if (REPRODUCIR_SONIDOS) {
                                sonidoDoorBuzz.play();
                        }

                        setTimeout(function() {
                                // Redireccionamos a la Cesta
                                location.href = 'https://www.amazon.es/gp/cart/view.html'
                        }, TIEMPO_OPERACION)

                } else {
                        console.log('Cesta de Amazon vacia')
                }

        }, TIEMPO_OPERACION)

}

// Pagina de confirmacion de agregado a la cesta
else if (document.URL.includes('/gp/huc/view')) {

        console.log(document.URL);

        if (REPRODUCIR_SONIDOS) {
                sonidoItemUsed.play();
        }

        setTimeout(function() {
                if (document.getElementsByClassName("a-color-price hlb-price a-inline-block a-text-bold")) {
                        console.log('*** Tramitar pedido ***');
                        document.getElementById("hlb-ptc-btn-native").click();
                }
        }, TIEMPO_OPERACION)

}

// Pagina de Pedido realizado
else if (document.URL.includes('/gp/buy/thankyou/handlers')) {

        if (REPRODUCIR_SONIDOS) {
                sonidoCodecOver.play();
        }

}
