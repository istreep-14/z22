// Popup script for extension configuration
document.addEventListener('DOMContentLoaded', async () => {
    const gasUrlInput = document.getElementById('gasUrl');
    const saveButton = document.getElementById('saveButton');
    const testButton = document.getElementById('testButton');
    const statusDiv = document.getElementById('status');
    
    // Load saved settings
    const result = await chrome.storage.sync.get(['gasUrl']);
    if (result.gasUrl) {
        gasUrlInput.value = result.gasUrl;
        updateStatus(true);
    }
    
    // Save settings
    saveButton.addEventListener('click', async () => {
        const url = gasUrlInput.value.trim();
        
        if (!url) {
            showStatus('Please enter a valid URL', 'error');
            return;
        }
        
        if (!url.includes('script.google.com')) {
            showStatus('URL should be a Google Apps Script deployment URL', 'error');
            return;
        }
        
        try {
            await chrome.storage.sync.set({ gasUrl: url });
            showStatus('Settings saved successfully!', 'success');
            updateStatus(true);
        } catch (error) {
            showStatus('Error saving settings: ' + error.message, 'error');
        }
    });
    
    // Test connection
    testButton.addEventListener('click', async () => {
        const url = gasUrlInput.value.trim();
        
        if (!url) {
            showStatus('Please enter a URL first', 'error');
            return;
        }
        
        testButton.textContent = 'Testing...';
        testButton.disabled = true;
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    test: true,
                    score: 42,
                    urlKey: 'test-key',
                    timestamp: new Date().toISOString()
                })
            });
            
            if (response.ok) {
                showStatus('✅ Connection test successful!', 'success');
            } else {
                showStatus(`❌ Connection failed: ${response.status}`, 'error');
            }
        } catch (error) {
            showStatus(`❌ Connection error: ${error.message}`, 'error');
        } finally {
            testButton.textContent = 'Test Connection';
            testButton.disabled = false;
        }
    });
    
    function updateStatus(connected) {
        if (connected) {
            statusDiv.className = 'status connected';
            statusDiv.textContent = '✅ Ready to log scores';
        } else {
            statusDiv.className = 'status disconnected';
            statusDiv.textContent = '⚠️ Not configured';
        }
    }
    
    function showStatus(message, type) {
        const tempStatus = document.createElement('div');
        tempStatus.className = `status ${type === 'success' ? 'connected' : 'disconnected'}`;
        tempStatus.textContent = message;
        
        statusDiv.parentNode.insertBefore(tempStatus, statusDiv.nextSibling);
        
        setTimeout(() => {
            tempStatus.remove();
        }, 3000);
    }
});
