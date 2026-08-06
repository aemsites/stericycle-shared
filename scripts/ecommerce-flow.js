import ffetch from './ffetch.js';

export const ECOMMERCE_FLOW_SHEET = '/ecommerce-flow.json';

const normalizeKey = (key) => key.toLowerCase().replace(/[^a-z0-9]/g, '');

export async function fetchEcommerceFlows() {
  try {
    const rows = await ffetch(ECOMMERCE_FLOW_SHEET).all();
    const result = {};
    rows.forEach((row) => {
      const keyRaw = row.Flow ?? row.Key ?? row.flow ?? row.key ?? '';
      const valueRaw = row.URL ?? row.Url ?? row.Value ?? row.url ?? row.value ?? '';
      if (keyRaw) {
        result[normalizeKey(String(keyRaw))] = String(valueRaw);
      }
    });
    return result;
  } catch {
    return {};
  }
}

export async function resolveFlowUrl(flowKey) {
  const flows = await fetchEcommerceFlows();
  const enabledVal = flows.enabled ?? '';
  const isEnabled = enabledVal.toLowerCase() === 'yes' || enabledVal.toLowerCase() === 'true';
  if (!isEnabled) return null;
  const url = flows[normalizeKey(flowKey)];
  return url || null;
}
