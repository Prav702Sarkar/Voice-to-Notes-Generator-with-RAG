const fileInput = document.getElementById('audioFile');
const fileNameDisplay = document.getElementById('fileName');
const dropZone = document.getElementById('dropZone');

let mediaRecorder;
let audioChunks = [];
let recordingStartTime;
let recordingTimer;
let recordedAudioBlob = null;

fileInput.addEventListener('change', function() {
    if (this.files && this.files.length > 0) {
        document.getElementById('summary').innerHTML = '';
        document.getElementById('definitions').innerHTML = '';
        document.getElementById('quiz').innerHTML = '';
        document.getElementById('transcriptText').innerText = '';
        document.getElementById('resultsArea').classList.add('hidden');
        localStorage.removeItem('lectureData');
        recordedAudioBlob = null;
        
        fileNameDisplay.textContent = "Selected: " + this.files[0].name;
        fileNameDisplay.style.color = "#4f46e5";
        fileNameDisplay.style.fontWeight = "bold";
        showSelectedFile(this.files[0].name);
    }
});

// Show selected file with remove option
function showSelectedFile(filename) {
    const fileDisplay = document.getElementById('selectedFileDisplay');
    const fileNameSpan = document.getElementById('selectedFileName');
    
    fileNameSpan.textContent = filename;
    fileDisplay.classList.remove('hidden');
}

// Remove selected file
function removeFile() {
    selectedFile = null;
    document.getElementById('audioFile').value = '';
    document.getElementById('fileName').textContent = 'Supported formats: MP3, WAV, M4A';
    document.getElementById('fileName').style.color = '';
    document.getElementById('selectedFileDisplay').classList.add('hidden');
}

// Drag and Drop Effects
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = "#4f46e5";
    dropZone.style.backgroundColor = "#f0fdf4";
});

dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = "#e5e7eb";
    dropZone.style.backgroundColor = "#ffffff";
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = "#e5e7eb";
    dropZone.style.backgroundColor = "#ffffff";
    
    if (e.dataTransfer.files.length > 0) {
        fileInput.files = e.dataTransfer.files;
        fileNameDisplay.textContent = "Selected: " + e.dataTransfer.files[0].name;
        localStorage.removeItem('lectureData');
        recordedAudioBlob = null;
    }
});

async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        
        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };
        
        mediaRecorder.onstop = () => {
            recordedAudioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            fileInput.value = '';
            
            const recordingStatus = document.getElementById('recordingStatus');
            recordingStatus.textContent = '✅ Recording saved! Ready to generate study materials.';
            recordingStatus.style.color = '#10b981';
            stream.getTracks().forEach(track => track.stop());
        };
        
        mediaRecorder.start();
        recordingStartTime = Date.now();
        
        document.getElementById('startRecordBtn').classList.add('hidden');
        document.getElementById('stopRecordBtn').classList.remove('hidden');
        document.getElementById('recordingIndicator').classList.remove('hidden');
        document.getElementById('recordingStatus').textContent = '🎤 Recording in progress...';
        document.getElementById('recordingStatus').style.color = '#ef4444';
        recordingTimer = setInterval(updateRecordingTime, 1000);
        
    } catch (error) {
        console.error('Error accessing microphone:', error);
        alert('Could not access microphone. Please ensure microphone permissions are granted.');
    }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        clearInterval(recordingTimer);
        document.getElementById('startRecordBtn').classList.remove('hidden');
        document.getElementById('stopRecordBtn').classList.add('hidden');
        document.getElementById('recordingIndicator').classList.add('hidden');
    }
}

