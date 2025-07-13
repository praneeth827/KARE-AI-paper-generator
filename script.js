// Global Variables
let currentTab = 'generator';
let courseOutcomes = [];
let questions = { partA: [], partB: [] };
let questionCounter = { partA: 0, partB: 0 };
let bloomTargets = {
    remember: 0,
    understand: 0,
    apply: 0,
    analyze: 0,
    evaluate: 0,
    create: 0
};
let uploadedFiles = [];
let generatedPapers = { easy: null, medium: null, hard: null };

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    initializeApp();
    setupEventListeners();
    updateBloomTable();
});

function checkAuthentication() {
    const userData = localStorage.getItem('edupaperUser') || sessionStorage.getItem('edupaperUser');
    if (!userData) {
        window.location.href = 'login.html';
        return;
    }
    
    const user = JSON.parse(userData);
    document.getElementById('username-display').textContent = user.name;
    document.getElementById('dropdown-name').textContent = user.name;
    document.getElementById('dropdown-email').textContent = user.email;
}

function logout() {
    localStorage.removeItem('edupaperUser');
    sessionStorage.removeItem('edupaperUser');
    window.location.href = 'login.html';
}

function initializeApp() {
    // Set default values
    document.getElementById('university-name').value = 'Kalasalingam Academy of Research and Education';
    document.getElementById('duration').value = '90 Minutes';
    document.getElementById('max-marks').value = '50';
    
    // Initialize Bloom's taxonomy targets
    bloomTargets = {
        remember: 4,
        understand: 14,
        apply: 24,
        analyze: 8,
        evaluate: 0,
        create: 0
    };
    
    updateBloomTable();
    updateQuickActions();
}

function setupEventListeners() {
    // Tab navigation
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            switchTab(this.dataset.tab);
        });
    });

    // User dropdown
    document.getElementById('userDropdownBtn').addEventListener('click', function() {
        document.querySelector('.user-dropdown').classList.toggle('active');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.user-dropdown')) {
            document.querySelector('.user-dropdown').classList.remove('active');
        }
    });

    // Start creating button
    document.getElementById('start-creating').addEventListener('click', function() {
        document.getElementById('welcome-screen').classList.add('hidden');
        document.getElementById('paper-form').classList.remove('hidden');
    });

    // Go to upload button
    document.getElementById('go-to-upload').addEventListener('click', function() {
        switchTab('upload');
    });

    // Course outcomes
    document.getElementById('add-co').addEventListener('click', addCourseOutcome);

    // Questions
    document.getElementById('add-part-a').addEventListener('click', () => addQuestion('partA'));
    document.getElementById('add-part-b').addEventListener('click', () => addQuestion('partB'));

    // Preview and download
    document.getElementById('generate-preview').addEventListener('click', generatePreview);
    document.getElementById('download-pdf').addEventListener('click', downloadPDF);

    // AI Assistant
    document.getElementById('send-message').addEventListener('click', sendMessage);
    document.getElementById('chat-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Course name change listener for AI assistant
    document.getElementById('course-name').addEventListener('input', function() {
        updateQuickActions();
    });

    // File upload
    setupFileUpload();

    // Preview and download buttons for generated papers
    document.querySelectorAll('.preview-paper').forEach(btn => {
        btn.addEventListener('click', function() {
            const level = this.dataset.level;
            previewGeneratedPaper(level);
        });
    });

    document.querySelectorAll('.download-paper').forEach(btn => {
        btn.addEventListener('click', function() {
            const level = this.dataset.level;
            downloadGeneratedPaper(level);
        });
    });
}

function switchTab(tabName) {
    currentTab = tabName;
    
    // Update nav tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');
}

// File Upload Functions
function setupFileUpload() {
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    const analyzeBtn = document.getElementById('analyze-files');

    // Drag and drop
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const files = Array.from(e.dataTransfer.files).filter(file => file.type === 'application/pdf');
        handleFileUpload(files);
    });

    // File input change
    fileInput.addEventListener('change', function(e) {
        const files = Array.from(e.target.files);
        handleFileUpload(files);
    });

    // Analyze files button
    analyzeBtn.addEventListener('click', analyzeUploadedFiles);
}

function handleFileUpload(files) {
    if (files.length === 0) {
        showNotification('Please select PDF files only.', 'error');
        return;
    }

    const maxFiles = parseInt(document.getElementById('max-files')?.value || '10');
    if (uploadedFiles.length + files.length > maxFiles) {
        showNotification(`Maximum ${maxFiles} files allowed.`, 'error');
        return;
    }

    // Show progress
    document.getElementById('upload-progress').classList.remove('hidden');
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');

    let uploaded = 0;
    const total = files.length;

    files.forEach((file, index) => {
        // Simulate upload progress
        setTimeout(() => {
            const fileData = {
                id: Date.now() + index,
                name: file.name,
                size: formatFileSize(file.size),
                content: `Content of ${file.name}` // In real app, this would be extracted PDF content
            };
            
            uploadedFiles.push(fileData);
            uploaded++;
            
            const progress = (uploaded / total) * 100;
            progressFill.style.width = progress + '%';
            progressText.textContent = `${Math.round(progress)}% Complete`;
            
            if (uploaded === total) {
                setTimeout(() => {
                    document.getElementById('upload-progress').classList.add('hidden');
                    displayUploadedFiles();
                    showNotification(`${total} files uploaded successfully!`, 'success');
                }, 500);
            }
        }, index * 200);
    });
}

