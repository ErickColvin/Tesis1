import {
  ensureAlertConfig,
  withDefaultRecipient
} from './alertConfig.service.js';
import { sendEmail } from './email.service.js';

function htmlStockAlert({ producto, stock, minStock, sku }) {
  return `
    <div style="font-family:Arial,sans-serif;padding:16px;background:#0f172a;color:#e2e8f0;">
      <h2 style="color:#60a5fa;">Alerta de stock bajo</h2>
      <p>El producto <strong>${producto || sku}</strong> tiene stock ${stock}/${minStock}.</p>
      <ul>
        <li>SKU: ${sku || 'N/D'}</li>
        <li>Stock: ${stock}</li>
        <li>Mínimo configurado: ${minStock}</li>
      </ul>
      <p>Revisa el panel para reabastecer.</p>
    </div>
  `;
}

function htmlImportSummary({ fileName, summary, errors }) {
  const errorsHtml = (errors || []).length
    ? `
      <div style="margin-top:16px;">
        <p style="margin:0 0 8px;color:#f43f5e;font-weight:bold;">Errores detectados:</p>
        <ul style="margin:0;padding-left:18px;font-size:13px;color:#e2e8f0;">
          ${errors.slice(0, 5).map((err) => `<li>Fila ${err.row}: ${err.field} - ${err.message}</li>`).join('')}
        </ul>
      </div>`
    : '<p style="margin-top:16px;color:#22c55e;font-weight:bold;">Sin errores reportados.</p>';

  return `
    <div style="font-family:Arial,sans-serif;padding:16px;background:#0f172a;color:#e2e8f0;">
      <h2 style="color:#c084fc;margin-bottom:4px;">Importación completada</h2>
      <p style="margin:0 0 8px;">El archivo <strong>${fileName}</strong> se procesó correctamente.</p>
      <ul style="list-style:none;margin:0;padding:0;font-size:13px;">
        <li>Total filas: <strong>${summary.rowsTotal}</strong></li>
        <li>Filas válidas: <strong>${summary.rowsOk}</strong></li>
        <li>Filas con error: <strong>${summary.rowsError}</strong></li>
        <li>Productos creados: <strong>${summary.productsCreated}</strong></li>
        <li>Productos actualizados: <strong>${summary.productsUpdated}</strong></li>
        ${summary.packagesCreated !== undefined ? `<li>Paquetes creados: <strong>${summary.packagesCreated}</strong></li>` : ''}
        ${summary.packagesUpdated !== undefined ? `<li>Paquetes actualizados: <strong>${summary.packagesUpdated}</strong></li>` : ''}
      </ul>
      ${errorsHtml}
    </div>
  `;
}

async function resolveRecipients(extra = []) {
  const config = await ensureAlertConfig();
  return withDefaultRecipient([...(config.emailRecipients || []), ...extra]);
}

export async function notifyLowStock(product) {
  try {
    const recipients = await resolveRecipients();
    if (!recipients.length) return;
    const subject = `[Stock bajo] ${product.nombre || product.producto || product.sku}`;
    const text = `Stock bajo: ${product.nombre || product.producto || product.sku} stock ${product.stock}/${product.minStock}.`;
    const html = htmlStockAlert({
      producto: product.nombre || product.producto,
      stock: product.stock,
      minStock: product.minStock,
      sku: product.sku
    });
    await sendEmail({ to: recipients, subject, text, html });
  } catch (err) {
    console.error('notifyLowStock error', err.message);
  }
}

export async function notifyImportSummary({ fileName, summary, errors = [], extraRecipients = [] }) {
  try {
    const recipients = await resolveRecipients(extraRecipients);
    if (!recipients.length) return;
    const subject = `Importación completada: ${fileName}`;
    const text = `Archivo ${fileName} importado. ${summary.rowsOk}/${summary.rowsTotal} filas válidas, ${summary.rowsError} con errores.`;
    const html = htmlImportSummary({ fileName, summary, errors });
    await sendEmail({ to: recipients, subject, text, html });
  } catch (err) {
    console.error('notifyImportSummary error', err.message);
  }
}
