// ============================================================
// Gymzy AI Proxy — Netlify Function
// Forwards requests to Anthropic API server-to-server,
// bypassing browser CORS restrictions entirely.
//
// SETUP:
//   1. Add ANTHROPIC_API_KEY to Netlify → Site Settings → Environment Variables
//   2. Deploy — this file is picked up automatically by Netlify Functions
//
// GODADDY MIGRATION:
//   When moving to GoDaddy, deploy this same function to Cloudflare Workers
//   (free tier) and update AI_PROXY_URL in gymzy.html to point to your
//   Cloudflare Worker URL instead of /api/ai-proxy.
// ============================================================

exports.handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('[ai-proxy] ANTHROPIC_API_KEY environment variable not set');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server configuration error: API key not set' }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':    'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key':       apiKey,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return {
      statusCode: response.status,
      headers: {
        'Content-Type':                'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(data),
    };
  } catch (err) {
    console.error('[ai-proxy] Fetch error:', err);
    return {
      statusCode: 502,
      body: JSON.stringify({ error: 'Proxy fetch failed: ' + err.message }),
    };
  }
};
