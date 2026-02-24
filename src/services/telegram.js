export async function getFileInfo(token, fileId) {
    const url = `https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (!data.ok) {
        throw new Error(`Telegram API Error: ${data.description}`);
    }
    
    return data.result;
}

export async function downloadFile(token, filePath) {
    const url = `https://api.telegram.org/file/bot${token}/${filePath}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
    }
    return await response.arrayBuffer();
}

export async function sendMessage(token, chatId, text) {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text })
    });
}
