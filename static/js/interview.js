// Interview session management
class InterviewManager {
    constructor() {
        this.currentQuestionIndex = 0;
        this.questions = [];
        this.sessionId = document.getElementById('session-id')?.value;
        this.timerInterval = null;
        this.timeLeft = 120; // 2 minutes default
        
        this.init();
    }
    
    init() {
        this.loadQuestions();
        this.setupEventListeners();
        this.startTimer();
    }
    
    async loadQuestions() {
        try {
            const response = await fetch('/api/next-question', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            const data = await response.json();
            
            if (data.status === 'success') {
                this.displayQuestion(data.question);
                this.questions.push(data.question);
            } else if (data.status === 'completed') {
                this.showCompletionMessage();
            }
        } catch (error) {
            console.error('Error loading questions:', error);
        }
    }
    
    displayQuestion(question) {
        // Update question text
        document.getElementById('question-text').textContent = question.question_text;
        
        // Update question ID
        document.getElementById('current-question-id').value = question.id;
        
        // Update question counter
        document.getElementById('question-counter').textContent = 
            `Question ${this.currentQuestionIndex + 1} of ${this.questions.length}`;
        
        // Update question tags
        const typeTag = document.getElementById('question-type');
        const difficultyTag = document.getElementById('question-difficulty');
        
        typeTag.textContent = question.question_type.charAt(0).toUpperCase() + question.question_type.slice(1);
        typeTag.className = `px-3 py-1 rounded-full text-sm ${
            question.question_type === 'technical' ? 'bg-blue-100 text-blue-800' :
            question.question_type === 'behavioral' ? 'bg-green-100 text-green-800' :
            question.question_type === 'situational' ? 'bg-yellow-100 text-yellow-800' :
            'bg-purple-100 text-purple-800'
        }`;
        
        difficultyTag.textContent = question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1);
        difficultyTag.className = `px-3 py-1 rounded-full text-sm ${
            question.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
            question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
        }`;
        
        // Set timer based on question
        this.timeLeft = question.time_allocated || 120;
        this.updateTimerDisplay();
        
        // Clear previous answer
        document.getElementById('answer-text').value = '';
        if (window.speechManager) {
            window.speechManager.clearTranscript();
        }
        
        // Hide feedback and show question
        document.getElementById('feedback-area').classList.add('hidden');
    }
    
    setupEventListeners() {
        // Submit answer
        document.getElementById('submit-answer').addEventListener('click', () => this.submitAnswer());

        // x question
        const skipBtn = document.getElementById('skip-question');
        if (skipBtn) {
            skipBtn.addEventListener('click', () => this.skipQuestion());
        }

        // Finish interview
        document.getElementById('finish-interview').addEventListener('click', () => this.finishInterview());

        // Next question - store reference for later removal
        this.nextQuestionBtn = document.getElementById('next-question-btn');
        this.nextQuestionHandler = () => this.nextQuestion();
        this.nextQuestionBtn.addEventListener('click', this.nextQuestionHandler);

        // Timer controls
        document.getElementById('start-timer').addEventListener('click', () => this.startTimer());
        document.getElementById('stop-timer').addEventListener('click', () => this.stopTimer());
    }
    
    startTimer() {
        this.stopTimer();
        
        const timerDisplay = document.getElementById('timer-display');
        const progressCircle = document.getElementById('progress-circle');
        const totalTime = this.timeLeft;
        
        this.timerInterval = setInterval(() => {
            if (this.timeLeft <= 0) {
                this.stopTimer();
                this.submitAnswer();
                return;
            }
            
            this.timeLeft--;
            this.updateTimerDisplay();
            
            // Update progress circle
            const circumference = 326.56;
            const offset = circumference - (this.timeLeft / totalTime) * circumference;
            progressCircle.style.strokeDashoffset = offset;
            
        }, 1000);
    }
    
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    updateTimerDisplay() {
        const timerDisplay = document.getElementById('timer-display');
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    async submitAnswer() {
        this.stopTimer();

        const questionId = document.getElementById('current-question-id').value;
        let answerText = document.getElementById('answer-text').value;
        const transcript = window.speechManager ? window.speechManager.getTranscript() : '';
        const duration = 120 - this.timeLeft; // Time spent on answer

        // Combine typed answer and speech transcript if both exist
        if (answerText.trim() && transcript.trim()) {
            answerText = answerText.trim() + ' ' + transcript.trim();
        } else if (transcript.trim()) {
            answerText = transcript.trim();
        }

        if (!answerText.trim()) {
            alert('Please provide an answer before submitting. Please type or speak your answer.');
            return;
        }
        
        const submitBtn = document.getElementById('submit-answer');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Analyzing...';
        
        try {
            const response = await fetch('/api/analyze-answer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question_id: questionId,
                    answer_text: answerText,
                    transcript: transcript,
                    duration: duration
                })
            });
            
