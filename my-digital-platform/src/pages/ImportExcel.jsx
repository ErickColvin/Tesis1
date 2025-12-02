import React, { useContext, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataContext } from '../context/DataContext';

// ## Configuracion de tipos de carga y textos de ayuda
const TYPE_OPTIONS = [
  { value: 'products', label: 'Productos', description: 'Actualiza SKUs de Mercado Libre, stock y precios.' },
  { value: 'packages', label: 'Paquetes', description: 'Controla codigos logisticos.' }
];

const TEMPLATE_ROWS = {
  products: [
    ['SKU', 'PRODUCTO', 'CATEGORIA', 'STOCK', 'minSTOCK', 'PRECIO'],
    ['SKU-0001', 'Bicicleta montana', 'computacion', 14, 9, 92.86],
    ['SKU-0002', 'Puzzle madera', 'hogar', 128, 15, 62.62],
    ['SKU-0003', 'Aspiradora ciclonica', 'juguetes', 258, 61, 43.9],
    ['SKU-0004', 'Aspiradora ciclonica', 'moda', 34, 9, 945.78]
  ],
  packages: [
    ['code', 'productSku', 'state', 'location', 'notes'],
    ['PKG-001', 'SKU-0001', 'in_transit', 'Lima', 'Scanner'],
    ['PKG-002', 'SKU-0002', 'delivered', 'Arequipa', 'Entregado']
  ]
};

const VALIDATION_RULES = {
  products: [
    'Encabezados esperados: SKU, PRODUCTO, CATEGORIA, STOCK, minSTOCK y PRECIO.',
    'SKU obligatorio, unico y sin espacios.',
    'Stock, minSTOCK y PRECIO deben ser numeros >= 0 (acepta coma o punto decimal).',
    'Si minSTOCK viene vacio se usara 10 por defecto.',
    'Las filas duplicadas por SKU se descartan automaticamente.'
  ],
  packages: [
    'code es obligatorio y se convierte a mayusculas.',
    'productSku debe existir previamente en productos.',
    'state permitido: created, in_transit, delivered o rejected.',
    'location y notes son opcionales, solo texto plano.'
  ]
};

const CHECKLIST = [
  'Conexion con la API respondida (healthcheck).',
  'Validacion de cabeceras y tipos de datos.',
  'Deteccion de duplicados en memoria antes del envio.',
  'Creacion/actualizacion en base de datos y regeneracion de alertas.',
  'Notificacion automatica por correo al completar la carga.'
];

const STATUS_STYLES = {
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100',
  info: 'border-sky-500/30 bg-sky-500/10 text-sky-100',
  warning: 'border-amber-500/30 bg-amber-500/10 text-amber-100',
  error: 'border-rose-500/30 bg-rose-500/10 text-rose-100'
};
// ## Fin configuracion de tipos de carga y textos de ayuda

// ## Utilidad de formato numerico para estadisticas
const formatNumber = (value) => {
  if (value === null || value === undefined) return '0';
  return new Intl.NumberFormat('es-PE').format(value);
};
// ## Fin utilidad de formato numerico para estadisticas

// ## Tarjeta resumida para metrica de carga
const SummaryCard = ({ label, value, accent = 'from-orange-500 to-rose-500' }) => (
  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
    <p className="text-xs uppercase tracking-[0.3em] text-gray-400">{label}</p>
    <p className={`mt-2 text-2xl font-semibold bg-gradient-to-r ${accent} text-transparent bg-clip-text`}>
      {formatNumber(value)}
    </p>
  </div>
);
// ## Fin tarjeta resumida para metrica de carga

