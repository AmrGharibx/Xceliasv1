const GEMINI_MODELS = ['gemini-2.5-flash-lite', 'gemini-2.0-flash-lite'];
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

async function callGeminiWithRetry(apiKey, geminiBody, retries = 2) {
    for (const model of GEMINI_MODELS) {
        for (let attempt = 0; attempt < retries; attempt++) {
            const url = `${GEMINI_BASE}/${model}:generateContent?key=${apiKey}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(geminiBody)
            });
            if (response.ok) {
                const data = await response.json();
                return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            }
            const status = response.status;
            if (status === 503 || status === 429) {
                console.warn(`Gemini ${model} attempt ${attempt + 1}: ${status}, retrying...`);
                await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
                continue;
            }
            const errText = await response.text().catch(() => '');
            throw new Error(`Gemini API ${status}: ${errText}`);
        }
    }
    throw new Error('All Gemini models unavailable');
}

module.exports = async function handler(req, res) {
    // CORS — restrict to xcelias.com
    const allowedOrigin = /^https?:\/\/(www\.)?xcelias\.com$/i;
    const reqOrigin = req.headers.origin || '';
    if (allowedOrigin.test(reqOrigin)) {
        res.setHeader('Access-Control-Allow-Origin', reqOrigin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    // Origin/Referer guard
    const origin  = req.headers.origin  || '';
    const referer = req.headers.referer || '';
    const allowed = /^https?:\/\/(www\.)?xcelias\.com(\/|$)/i;
    if (!allowed.test(origin) && !allowed.test(referer)) {
        return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

    if (!GEMINI_API_KEY) {
        return res.status(500).json({ success: false, error: 'Gemini API key not configured' });
    }

    try {
        const { systemPrompt, messages, generationConfig } = req.body;
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ success: false, error: 'Messages array is required' });
        }
        if (messages.length > 20) {
            return res.status(400).json({ success: false, error: 'Too many messages' });
        }

        const contents = messages.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: String(m.content || '') }]
        }));

        const geminiBody = {
            contents,
            generationConfig: {
                temperature: generationConfig?.temperature ?? 0.9,
                topP: generationConfig?.topP ?? 0.95,
                maxOutputTokens: Math.min(generationConfig?.maxOutputTokens ?? 1200, 4096)
            }
        };

        if (systemPrompt) {
            geminiBody.systemInstruction = { parts: [{ text: systemPrompt }] };
        }

        const text = await callGeminiWithRetry(GEMINI_API_KEY, geminiBody);
        res.json({ success: true, text });
    } catch (err) {
        console.error('Gemini proxy error:', err.message);
        res.status(502).json({ success: false, error: err.message || 'Gemini request failed' });
    }
}
