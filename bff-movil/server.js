// BFF MOVIL - puerto 5002
// Backend orientado a la aplicación móvil. Entrega respuestas livianas, con únicamente
// los datos esenciales, para reducir el consumo de datos y mejorar los tiempos de carga en el dispositivo del cliente.

const http = require('http');
const { URL } = require('url');
const legacy = require('../legacy/legacyData');
const { enviarJSON } = require('../legacy/httpHelper');

const PUERTO = 5002;

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PUERTO}`);
  const partes = url.pathname.split('/').filter(Boolean);

  if (req.method === 'GET' && partes[0] === 'api' && partes[1] === 'movil' && partes[2] === 'cuentas' && partes[3] && partes[4] === 'resumen') {
    const cuenta = legacy.getCuenta(partes[3]);
    if (!cuenta) return enviarJSON(res, 404, { error: 'Cuenta no encontrada' });

    return enviarJSON(res, 200, {
      nombre: cuenta.nombre,
      saldo: cuenta.saldo,
    });
  }

  if (req.method === 'GET' && partes[0] === 'api' && partes[1] === 'movil' && partes[2] === 'cuentas' && partes[3] && partes[4] === 'movimientos') {
    const cuenta = legacy.getCuenta(partes[3]);
    if (!cuenta) return enviarJSON(res, 404, { error: 'Cuenta no encontrada' });

    const movs = legacy.getMovimientosPorCuenta(partes[3])
      .slice(-5)
      .map((m) => ({ fecha: m.fecha, monto: m.monto }));

    return enviarJSON(res, 200, movs);
  }

  enviarJSON(res, 404, { error: 'ruta no encontrada' });
});

server.listen(PUERTO, () => {
  console.log('BFF MOVIL corriendo en http://localhost:' + PUERTO);
});