// ## Mensaje compacto de estado o error
const FeedbackMessage = ({ feedback }) => {
  if (!feedback) return null;
  const style = STATUS_STYLES[feedback.type] || STATUS_STYLES.info;
  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm font-medium ${style}`}>
      {feedback.message}
    </div>
  );
};
// ## Fin mensaje compacto de estado o error

// ## Tabla de errores detectados en la carga
const ErrorList = ({ errors }) => {
  if (!errors?.length) return null;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-white">Detalle de observaciones</p>
        <p className="text-xs text-gray-400">Se muestran las primeras {errors.length} filas con error</p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-white/10">
        <table className="min-w-full divide-y divide-white/5 text-sm">
          <thead className="bg-white/5 text-gray-300">
            <tr>
              <th className="px-4 py-2 text-left font-semibold">Fila</th>
              <th className="px-4 py-2 text-left font-semibold">Campo</th>
              <th className="px-4 py-2 text-left font-semibold">Detalle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-gray-200">
            {errors.map((err, idx) => (
              <tr key={`${err.row}-${err.field}-${idx}`}>
                <td className="px-4 py-2">{err.row ?? '-'}</td>
                <td className="px-4 py-2 uppercase tracking-wide text-xs text-gray-400">{err.field}</td>
                <td className="px-4 py-2">{err.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
// ## Fin tabla de errores detectados en la carga

// ## Pantalla de importacion de Excel para inventarios
const ImportExcel = ({ allowEdit = true }) => {
  const navigate = useNavigate();
  const { uploadExcel } = useContext(DataContext) || {};

  // ## Estado para archivo, tipo, progreso y mensajes
  const [file, setFile] = useState(null);
  const [type, setType] = useState('products');
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [errors, setErrors] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const fileInputRef = useRef(null);
  // ## Fin estado para archivo, tipo, progreso y mensajes

  // ## Datos derivados segun el tipo de carga elegido
  const requiredHeaders = useMemo(() => TEMPLATE_ROWS[type][0], [type]);
  const validationRules = VALIDATION_RULES[type];
  // ## Fin datos derivados segun el tipo de carga elegido

  // ## Seleccion y limpieza de archivo local
  const handleFileChange = (event) => {
    setFeedback(null);
    const newFile = event.target.files?.[0];
    setFile(newFile || null);
  };

  const resetFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
// ## Fin seleccion y limpieza de archivo local

// ## Descarga de plantilla CSV segun tipo
const downloadTemplate = () => {
  const rows = TEMPLATE_ROWS[type];
  const separator = ';'; // Excel en ES usa ; como separador cuando los decimales llevan coma
  const csvBody = rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(separator))
    .join('\n');
  const csv = `\ufeff${csvBody}`; // BOM para que Excel detecte UTF-8 y columnas
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `plantilla_${type}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };
  // ## Fin descarga de plantilla CSV segun tipo

  // ## Envio de archivo al backend y manejo de feedback
  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback(null);
    setSummary(null);
    setErrors([]);

    if (!allowEdit) {
      setFeedback({ type: 'error', message: 'Solo lectura: solicita permisos de edicion para cargar inventario.' });
      return;
    }

    if (!file) {
      setFeedback({ type: 'warning', message: 'Selecciona un archivo Excel (.xlsx, .xls o .csv) antes de continuar.' });
      return;
    }

    if (!uploadExcel) {
      setFeedback({ type: 'error', message: 'Servicio de carga no disponible. Refresca la pagina.' });
      return;
    }

    setLoading(true);
    setProgress(10);

    try {
      const result = await uploadExcel(file, {
        type,
        onProgress: (value) => setProgress(value || 15)
      });
      const payloadSummary = result?.summary || null;
      setSummary(payloadSummary);
      setErrors(result?.errors || []);
      const hasWarnings = (payloadSummary?.rowsError || 0) > 0;
      setFeedback({
        type: hasWarnings ? 'warning' : 'success',
        message: hasWarnings
          ? `Carga completada con ${payloadSummary.rowsOk} filas validas y ${payloadSummary.rowsError} observaciones.`
          : 'Inventario actualizado correctamente. No se detectaron errores.'
      });
    } catch (err) {
      const errorMsg =
        err?.response?.data?.detail ||
        err?.response?.data?.error ||
        err?.message ||
        'Error inesperado al procesar el archivo.';
      setFeedback({ type: 'error', message: errorMsg });
      setSummary(null);
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(0), 900);
    }
  };
  // ## Fin envio de archivo al backend y manejo de feedback

  // ## Tarjetas de resumen derivadas de la respuesta
  const summaryCards = useMemo(() => {
    if (!summary) return [];
    return [
      { label: 'Total filas procesadas', value: summary.rowsTotal, accent: 'from-amber-400 to-rose-500' },
      { label: 'Filas validas', value: summary.rowsOk, accent: 'from-emerald-400 to-lime-500' },
      { label: 'Filas con error', value: summary.rowsError, accent: 'from-amber-500 to-orange-600' },
      { label: 'Productos creados', value: summary.productsCreated, accent: 'from-rose-400 to-pink-500' },
      { label: 'Productos actualizados', value: summary.productsUpdated, accent: 'from-orange-400 to-amber-500' },
      { label: 'Paquetes creados', value: summary.packagesCreated, accent: 'from-lime-400 to-emerald-500' },
      { label: 'Paquetes actualizados', value: summary.packagesUpdated, accent: 'from-rose-400 to-red-500' }
    ].filter((item) => item.value !== undefined && item.value !== null);
  }, [summary]);
  // ## Fin tarjetas de resumen derivadas de la respuesta

  // ## Render principal de la pantalla de importacion
  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.4em] text-amber-300/70">Importar datos</p>
        <h1 className="text-3xl font-semibold text-white">Carga masiva de inventario</h1>
        <p className="text-sm text-gray-400">
          Normalizamos cabeceras, detectamos duplicados y notificamos por correo para que la trazabilidad quede consistente.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <section className="glass-panel p-6 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {TYPE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setType(option.value)}
                  className={`rounded-2xl border px-4 py-3 text-left transition ${
                    type === option.value
                      ? 'border-white/40 bg-white/10 text-white'
                      : 'border-white/5 bg-white/0 text-gray-300 hover:border-white/20'
                  }`}
                >
                  <p className="text-sm font-semibold">{option.label}</p>
                  <p className="text-xs text-gray-400">{option.description}</p>
                </button>
              ))}
            </div>

            <div className="border border-dashed border-white/20 rounded-2xl p-6 text-center hover:border-white/40 transition relative">
              <p className="text-sm text-gray-300 mb-3">
                Arrastra tu archivo o haz clic para seleccionar. Aceptamos .xlsx y .xls
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="block w-full cursor-pointer rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-200 file:mr-4 file:rounded-lg file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-sm file:font-semibold hover:file:bg-white/20 disabled:opacity-50"
                disabled={!allowEdit || loading}
              />
              {file && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-400">
                  <span>
                    Archivo seleccionado: <span className="text-white font-semibold">{file.name}</span>
                  </span>
                  <button
                    type="button"
                    className="text-rose-300 hover:text-rose-200 font-semibold"
                    onClick={resetFile}
                    disabled={loading}
                  >
                    Limpiar
                  </button>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !allowEdit}
              className="w-full rounded-2xl bg-gradient-to-r from-orange-500 to-rose-500 py-3 font-semibold tracking-wide shadow-lg transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
            >
              {allowEdit ? (loading ? 'Procesando...' : 'Procesar inventario') : 'Permiso requerido'}
            </button>
          </form>

          {loading && (
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-widest text-gray-400">Progreso</p>
              <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-400 via-rose-400 to-pink-500 transition-all duration-200"
                  style={{ width: `${Math.min(Math.max(progress, 10), 100)}%` }}
                />
              </div>
            </div>
          )}

          <FeedbackMessage feedback={feedback} />

          {summary && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white">Resumen del procesamiento</p>
                <button
                  type="button"
                  onClick={() => navigate('/products')}
                  className="text-xs font-semibold uppercase tracking-widest text-amber-300 hover:text-amber-200"
                >
                  Ver productos
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {summaryCards.map((card) => (
                  <SummaryCard key={card.label} label={card.label} value={card.value} accent={card.accent} />
                ))}
              </div>
            </div>
          )}

          <ErrorList errors={errors} />
        </section>

        <aside className="glass-panel p-6 space-y-6">
          <div>
            <p className="text-sm font-semibold text-white">Plantilla de referencia</p>
            <p className="text-xs text-gray-400">
              Cabeceras detectadas automaticamente. Puedes renombrarlas o usar sin acentos.
            </p>
            <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10">
              <table className="min-w-full text-xs text-gray-200">
                <thead className="bg-white/5">
                  <tr>
                    {requiredHeaders.map((header) => (
                      <th key={header} className="px-3 py-2 text-left font-semibold uppercase tracking-wide text-gray-400">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TEMPLATE_ROWS[type].slice(1).map((row, idx) => (
                    <tr key={`${type}-row-${idx}`} className="border-t border-white/5">
                      {row.map((cell, cellIdx) => (
                        <td key={`${type}-row-${idx}-${cellIdx}`} className="px-3 py-2">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-gray-500 italic">
              Consejo: usa la plantilla para editar en Excel/Google Sheets y exporta a .xlsx antes de subirla.
            </p>
            <button
              type="button"
              onClick={downloadTemplate}
              className="mt-4 w-full rounded-2xl border border-white/20 py-2 text-sm font-semibold text-white hover:bg-white/10"
            >
              Descargar plantilla (CSV editable)
            </button>
          </div>

          <div>
            <p className="text-sm font-semibold text-white">Reglas de validacion</p>
            <ul className="mt-3 space-y-2 text-sm text-gray-300">
              {validationRules.map((rule) => (
                <li key={rule} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-400" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-white">Chequeo funcional activo</p>
            <ul className="mt-3 space-y-2 text-xs text-gray-400">
              {CHECKLIST.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-0.5 h-2 w-2 rounded-full bg-emerald-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
};
// ## Fin pantalla de importacion de Excel para inventarios

export default ImportExcel;
