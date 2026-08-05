import express from 'express';
import axios from 'axios';
import { uploadToCloudinary } from '../utils/cloudinaryConfig.js';
import pollinationsService, {
  buildPollinationsUrl,
  clampDimension,
  DEFAULT_MODEL,
  DEFAULT_WIDTH,
  DEFAULT_HEIGHT
} from '../lib/pollinations.js';

const router = express.Router();

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

    const width = clampDimension(rawWidth == null ? NaN : Number(rawWidth), DEFAULT_WIDTH);
    const height = clampDimension(rawHeight == null ? NaN : Number(rawHeight), DEFAULT_HEIGHT);

    if (seed != null && seed !== '') {
      const seedNum = Number(seed);
      if (Number.isNaN(seedNum) || !Number.isInteger(seedNum) || seedNum < 0) {
        return res.status(400).json({ error: 'Seed must be a non-negative integer' });
      }
    }

    const params = {
      model: model || DEFAULT_MODEL,
      width,
      height,
      seed,
      nologo: nologo !== false,
      enhance: !!enhance,
      private: !!isPrivate,
      apiKey: process.env.POLLINATIONS_API_KEY
    };

    const pollinationsUrl = buildPollinationsUrl(trimmedPrompt, params);
    const headers = pollinationsService.buildPollinationsHeaders(
      process.env.POLLINATIONS_API_KEY
    );

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
      nologo: params.nologo,
      attribution: 'Powered by Pollinations AI'
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
