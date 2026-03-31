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

async function streamGemini(apiKey, geminiBody, res) {
    for (const model of GEMINI_MODELS) {
        const url = `${GEMINI_BASE}/${model}:streamGenerateContent?key=${apiKey}&alt=sse`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(geminiBody)
        });
        if (!response.ok) {
            const status = response.status;
            if (status === 503 || status === 429) continue;
            const errText = await response.text().catch(() => '');
            throw new Error(`Gemini API ${status}: ${errText}`);
        }
        // Stream SSE from Gemini to client
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop();

            for (const line of lines) {
                if (!line.startsWith('data: ')) continue;
                const raw = line.slice(6).trim();
                if (!raw || raw === '[DONE]') continue;
                try {
                    const parsed = JSON.parse(raw);
                    const chunk = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (chunk) {
                        res.write(`data: ${JSON.stringify({ t: chunk })}\n\n`);
                    }
                } catch (_) {}
            }
        }
        res.write('data: [DONE]\n\n');
        return res.end();
    }
    throw new Error('All Gemini models unavailable');
}

module.exports = async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

    if (!GEMINI_API_KEY) {
        return res.status(500).json({ success: false, error: 'Gemini API key not configured' });
    }

    try {
        const { systemPrompt, messages, generationConfig, stream } = req.body;
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ success: false, error: 'Messages array is required' });
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
                maxOutputTokens: generationConfig?.maxOutputTokens ?? 1200
            }
        };

        if (systemPrompt) {
            geminiBody.systemInstruction = { parts: [{ text: systemPrompt }] };
        }

        if (stream) {
            return await streamGemini(GEMINI_API_KEY, geminiBody, res);
        }

        const text = await callGeminiWithRetry(GEMINI_API_KEY, geminiBody);
        res.json({ success: true, text });
    } catch (err) {
        console.error('Gemini proxy error:', err.message);
        res.status(502).json({ success: false, error: err.message || 'Gemini request failed' });
    }
}
