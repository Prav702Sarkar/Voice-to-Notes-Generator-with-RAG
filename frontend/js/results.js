// Results Page JavaScript
let processingInterval;
let progress = 0;

// Format quiz content for proper display
function formatQuizDisplay(quizHtml) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(quizHtml, 'text/html');
    let fullText = doc.body.innerText || doc.body.textContent;
    
    // Clean up the text
    fullText = fullText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    // Split into question blocks
    const questionBlocks = fullText.split(/(?=\n\d+[\.\)]\s)/);
    
    let formattedHtml = '<div class="quiz-preview">';
    
    questionBlocks.forEach((block, index) => {
        if (!block.trim()) return;
        
        const lines = block.split('\n').map(l => l.trim()).filter(l => l);
        if (lines.length < 2) return; // Need at least question + some content
        
        // First line has question number and text
        const firstLine = lines[0];
        const questionMatch = firstLine.match(/^(\d+[\.\)]\s*)(.+)/);
        if (!questionMatch) return;
        
        let questionText = questionMatch[2].trim();
        let lineIndex = 1;
        
        // Get full question text (may span multiple lines)
        while (lineIndex < lines.length && !questionText.includes('?')) {
            const nextLine = lines[lineIndex];
            if (/^[A-Da-d][\)\.]/.test(nextLine)) break;
            questionText += ' ' + nextLine;
            lineIndex++;
        }
        
        formattedHtml += `<div class="quiz-question-preview">`;
        formattedHtml += `<h4>${questionMatch[1]}${questionText}</h4>`;
        formattedHtml += `<div class="quiz-options-preview">`;
        
        // Extract options
        let correctAnswer = '';
        for (let i = lineIndex; i < lines.length; i++) {
            const line = lines[i];
            
            // Check if it's an option
            const optionMatch = line.match(/^([A-Da-d])[\)\.][\s]*(.+)$/);
            if (optionMatch) {
                const optionLetter = optionMatch[1].toUpperCase();
                const optionText = optionMatch[2].trim();
                formattedHtml += `<div class="option-preview"><strong>${optionLetter})</strong> ${optionText}</div>`;
            }
            // Check for correct answer line
            else if (line.match(/correct\s*answer/i)) {
                const answerMatch = line.match(/correct\s*answer\s*:?\s*([A-Da-d])/i);
                if (answerMatch) {
                    correctAnswer = answerMatch[1].toUpperCase();
                }
            }
        }
        
        formattedHtml += `</div>`;
        
        if (correctAnswer) {
            formattedHtml += `<div class="correct-answer-preview"><i class="fa-solid fa-check-circle"></i> Correct Answer: <strong>${correctAnswer}</strong></div>`;
        }
        
        formattedHtml += `</div>`;
    });
    
    formattedHtml += '</div>';
    
    return formattedHtml;
}

// Check if we're processing or viewing results
window.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    
    // Always check if we have data in localStorage
    const savedData = localStorage.getItem('lectureData');
    
    if (mode === 'processing' && !savedData) {
        // Only show processing animation if no data exists yet
        startProcessingSimulation();
    } else if (savedData) {
        // If we have data, go straight to results
        loadResults();
    } else {
        // No data and not processing - show error
        showError('No lecture data found. Please upload a file first.');
    }
});

// Simulate processing with realistic steps
function startProcessingSimulation() {
    document.getElementById('processingState').classList.remove('hidden');
    document.getElementById('resultsDisplay').classList.add('hidden');
    document.getElementById('errorState').classList.add('hidden');
    
    progress = 0;
    let currentStep = 1;
    
    // Simulate step progression
    processingInterval = setInterval(() => {
        progress += Math.random() * 5;
        
        if (progress > 100) progress = 100;
        
        // Update progress bar
        document.getElementById('mainProgressFill').style.width = progress + '%';
        document.getElementById('progressPercent').textContent = Math.round(progress);
        
        // Update steps based on progress
        if (progress > 10 && currentStep === 1) {
            completeStep(1);
            startStep(2);
            currentStep = 2;
            updateProcessingMessage('Analyzing lecture content with BERT...');
        }
        
        if (progress > 60 && currentStep === 2) {
            completeStep(2);
            startStep(3);
            currentStep = 3;
            updateProcessingMessage('Generating study materials...');
        }
        
        if (progress >= 100) {
            completeStep(3);
            clearInterval(processingInterval);
            setTimeout(() => {
                checkForResults();
            }, 1000);
        }
    }, 200);
}

function updateProcessingMessage(message) {
    document.getElementById('processingMessage').textContent = message;
}

function startStep(stepNum) {
    const step = document.getElementById('step' + stepNum);
    step.classList.add('active');
    step.querySelector('.step-status').innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
}

function completeStep(stepNum) {
    const step = document.getElementById('step' + stepNum);
    step.classList.remove('active');
    step.classList.add('completed');
    step.querySelector('.step-status').innerHTML = '<i class="fa-solid fa-circle-check"></i>';
}

// Check for results in localStorage
function checkForResults() {
    const savedData = localStorage.getItem('lectureData');
    
    if (savedData) {
        // Redirect to show results
        window.location.href = 'results.html';
    } else {
        showError('No results found. Please try uploading again.');
    }
}