function displayUploadedFiles() {
    const filesList = document.getElementById('files-list');
    const uploadedFilesSection = document.getElementById('uploaded-files');
    
    filesList.innerHTML = '';
    
    uploadedFiles.forEach(file => {
        const fileElement = document.createElement('div');
        fileElement.className = 'file-item';
        fileElement.innerHTML = `
            <div class="file-icon">
                <i class="fas fa-file-pdf"></i>
            </div>
            <div class="file-info">
                <div class="file-name">${file.name}</div>
                <div class="file-size">${file.size}</div>
            </div>
            <div class="file-actions">
                <button class="btn btn-danger" onclick="removeFile('${file.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        filesList.appendChild(fileElement);
    });
    
    uploadedFilesSection.classList.remove('hidden');
    document.getElementById('files-count').textContent = uploadedFiles.length;
}

function removeFile(fileId) {
    uploadedFiles = uploadedFiles.filter(file => file.id !== parseInt(fileId));
    displayUploadedFiles();
    
    if (uploadedFiles.length === 0) {
        document.getElementById('uploaded-files').classList.add('hidden');
        document.getElementById('analysis-results').classList.add('hidden');
    }
}

function analyzeUploadedFiles() {
    if (uploadedFiles.length < 3) {
        showNotification('Please upload at least 3 PDF files for analysis.', 'error');
        return;
    }

    // Show loading
    const analyzeBtn = document.getElementById('analyze-files');
    const originalText = analyzeBtn.innerHTML;
    analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
    analyzeBtn.disabled = true;

    // Simulate AI analysis
    setTimeout(() => {
        // Randomly select 3 files for different difficulty levels
        const shuffled = [...uploadedFiles].sort(() => 0.5 - Math.random());
        const selectedFiles = shuffled.slice(0, 3);

        generatedPapers = {
            easy: selectedFiles[0],
            medium: selectedFiles[1],
            hard: selectedFiles[2]
        };

        // Update the paper cards with actual file names
        document.getElementById('easy-paper-name').textContent = `Based on: ${selectedFiles[0].name}`;
        document.getElementById('medium-paper-name').textContent = `Based on: ${selectedFiles[1].name}`;
        document.getElementById('hard-paper-name').textContent = `Based on: ${selectedFiles[2].name}`;

        // Show results
        document.getElementById('analysis-results').classList.remove('hidden');
        
        // Reset button
        analyzeBtn.innerHTML = originalText;
        analyzeBtn.disabled = false;
        
        showNotification('Analysis complete! 3 difficulty-based papers generated.', 'success');
    }, 3000);
}

function previewGeneratedPaper(level) {
    const paper = generatedPapers[level];
    if (!paper) {
        showNotification('No paper generated for this level.', 'error');
        return;
    }

    const modal = document.getElementById('preview-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');

    modalTitle.textContent = `${level.charAt(0).toUpperCase() + level.slice(1)} Level Paper Preview`;
    
    // Display the actual PDF content (in a real app, this would be the extracted and formatted content)
    modalBody.innerHTML = `
        <div class="paper-preview">
            <div class="paper-header">
                <div class="university-header">
                    <div class="university-name">Kalasalingam Academy of Research and Education</div>
                    <div style="font-size: 0.9rem;">ACADEMY OF RESEARCH AND EDUCATION</div>
                    <div style="font-size: 0.9rem;">(DEEMED UNIVERSITY)</div>
                </div>
            </div>
            <div style="margin: 2rem 0;">
                <h3>${level.charAt(0).toUpperCase() + level.slice(1)} Level Question Paper</h3>
                <p><strong>Source File:</strong> ${paper.name}</p>
                <div style="margin-top: 1rem; padding: 1rem; background: #f9fafb; border-radius: 8px;">
                    <h4>Content Preview:</h4>
                    <p>${paper.content}</p>
                    <p style="margin-top: 1rem; font-style: italic;">
                        This paper contains the exact content from the uploaded PDF file "${paper.name}" 
                        categorized as ${level} difficulty level.
                    </p>
                </div>
            </div>
        </div>
    `;

    modal.classList.remove('hidden');
}

function downloadGeneratedPaper(level) {
    const paper = generatedPapers[level];
    if (!paper) {
        showNotification('No paper generated for this level.', 'error');
        return;
    }

    // Create a new window for printing/downloading
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${level.charAt(0).toUpperCase() + level.slice(1)} Level Paper - ${paper.name}</title>
            <style>
                body {
                    font-family: 'Times New Roman', serif;
                    line-height: 1.4;
                    margin: 20px;
                    color: #000;
                }
                .paper-header {
                    border: 2px solid #000;
                    padding: 1rem;
                    margin-bottom: 1.5rem;
                    text-align: center;
                }
                .university-name {
                    font-size: 1.5rem;
                    font-weight: bold;
                    text-transform: uppercase;
                    margin-bottom: 0.5rem;
                }
                .content-section {
                    margin: 2rem 0;
                    padding: 1rem;
                    border: 1px solid #ccc;
                }
                @media print {
                    body { margin: 0; }
                }
            </style>
        </head>
        <body>
            <div class="paper-header">
                <div class="university-name">Kalasalingam Academy of Research and Education</div>
                <div>ACADEMY OF RESEARCH AND EDUCATION</div>
                <div>(DEEMED UNIVERSITY)</div>
                <div style="margin-top: 1rem;">
                    <strong>${level.charAt(0).toUpperCase() + level.slice(1)} Level Question Paper</strong>
                </div>
            </div>
            <div class="content-section">
                <h3>Source File: ${paper.name}</h3>
                <div style="margin-top: 1rem;">
                    <h4>Content:</h4>
                    <p>${paper.content}</p>
                </div>
                <div style="margin-top: 2rem; font-style: italic; color: #666;">
                    This paper contains the exact content from the uploaded PDF file "${paper.name}" 
                    categorized as ${level} difficulty level.
                </div>
            </div>
        </body>
        </html>
    `);
    
    printWindow.document.close();
    
    // Wait for content to load, then print
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 500);
    
    showNotification(`${level.charAt(0).toUpperCase() + level.slice(1)} level paper download initiated!`, 'success');
}

