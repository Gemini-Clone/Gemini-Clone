# Generative Language Proxy (local)

This repository contains a tiny Node proxy to keep your Google Generative Language API key off the browser.

Setup

1. Install dependencies:

```bash
npm install
```

2. Set your API key in the environment (Windows CMD):

```bash
set GEN_API_KEY=YOUR_KEY_HERE
npm start
```

(For PowerShell: `$env:GEN_API_KEY = "YOUR_KEY_HERE"`)

3. Start the proxy:

```bash
npm start
```

By default the proxy listens on `http://localhost:3000` and exposes `POST /api/generate` which forwards requests to the Generative Language API.

Client notes

- Update your client to POST to `http://localhost:3000/api/generate` instead of calling Google's endpoint directly.
- Keep the API key out of client-side code.
- Monitor usage and enable billing/quota in Google Cloud Console.
