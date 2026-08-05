import axios from 'axios';

const POLLINATIONS_BASE_URL = 'https://gen.pollinations.ai/image';

const POLLINATIONS_API_KEY = process.env.POLLINATIONS_API_KEY;

const DEFAULT_MODEL = process.env.POLLINATIONS_DEFAULT_MODEL || 'flux';
const DEFAULT_WIDTH = parseInt(process.env.POLLINATIONS_DEFAULT_WIDTH || '1024', 10);
const DEFAULT_HEIGHT = parseInt(process.env.POLLINATIONS_DEFAULT_HEIGHT || '1024', 10);

const ALLOWED_DIMENSIONS = [256, 384, 512, 576, 640, 720, 768, 960, 1024, 1280, 1536, 1920, 2048];

const APP_NAME = 'HSCAura';
const APP_DESCRIPTION = 'NeuraX Omega AI Chat';

function clampDimension(value, fallback) {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback;
  let closest = ALLOWED_DIMENSIONS[0];
  let minDiff = Math.abs(value - closest);
  for (const dim of ALLOWED_DIMENSIONS) {
    const diff = Math.abs(value - dim);
    if (diff < minDiff) {
      minDiff = diff;
      closest = dim;
    }
  }
  return closest;
}

export function buildPollinationsUrl(prompt, params = {}) {
  const encodedPrompt = encodeURIComponent(prompt.trim());
  const searchParams = new URLSearchParams();

  searchParams.set('model', params.model || DEFAULT_MODEL);
  searchParams.set('width', String(params.width || DEFAULT_WIDTH));
  searchParams.set('height', String(params.height || DEFAULT_HEIGHT));

  if (params.seed != null && params.seed !== '') {
    searchParams.set('seed', String(params.seed));
  }
  if (params.nologo) {
    searchParams.set('nologo', 'true');
  }
  if (params.private) {
    searchParams.set('private', 'true');
  }
  if (params.enhance) {
    searchParams.set('enhance', 'true');
  }
  if (params.apiKey) {
    searchParams.set('key', params.apiKey);
  }

  return `${POLLINATIONS_BASE_URL}/${encodedPrompt}?${searchParams.toString()}`;
}

export function buildPollinationsHeaders(apiKey, accept = 'image/*') {
  const headers = {};
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }
  headers.Accept = accept;
  return headers;
}

export async function generateImageWithPollinations(prompt, options = {}) {
  const {
    model = DEFAULT_MODEL,
    width = DEFAULT_WIDTH,
    height = DEFAULT_HEIGHT,
    seed,
    nologo = true,
    private: isPrivate = false,
    enhance = false,
    timeout = 180000,
    apiKey = POLLINATIONS_API_KEY
  } = options;

  const clampedWidth = clampDimension(Number(width), DEFAULT_WIDTH);
  const clampedHeight = clampDimension(Number(height), DEFAULT_HEIGHT);

  const url = buildPollinationsUrl(prompt, {
    model,
    width: clampedWidth,
    height: clampedHeight,
    seed,
    nologo,
    private: isPrivate,
    enhance,
    apiKey
  });

  const headers = buildPollinationsHeaders(apiKey);

  console.log(`🎨 [${APP_NAME}] Generating image via Pollinations (model=${model}, size=${clampedWidth}x${clampedHeight})`);

  const response = await axios.get(url, {
    headers,
    responseType: 'arraybuffer',
    timeout
  });

  if (!response.data || response.data.length < 1000) {
    throw new Error('Pollinations returned an empty or too-small response.');
  }

  const contentType = response.headers?.['content-type'] || 'image/jpeg';
  if (!contentType.startsWith('image/')) {
    const preview = Buffer.from(response.data).toString('utf8', 0, 500);
    throw new Error(`Pollinations did not return an image. Content-Type=${contentType}. Body: ${preview}`);
  }

  return {
    buffer: Buffer.from(response.data),
    contentType,
    prompt: prompt.trim(),
    provider: 'pollinations',
    model,
    width: clampedWidth,
    height: clampedHeight,
    seed: seed || null
  };
}

export function getPollinationsInfo() {
  return {
    provider: 'pollinations',
    appName: APP_NAME,
    appDescription: APP_DESCRIPTION,
    baseUrl: POLLINATIONS_BASE_URL,
    defaultModel: DEFAULT_MODEL,
    defaultDimensions: {
      width: DEFAULT_WIDTH,
      height: DEFAULT_HEIGHT
    },
    apiKeyConfigured: Boolean(POLLINATIONS_API_KEY)
  };
}

export {
  POLLINATIONS_BASE_URL,
  POLLINATIONS_API_KEY,
  DEFAULT_MODEL,
  DEFAULT_WIDTH,
  DEFAULT_HEIGHT,
  ALLOWED_DIMENSIONS,
  APP_NAME,
  APP_DESCRIPTION,
  clampDimension
};

export default {
  POLLINATIONS_BASE_URL,
  DEFAULT_MODEL,
  DEFAULT_WIDTH,
  DEFAULT_HEIGHT,
  ALLOWED_DIMENSIONS,
  clampDimension,
  buildPollinationsUrl,
  buildPollinationsHeaders,
  generateImageWithPollinations,
  getPollinationsInfo,
  APP_NAME,
  APP_DESCRIPTION
};
