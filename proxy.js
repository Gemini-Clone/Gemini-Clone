const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const path = require('path');
const app = express();
app.use(cors());
app.use(express.json());

const KEY = process.env.GEN_API_KEY;
if (!KEY) {
  console.warn('Warning: GEN_API_KEY environment variable is not set. Requests will likely fail.');
}

const PRIMARY_MODEL = process.env.GEN_MODEL || 'gemini-2.0-flash';
const FALLBACK_MODELS = ['gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-pro'];

function normalizeModelName(name) {
  if (!name) return '';
  return String(name).replace(/^models\//, '');
}

let discoveredModelsCache = { expiresAt: 0, models: [] };

async function discoverModels() {
  const now = Date.now();
  if (discoveredModelsCache.expiresAt > now && discoveredModelsCache.models.length) {
    return discoveredModelsCache.models;
  }

  try {
    const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${KEY}`);
    if (!resp.ok) {
      const errText = await resp.text();
      console.warn('Model discovery failed:', resp.status, errText);
      return [];
    }

    const data = await resp.json();
    const models = (data.models || [])
      .filter((m) => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent'))
      .map((m) => normalizeModelName(m.name))
      .filter(Boolean);

    discoveredModelsCache = {
      expiresAt: now + 5 * 60 * 1000,
      models,
    };

    console.log('Discovered generateContent models:', models.slice(0, 10));
    return models;
  } catch (e) {
    console.warn('Model discovery exception:', e && e.message ? e.message : e);
    return [];
  }
}

app.post('/api/generate', async (req, res) => {
  try {
    console.log('Proxy received request:', JSON.stringify(req.body).slice(0, 1000));
    const discoveredModels = await discoverModels();
    const modelsToTry = [...new Set([PRIMARY_MODEL, ...FALLBACK_MODELS, ...discoveredModels].map(normalizeModelName).filter(Boolean))];

    let finalResp;
    let finalBody = '';

    for (const model of modelsToTry) {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(req.body),
        }
      );

      const body = await resp.text();
      console.log(`Proxy response status from ${model}:`, resp.status);

      finalResp = resp;
      finalBody = body;

      if (resp.status !== 429 && resp.status !== 404) break;
      console.warn(`Model ${model} returned ${resp.status}. Trying fallback model...`);
    }

    if (finalResp && finalResp.status === 404) {
      console.warn('All attempted models failed with 404. Tried models:', modelsToTry);
    }

    res
      .status(finalResp.status)
      .set('Content-Type', finalResp.headers.get('content-type') || 'text/plain')
      .send(finalBody);
  } catch (err) {
    console.error('Proxy error:', err && err.stack ? err.stack : err);
    res.status(500).json({ error: 'proxy error', detail: String(err && err.message ? err.message : err) });
  }
});

const PORT = process.env.PORT || 3000;

// Serve static files from project root so you can open http://localhost:PORT
app.use(express.static(path.join(__dirname)));

// Fallback to index.html for SPA routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => console.log(`Proxy + static server listening on http://localhost:${PORT}`));
