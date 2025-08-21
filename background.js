// Background service worker for handling API communication
chrome.runtime.onInstalled.addListener(() => {
    console.log('Zetamac Score Logger: Extension installed');
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SCORE_DETECTED') {
        handleScoreDetection(message.data, sendResponse);
        return true; // Keep the message channel open for async response
    }
});

async function handleScoreDetection(scoreData, sendResponse) {
    try {
        console.log('Zetamac Score Logger: Processing score data', scoreData);
        
        // Get the Google Apps Script URL from storage
        const result = await chrome.storage.sync.get(['gasUrl']);
        const gasUrl = result.gasUrl;
        
        if (!gasUrl) {
            console.error('Zetamac Score Logger: No Google Apps Script URL configured');
            sendResponse({ success: false, error: 'No API URL configured' });
            return;
        }
        
        // Send data to Google Apps Script
        const response = await fetch(gasUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(scoreData)
        });
        
        if (response.ok) {
            const result = await response.text();
            console.log('Zetamac Score Logger: Successfully sent to Google Sheets:', result);
            sendResponse({ success: true, message: result });
            
            // Show notification on success
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icon48.png',
                title: 'Zetamac Score Logged',
                message: `Score ${scoreData.score} saved to Google Sheets`
            });
        } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
    } catch (error) {
        console.error('Zetamac Score Logger: Error sending score:', error);
        sendResponse({ success: false, error: error.message });
    }
}
