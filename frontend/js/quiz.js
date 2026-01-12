// Quiz State
let quizData = [];
let currentQuestionIndex = 0;
let selectedAnswer = null;
let score = 0;
let answeredQuestions = [];

// Load quiz from localStorage
function loadQuiz() {
    const savedData = localStorage.getItem('lectureData');
    if (!savedData) {
        // No data available - show empty state
        document.getElementById('noQuizState').classList.remove('hidden');
        document.getElementById('quizStartScreen').classList.add('hidden');
        return;
    }
    
    const data = JSON.parse(savedData);
    
    // Check if data is old
    if (!data.isFresh) {
        showOldDataWarning();
    }
    
    if (data.quiz) {
        quizData = parseQuiz(data.quiz);
        
        // Verify we have the expected number of questions
        const expectedCount = data.quizCount || 5;
        console.log(`Expected ${expectedCount} questions, parsed ${quizData.length} questions`);
        
        if (quizData.length > 0) {
            document.getElementById('noQuizState').classList.add('hidden');
            document.getElementById('quizStartScreen').classList.remove('hidden');
            document.getElementById('questionCount').textContent = quizData.length;
        } else {
            // No valid quiz questions parsed
            showNoQuizState();
        }
    } else {
        // No quiz data in localStorage
        showNoQuizState();
    }
}

function showOldDataWarning() {
    const warning = document.createElement('div');
    warning.className = 'old-data-warning';
    warning.innerHTML = `
        <i class="fa-solid fa-info-circle"></i>
        <span>Viewing quiz from a previous upload.</span>
        <button onclick="window.location.href='index.html'" class="btn btn-secondary" style="padding: 0.5rem 1rem;">
            <i class="fa-solid fa-upload"></i> Upload New
        </button>
    `;
    document.querySelector('.page-header').insertAdjacentElement('afterend', warning);
}

function showNoQuizState() {
    document.getElementById('noQuizState').classList.remove('hidden');
    document.getElementById('quizStartScreen').classList.add('hidden');
    document.getElementById('quizContainer').classList.add('hidden');
    document.getElementById('quizResults').classList.add('hidden');
}

// Parse quiz HTML to extract questions and answers
function parseQuiz(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const questions = [];
    
    // Get all text content and normalize line breaks
    let fullText = doc.body.innerText || doc.body.textContent;
    fullText = fullText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    // Split into question blocks by finding question numbers at start of line
    const questionBlocks = fullText.split(/(?=\n\d+[\.\)]\s)/);
    
    questionBlocks.forEach(block => {
        if (!block.trim()) return;
        
        const lines = block.split('\n').map(l => l.trim()).filter(l => l);
        if (lines.length < 5) return; // Need at least question + 4 options
        
        // First line should have question number and start of question
        const firstLine = lines[0];
        const questionMatch = firstLine.match(/^(\d+[\.\)]\s*)(.+)/);
        if (!questionMatch) return;
        
        let questionText = questionMatch[2].trim();
        
        // If question continues on next lines (multiline question)
        let lineIndex = 1;
        while (lineIndex < lines.length && !questionText.includes('?')) {
            const nextLine = lines[lineIndex];
            // Stop if we hit an option line
            if (/^[A-Da-d][\)\.]/.test(nextLine)) break;
            questionText += ' ' + nextLine;
            lineIndex++;
        }
        
        // Clean question text
        questionText = questionText
            .replace(/\(correct answer:?\s*[A-Da-d]\)/gi, '')
            .replace(/\[correct answer:?\s*[A-Da-d]\]/gi, '')
            .replace(/correct answer:?\s*[A-Da-d]/gi, '')
            .replace(/answer:?\s*[A-Da-d]/gi, '')
            .trim();
        
        // Extract options
        const options = [];
        let correctAnswerIndex = 0;
        
        for (let i = lineIndex; i < lines.length; i++) {
            const line = lines[i];
            
            // Match option pattern: A) text or A. text
            const optionMatch = line.match(/^([A-Da-d])[\)\.][\s]*(.+)$/);
            if (optionMatch) {
                let optionText = optionMatch[2].trim();
                
                // Clean up option text
                optionText = optionText
                    .replace(/\*+/g, '')
                    .replace(/✓/g, '')
                    .replace(/\(correct\)/gi, '')
                    .replace(/\[correct\]/gi, '')
                    .trim();
                
                options.push(optionText);
            }
            // Check for "Correct answer: X" line
            else if (line.match(/correct\s*answer/i)) {
                const answerMatch = line.match(/correct\s*answer\s*:?\s*([A-Da-d])/i);
                if (answerMatch) {
                    const answerLetter = answerMatch[1].toUpperCase();
                    correctAnswerIndex = answerLetter.charCodeAt(0) - 65;
                }
            }
        }
        
        // Only add if we have a valid question with at least 2 options
        if (questionText && options.length >= 2) {
            questions.push({
                question: questionText,
                options: options.slice(0, 4),
                correctAnswer: Math.max(0, Math.min(correctAnswerIndex, options.length - 1))
            });
        }
    });
    
    console.log(`Parsed ${questions.length} questions from quiz HTML`);
    
    // Fallback: create simple true/false questions if parsing fails
    if (questions.length === 0) {
        console.warn('No questions parsed, using fallback');
        questions.push({
            question: 'Based on the lecture, do you understand the key concepts?',
            options: ['Yes, I understand', 'No, I need to review', 'Partially understood', 'Not sure'],
            correctAnswer: 0
        });
    }
    
    return questions;
}

