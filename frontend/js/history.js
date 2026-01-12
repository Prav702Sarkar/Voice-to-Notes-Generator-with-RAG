// History Management

// Go back to previous page
function goBack() {
    window.history.back();
}

// Load history on page load
function loadHistory() {
    const currentData = localStorage.getItem('lectureData');
    const historyData = localStorage.getItem('lectureHistory');
    
    if (!currentData && !historyData) {
        // No data at all
        document.getElementById('noHistoryState').classList.remove('hidden');
        return;
    }
    
    document.getElementById('noHistoryState').classList.add('hidden');
    
    // Show current lecture if exists
    if (currentData) {
        const data = JSON.parse(currentData);
        displayCurrentLecture(data);
    }
    
    // Show history if exists
    if (historyData) {
        const history = JSON.parse(historyData);
        if (history.length > 0) {
            displayHistory(history);
        }
    }
}

// Display current lecture
function displayCurrentLecture(data) {
    document.getElementById('currentLectureSection').classList.remove('hidden');
    
    const card = document.createElement('div');
    card.className = 'lecture-item current-lecture';
    
    const timestamp = new Date(data.timestamp);
    const timeAgo = getTimeAgo(timestamp);
    
    card.innerHTML = `
        <div class="lecture-header">
            <div class="lecture-info">
                <h3><i class="fa-solid fa-circle-play"></i> Active Lecture</h3>
                <p class="lecture-date">${timestamp.toLocaleString()}</p>
                <p class="time-ago">${timeAgo}</p>
            </div>
            <span class="lecture-badge current-badge">Current</span>
        </div>
        <div class="lecture-stats">
            <div class="stat">
                <i class="fa-solid fa-question-circle"></i>
                <span>${data.quizCount || 5} Quiz Questions</span>
            </div>
            ${data.context ? `
            <div class="stat">
                <i class="fa-solid fa-comment-dots"></i>
                <span>Has Context</span>
            </div>
            ` : ''}
        </div>
        <div class="lecture-actions">
            <button onclick="viewLecture('current')" class="action-btn primary">
                <i class="fa-solid fa-eye"></i> View Results
            </button>
            <button onclick="viewFlashcards()" class="action-btn">
                <i class="fa-solid fa-layer-group"></i> Flashcards
            </button>
            <button onclick="viewQuiz()" class="action-btn">
                <i class="fa-solid fa-clipboard-question"></i> Take Quiz
            </button>
            <button onclick="saveToHistory()" class="action-btn success">
                <i class="fa-solid fa-bookmark"></i> Save to History
            </button>
        </div>
    `;
    
    document.getElementById('currentLectureCard').innerHTML = '';
    document.getElementById('currentLectureCard').appendChild(card);
}

// Display history
function displayHistory(history) {
    document.getElementById('historySection').classList.remove('hidden');
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '';
    
    // Sort by timestamp (newest first)
    history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    history.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'lecture-item';
        
        const timestamp = new Date(item.timestamp);
        const timeAgo = getTimeAgo(timestamp);
        
        // Use generated title if available, otherwise create one
        const lectureTitle = item.title || generateTitleFromSummary(item.summary);
        
        card.innerHTML = `
            <div class="lecture-header">
                <div class="lecture-info">
                    <h3><i class="fa-solid fa-book"></i> ${lectureTitle}</h3>
                    <p class="lecture-date">${timestamp.toLocaleString()}</p>
                    <p class="time-ago">${timeAgo}</p>
                </div>
                <span class="lecture-badge">${item.quizCount || 5} Questions</span>
            </div>
            ${item.context ? `
            <div class="lecture-context">
                <strong>Context:</strong> ${item.context.substring(0, 100)}${item.context.length > 100 ? '...' : ''}
            </div>
            ` : ''}
            <div class="lecture-actions">
                <button onclick="viewHistoryLecture(${index})" class="action-btn primary">
                    <i class="fa-solid fa-eye"></i> View Results
                </button>
                <button onclick="loadFromHistory(${index})" class="action-btn">
                    <i class="fa-solid fa-rotate-left"></i> Load This Lecture
                </button>
                <button onclick="deleteHistoryItem(${index})" class="action-btn danger">
                    <i class="fa-solid fa-trash"></i> Delete
                </button>
            </div>
        `;
        
        historyList.appendChild(card);
    });
}

