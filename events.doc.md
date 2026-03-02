Eventos
Los eventos son la manera en la que Wompi te informa sobre algo importante que sucedió, sin que lo solicites activamente, usando un webhook. En pocas palabras, haremos una petición HTTP de tipo POST a una URL que especifiques, con un JSON que contiene toda la información relativa al evento que sucedió.

Así, por ejemplo, cada vez que una transacción sea aprobada o rechazada, Wompi te informará sobre esta actividad en la URL de eventos que hayas configurado en tu cuenta, con el fin de que tomes las medidas necesarias del lado de tu negocio. Para configurar dicha URL, lo puedes hacer en nuestro Dashboard de comercios.

Una URL de eventos para cada ambiente
Ten presente que tanto para Sandbox como Producción, debes configurar una URL de eventos diferente para cada ambiente. Esto, con el fin de evitar la mezcla accidental de transacciones de prueba con datos reales.

Manejar un evento
Cada vez que Wompi quiera notificar un evento a tu sistema, usará la URL de eventos, a la cual hará una petición HTTP de tipo POST, que contendrá un objeto como el que se muestra más abajo. A dicha petición HTTP, tu sistema deberá responder con un status HTTP 200 (que es el status de respuesta exitosa por defecto en los frameworks y librerías más populares). El cuerpo de respuesta que envíes no tiene importancia, ya que Wompi no lo utilizará de ninguna manera, así que puedes responder con un cuerpo vacío, un objeto JSON, etc.

Mientras el status HTTP de la respuesta por parte de tu sistema sea diferente a 200, Wompi considerará que el evento no pudo ser notificado correctamente y reintentará notificar nuevamente el evento, máximo 3 veces durante las siguientes 24 horas, hasta obtener un 200 como respuesta. El primer reintento será efectuado 30 minutos después, el segundo a las 3 horas y el último pasadas 24 horas.

Usa HTTPS
Te recomendamos usar HTTPS para la URL de eventos que especifiques. De esta manera se garantiza que la información viaja con encripción de punta a punta sin que nadie la pueda modificar durante el proceso de comunicación.

Cuerpo de un evento
Cualquier evento que Wompi envíe tendrá siempre la misma estructura:

{
  "event": "transaction.updated", // Nombre del tipo de evento
  "data": {
    // Data específica del evento
  },
  "environment": "prod", // "test" para Sandbox, "prod" para Producción
  "signature": {
    "properties": [
      // Lista de propiedades con las que se construye la firma
    ],
    "checksum": "..." // Hash calculado con una firma asimétrica SHA256
  },
  "timestamp": 1530291411, // Timestamp UNIX del evento usado para la firma del mismo
  "sent_at":  "2018-07-18T08:35:20.000Z" // Fecha current la que se notificó el evento por primera vez
}

Así por ejemplo, en el caso del evento transaction.updated, el cual indica que el estado de una transacción cambió, el cuerpo JSON enviado a la URL de eventos se verá como el siguiente:

{
  "event": "transaction.updated",
  "data": {
    "transaction": {
        "id": "1234-1610641025-49201",
        "amount_in_cents": 4490000,
        "reference": "MZQ3X2DE2SMX",
        "customer_email": "juan.perez@gmail.com",
        "currency": "COP",
        "payment_method_type": "NEQUI",
        "redirect_url": "https://mitienda.com.co/pagos/redireccion",
        "status": "APPROVED",
        "shipping_address": null,
        "payment_link_id": null,
        "payment_source_id": null
      }
  },
  "environment": "prod",
  "signature": {
    "properties": [
      "transaction.id",
      "transaction.status",
      "transaction.amount_in_cents"
    ],
    "checksum": "3476DDA50F64CD7CBD160689640506FEBEA93239BC524FC0469B2C68A3CC8BD0"
  },
  "timestamp": 1530291411,
  "sent_at":  "2018-07-20T16:45:05.000Z"
}

Tipos de eventos
A continuación encuentras una lista con los tipos de eventos que Wompi usa. Esta lista puede crecer con el tiempo, así que te sugerimos consultarla periódicamente:

Tipo	Descripción
transaction.updated	El estado de una transacción cambió, usualmente a un estado final (APPROVED, VOIDED, DECLINED o ERROR)
nequi_token.updated	El estado de un token de Nequi cambió, usualmente a un estado final (APPROVED o DECLINED)
bancolombia_transfer_token.updated	El estado de un token de Bancolombia cambió, usualmente a un estado final (APPROVED o DECLINED)
Seguridad
Para validar la integridad de la información notificada a tu URL de eventos y evitar suplantaciones, Wompi utiliza un hash criptográfico asimétrico, cuyo valor se encuentra en dos sitios:

