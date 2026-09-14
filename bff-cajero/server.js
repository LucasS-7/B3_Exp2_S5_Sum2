// BFF CAJERO - puerto 5003
// Backend orientado a cajeros automáticos. Expone únicamente las operaciones críticas
// del canal (consulta de saldo y retiro de dinero), exigiendo validación de pin en cada
// solicitud dado el carácter sensible de estas transacciones.

const http = require('http');
const { URL } = require('url');
const legacy = require('../legacy/legacyData');
const { enviarJSON, leerBody } = require('../legacy/httpHelper');

const PUERTO = 5003;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PUERTO}`);
  const partes = url.pathname.split('/').filter(Boolean);

  if (req.method === 'GET' && partes[0] === 'api' && partes[1] === 'cajero' && partes[2] === 'cuentas' && partes[3] && partes[4] === 'saldo') {
    const pin = url.searchParams.get('pin');
    const cuenta = legacy.getCuenta(partes[3]);

    if (!cuenta) return enviarJSON(res, 404, { error: 'Cuenta no encontrada' });
    if (cuenta.pin !== pin) return enviarJSON(res, 401, { error: 'Pin incorrecto' });

    return enviarJSON(res, 200, { cuentaId: partes[3], saldoDisponible: cuenta.saldo });
  }

  if (req.method === 'POST' && partes[0] === 'api' && partes[1] === 'cajero' && partes[2] === 'cuentas' && partes[3] && partes[4] === 'retiro') {
    const body = await leerBody(req);
    const resultado = legacy.retirarDinero(partes[3], Number(body.monto), body.pin);

    if (!resultado.ok) return enviarJSON(res, 400, { error: resultado.error });
    return enviarJSON(res, 200, { mensaje: 'retiro exitoso', saldoDisponible: resultado.saldo });
  }

  enviarJSON(res, 404, { error: 'ruta no encontrada' });
});

server.listen(PUERTO, () => {
  console.log('BFF CAJERO corriendo en http://localhost:' + PUERTO);
});