// Save current lecture to history
function saveToHistory() {
    const currentData = localStorage.getItem('lectureData');
    if (!currentData) {
        alert('No current lecture to save!');
        return;
    }
    
    const data = JSON.parse(currentData);
    let history = JSON.parse(localStorage.getItem('lectureHistory') || '[]');
    
    // Generate a title from the summary
    const title = generateTitleFromSummary(data.summary);
    
    // Add to history with generated title
    history.push({
        ...data,
        title: title,
        savedAt: new Date().toISOString()
    });
    
    // Keep only last 10 lectures
    if (history.length > 10) {
        history = history.slice(-10);
    }
    
    localStorage.setItem('lectureHistory', JSON.stringify(history));
    alert(`Lecture saved as: "${title}"`);
    loadHistory();
}

// Generate title from summary content
function generateTitleFromSummary(summaryHtml) {
    // Strip HTML and get plain text
    const tmp = document.createElement('div');
    tmp.innerHTML = summaryHtml;
    const text = (tmp.textContent || tmp.innerText || '').trim();
    
    // Try to find a title-like sentence from the first 150 characters
    let title = text.substring(0, 150).trim();
    
    // Look for first sentence
    const firstSentenceMatch = title.match(/^[^.!?]+[.!?]/);
    if (firstSentenceMatch) {
        title = firstSentenceMatch[0].replace(/[.!?]$/, '').trim();
    } else {
        // If no sentence ending, take first line or truncate
        const firstLine = title.split('\n')[0];
        title = firstLine.length > 60 ? firstLine.substring(0, 60) + '...' : firstLine;
    }
    
    // Limit title length
    if (title.length > 80) {
        title = title.substring(0, 77) + '...';
    }
    
    // Fallback if title is too short or empty
    if (!title || title.length < 10) {
        title = 'Lecture - ' + new Date().toLocaleDateString();
    }
    
    return title;
}

// View history lecture without replacing current
function viewHistoryLecture(index) {
    const history = JSON.parse(localStorage.getItem('lectureHistory') || '[]');
    if (history[index]) {
        // Temporarily save current lecture
        const currentData = localStorage.getItem('lectureData');
        if (currentData) {
            sessionStorage.setItem('tempCurrentLecture', currentData);
        }
        
        // Load history item for viewing
        localStorage.setItem('lectureData', JSON.stringify(history[index]));
        localStorage.setItem('viewingHistory', 'true');
        
        // Navigate to results
        window.location.href = 'results.html';
    }
}

// Load lecture from history
function loadFromHistory(index) {
    if (!confirm('Load this lecture? Current lecture will be replaced.')) {
        return;
    }
    
    const history = JSON.parse(localStorage.getItem('lectureHistory') || '[]');
    if (history[index]) {
        localStorage.setItem('lectureData', JSON.stringify(history[index]));
        alert('Lecture loaded! You can now view it in Results, Flashcards, or Quiz.');
        loadHistory();
    }
}

// Delete history item
function deleteHistoryItem(index) {
    if (!confirm('Delete this lecture from history?')) {
        return;
    }
    
    let history = JSON.parse(localStorage.getItem('lectureHistory') || '[]');
    history.splice(index, 1);
    localStorage.setItem('lectureHistory', JSON.stringify(history));
    loadHistory();
}

// Clear current lecture
function clearCurrentLecture() {
    if (!confirm('Clear current lecture? You can save it to history first.')) {
        return;
    }
    
    localStorage.removeItem('lectureData');
    loadHistory();
}

// Clear all history
function clearAllHistory() {
    if (!confirm('Delete all lecture history? This cannot be undone.')) {
        return;
    }
    
    localStorage.removeItem('lectureHistory');
    loadHistory();
}

// Navigate to different pages
function viewLecture(type) {
    window.location.href = 'results.html';
}

function viewFlashcards() {
    window.location.href = 'flashcards.html';
}

function viewQuiz() {
    window.location.href = 'quiz.html';
}

// Helper: Get time ago string
function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return Math.floor(seconds / 60) + ' minutes ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + ' hours ago';
    if (seconds < 604800) return Math.floor(seconds / 86400) + ' days ago';
    
    return date.toLocaleDateString();
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', loadHistory);