// Shuffle array using Fisher-Yates algorithm
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Start quiz
function startQuiz() {
    document.getElementById('quizStartScreen').classList.add('hidden');
    document.getElementById('quizContainer').classList.remove('hidden');
    
    // Shuffle questions randomly
    quizData = shuffleArray(quizData);
    
    // Shuffle options for each question and update correct answer index
    quizData = quizData.map(question => {
        const correctOption = question.options[question.correctAnswer];
        const shuffledOptions = shuffleArray(question.options);
        const newCorrectIndex = shuffledOptions.indexOf(correctOption);
        
        return {
            ...question,
            options: shuffledOptions,
            correctAnswer: newCorrectIndex
        };
    });
    
    currentQuestionIndex = 0;
    score = 0;
    answeredQuestions = [];
    displayQuestion();
}

// Display current question
function displayQuestion() {
    if (currentQuestionIndex >= quizData.length) {
        showResults();
        return;
    }
    
    const question = quizData[currentQuestionIndex];
    document.getElementById('questionText').textContent = question.question;
    document.getElementById('currentQuestion').textContent = currentQuestionIndex + 1;
    document.getElementById('totalQuestions').textContent = quizData.length;
    
    // Display options
    const optionsContainer = document.getElementById('optionsContainer');
    optionsContainer.innerHTML = '';
    
    question.options.forEach((option, index) => {
        const optionWrapper = document.createElement('div');
        optionWrapper.className = 'option-wrapper';
        
        const button = document.createElement('button');
        button.className = 'option-btn';
        
        const optionLabel = document.createElement('span');
        optionLabel.className = 'option-label';
        optionLabel.textContent = String.fromCharCode(65 + index) + ')';
        
        const optionText = document.createElement('span');
        optionText.className = 'option-text';
        optionText.textContent = option;
        
        button.appendChild(optionLabel);
        button.appendChild(optionText);
        button.onclick = () => selectOption(index);
        
        optionWrapper.appendChild(button);
        optionsContainer.appendChild(optionWrapper);
    });
    
    // Reset UI
    selectedAnswer = null;
    document.getElementById('submitBtn').disabled = true;
    document.getElementById('quizNavigation').classList.add('hidden');
    
    // Update next button text based on if it's the last question
    const nextBtn = document.querySelector('#quizNavigation button');
    if (currentQuestionIndex === quizData.length - 1) {
        nextBtn.innerHTML = 'Finish <i class="fa-solid fa-check"></i>';
    } else {
        nextBtn.innerHTML = 'Next Question <i class="fa-solid fa-arrow-right"></i>';
    }
    
    // Update progress
    updateQuizProgress();
}

// Select an option
function selectOption(index) {
    selectedAnswer = index;
    
    // Update UI
    const options = document.querySelectorAll('.option-btn');
    options.forEach((btn, i) => {
        btn.classList.remove('selected');
        if (i === index) {
            btn.classList.add('selected');
        }
    });
    
    document.getElementById('submitBtn').disabled = false;
}

// Submit answer
function submitAnswer() {
    if (selectedAnswer === null) return;
    
    const question = quizData[currentQuestionIndex];
    const isCorrect = selectedAnswer === question.correctAnswer;
    
    if (isCorrect) {
        score++;
    }
    
    answeredQuestions.push({
        question: question.question,
        selectedAnswer: selectedAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect: isCorrect
    });
    
    // Show feedback
    const options = document.querySelectorAll('.option-btn');
    options.forEach((btn, i) => {
        btn.disabled = true;
        if (i === question.correctAnswer) {
            btn.classList.add('correct');
        } else if (i === selectedAnswer && !isCorrect) {
            btn.classList.add('incorrect');
        }
    });
    
    // Show next button
    document.getElementById('submitBtn').classList.add('hidden');
    document.getElementById('quizNavigation').classList.remove('hidden');
}

// Next question
function nextQuestion() {
    // Check if this was the last question
    if (currentQuestionIndex >= quizData.length - 1) {
        showResults();
        return;
    }
    
    currentQuestionIndex++;
    document.getElementById('submitBtn').classList.remove('hidden');
    displayQuestion();
}

// Show results
function showResults() {
    document.getElementById('quizContainer').classList.add('hidden');
    document.getElementById('resultsScreen').classList.remove('hidden');
    
    const percentage = Math.round((score / quizData.length) * 100);
    document.getElementById('scorePercentage').textContent = percentage;
    document.getElementById('correctCount').textContent = score;
    document.getElementById('incorrectCount').textContent = quizData.length - score;
    
    // Save results
    const savedData = JSON.parse(localStorage.getItem('lectureData') || '{}');
    savedData.quizResults = {
        score: score,
        total: quizData.length,
        percentage: percentage,
        timestamp: new Date().toISOString()
    };
    localStorage.setItem('lectureData', JSON.stringify(savedData));
}

// Retake quiz
function retakeQuiz() {
    document.getElementById('resultsScreen').classList.add('hidden');
    document.getElementById('quizStartScreen').classList.remove('hidden');
}

// Update progress bar
function updateQuizProgress() {
    const progress = ((currentQuestionIndex + 1) / quizData.length) * 100;
    document.getElementById('quizProgressFill').style.width = progress + '%';
}

// Upload new lecture - clears old data and redirects to upload page
function uploadNewLecture() {
    if (confirm('Upload a new lecture? This will clear the current quiz.')) {
        localStorage.removeItem('lectureData');
        window.location.href = 'index.html';
    }
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', loadQuiz);
