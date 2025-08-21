// Content script for monitoring Zetamac game completion
(function() {
    'use strict';
    
    let gameInProgress = false;
    let lastScore = null;
    
    console.log('Zetamac Score Logger: Content script loaded');
    
    // Function to extract current score from the page
    function getCurrentScore() {
        // Look for score elements - adjust selectors based on actual Zetamac HTML structure
        const scoreElements = [
            document.querySelector('#score'),
            document.querySelector('.score'),
            document.querySelector('[id*="score"]'),
            document.querySelector('[class*="score"]')
        ];
        
        for (const element of scoreElements) {
            if (element && element.textContent) {
                const scoreText = element.textContent.trim();
                const scoreMatch = scoreText.match(/(\d+)/);
                if (scoreMatch) {
                    return parseInt(scoreMatch[1]);
                }
            }
        }
        
        return null;
    }
    
    // Function to check if game has ended
    function isGameEnded() {
        // Look for game over indicators - adjust selectors based on actual Zetamac HTML structure
        const gameOverIndicators = [
            document.querySelector('[id*="game"]') && document.querySelector('[id*="game"]').textContent.toLowerCase().includes('over'),
            document.querySelector('[class*="game"]') && document.querySelector('[class*="game"]').textContent.toLowerCase().includes('over'),
            document.querySelector('body').textContent.toLowerCase().includes('game over'),
            document.querySelector('body').textContent.toLowerCase().includes('time\'s up'),
            document.querySelector('body').textContent.toLowerCase().includes('finished')
        ];
        
        return gameOverIndicators.some(indicator => indicator === true);
    }
    
    // Function to extract URL key
    function getUrlKey() {
        const url = window.location.href;
        const keyMatch = url.match(/[?&]key=([^&]+)/);
        return keyMatch ? keyMatch[1] : url.split('/').pop();
    }
    
    // Function to send score to background script
    function sendScore(score, urlKey) {
        console.log('Zetamac Score Logger: Sending score', score, 'with key', urlKey);
        
        chrome.runtime.sendMessage({
            type: 'SCORE_DETECTED',
            data: {
                score: score,
                urlKey: urlKey,
                timestamp: new Date().toISOString(),
                url: window.location.href
            }
        }, (response) => {
            if (chrome.runtime.lastError) {
                console.error('Zetamac Score Logger: Error sending message:', chrome.runtime.lastError);
            } else if (response && response.success) {
                console.log('Zetamac Score Logger: Score logged successfully');
            } else {
                console.error('Zetamac Score Logger: Failed to log score');
            }
        });
    }
    
    // Function to monitor for game state changes
    function monitorGameState() {
        const currentScore = getCurrentScore();
        const gameEnded = isGameEnded();
        
        // Detect game start
        if (currentScore !== null && !gameInProgress && !gameEnded) {
            gameInProgress = true;
            lastScore = null;
            console.log('Zetamac Score Logger: Game started');
        }
        
        // Detect game end
        if (gameInProgress && gameEnded && currentScore !== null) {
            gameInProgress = false;
            
            // Only log if this is a new score
            if (currentScore !== lastScore) {
                lastScore = currentScore;
                const urlKey = getUrlKey();
                sendScore(currentScore, urlKey);
            }
        }
    }
    
    // Set up monitoring
    const observer = new MutationObserver((mutations) => {
        let shouldCheck = false;
        
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList' || mutation.type === 'characterData') {
                shouldCheck = true;
            }
        });
        
        if (shouldCheck) {
            monitorGameState();
        }
    });
    
    // Start observing the document for changes
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
    });
    
    // Also check periodically in case mutations are missed
    setInterval(monitorGameState, 1000);
    
    // Initial check
    setTimeout(monitorGameState, 2000);
    
})();
