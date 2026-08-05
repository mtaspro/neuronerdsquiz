import express from 'express';
import axios from 'axios';
import { uploadToCloudinary } from '../utils/cloudinaryConfig.js';

const router = express.Router();

const POLLINATIONS_BASE_URL = 'https://gen.pollinations.ai/image';
const POLLINATIONS_API_KEY = process.env.POLLINATIONS_API_KEY;
const DEFAULT_MODEL = process.env.POLLINATIONS_DEFAULT_MODEL || 'flux';
const DEFAULT_WIDTH = parseInt(process.env.POLLINATIONS_DEFAULT_WIDTH || '1024', 10);
const DEFAULT_HEIGHT = parseInt(process.env.POLLINATIONS_DEFAULT_HEIGHT || '1024', 10);

const ALLOWED_DIMENSIONS = [256, 384, 512, 576, 640, 720, 768, 960, 1024, 1280, 1536, 1920, 2048];

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

function buildPollinationsUrl(prompt, params = {}) {
  const encodedPrompt = encodeURIComponent(prompt);
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

function mapPollinationsError(error) {
  const status = error?.response?.status;
  const body = error?.response?.data;
  const code = error?.code;

  if (status === 401 || status === 403) {
    return { status: 401, error: 'Authentication failed. Image generation service temporarily unavailable.' };
  }
  if (status === 429) {
    return { status: 429, error: 'Rate limit exceeded. Please try again later.' };
  }
  if (status === 400) {
    const detail = typeof body === 'string'
      ? body.substring(0, 200)
      : body?.error?.message || body?.message || 'Invalid request parameters';
    return { status: 400, error: `Invalid image generation request: ${detail}` };
  }
  if (status === 500 || status === 502 || status === 503 || status === 504) {
    return { status: 502, error: 'Image generation service is currently unavailable. Please try again later.' };
  }
  if (code === 'ECONNABORTED') {
    return { status: 408, error: 'Request timeout. Please try again.' };
  }
  if (code === 'ENOTFOUND' || code === 'ECONNREFUSED' || code === 'ETIMEDOUT') {
    return { status: 502, error: 'Could not reach image generation service. Please try again later.' };
  }
  return null;
}

router.post('/generate-image', async (req, res) => {
  try {
    const {
      prompt,
      model,
      width: rawWidth,
      height: rawHeight,
      seed,
      nologo = true,
      enhance,
      private: isPrivate
    } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required and must be a string' });
    }

    const trimmedPrompt = prompt.trim();
    if (trimmedPrompt.length < 3) {
      return res.status(400).json({ error: 'Prompt must be at least 3 characters long' });
    }
    if (trimmedPrompt.length > 2000) {
      return res.status(400).json({ error: 'Prompt must be less than 2000 characters' });
    }

    const parsedWidth = rawWidth == null ? NaN : Number(rawWidth);
    const parsedHeight = rawHeight == null ? NaN : Number(rawHeight);
    const width = clampDimension(parsedWidth, DEFAULT_WIDTH);
    const height = clampDimension(parsedHeight, DEFAULT_HEIGHT);

    if (seed != null && seed !== '') {
      const seedNum = Number(seed);
      if (Number.isNaN(seedNum) || !Number.isInteger(seedNum) || seedNum < 0) {
        return res.status(400).json({ error: 'Seed must be a non-negative integer' });
      }
    }

    if (!POLLINATIONS_API_KEY) {
      if (!process.env.DEEPAI_API_KEY) {
        return res.status(500).json({ error: 'Image generation service not configured' });
      }
      console.warn('POLLINATIONS_API_KEY not set, falling back to DeepAI');
      const deepaiResponse = await axios.post('https://api.deepai.org/api/text2img', {
        text: trimmedPrompt
      }, {
        headers: {
          'Api-Key': process.env.DEEPAI_API_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });
      if (!deepaiResponse.data || !deepaiResponse.data.output_url) {
        throw new Error('Invalid response from DeepAI');
      }
      console.log('✅ Generated image with DeepAI (fallback):', deepaiResponse.data.output_url);
      return res.json({
        imageUrl: deepaiResponse.data.output_url,
        prompt: trimmedPrompt,
        provider: 'deepai',
        model: 'deepai-text2img'
      });
    }

    const params = {
      model: model || DEFAULT_MODEL,
      width,
      height,
      seed,
      nologo: nologo !== false,
      enhance: !!enhance,
      private: !!isPrivate,
      apiKey: POLLINATIONS_API_KEY
    };

    const pollinationsUrl = buildPollinationsUrl(trimmedPrompt, params);
    const headers = {
      Authorization: `Bearer ${POLLINATIONS_API_KEY}`,
      Accept: 'image/*'
    };

    console.log(`🎨 Generating image via Pollinations (model=${params.model}, size=${width}x${height})`);

    const imageResponse = await axios.get(pollinationsUrl, {
      headers,
      responseType: 'arraybuffer',
      timeout: 180000
    });

    if (!imageResponse.data || imageResponse.data.length < 1000) {
      const preview = typeof imageResponse.data === 'string'
        ? imageResponse.data.substring(0, 300)
        : Buffer.from(imageResponse.data || '').toString('utf8', 0, 300);
      throw new Error(`Pollinations returned empty or too-small response. Preview: ${preview}`);
    }

    const contentType = imageResponse.headers?.['content-type'] || 'image/jpeg';
    if (!contentType.startsWith('image/')) {
      const textPreview = Buffer.from(imageResponse.data).toString('utf8', 0, 500);
      throw new Error(`Pollinations did not return an image. Content-Type=${contentType}. Body: ${textPreview}`);
    }

    const cloudinaryUrl = await uploadToCloudinary(Buffer.from(imageResponse.data), 'ai-generated-images');

    console.log('✅ Generated image with Pollinations → Cloudinary:', cloudinaryUrl);

    res.json({
      imageUrl: cloudinaryUrl,
      prompt: trimmedPrompt,
      provider: 'pollinations',
      model: params.model,
      width,
      height,
      seed: params.seed || null,
      nologo: params.nologo
    });
  } catch (error) {
    console.error('Image generation error:', error?.response?.status ? `HTTP ${error.response.status}` : '', error?.response?.data ? Buffer.from(error.response.data).toString('utf8', 0, 400) : error.message);

    const mapped = mapPollinationsError(error);
    if (mapped) {
      return res.status(mapped.status).json({ error: mapped.error });
    }

    if (error?.message?.includes('Cloudinary') || error?.message?.includes('upload')) {
      return res.status(500).json({ error: 'Image storage service temporarily unavailable. Please try again.' });
    }

    res.status(500).json({ error: 'Image generation service is currently unavailable. Please try again later.' });
  }
});

export default router;
