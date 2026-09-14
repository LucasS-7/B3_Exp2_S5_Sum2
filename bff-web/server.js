// BFF WEB - puerto 5001
// Backend orientado al cliente web. Entrega la información completa de cada cuenta
// (incluyendo el historial de movimientos), ya que en este canal el peso de la respuesta no es una limitante como en el móvil.

const http = require('http');
const { URL } = require('url');
const legacy = require('../legacy/legacyData');
const { enviarJSON } = require('../legacy/httpHelper');

const PUERTO = 5001;

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PUERTO}`);
  const partes = url.pathname.split('/').filter(Boolean);

  if (req.method === 'GET' && url.pathname === '/api/web/cuentas') {
    return enviarJSON(res, 200, legacy.getCuentas());
  }

  if (req.method === 'GET' && partes[0] === 'api' && partes[1] === 'web' && partes[2] === 'cuentas' && partes[3]) {
    const id = partes[3];
    const cuenta = legacy.getCuenta(id);
    if (!cuenta) return enviarJSON(res, 404, { error: 'Cuenta no encontrada' });

    return enviarJSON(res, 200, {
      cuenta,
      movimientos: legacy.getMovimientosPorCuenta(id),
    });
  }

  // este endpoint muestra actividad general del banco, no de una cuenta
  // especifica, porque el archivo transacciones.csv del repo no trae
  // cuenta_id (solo id, fecha, monto y tipo)
  if (req.method === 'GET' && url.pathname === '/api/web/actividad-general') {
    return enviarJSON(res, 200, legacy.getActividadGeneral());
  }

  enviarJSON(res, 404, { error: 'ruta no encontrada' });
});

server.listen(PUERTO, () => {
  console.log('BFF WEB corriendo en http://localhost:' + PUERTO);
});