function closePreviewModal() {
    document.getElementById('preview-modal').classList.add('hidden');
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Course Outcomes Functions
function addCourseOutcome() {
    const coId = Date.now().toString();
    const coNumber = courseOutcomes.length + 1;
    
    const courseOutcome = {
        id: coId,
        code: `CO${coNumber}`,
        description: ''
    };
    
    courseOutcomes.push(courseOutcome);
    renderCourseOutcomes();
}

function renderCourseOutcomes() {
    const container = document.getElementById('course-outcomes');
    container.innerHTML = '';
    
    courseOutcomes.forEach(co => {
        const coElement = document.createElement('div');
        coElement.className = 'course-outcome';
        coElement.innerHTML = `
            <div class="co-code">
                <input type="text" value="${co.code}" onchange="updateCourseOutcome('${co.id}', 'code', this.value)">
            </div>
            <div class="co-description">
                <textarea placeholder="Describe the course outcome..." onchange="updateCourseOutcome('${co.id}', 'description', this.value)">${co.description}</textarea>
            </div>
            <div class="co-actions">
                <button class="btn btn-danger" onclick="removeCourseOutcome('${co.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        container.appendChild(coElement);
    });
}

function updateCourseOutcome(id, field, value) {
    const co = courseOutcomes.find(co => co.id === id);
    if (co) {
        co[field] = value;
    }
}

function removeCourseOutcome(id) {
    courseOutcomes = courseOutcomes.filter(co => co.id !== id);
    renderCourseOutcomes();
}

// Questions Functions
function addQuestion(part) {
    const questionId = Date.now().toString();
    questionCounter[part]++;
    
    const question = {
        id: questionId,
        number: questionCounter[part],
        text: '',
        marks: part === 'partA' ? 2 : 8,
        pattern: 'Remember',
        mappingCO: courseOutcomes.length > 0 ? courseOutcomes[0].code : 'CO1',
        bloomLevel: 'Remember',
        difficulty: 'easy'
    };
    
    questions[part].push(question);
    renderQuestions();
}

function renderQuestions() {
    renderPartQuestions('partA', 'part-a-questions');
    renderPartQuestions('partB', 'part-b-questions');
    updateBloomTable();
}

function renderPartQuestions(part, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    questions[part].forEach(question => {
        const questionElement = document.createElement('div');
        questionElement.className = `question-item ${question.difficulty}`;
        questionElement.innerHTML = `
            <div class="question-header">
                <span class="question-number">Q${question.number}</span>
                <div class="question-actions">
                    <button class="btn btn-ai" onclick="generateAIQuestion('${question.id}', '${part}')">
                        <i class="fas fa-brain"></i>
                        AI Generate
                    </button>
                    <button class="btn btn-danger" onclick="removeQuestion('${question.id}', '${part}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="question-form">
                <div class="form-group">
                    <label>Question Text</label>
                    <textarea rows="3" placeholder="Enter the question text..." onchange="updateQuestion('${question.id}', '${part}', 'text', this.value)">${question.text}</textarea>
                </div>
                <div class="question-meta">
                    <div class="form-group">
                        <label>Marks</label>
                        <input type="number" value="${question.marks}" min="1" onchange="updateQuestion('${question.id}', '${part}', 'marks', parseInt(this.value))">
                    </div>
                    <div class="form-group">
                        <label>Difficulty</label>
                        <select onchange="updateQuestion('${question.id}', '${part}', 'difficulty', this.value)">
                            <option value="easy" ${question.difficulty === 'easy' ? 'selected' : ''}>Easy</option>
                            <option value="medium" ${question.difficulty === 'medium' ? 'selected' : ''}>Medium</option>
                            <option value="hard" ${question.difficulty === 'hard' ? 'selected' : ''}>Hard</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Pattern</label>
                        <select onchange="updateQuestion('${question.id}', '${part}', 'pattern', this.value)">
                            <option value="Remember" ${question.pattern === 'Remember' ? 'selected' : ''}>Remember</option>
                            <option value="Understand" ${question.pattern === 'Understand' ? 'selected' : ''}>Understand</option>
                            <option value="Apply" ${question.pattern === 'Apply' ? 'selected' : ''}>Apply</option>
                            <option value="Analyze" ${question.pattern === 'Analyze' ? 'selected' : ''}>Analyze</option>
                            <option value="Evaluate" ${question.pattern === 'Evaluate' ? 'selected' : ''}>Evaluate</option>
                            <option value="Create" ${question.pattern === 'Create' ? 'selected' : ''}>Create</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Mapping CO</label>
                        <select onchange="updateQuestion('${question.id}', '${part}', 'mappingCO', this.value)">
                            ${courseOutcomes.map(co => `<option value="${co.code}" ${question.mappingCO === co.code ? 'selected' : ''}>${co.code}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Bloom's Level</label>
                        <select onchange="updateQuestion('${question.id}', '${part}', 'bloomLevel', this.value)">
                            <option value="Remember" ${question.bloomLevel === 'Remember' ? 'selected' : ''}>Remember</option>
                            <option value="Understand" ${question.bloomLevel === 'Understand' ? 'selected' : ''}>Understand</option>
                            <option value="Apply" ${question.bloomLevel === 'Apply' ? 'selected' : ''}>Apply</option>
                            <option value="Analyze" ${question.bloomLevel === 'Analyze' ? 'selected' : ''}>Analyze</option>
                            <option value="Evaluate" ${question.bloomLevel === 'Evaluate' ? 'selected' : ''}>Evaluate</option>
                            <option value="Create" ${question.bloomLevel === 'Create' ? 'selected' : ''}>Create</option>
                        </select>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(questionElement);
    });
}

function updateQuestion(id, part, field, value) {
    const question = questions[part].find(q => q.id === id);
    if (question) {
        question[field] = value;
        if (field === 'difficulty') {
            // Update the visual styling
            const questionElement = document.querySelector(`[data-question-id="${id}"]`);
            if (questionElement) {
                questionElement.className = `question-item ${value}`;
            }
        }
        if (field === 'marks' || field === 'bloomLevel') {
            updateBloomTable();
        }
        renderQuestions();
    }
}

function removeQuestion(id, part) {
    questions[part] = questions[part].filter(q => q.id !== id);
    // Renumber questions
    questions[part].forEach((q, index) => {
        q.number = index + 1;
    });
    questionCounter[part] = questions[part].length;
    renderQuestions();
}

function generateAIQuestion(id, part) {
    const question = questions[part].find(q => q.id === id);
    if (!question) return;
    
    // Simple AI question generation
    const sampleQuestions = [
        'Explain the fundamental concepts and their applications in real-world scenarios.',
        'Analyze the given problem and provide a comprehensive solution with proper justification.',
        'Compare and contrast different approaches to solve the given mathematical problem.',
        'Derive the formula and demonstrate its application with suitable examples.',
        'Evaluate the effectiveness of different methods and recommend the best approach.',
        'Design a solution for the given problem and validate your approach.',
        'Solve the given equation using appropriate mathematical techniques.',
        'Prove the given theorem and discuss its practical implications.'
    ];
    
    const randomQuestion = sampleQuestions[Math.floor(Math.random() * sampleQuestions.length)];
    question.text = randomQuestion;
    renderQuestions();
    showNotification('AI question generated successfully!', 'success');
}

// Bloom's Taxonomy Functions
function updateBloomTable() {
    const tableBody = document.getElementById('bloom-table-body');
    tableBody.innerHTML = '';
    
    const levels = ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'];
    const levelLabels = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'];
    const levelColors = ['bloom-remember', 'bloom-understand', 'bloom-apply', 'bloom-analyze', 'bloom-evaluate', 'bloom-create'];
    
    let totalTarget = 0;
    let totalCurrent = 0;
    
    levels.forEach((level, index) => {
        const target = bloomTargets[level];
        const current = calculateCurrentMarks(levelLabels[index]);
        const difference = current - target;
        const isBalanced = Math.abs(difference) <= 2;
        
        totalTarget += target;
        totalCurrent += current;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <span class="bloom-level ${levelColors[index]}">${levelLabels[index]}</span>
            </td>
            <td>
                <input type="number" value="${target}" min="0" onchange="updateBloomTarget('${level}', parseInt(this.value))">
            </td>
            <td class="text-center">${current}</td>
            <td class="text-center" style="color: ${difference > 0 ? '#059669' : difference < 0 ? '#dc2626' : '#6b7280'}">
                ${difference > 0 ? '+' : ''}${difference}
            </td>
            <td class="text-center">
                <span class="${isBalanced ? 'status-balanced' : 'status-needs-adjustment'}">
                    ${isBalanced ? 'Balanced' : 'Needs Adjustment'}
                </span>
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    // Add total row
    const totalRow = document.createElement('tr');
    totalRow.style.backgroundColor = '#f9fafb';
    totalRow.style.fontWeight = '600';
    totalRow.innerHTML = `
        <td>Total</td>
        <td class="text-center">${totalTarget}</td>
        <td class="text-center">${totalCurrent}</td>
        <td class="text-center">${totalCurrent - totalTarget}</td>
        <td class="text-center">
            <i class="fas fa-chart-line" style="color: #3b82f6;"></i>
        </td>
    `;
    tableBody.appendChild(totalRow);
}

function calculateCurrentMarks(bloomLevel) {
    let total = 0;
    [...questions.partA, ...questions.partB].forEach(question => {
        if (question.bloomLevel === bloomLevel) {
            total += question.marks || 0;
        }
    });
    return total;
}

function updateBloomTarget(level, value) {
    bloomTargets[level] = value || 0;
    updateBloomTable();
}

// Preview and Download Functions
function generatePreview() {
    const preview = document.getElementById('paper-preview');
    const courseDetails = getCourseDetails();
    
    const previewHTML = `
        <div class="paper-header">
            <div class="university-header">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
                    <div style="width: 60px; height: 60px; border: 1px solid #000; display: flex; align-items: center; justify-content: center; font-size: 0.8rem;">LOGO</div>
                    <div style="text-align: center; flex: 1; margin: 0 1rem;">
                        <div class="university-name">${courseDetails.universityName || 'University Name'}</div>
                        <div style="font-size: 0.9rem;">ACADEMY OF RESEARCH AND EDUCATION</div>
                        <div style="font-size: 0.9rem;">(DEEMED UNIVERSITY)</div>
                        <div style="font-size: 0.8rem; margin-top: 0.5rem;">Under sec. 3 of UGC Act 1956, Accredited by NAAC with "A++" Grade</div>
                    </div>
                    <div style="width: 60px; height: 60px; border: 1px solid #000; display: flex; align-items: center; justify-content: center; font-size: 0.8rem;">PHOTO</div>
                </div>
                
                <div style="text-align: center; margin-bottom: 1rem;">
                    <div style="font-size: 1.1rem; font-weight: bold;">OFFICE OF DEAN - FRESHMAN ENGINEERING</div>
                </div>

                <div style="border: 1px solid #000; padding: 0.5rem; margin-bottom: 1rem;">
                    <div style="display: grid; grid-template-columns: repeat(9, 1fr); gap: 2px; text-align: center;">
                        ${generateQuestionId().split('').map(digit => `<div style="border: 1px solid #000; padding: 0.25rem; font-weight: bold;">${digit}</div>`).join('')}
                    </div>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <div style="font-size: 1.1rem; font-weight: bold;">${courseDetails.examType || 'EXAMINATION TYPE'}</div>
                    <div style="font-size: 1.1rem; font-weight: bold;">SET - ${courseDetails.setNumber || '00'}</div>
                </div>

                <table class="paper-table">
                    <tr>
                        <td style="font-weight: bold; width: 16.66%;">Course Code</td>
                        <td>: ${courseDetails.courseCode}</td>
                        <td style="font-weight: bold; width: 16.66%;">Duration</td>
                        <td>: ${courseDetails.duration}</td>
                    </tr>
                    <tr>
                        <td style="font-weight: bold;">Course Name</td>
                        <td>: ${courseDetails.courseName}</td>
                        <td style="font-weight: bold;">Max. Marks</td>
                        <td>: ${courseDetails.maxMarks}</td>
                    </tr>
                    <tr>
                        <td style="font-weight: bold;">Degree/Year/Sem.</td>
                        <td>: ${courseDetails.degree}. / ${courseDetails.year} / ${courseDetails.semester}</td>
                        <td style="font-weight: bold;">Date & Session</td>
                        <td>: ${formatDate(courseDetails.date)} & ${courseDetails.session}</td>
                    </tr>
                </table>
            </div>
        </div>

        ${courseOutcomes.length > 0 ? `
            <div style="margin-bottom: 1.5rem;">
                <div style="font-weight: bold; margin-bottom: 0.5rem; font-size: 0.9rem;">COs TO BE ASSESSED DURING ${courseDetails.examType || 'EXAMINATION'}</div>
                <table class="paper-table">
                    ${courseOutcomes.map(co => `
                        <tr>
                            <td style="width: 60px; text-align: center; font-weight: bold;">${co.code}</td>
                            <td>${co.description}</td>
                        </tr>
                    `).join('')}
                </table>
            </div>
        ` : ''}

        ${questions.partA.length > 0 ? `
            <div style="margin-bottom: 1.5rem;">
                <table class="paper-table">
                    <thead>
                        <tr style="background: #f5f5f5;">
                            <th colspan="3">PART - A (${questions.partA.length} x 2 = ${questions.partA.reduce((sum, q) => sum + q.marks, 0)} Marks)</th>
                            <th>Pattern</th>
                            <th>Mapping COs</th>
                            <th>Marks</th>
                        </tr>
                        <tr>
                            <th colspan="3">Answer All Questions</th>
                            <th></th>
                            <th></th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        ${questions.partA.map(question => `
                            <tr>
                                <td style="width: 30px; text-align: center;">${question.number}</td>
                                <td colspan="2">${question.text}</td>
                                <td style="text-align: center;">${question.pattern}</td>
                                <td style="text-align: center;">${question.mappingCO}</td>
                                <td style="text-align: center;">${question.marks}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        ` : ''}

        ${questions.partB.length > 0 ? `
            <div style="margin-bottom: 1.5rem;">
                <table class="paper-table">
                    <thead>
                        <tr style="background: #f5f5f5;">
                            <th colspan="3">PART - B (${questions.partB.length} x 16 = ${questions.partB.reduce((sum, q) => sum + q.marks, 0)} Marks)</th>
                            <th>Pattern</th>
                            <th>Mapping COs</th>
                            <th>Marks</th>
                        </tr>
                        <tr>
                            <th colspan="3">Answer All Questions</th>
                            <th></th>
                            <th></th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        ${questions.partB.map(question => `
                            <tr>
                                <td style="width: 30px; text-align: center;">${question.number}</td>
                                <td colspan="2">${question.text}</td>
                                <td style="text-align: center;">${question.pattern}</td>
                                <td style="text-align: center;">${question.mappingCO}</td>
                                <td style="text-align: center;">${question.marks}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        ` : ''}

        <div>
            <div style="font-weight: bold; margin-bottom: 0.5rem; font-size: 0.9rem;">Assessment Pattern as per Bloom's Taxonomy:</div>
            <table class="paper-table">
                <thead>
                    <tr style="background: #f5f5f5;">
                        <th>COs</th>
                        <th>Remember</th>
                        <th>Understand</th>
                        <th>Apply</th>
                        <th>Analyze</th>
                        <th>Evaluate</th>
                        <th>Create</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${courseOutcomes.map(co => {
                        const coQuestions = [...questions.partA, ...questions.partB].filter(q => q.mappingCO === co.code);
                        const bloomCounts = {
                            remember: coQuestions.filter(q => q.bloomLevel === 'Remember').reduce((sum, q) => sum + q.marks, 0),
                            understand: coQuestions.filter(q => q.bloomLevel === 'Understand').reduce((sum, q) => sum + q.marks, 0),
                            apply: coQuestions.filter(q => q.bloomLevel === 'Apply').reduce((sum, q) => sum + q.marks, 0),
                            analyze: coQuestions.filter(q => q.bloomLevel === 'Analyze').reduce((sum, q) => sum + q.marks, 0),
                            evaluate: coQuestions.filter(q => q.bloomLevel === 'Evaluate').reduce((sum, q) => sum + q.marks, 0),
                            create: coQuestions.filter(q => q.bloomLevel === 'Create').reduce((sum, q) => sum + q.marks, 0),
                        };
                        const total = Object.values(bloomCounts).reduce((sum, value) => sum + value, 0);

                        return `
                            <tr>
                                <td style="text-align: center; font-weight: bold;">${co.code}</td>
                                <td style="text-align: center;">${bloomCounts.remember}</td>
                                <td style="text-align: center;">${bloomCounts.understand}</td>
                                <td style="text-align: center;">${bloomCounts.apply}</td>
                                <td style="text-align: center;">${bloomCounts.analyze}</td>
                                <td style="text-align: center;">${bloomCounts.evaluate}</td>
                                <td style="text-align: center;">${bloomCounts.create}</td>
                                <td style="text-align: center; font-weight: bold;">${total}</td>
                            </tr>
                        `;
                    }).join('')}
                    <tr style="background: #f5f5f5; font-weight: bold;">
                        <td style="text-align: center;">Total</td>
                        <td style="text-align: center;">${calculateCurrentMarks('Remember')}</td>
                        <td style="text-align: center;">${calculateCurrentMarks('Understand')}</td>
                        <td style="text-align: center;">${calculateCurrentMarks('Apply')}</td>
                        <td style="text-align: center;">${calculateCurrentMarks('Analyze')}</td>
                        <td style="text-align: center;">${calculateCurrentMarks('Evaluate')}</td>
                        <td style="text-align: center;">${calculateCurrentMarks('Create')}</td>
                        <td style="text-align: center;">${[...questions.partA, ...questions.partB].reduce((sum, q) => sum + q.marks, 0)}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;
    
    preview.innerHTML = previewHTML;
    showNotification('Preview generated successfully!', 'success');
}

function downloadPDF() {
    // Generate preview first
    generatePreview();
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    const previewContent = document.getElementById('paper-preview').innerHTML;
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Question Paper</title>
            <style>
                body {
                    font-family: 'Times New Roman', serif;
                    line-height: 1.4;
                    margin: 20px;
                    color: #000;
                }
                .paper-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 1rem 0;
                }
                .paper-table th,
                .paper-table td {
                    border: 1px solid #000;
                    padding: 8px;
                    text-align: left;
                }
                .paper-table th {
                    background: #f5f5f5;
                    font-weight: bold;
                }
                .paper-header {
                    border: 2px solid #000;
                    padding: 1rem;
                    margin-bottom: 1.5rem;
                }
                .university-name {
                    font-size: 1.5rem;
                    font-weight: bold;
                    text-transform: uppercase;
                    margin-bottom: 0.5rem;
                }
                @media print {
                    body { margin: 0; }
                    .paper-header { border: 2px solid #000; }
                }
            </style>
        </head>
        <body>
            ${previewContent}
        </body>
        </html>
    `);
    
    printWindow.document.close();
    
    // Wait for content to load, then print
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 500);
    
    showNotification('PDF download initiated!', 'success');
}

function getCourseDetails() {
    return {
        universityName: document.getElementById('university-name').value,
        courseCode: document.getElementById('course-code').value,
        courseName: document.getElementById('course-name').value,
        degree: document.getElementById('degree').value,
        year: document.getElementById('year').value,
        semester: document.getElementById('semester').value,
        duration: document.getElementById('duration').value,
        maxMarks: document.getElementById('max-marks').value,
        date: document.getElementById('exam-date').value,
        session: document.getElementById('session').value,
        setNumber: document.getElementById('set-number').value,
        examType: document.getElementById('exam-type').value
    };
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { 
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).replace(/\//g, '.');
}

function generateQuestionId() {
    return Math.random().toString().slice(2, 11);
}

// AI Assistant Functions
function updateQuickActions() {
    const courseName = document.getElementById('course-name').value.toLowerCase();
    const actionsGrid = document.getElementById('quick-actions-grid');
    
    let actions = [
        { icon: 'fas fa-calculator', text: 'Generate Math Questions', prompt: 'Generate 5 mathematics questions covering various topics suitable for the current course level.' },
        { icon: 'fas fa-chart-bar', text: 'Optimize Bloom\'s Taxonomy', prompt: 'Analyze my current question paper and suggest how to better distribute questions across Bloom\'s taxonomy levels.' },
        { icon: 'fas fa-target', text: 'Create Course Outcomes', prompt: 'Help me create appropriate course outcomes (COs) for the current course.' },
        { icon: 'fas fa-brain', text: 'Improve Questions', prompt: 'Review my questions and suggest improvements for clarity, difficulty, and assessment value.' },
        { icon: 'fas fa-lightbulb', text: 'Study Tips', prompt: 'Give me effective study strategies and learning techniques for students.' },
        { icon: 'fas fa-graduation-cap', text: 'Career Guidance', prompt: 'Provide career guidance and academic pathway suggestions for students.' }
    ];
    
    actionsGrid.innerHTML = actions.map(action => `
        <div class="action-item" onclick="useQuickAction('${action.prompt}')">
            <i class="${action.icon}"></i>
            <span>${action.text}</span>
        </div>
    `).join('');
}

function useQuickAction(prompt) {
    document.getElementById('chat-input').value = prompt;
    sendMessage();
}

function sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Add user message
    addMessage('user', message);
    
    // Show typing indicator
    addTypingIndicator();
    
    // Generate AI response
    setTimeout(() => {
        removeTypingIndicator();
        const response = generateAIResponse(message);
        addMessage('assistant', response);
    }, 1500);
    
    input.value = '';
}

function addMessage(role, content) {
    const messagesContainer = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}-message`;
    messageDiv.innerHTML = `
        <div class="message-avatar">
            <i class="fas fa-${role === 'user' ? 'user' : 'robot'}"></i>
        </div>
        <div class="message-content">
            ${formatMessageContent(content)}
        </div>
    `;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function addTypingIndicator() {
    const messagesContainer = document.getElementById('chat-messages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message assistant-message typing-indicator';
    typingDiv.innerHTML = `
        <div class="message-avatar">
            <i class="fas fa-robot"></i>
        </div>
        <div class="message-content">
            <p>AI is typing...</p>
        </div>
    `;
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function removeTypingIndicator() {
    const typingIndicator = document.querySelector('.typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

function formatMessageContent(content) {
    // Convert markdown-like formatting to HTML
    return content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>')
        .replace(/^(.*)$/, '<p>$1</p>');
}

function generateAIResponse(userMessage) {
    const lowercaseMessage = userMessage.toLowerCase();
    
    // Comprehensive AI responses like ChatGPT
    if (lowercaseMessage.includes('matrix') || lowercaseMessage.includes('matrices')) {
        return `**Matrix Operations and Applications**

Matrices are fundamental mathematical structures with wide applications in engineering, computer science, and physics. Here's a comprehensive overview:

**Basic Operations:**
• **Addition/Subtraction**: Element-wise operations for matrices of same dimensions
• **Multiplication**: Row-column multiplication following specific rules
• **Transpose**: Flipping matrix along its diagonal
• **Determinant**: Scalar value representing matrix properties

**Key Concepts:**
• **Rank**: Maximum number of linearly independent rows/columns
• **Inverse**: Matrix A⁻¹ such that A × A⁻¹ = I (identity matrix)
• **Eigenvalues/Eigenvectors**: Special scalars and vectors satisfying Av = λv

**Applications:**
• **Computer Graphics**: 3D transformations and rotations
• **Machine Learning**: Data representation and neural networks
• **Engineering**: System of equations and control systems
• **Economics**: Input-output models and optimization

**Study Tips:**
1. Practice basic operations until they become automatic
2. Understand geometric interpretations of matrix operations
3. Learn systematic approaches for finding determinants and inverses
4. Connect matrix concepts to real-world applications

Would you like me to elaborate on any specific matrix topic or provide practice problems?`;
    }
    
    if (lowercaseMessage.includes('study') || lowercaseMessage.includes('learning') || lowercaseMessage.includes('tips')) {
        return `**Effective Study Strategies for Academic Success**

**Active Learning Techniques:**
• **Spaced Repetition**: Review material at increasing intervals
• **Feynman Technique**: Explain concepts in simple terms
• **Practice Testing**: Regular self-assessment and quizzes
• **Interleaving**: Mix different topics in study sessions

**Time Management:**
• **Pomodoro Technique**: 25-minute focused study blocks
• **Time Blocking**: Dedicate specific hours to subjects
• **Priority Matrix**: Focus on important and urgent tasks
• **Break Scheduling**: Regular breaks to maintain concentration

**Note-Taking Methods:**
• **Cornell Notes**: Structured format with cues and summary
• **Mind Mapping**: Visual representation of concepts
• **Outline Method**: Hierarchical organization of information
• **Charting**: Tables for comparing information

**Memory Enhancement:**
• **Mnemonics**: Memory aids and acronyms
• **Visualization**: Create mental images of concepts
• **Association**: Link new information to known concepts
• **Repetition**: Multiple exposures to material

**Environment Optimization:**
• **Distraction-Free Zone**: Minimize interruptions
• **Proper Lighting**: Adequate illumination for reading
• **Comfortable Seating**: Ergonomic study setup
• **Resource Organization**: Keep materials easily accessible

**Subject-Specific Tips:**
• **Mathematics**: Practice problems daily, understand concepts before memorizing
• **Science**: Connect theory to practical applications
• **Languages**: Immerse yourself in the language daily
• **History**: Create timelines and cause-effect relationships

Remember: Consistency beats intensity. Regular, focused study sessions are more effective than cramming!`;
    }
    
    if (lowercaseMessage.includes('career') || lowercaseMessage.includes('guidance') || lowercaseMessage.includes('job')) {
        return `**Career Guidance and Academic Pathways**

**Engineering Career Paths:**
• **Software Engineering**: Programming, web development, mobile apps
• **Data Science**: Analytics, machine learning, AI development
• **Mechanical Engineering**: Design, manufacturing, automotive
• **Electrical Engineering**: Electronics, power systems, telecommunications
• **Civil Engineering**: Construction, infrastructure, urban planning

**Emerging Fields:**
• **Artificial Intelligence**: Machine learning, robotics, automation
• **Cybersecurity**: Information security, ethical hacking
• **Renewable Energy**: Solar, wind, sustainable technologies
• **Biotechnology**: Medical devices, pharmaceuticals, genetics
• **Space Technology**: Aerospace, satellite systems

**Skill Development:**
• **Technical Skills**: Programming languages, software tools
• **Soft Skills**: Communication, teamwork, leadership
• **Problem-Solving**: Analytical thinking, creativity
• **Continuous Learning**: Stay updated with industry trends

**Academic Preparation:**
• **Strong Foundation**: Master fundamental concepts
• **Practical Experience**: Internships, projects, labs
• **Research Opportunities**: Undergraduate research programs
• **Networking**: Professional associations, conferences

**Industry Insights:**
• **Technology Sector**: High growth, innovation-driven
• **Healthcare**: Stable demand, meaningful impact
• **Finance**: Analytical skills, quantitative methods
• **Consulting**: Problem-solving, client interaction
• **Entrepreneurship**: Innovation, risk-taking, leadership

**Next Steps:**
1. Identify your interests and strengths
2. Research specific career requirements
3. Develop relevant skills through courses and projects
4. Seek mentorship from professionals
5. Build a portfolio showcasing your abilities

What specific career area interests you most? I can provide more detailed guidance!`;
    }
    
    if (lowercaseMessage.includes('bloom') || lowercaseMessage.includes('taxonomy')) {
        return `**Bloom's Taxonomy in Educational Assessment**

**Understanding the Hierarchy:**
Bloom's Taxonomy provides a framework for categorizing learning objectives and assessment questions across six cognitive levels:

**1. Remember (Knowledge)**
• **Definition**: Recall facts, terms, basic concepts
• **Keywords**: Define, list, identify, name, state
• **Example**: "Define the term 'matrix determinant'"
• **Assessment**: Multiple choice, fill-in-the-blank

**2. Understand (Comprehension)**
• **Definition**: Explain ideas or concepts
• **Keywords**: Explain, describe, summarize, interpret
• **Example**: "Explain the significance of eigenvalues in matrix analysis"
• **Assessment**: Short answer, explanation questions

**3. Apply (Application)**
• **Definition**: Use information in new situations
• **Keywords**: Apply, solve, demonstrate, calculate
• **Example**: "Calculate the inverse of a 3×3 matrix"
• **Assessment**: Problem-solving, calculations

**4. Analyze (Analysis)**
• **Definition**: Draw connections among ideas
• **Keywords**: Analyze, compare, contrast, examine
• **Example**: "Compare different methods for solving linear systems"
• **Assessment**: Case studies, comparative analysis

**5. Evaluate (Evaluation)**
• **Definition**: Justify decisions or courses of action
• **Keywords**: Evaluate, critique, judge, assess
• **Example**: "Evaluate the efficiency of different matrix algorithms"
• **Assessment**: Critical essays, peer reviews

**6. Create (Synthesis)**
• **Definition**: Produce new or original work
• **Keywords**: Create, design, formulate, develop
• **Example**: "Design an algorithm for matrix multiplication optimization"
• **Assessment**: Projects, research papers, designs

**Optimal Distribution for Engineering:**
• **Lower Order (Remember + Understand)**: 25-30%
• **Middle Order (Apply + Analyze)**: 50-60%
• **Higher Order (Evaluate + Create)**: 15-20%

This distribution ensures students master fundamentals while developing critical thinking and innovation skills essential for engineering practice.`;
    }
    
    // Default comprehensive response
    return `**Comprehensive Educational Assistance**

Thank you for your question about "${userMessage}". I'm here to provide detailed, helpful information on a wide range of topics!

**My Expertise Areas:**

**📚 Academic Subjects:**
• **Mathematics**: Calculus, Linear Algebra, Statistics, Discrete Math
• **Physics**: Mechanics, Thermodynamics, Electromagnetism, Quantum Physics
• **Chemistry**: Organic, Inorganic, Physical, Analytical Chemistry
• **Engineering**: All major disciplines and applications

**🎯 Educational Support:**
• **Study Strategies**: Effective learning techniques and time management
• **Exam Preparation**: Test-taking strategies and review methods
• **Research Skills**: Information gathering and analysis
• **Academic Writing**: Essays, reports, and technical documentation

**💼 Career Guidance:**
• **Industry Insights**: Current trends and future opportunities
• **Skill Development**: Technical and soft skills for success
• **Professional Growth**: Networking, leadership, entrepreneurship
• **Academic Pathways**: Course selection and specialization advice

**🧠 Problem-Solving:**
• **Analytical Thinking**: Breaking down complex problems
• **Creative Solutions**: Innovative approaches to challenges
• **Critical Evaluation**: Assessing information and arguments
• **Decision Making**: Weighing options and consequences

**How I Can Help You:**
1. **Detailed Explanations**: Complex concepts made simple
2. **Step-by-Step Solutions**: Guided problem-solving approaches
3. **Practical Applications**: Real-world relevance of academic topics
4. **Personalized Advice**: Tailored to your specific needs and goals

**Ask Me About:**
• Specific academic topics or problems
• Study techniques and learning strategies
• Career planning and professional development
• Research methods and academic writing
• Technology and innovation trends
• Personal development and goal setting

Feel free to ask more specific questions, and I'll provide comprehensive, detailed responses tailored to your needs. What would you like to explore further?`;
}

// Settings Functions
function openSettings() {
    document.getElementById('settings-modal').classList.remove('hidden');
    document.querySelector('.user-dropdown').classList.remove('active');
}

function closeSettings() {
    document.getElementById('settings-modal').classList.add('hidden');
}

function saveSettings() {
    const settings = {
        defaultUniversity: document.getElementById('default-university').value,
        defaultDuration: document.getElementById('default-duration').value,
        defaultMarks: document.getElementById('default-marks').value,
        maxFiles: document.getElementById('max-files').value
    };
    
    localStorage.setItem('edupaperSettings', JSON.stringify(settings));
    showNotification('Settings saved successfully!', 'success');
    closeSettings();
}

// Utility Functions
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    
    // Set background color based on type
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
    };
    notification.style.backgroundColor = colors[type] || colors.info;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Load settings on page load
document.addEventListener('DOMContentLoaded', function() {
    const savedSettings = localStorage.getItem('edupaperSettings');
    if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        
        if (settings.defaultUniversity) {
            document.getElementById('default-university').value = settings.defaultUniversity;
            document.getElementById('university-name').value = settings.defaultUniversity;
        }
        if (settings.defaultDuration) {
            document.getElementById('default-duration').value = settings.defaultDuration;
            document.getElementById('duration').value = settings.defaultDuration;
        }
        if (settings.defaultMarks) {
            document.getElementById('default-marks').value = settings.defaultMarks;
            document.getElementById('max-marks').value = settings.defaultMarks;
        }
        if (settings.maxFiles) {
            document.getElementById('max-files').value = settings.maxFiles;
        }
    }
});