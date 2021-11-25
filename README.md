# Amazon-Bot
Bot para Amazon España.

Refresca automáticamente la página de un producto de Amazon que no se encuentra disponible hasta encontrar stock, y procede a realizar la compra una vez haya encontrado disponibilidad.

### Instrucciones

1. Instalar la extensión **Tampermonkey** de Google Chrome:
https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo
2. Abrir el *Dashboard* de **Tampermonkey** y crear un nuevo script.
3. Copiar el contenido del fichero [amazon-bot.js](amazon-bot.js) en el nuevo script.
4. Abrir en el navegador la página del producto de Amazon deseado, y copiar la ID de producto de la URL en el script, y asignarle el precio límite.
5. Activar **Tampermonkey** y el script a ejecutar.