// Load and display results
function loadResults() {
    const savedData = localStorage.getItem('lectureData');
    
    if (!savedData) {
        window.location.href = 'index.html';
        return;
    }
    
    const data = JSON.parse(savedData);
    const isViewingHistory = localStorage.getItem('viewingHistory') === 'true';
    
    // Check if data is fresh (from current session) or old
    if (!data.isFresh && !isViewingHistory) {
        showOldDataWarning();
    } else if (!isViewingHistory) {
        // Mark as viewed (no longer fresh)
        data.isFresh = false;
        localStorage.setItem('lectureData', JSON.stringify(data));
    }
    
    // Display content
    document.getElementById('summaryContent').innerHTML = data.summary || 'No summary available';
    document.getElementById('definitionsContent').innerHTML = data.definitions || 'No definitions available';
    
    // Format and display quiz properly
    if (data.quiz) {
        document.getElementById('quizContent').innerHTML = formatQuizDisplay(data.quiz);
    } else {
        document.getElementById('quizContent').innerHTML = 'No quiz available';
    }
    
    document.getElementById('transcriptContent').textContent = data.transcript || 'No transcript available';
    
    // Show results
    document.getElementById('processingState').classList.add('hidden');
    document.getElementById('resultsDisplay').classList.remove('hidden');
}

// Show warning for old data
function showOldDataWarning() {
    const warningBanner = document.createElement('div');
    warningBanner.className = 'old-data-warning';
    warningBanner.innerHTML = `
        <div style="display: flex; align-items: center; gap: 1rem; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 1rem;">
                <i class="fa-solid fa-exclamation-triangle"></i>
                <div>
                    <strong>Viewing Previous Upload</strong>
                    <p style="margin: 0; font-size: 0.9rem;">This data is from a previous session. Upload a new file for fresh results.</p>
                </div>
            </div>
            <button onclick="window.location.href='index.html'" class="btn btn-primary">
                <i class="fa-solid fa-upload"></i> Upload New
            </button>
        </div>
    `;
    
    const resultsHeader = document.querySelector('.results-header');
    resultsHeader.insertAdjacentElement('afterend', warningBanner);
}

// Switch between result tabs
function switchResultTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.result-tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all buttons
    document.querySelectorAll('.result-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById('result-' + tabName).classList.add('active');
    
    // Highlight button
    event.target.classList.add('active');
}

// Download functionality - now supports PDF
function downloadContent(type) {
    const savedData = JSON.parse(localStorage.getItem('lectureData'));
    
    if (type === 'summary') {
        // Download summary as PDF
        downloadPdf({
            summary: savedData.summary,
            definitions: '',
            quiz: '',
            transcript: '',
            flashcards: []
        }, event.target);
    } else if (type === 'all') {
        // Download all materials as PDF
        downloadPdf({
            summary: savedData.summary,
            definitions: savedData.definitions,
            quiz: savedData.quiz,
            transcript: savedData.transcript,
            flashcards: savedData.flashcards || []
        }, event.target);
    }
}

// Download PDF from backend
function downloadPdf(lectureData, downloadBtn) {
    // Show loading indicator
    const originalText = downloadBtn.innerHTML;
    downloadBtn.disabled = true;
    downloadBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating PDF...';
    
    // Send data to backend
    fetch('/api/download-pdf', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(lectureData)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => {
                throw new Error(err.error || 'Failed to generate PDF');
            });
        }
        return response.blob();
    })
    .then(blob => {
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // Generate filename with timestamp
        const now = new Date();
        const timestamp = now.toISOString().replace(/[:.]/g, '-').split('T')[0];
        a.download = `lecture_notes_${timestamp}.pdf`;
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        // Reset button
        downloadBtn.disabled = false;
        downloadBtn.innerHTML = originalText;
        
        // Show success message
        showNotification('PDF downloaded successfully!');
    })
    .catch(error => {
        console.error('Error:', error);
        alert(`Error generating PDF: ${error.message}`);
        
        // Reset button
        downloadBtn.disabled = false;
        downloadBtn.innerHTML = originalText;
    });
}

// Show notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification success';
    notification.innerHTML = `<i class="fa-solid fa-check-circle"></i> ${message}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        animation: slideIn 0.3s ease-in-out;
    `;
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Strip HTML tags for plain text download (kept for backward compatibility)
function stripHTML(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
}

// Show error
function showError(message) {
    document.getElementById('processingState').classList.add('hidden');
    document.getElementById('resultsDisplay').classList.add('hidden');
    document.getElementById('errorState').classList.remove('hidden');
    document.getElementById('errorMessage').textContent = message;
}

// Show history viewing banner
function showHistoryViewingBanner() {
    const banner = document.createElement('div');
    banner.className = 'history-viewing-banner';
    banner.innerHTML = `
        <div class="banner-content">
            <i class="fa-solid fa-clock-rotate-left"></i>
            <span>Viewing historical lecture</span>
        </div>
    `;
    
    const pageContainer = document.querySelector('.page-container');
    pageContainer.insertBefore(banner, pageContainer.firstChild);
}

// Return to history and restore current lecture
function returnToCurrentLecture() {
    // Restore original current lecture if exists
    const tempCurrent = sessionStorage.getItem('tempCurrentLecture');
    if (tempCurrent) {
        localStorage.setItem('lectureData', tempCurrent);
        sessionStorage.removeItem('tempCurrentLecture');
    }
    
    // Clear viewing history flag
    localStorage.removeItem('viewingHistory');
    
    // Go back to history page
    window.location.href = 'history.html';
}
