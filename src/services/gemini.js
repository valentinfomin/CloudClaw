/**
 * Gemini AI Service
 */

/**
 * Analyze an image using Google Gemini 1.5 Flash
 * @param {string} apiKey 
 * @param {ArrayBuffer} imageBuffer 
 * @param {string} mimeType 
 * @returns {Promise<string>}
 */
let cachedModelId = null;

async function getAvailableModel(apiKey) {
    if (cachedModelId) return cachedModelId;

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data && data.models) {
            // Priority list of models we prefer
            const preferredModels = [
                'models/gemini-2.5-flash',
                'models/gemini-2.0-flash',
                'models/gemini-1.5-flash',
                'models/gemini-flash-latest'
            ];
            
            for (const preferred of preferredModels) {
                if (data.models.some(m => m.name === preferred)) {
                    cachedModelId = preferred.replace('models/', '');
                    return cachedModelId;
                }
            }
        }
    } catch (e) {
        console.warn("Failed to fetch available models, falling back to default", e);
    }
    
    // Ultimate fallback if fetch fails
    return 'gemini-2.5-flash';
}

export async function analyzeImage(apiKey, imageBuffer, mimeType) {
    if (!apiKey) throw new Error('GEMINI_API_KEY is missing');
    
    const modelId = await getAvailableModel(apiKey);
    console.log(`--- Gemini request using model: ${modelId} ---`);
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;
    
    // Robust Base64 conversion
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));

    const payload = {
        contents: [{
            parts: [
                { text: "Describe this image concisely. Extract any text or numbers found." },
                {
                    inline_data: {
                        mime_type: mimeType,
                        data: base64Image
                    }
                }
            ]
        }]
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Gemini API Error Body: ${errorBody}`);
        throw new Error(`Gemini API Error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
        return data.candidates[0].content.parts[0].text;
    }

    throw new Error('Failed to extract description from Gemini response');
}
