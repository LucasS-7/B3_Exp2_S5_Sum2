// Simula el sistema legacy del banco (leyendo los csv del repo bank_legacy_data)
// Los datos vienen sucios a proposito: cuentas repetidas, saldos vacios, edades
// imposibles, fechas en formatos distintos, etc.
// Esta capa se encarga de limpiar/normalizar antes de que los BFF entreguen la informacion.

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

function leerCSV(nombre) {
  const ruta = path.join(DATA_DIR, nombre);
  const texto = fs.readFileSync(ruta, 'utf-8').trim();
  const lineas = texto.split('\n');
  const columnas = lineas[0].split(',');

  const filas = [];
  for (let i = 1; i < lineas.length; i++) {
    const valores = lineas[i].split(',');
    const fila = {};
    for (let j = 0; j < columnas.length; j++) {
      fila[columnas[j].trim()] = (valores[j] || '').trim();
    }
    filas.push(fila);
  }
  return filas;
}

// Los archivos .CSV traen fechas en varios formatos, entonces estandarizamos las
// fechas en formato (aaaa-mm-dd).

function normalizarFecha(fecha) {
  if (!fecha) return null;
  const partes = fecha.replace(/\//g, '-').split('-');
  if (partes.length !== 3) return fecha; // formato raro, se deja como viene

  if (partes[0].length === 4) {
    // ya viene aaaa-mm-dd
    return partes.join('-');
  }
  // viene dd-mm-aaaa
  const [dia, mes, anio] = partes;
  return `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
}

//Estandarizar las tildes y minusculas.
function normalizarTexto(txt) {
  if (!txt) return '';
  return txt
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

// El archivo .CSV trae la misma cuenta_id repetida muchas veces con distinto
// nombre/tipo. Se toma la primera fila valida de cada cuenta_id y el resto se descarta.

function cargarCuentas() {
  const filas = leerCSV('intereses.csv');
  const cuentas = {};

  for (const f of filas) {
    if (cuentas[f.cuenta_id]) continue; // esa cuenta ya quedo con un registro valido

    const edad = Number(f.edad);
    const saldo = f.saldo === '' ? null : Number(f.saldo);
    const nombreOk = f.nombre && f.nombre.toLowerCase() !== 'unknown';

    if (!f.cuenta_id) continue;
    if (!nombreOk) continue;
    if (!(edad > 0 && edad < 110)) continue;
    if (saldo === null || Number.isNaN(saldo)) continue;

    const tipo = normalizarTexto(f.tipo);
    const tipoValido = ['ahorro', 'prestamo', 'hipoteca'].includes(tipo) ? tipo : 'sin_clasificar';

    cuentas[f.cuenta_id] = {
      cuentaId: f.cuenta_id,
      nombre: f.nombre,
      edad,
      saldo,
      tipoProducto: tipoValido,
      pin: '7295',
    };
  }

  return cuentas;
}


// Historial de movimientos de cada cuenta.
function cargarMovimientos() {
  const filas = leerCSV('cuentas_anuales.csv');
  const lista = [];

  for (const f of filas) {
    const monto = Number(f.monto);
    if (!f.cuenta_id) continue;
    if (f.monto === '' || Number.isNaN(monto) || monto === 0) continue; // dato faltante o invalido

    lista.push({
      cuentaId: f.cuenta_id,
      fecha: normalizarFecha(f.fecha),
      tipo: normalizarTexto(f.transaccion) || 'sin_tipo',
      monto,
      descripcion: f.descripcion || 'sin descripcion',
    });
  }

  return lista;
}


// El archivo NO trae cuenta_id, por eso no se puede asociar a una cuenta especifica,
// se deja como un listado general.

function cargarActividadGeneral() {
  const filas = leerCSV('transacciones.csv');
  const lista = [];

  for (const f of filas) {
    const monto = Number(f.monto);
    const tipo = normalizarTexto(f.tipo);
    if (f.monto === '' || Number.isNaN(monto) || monto === 0) continue;
    if (!['credito', 'debito'].includes(tipo)) continue; // se descartan "invalid" y "desconocido"

    lista.push({
      id: f.id,
      fecha: normalizarFecha(f.fecha),
      tipo,
      monto,
    });
  }

  return lista;
}

const cuentas = cargarCuentas();
const movimientos = cargarMovimientos();
const actividadGeneral = cargarActividadGeneral();

function getCuentas() {
  return Object.values(cuentas);
}

function getCuenta(id) {
  return cuentas[id] || null;
}

function getMovimientosPorCuenta(id) {
  return movimientos
    .filter((m) => m.cuentaId === id)
    .sort((a, b) => (a.fecha > b.fecha ? 1 : -1));
}

function getActividadGeneral(limite = 15) {
  return actividadGeneral.slice(0, limite);
}

// Operación del cajero: retiro
function retirarDinero(id, monto, pin) {
  const c = cuentas[id];
  if (!c) return { ok: false, error: 'Cuenta no existe' };
  if (c.pin !== pin) return { ok: false, error: 'Pin incorrecto' };
  if (!(monto > 0)) return { ok: false, error: 'Monto invalido' };
  if (c.saldo < monto) return { ok: false, error: 'Saldo insuficiente' };

  c.saldo -= monto;
  return { ok: true, saldo: c.saldo };
}

module.exports = {
  getCuentas,
  getCuenta,
  getMovimientosPorCuenta,
  getActividadGeneral,
  retirarDinero,
};