            const data = await response.json();
            
            if (data.status === 'success') {
                this.displayFeedback(data.analysis, data.next_question_available);
            }
        } catch (error) {
            console.error('Error submitting answer:', error);
            alert('Error submitting answer. Please try again.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane mr-2"></i> Submit Answer';
        }
    }
    
    displayFeedback(analysis, hasNextQuestion) {
        const feedbackArea = document.getElementById('feedback-area');
        const feedbackContent = document.getElementById('feedback-content');
        const nextBtn = document.getElementById('next-question-btn');

        // Build feedback HTML
        let feedbackHTML = `
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div class="text-center p-4 bg-blue-50 rounded-lg">
                    <div class="text-2xl font-bold text-blue-700">${analysis.grammar_score}/10</div>
                    <div class="text-sm text-blue-600">Grammar</div>
                </div>
                <div class="text-center p-4 bg-green-50 rounded-lg">
                    <div class="text-2xl font-bold text-green-700">${analysis.relevance_score}/10</div>
                    <div class="text-sm text-green-600">Relevance</div>
                </div>
                <div class="text-center p-4 bg-yellow-50 rounded-lg">
                    <div class="text-2xl font-bold text-yellow-700">${analysis.confidence_score}/10</div>
                    <div class="text-sm text-yellow-600">Confidence</div>
                </div>
                <div class="text-center p-4 bg-purple-50 rounded-lg">
                    <div class="text-2xl font-bold text-purple-700">${analysis.star_score}/10</div>
                    <div class="text-sm text-purple-600">STAR Method</div>
                </div>
            </div>

            <div class="p-4 bg-gray-50 rounded-lg mb-4">
                <h4 class="font-bold mb-2">Filler Words:</h4>
                <p>${analysis.filler_words_count} filler words detected (um, uh, like, etc.)</p>
            </div>

            <div class="p-4 bg-green-50 rounded-lg mb-4">
                <h4 class="font-bold mb-2">AI Feedback:</h4>
                <p>${analysis.feedback}</p>
            </div>
        `;

        if (analysis.suggested_answer) {
            feedbackHTML += `
                <div class="p-4 bg-blue-50 rounded-lg mb-4">
                    <h4 class="font-bold mb-2">Suggested Better Answer:</h4>
                    <p>${analysis.suggested_answer}</p>
                </div>
            `;
        }

        if (analysis.cross_question) {
            feedbackHTML += `
                <div class="p-4 bg-yellow-50 rounded-lg">
                    <h4 class="font-bold mb-2">Follow-up Question:</h4>
                    <p>${analysis.cross_question}</p>
                </div>
            `;
        }

        feedbackContent.innerHTML = feedbackHTML;

        // Update next button text and set up single handler
        if (hasNextQuestion) {
            nextBtn.innerHTML = 'Next Question <i class="fas fa-arrow-right ml-2"></i>';
        } else {
            nextBtn.innerHTML = 'Continue to Coding Test <i class="fas fa-arrow-right ml-2"></i>';
        }

        // Set up single click handler that handles both cases
        nextBtn.onclick = () => this.handleNextAction();

        // Show feedback area
        feedbackArea.classList.remove('hidden');
    }
    
    skipQuestion() {
        if (confirm('Skip this question?')) {
            this.nextQuestion();
        }
    }
    
    async nextQuestion() {
        try {
            const response = await fetch('/api/next-question', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();

            if (data.status === 'success') {
                this.currentQuestionIndex = data.current_index + 1; // Sync with server
                this.displayQuestion(data.question);
                this.questions.push(data.question);
            } else if (data.status === 'completed') {
                this.showCompletionMessage();
            }
        } catch (error) {
            console.error('Error loading next question:', error);
        }
    }
    
    showCompletionMessage() {
        alert('All questions completed! Moving to coding test...');
        window.location.href = '/coding-test';
    }
    
    handleNextAction() {
        // Check if there are more questions by calling the API
        fetch('/api/next-question', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                // There are more questions, load the next one
                this.currentQuestionIndex = data.current_index + 1;
                this.displayQuestion(data.question);
                this.questions.push(data.question);
            } else if (data.status === 'completed') {
                // No more questions, redirect to coding test
                window.location.href = '/coding-test';
            }
        })
        .catch(error => {
            console.error('Error checking for next question:', error);
            // Fallback: assume no more questions and redirect to coding test
            window.location.href = '/coding-test';
        });
    }

    finishInterview() {
        if (confirm('Are you sure you want to finish the interview? This will end the session.')) {
            window.location.href = '/feedback';
        }
    }
}

// Initialize interview manager when page loads
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('question-text')) {
        window.interviewManager = new InterviewManager();
    }
});