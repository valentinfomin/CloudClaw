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
export async function analyzeImage(apiKey, imageBuffer, mimeType) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const base64Image = btoa(
        new Uint8Array(imageBuffer)
            .reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

    const payload = {
        contents: [{
            parts: [
                { text: "Provide a detailed description of this image and extract any text or numbers found within it. Be direct and concise." },
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
        throw new Error(`Gemini API Error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
        return data.candidates[0].content.parts[0].text;
    }

    throw new Error('Failed to extract description from Gemini response');
}
