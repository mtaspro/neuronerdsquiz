import AiIntegrationConfig from '../models/AiIntegrationConfig.js';

export const INTEGRATION_KEYS = ['neurax', 'daily_calendar', 'whatsapp_bot'];
export const PROVIDERS = ['openrouter', 'groq', 'gemini', 'hcn'];

export const DEFAULT_INTEGRATIONS = {
  neurax: {
    enabled: true,
    provider: 'hcn',
    modelId: 'step-3.5-flash',
    overrideClientModel: false,
    fallbackEnabled: true,
    fallbackProvider: 'openrouter',
    fallbackModelId: 'openrouter/free'
  },
  daily_calendar: {
    enabled: true,
    provider: 'gemini',
    modelId: 'gemini-2.5-flash',
    overrideClientModel: true,
    fallbackEnabled: true,
    fallbackProvider: 'openrouter',
    fallbackModelId: 'openrouter/free'
  },
  whatsapp_bot: {
    enabled: true,
    provider: 'hcn',
    modelId: 'step-3.5-flash',
    overrideClientModel: true,
    fallbackEnabled: true,
    fallbackProvider: 'openrouter',
    fallbackModelId: 'openrouter/free'
  }
};

let cachedConfig = null;
let cachedAt = 0;
const CACHE_TTL_MS = 5000;

export function getProviderKeyStatus() {
  return {
    openrouter: Boolean(process.env.OPENROUTER_API_KEY),
    groq: Boolean(process.env.GROQ_API_KEY),
    gemini: Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY),
    hcn: Boolean(process.env.HCN_API_KEY)
  };
}

export function invalidateAiIntegrationCache() {
  cachedConfig = null;
  cachedAt = 0;
}

function normalizeIntegration(key, incoming = {}) {
  const defaults = DEFAULT_INTEGRATIONS[key];
  const provider = PROVIDERS.includes(incoming.provider) ? incoming.provider : defaults.provider;
  const fallbackProvider = PROVIDERS.includes(incoming.fallbackProvider)
    ? incoming.fallbackProvider
    : defaults.fallbackProvider;

  return {
    enabled: incoming.enabled !== false,
    provider,
    modelId: String(incoming.modelId || defaults.modelId).trim(),
    overrideClientModel: Boolean(incoming.overrideClientModel),
    fallbackEnabled: incoming.fallbackEnabled !== false,
    fallbackProvider,
    fallbackModelId: String(incoming.fallbackModelId || defaults.fallbackModelId).trim()
  };
}

function toPlainIntegrations(doc) {
  const source = doc?.integrations || {};
  return {
    neurax: normalizeIntegration('neurax', source.neurax || {}),
    daily_calendar: normalizeIntegration('daily_calendar', source.daily_calendar || {}),
    whatsapp_bot: normalizeIntegration('whatsapp_bot', source.whatsapp_bot || {})
  };
}

export async function getAiIntegrationConfig() {
  const now = Date.now();
  if (cachedConfig && now - cachedAt < CACHE_TTL_MS) {
    return cachedConfig;
  }

  let doc = await AiIntegrationConfig.findOne();
  if (!doc) {
    doc = await AiIntegrationConfig.create({ integrations: DEFAULT_INTEGRATIONS });
  }

  cachedConfig = toPlainIntegrations(doc);
  cachedAt = now;
  return cachedConfig;
}

export async function saveAiIntegrationConfig(integrations, userId) {
  const next = {
    neurax: normalizeIntegration('neurax', integrations?.neurax || {}),
    daily_calendar: normalizeIntegration('daily_calendar', integrations?.daily_calendar || {}),
    whatsapp_bot: normalizeIntegration('whatsapp_bot', integrations?.whatsapp_bot || {})
  };

  for (const key of INTEGRATION_KEYS) {
    if (!next[key].modelId) {
      throw new Error(`Model ID is required for ${key}`);
    }
    if (next[key].fallbackEnabled && !next[key].fallbackModelId) {
      throw new Error(`Fallback model ID is required for ${key} when fallback is enabled`);
    }
  }

  const doc = await AiIntegrationConfig.findOneAndUpdate(
    {},
    {
      integrations: next,
      updatedBy: userId || undefined
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  invalidateAiIntegrationCache();
  cachedConfig = toPlainIntegrations(doc);
  cachedAt = Date.now();
  return cachedConfig;
}

export async function getIntegrationSettings(integrationKey = 'neurax') {
  const key = INTEGRATION_KEYS.includes(integrationKey) ? integrationKey : 'neurax';
  const config = await getAiIntegrationConfig();
  return { key, settings: config[key] };
}

export function resolveRouting({ settings, clientModel }) {
  const useConfiguredModel = settings.overrideClientModel || !clientModel;
  const primaryModel = useConfiguredModel ? settings.modelId : clientModel;
  const primaryProvider = useConfiguredModel ? settings.provider : null;

  const chain = [{ model: primaryModel, provider: primaryProvider }];

  if (settings.fallbackEnabled && settings.fallbackModelId) {
    const sameAsPrimary =
      settings.fallbackProvider === (primaryProvider || settings.provider) &&
      settings.fallbackModelId === primaryModel;
    if (!sameAsPrimary) {
      chain.push({
        model: settings.fallbackModelId,
        provider: settings.fallbackProvider
      });
    }
  }

  return {
    enabled: settings.enabled !== false,
    useConfiguredModel,
    chain
  };
}