function updateRecordingTime() {
    const elapsed = Date.now() - recordingStartTime;
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    
    document.getElementById('recordingTime').textContent = 
        `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

async function processLecture() {
    const file = fileInput.files[0];
    const generateBtn = document.getElementById('generateBtn');
    const loadingState = document.getElementById('loadingState');
    const resultsArea = document.getElementById('resultsArea');
    const loadingText = document.getElementById('loadingText');

    if (!file && !recordedAudioBlob) {
        alert("Please select an audio file or record audio first!");
        return;
    }

    generateBtn.disabled = true;
    dropZone.classList.add('hidden');
    loadingState.classList.remove('hidden');
    resultsArea.classList.add('hidden');
    localStorage.removeItem('lectureData');

    const formData = new FormData();
    
    if (recordedAudioBlob) {
        formData.append('file', recordedAudioBlob, 'recorded_lecture.wav');
    } else {
        formData.append('file', file);
    }
    
    const quizCount = document.getElementById('quizCount').value;
    formData.append('quiz_count', quizCount);
    
    const contextPrompt = document.getElementById('contextPrompt').value.trim();
    if (contextPrompt) {
        formData.append('context', contextPrompt);
    }

    try {
        loadingText.innerText = "🎧 Transcribing Audio (Whisper)...";
        document.getElementById('loadStep1').classList.add('active');
        
        let progress = 0;
        let progressInterval = setInterval(() => {
            progress += Math.random() * 3;
            if (progress > 90) progress = 90;
            document.getElementById('uploadProgressFill').style.width = progress + '%';
        }, 200);
        
        
        const response = await fetch('http://127.0.0.1:5000/api/process-lecture', {
            method: 'POST',
            body: formData
        });

        await new Promise(resolve => setTimeout(resolve, 300));
        
        document.getElementById('loadStep1').classList.remove('active');
        document.getElementById('loadStep1').classList.add('completed');
        document.getElementById('loadStep2').classList.add('active');
        loadingText.innerText = "🧠 Analyzing Content (BERT & RAG)...";
        progress = 50;
        document.getElementById('uploadProgressFill').style.width = progress + '%';
        
        // Keep step 2 highlighted longer
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Update to step 3 - Generating
        document.getElementById('loadStep2').classList.remove('active');
        document.getElementById('loadStep2').classList.add('completed');
        document.getElementById('loadStep3').classList.add('active');
        loadingText.innerText = "✨ Generating Study Materials...";
        progress = 75;
        document.getElementById('uploadProgressFill').style.width = progress + '%';
        
        // Parse response after showing step 3
        await new Promise(resolve => setTimeout(resolve, 800));
        
        let data;
        try {
            data = await response.json();
        } catch (jsonError) {
            clearInterval(progressInterval);
            throw new Error("Server returned an invalid response. Please try again.");
        }

        if (!response.ok) {
            clearInterval(progressInterval);
            throw new Error(data.error || "Server Error");
        }
        
        // Complete all steps
        progress = 100;
        document.getElementById('uploadProgressFill').style.width = '100%';
        document.getElementById('loadStep3').classList.remove('active');
        document.getElementById('loadStep3').classList.add('completed');
        clearInterval(progressInterval);

        // Step C: Save Results to localStorage with fresh flag
        const lectureData = {
            summary: data.data.summary,
            definitions: data.data.definitions,
            quiz: data.data.quiz,
            transcript: data.transcript_preview,
            quizCount: parseInt(quizCount),
            context: contextPrompt,
            timestamp: new Date().toISOString(),
            isFresh: true,  // Mark as freshly uploaded
            sessionId: Date.now()  // Unique session identifier
        };
        
        localStorage.setItem('lectureData', JSON.stringify(lectureData));
        
        // Redirect to results page after successful processing
        window.location.href = 'results.html';

    } catch (error) {
        console.error("Error:", error);
        
        // Clear progress interval if it exists
        if (typeof progressInterval !== 'undefined') {
            clearInterval(progressInterval);
        }
        
        alert("An error occurred: " + error.message);
        loadingState.classList.add('hidden');
        dropZone.classList.remove('hidden');
        generateBtn.disabled = false;
    }
}

// --- 3. Tab Switching Logic ---
function switchTab(tabName) {
    // Hide all content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Deactivate all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Activate selected
    document.getElementById(tabName).classList.add('active');
    
    // Highlight button (Simple logic to find the button that was clicked is hard without event, 
    // so we assume order or find by text. Better approach below:)
    const buttons = document.querySelectorAll('.tab-btn');
    if(tabName === 'summary') buttons[0].classList.add('active');
    if(tabName === 'definitions') buttons[1].classList.add('active');
    if(tabName === 'quiz') buttons[2].classList.add('active');
}