El Header HTTP X-Event-Checksum
El campo checksum, del objeto signature
Los proveemos en ambos sitios por conveniencia, así que eres libre de extraerlo de cualquiera de los dos para hacer la respectiva validación de seguridad.

El algoritmo usado para generar esta firma asimétrica es SHA256. El valor de este checksum se genera concantenando en orden lo siguientes datos:

Los valores de los campos especificados en el arreglo properties, que apuntan a campos del objeto data
El campo timestamp (número entero) que es el Tiempo UNIX del evento
Un Secreto conocido únicamente por el comercio y Wompi, que está disponible en la opción Mi cuenta del Dashboard de Comercios, bajo la sección Secretos para integración técnica. Este secreto debe ser custodiado con la máxima seguridad en tus servidores
Paso a paso: Verifica la autenticidad de un evento
Siguiendo estas instrucciones, explicamos a continuación cómo calcular y validar por ejemplo el checksum del evento de una Transacción, mostrado más arriba, paso a paso:

Paso 1: Concatena los valores de los datos del evento
En el objeto signature del evento debes concatenar el valor de los datos descritos en el campo properties. En este caso tenemos:

transaction.id: Cuyo valor es 1234-1610641025-49201
transaction.status: Cuyo valor es APPROVED
transaction.amount_in_cents: Cuyo valor es 4490000
El valor resultante de la concatenación de estos datos, respetando el orden especificados en el arreglo signature.properties es:

1234-1610641025-49201APPROVED4490000

Los properties pueden variar.
Los valores del campo properties pueden variar en el tiempo y en cada evento, por eso es muy importante que no los asumas como un arreglo fijo dentro de tu código, sino que siempre los extraigas del evento y utilices apropiadamente en cada validación.

Paso 2: Concatena el campo timestamp
A la concatenación de las propiedades mostradas en el Paso 1, debes concatenarle también el campo timestamp del evento, que en este caso es 1530291411. El valor que deberías tener ahora en la cadena en este punto es:

1234-1610641025-49201APPROVED44900001530291411

Paso 3: Concatena tu secreto
En este paso debes concatenar tu secreto al string que estás generando hasta este punto. Vamos a asumir, en este ejemplo, que tu secreto es:

prod_events_OcHnIzeBl5socpwByQ4hA52Em3USQ93Z

El Secreto de Eventos es distinto a la Llave Privada
Es importante que aclarar que este Secreto para Eventos es diferente de tu Llave Privada y Llave Pública.

El resultado final de la concatenación debería ser:

1234-1610641025-49201APPROVED44900001530291411prod_events_OcHnIzeBl5socpwByQ4hA52Em3USQ93Z

Paso 4: Usa SHA256 para generar el checksum
Con estos datos concatenados apropiadamente, es momento de generar el checksum usando SHA256. Pasando la cadena por este algoritmo se obtiene por ejemplo el siguiente resultado:

3476DDA50F64CD7CBD160689640506FEBEA93239BC524FC0469B2C68A3CC8BD0

La manera en la que usa SHA256 para calcular este valor, varía dependiendo de cada lenguaje de programación. Sin embargo, el resultado debe ser siempre el mismo, dada la naturaleza de este algoritmo seguro de encripción asimétrica. Mostramos algunos ejemplos a continuación:

PHP
// Cómo se escribe
hash ("sha256", $cadena_concatenada);
// Ejemplo
hash ("sha256", "1234-1610641025-49201APPROVED44900001530291411prod_events_OcHnIzeBl5socpwByQ4hA52Em3USQ93Z");


Ruby
# Cómo se escribe
Digest::SHA256.hexdigest(cadena_concatenada)
# Ejemplo
Digest::SHA256.hexdigest("1234-1610641025-49201APPROVED44900001530291411prod_events_OcHnIzeBl5socpwByQ4hA52Em3USQ93Z")


Paso 5: Compara tu checksum calculado con el proveído en el evento
Al generar, tú mismo, el valor del checksum en tu servidor, puedes ahora compararlo con el que llegó en el evento. Si ambos son iguales entonces puedes estar seguro que la información presentada es legítima y enviada por Wompi, y no una suplantación de un tercero. De lo contrario, debes ignorar dicho evento.