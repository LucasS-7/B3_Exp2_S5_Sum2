- Asignatura: Desarrollo Backend III.
- Alumno: Lucas Silva A.
- Docente: Alonso Castillo P. 


#Actividad Sumativa N°2

## Objetivo

El banco tiene 3 tipos de clientes: la web, la app del celular y los cajeros automáticos. Cada uno necesita cosas distintas de los mismos datos, así que en vez de una API genérica para todos, se hizo un backend específico para cada uno:

- bff-web -> (puerto 5001).
- bff-movil -> (puerto 5002).
- bff-cajero -> (puerto 5003).

Los 3 usan la misma base de datos (legacy/legacyData.js), que
lee los csv de la carpeta data/ , sacados directamente del repositorio (https://github.com/KariVillagran/bank_legacy_data).



## Estructura

```
banco-xyz-bff/
├── data/               csv del repo bank_legacy_data
│   ├── intereses.csv
│   ├── cuentas_anuales.csv
│   └── transacciones.csv
├── legacy/
│   ├── legacyData.js   lee los csv, limpia y normaliza los datos
│   └── httpHelper.js   funciones chicas para responder json
├── bff-web/server.js
├── bff-movil/server.js
├── bff-cajero/server.js
└── README.md
```



## Endpoints

BFF Web (http://localhost:5001)
- GET /api/web/cuentas - lista de cuentas válidas
- GET /api/web/cuentas/:id - cuenta completa + todos sus movimientos
- GET /api/web/actividad-general - movimientos generales del banco
  

BFF Móvil (http://localhost:5002)
- GET /api/movil/cuentas/:id/resumen - nombre y saldo, nada más
- GET /api/movil/cuentas/:id/movimientos - últimos 5 movimientos

BFF Cajero (http://localhost:5003)
- GET /api/cajero/cuentas/:id/saldo?pin= - consulta de saldo
- POST /api/cajero/cuentas/:id/retiro con body 


## Cómo ejecutar

- Necesario tener Node instalado.

Abrir 3 terminales, en cada una ubicarse dentro de la carpeta del proyecto y ejecutar en cada terminal un BFF:

```
node bff-web/server.js
node bff-movil/server.js
node bff-cajero/server.js
```

Probar con el navegador o con curl:

```
curl http://localhost:5001/api/web/cuentas/101
curl http://localhost:5002/api/movil/cuentas/101/resumen
curl "http://localhost:5003/api/cajero/cuentas/101/saldo?pin=7295"

curl -X POST http://localhost:5003/api/cajero/cuentas/101/retiro -H "Content-Type: application/json" -d "{\"monto\":1000,\"pin\":\"7295\"}"
```

