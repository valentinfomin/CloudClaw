// src/services/search.js

export async function performTavilySearch(apiKey, query) {
    if (!apiKey) {
        throw new Error('Tavily API key is missing');
    }

    const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({ query: query })
    });

    if (!response.ok) {
        throw new Error(`Tavily search failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.results || [];
}
