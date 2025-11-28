import AlertConfig from '../models/alertConfig.model.js';

const DEFAULT_ALERT_EMAIL = (process.env.ALERT_DEFAULT_EMAIL || 'erick.a.colvincordova@gmail.com').trim();

function normalizeRecipients(list = []) {
  const uniques = new Set();
  list.forEach((item) => {
    const email = String(item || '').trim().toLowerCase();
    if (email) uniques.add(email);
  });
  if (DEFAULT_ALERT_EMAIL) {
    uniques.add(DEFAULT_ALERT_EMAIL.toLowerCase());
  }
  return Array.from(uniques);
}

export function getDefaultAlertEmail() {
  return DEFAULT_ALERT_EMAIL;
}

export async function ensureAlertConfig() {
  let config = await AlertConfig.findOne();
  if (!config) {
    config = await AlertConfig.create({
      emailRecipients: DEFAULT_ALERT_EMAIL ? [DEFAULT_ALERT_EMAIL] : []
    });
  } else {
    const normalized = normalizeRecipients(config.emailRecipients);
    if (normalized.length !== (config.emailRecipients || []).length ||
        (DEFAULT_ALERT_EMAIL && !normalized.includes(DEFAULT_ALERT_EMAIL.toLowerCase()))) {
      config.emailRecipients = normalized;
      await config.save();
    }
  }
  return config;
}

export async function updateAlertConfigRecipients(config, recipientsInput) {
  const recipients = Array.isArray(recipientsInput)
    ? recipientsInput
    : String(recipientsInput || '')
        .split(',')
        .map((email) => email.trim())
        .filter(Boolean);
  config.emailRecipients = normalizeRecipients(recipients);
  return config;
}

export function withDefaultRecipient(recipients = []) {
  return normalizeRecipients(recipients);
}
