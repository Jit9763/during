let taskData = [];
const isAdminPage = window.location.pathname.includes('admin.html');

// 1. Load Data
async function loadData() {
    try {
        // Load from LocalStorage if exists, otherwise from XML
        const localData = localStorage.getItem('census_tasks');
        if (localData) {
            taskData = JSON.parse(localData);
            renderPage();
        } else {
            const response = await fetch('data.xml');
            const text = await response.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(text, "text/xml");
            
            const categories = xmlDoc.getElementsByTagName('category');
            for (let cat of categories) {
                let categoryName = cat.getAttribute('name');
                let tasks = cat.getElementsByTagName('task');
                let catTasks = [];
                for (let t of tasks) {
                    let taskObj = {
                        id: t.getAttribute('id'),
                        name: t.getAttribute('name'),
                        status: t.getAttribute('status') || 'lambit',
                        type: t.getAttribute('type') || 'simple'
                    };
                    if (taskObj.type === 'counter') {
                        taskObj.total = parseInt(t.getAttribute('total')) || 242;
                        taskObj.completed = parseInt(t.getAttribute('completed')) || 0;
                    }
                    if (taskObj.type === 'info') {
                        taskObj.content = t.getAttribute('content') || '';
                    }
                    if (taskObj.type === 'map-stats') {
                        taskObj.total = parseInt(t.getAttribute('total')) || 97;
                        taskObj.checked = parseInt(t.getAttribute('checked')) || 0;
                        taskObj.correct = parseInt(t.getAttribute('correct')) || 0;
                        taskObj.incorrect = parseInt(t.getAttribute('incorrect')) || 0;
                        taskObj.deadline = t.getAttribute('deadline') || '';
                    }
                    catTasks.push(taskObj);
                }
                taskData.push({ category: categoryName, tasks: catTasks });
            }
            renderPage();
        }
    } catch (error) {
        console.error("Error loading XML:", error);
    }
}

// 2. Render Page
function renderPage() {
    const container = isAdminPage ? document.getElementById('admin-container') : document.getElementById('public-container');
    if (!container) return;
    
    container.innerHTML = '';
    let totalPurn = 0;
    let totalTasks = 0;

    taskData.forEach((cat, catIdx) => {
        const section = document.createElement('div');
        section.className = 'category-section';
        
        let taskHtml = `<h2 class="category-title">${cat.category}</h2><div class="task-grid">`;
        
        cat.tasks.forEach((task, taskIdx) => {
            let taskWeight = 1;
            let taskPurnCount = 0;

            if (task.type === 'counter') {
                taskWeight = 1; // Treat one tracker as one unit of weight for overall progress
                taskPurnCount = task.completed / task.total;
                totalTasks += taskWeight;
                totalPurn += taskPurnCount;

                const percent = Math.round((task.completed / task.total) * 100);
                
                if (isAdminPage) {
                    taskHtml += `
                        <div class="task-card">
                            <span class="task-name">${task.name}</span>
                            <div class="counter-info">
                                <span>प्रगति: ${task.completed} / ${task.total}</span>
                                <span>${percent}%</span>
                            </div>
                            <div class="mini-progress-track">
                                <div class="mini-bar" style="width: ${percent}%"></div>
                            </div>
                            <div class="counter-input-group">
                                <label style="font-size:12px;">पूर्ण ब्लॉक्स:</label>
                                <input type="number" class="counter-input" value="${task.completed}" min="0" max="${task.total}" onchange="updateCounterStatus('${task.id}', this.value)">
                            </div>
                        </div>
                    `;
                } else {
                    taskHtml += `
                        <div class="task-card">
                            <span class="task-name">${task.name}</span>
                            <div class="counter-info">
                                <span>प्रगति: ${task.completed} / ${task.total}</span>
                                <span>${percent}%</span>
                            </div>
                            <div class="mini-progress-track">
                                <div class="mini-bar" style="width: ${percent}%"></div>
                            </div>
                        </div>
                    `;
                }
            } else if (task.type === 'info') {
                const parts = task.content.split('|');
                let pillsHtml = '<div class="info-btn-group">';
                parts.forEach(p => {
                    pillsHtml += `<span class="info-pill">${p.trim()}</span>`;
                });
                pillsHtml += '</div>';

                taskHtml += `
                    <div class="task-card" style="background: #e3f2fd; border: 1.5px solid var(--secondary);">
                        <span class="task-name" style="color: var(--primary); margin-bottom:5px;"><i class="fas fa-info-circle"></i> ${task.name}</span>
                        ${pillsHtml}
                    </div>
                `;
            } else if (task.type === 'map-stats') {
                const checkedPercent = Math.round((task.checked / task.total) * 100);
                totalTasks += 1;
                totalPurn += (task.checked / task.total);

                let deadlineHtml = task.deadline ? `<div class="deadline-tag"><i class="fas fa-calendar-alt"></i> समय सीमा: ${task.deadline}</div>` : '';

                if (isAdminPage) {
                    taskHtml += `
                        <div class="task-card">
                            <span class="task-name">${task.name}</span>
                            <div class="counter-info">
                                <span>जांच की गई: ${task.checked} / ${task.total}</span>
                                <span>${checkedPercent}%</span>
                            </div>
                            <div class="mini-progress-track">
                                <div class="mini-bar" style="width: ${checkedPercent}%"></div>
                            </div>
                            <div class="stat-badges">
                                <span class="stat-pill shi">सही: ${task.correct}</span>
                                <span class="stat-pill galat">गलत: ${task.incorrect}</span>
                            </div>
                            <div style="margin-top:15px; display:grid; grid-template-columns: 1fr 1fr; gap:5px;">
                                <div class="counter-input-group"><label style="font-size:10px;">जांच:</label><input type="number" class="counter-input" value="${task.checked}" onchange="updateMapField('${task.id}', 'checked', this.value)"></div>
                                <div class="counter-input-group"><label style="font-size:10px;">सही:</label><input type="number" class="counter-input" value="${task.correct}" onchange="updateMapField('${task.id}', 'correct', this.value)"></div>
                                <div class="counter-input-group"><label style="font-size:10px;">गलत:</label><input type="number" class="counter-input" value="${task.incorrect}" onchange="updateMapField('${task.id}', 'incorrect', this.value)"></div>
                                <div class="counter-input-group"><label style="font-size:10px;">तारीख:</label><input type="date" class="counter-input" style="width:110px;" value="${task.deadline}" onchange="updateMapField('${task.id}', 'deadline', this.value)"></div>
                            </div>
                            <div class="radio-group" style="margin-top:10px;">
                                <div class="radio-option">
                                    <input type="radio" id="purn-${task.id}" name="status-${task.id}" value="purn" ${task.status === 'purn' ? 'checked' : ''} onchange="updateTaskStatus('${task.id}', 'purn')">
                                    <label for="purn-${task.id}">पूर्ण</label>
                                </div>
                                <div class="radio-option">
                                    <input type="radio" id="apurn-${task.id}" name="status-${task.id}" value="apurn" ${task.status === 'apurn' ? 'checked' : ''} onchange="updateTaskStatus('${task.id}', 'apurn')">
                                    <label for="apurn-${task.id}">अपूर्ण</label>
                                </div>
                            </div>
                        </div>
                    `;
                } else {
                    taskHtml += `
                        <div class="task-card">
                            <span class="task-name">${task.name}</span>
                            <div class="counter-info">
                                <span>जांच की गई: ${task.checked} / ${task.total}</span>
                                <span>${checkedPercent}%</span>
                            </div>
                            <div class="mini-progress-track">
                                <div class="mini-bar" style="width: ${checkedPercent}%"></div>
                            </div>
                            <div class="stat-badges">
                                <span class="stat-pill shi">सही: ${task.correct}</span>
                                <span class="stat-pill galat">गलत: ${task.incorrect}</span>
                            </div>
                            ${deadlineHtml}
                            <div style="margin-top:10px;">
                                <span class="status-tag status-${task.status}">${getStatusLabel(task.status)}</span>
                            </div>
                        </div>
                    `;
                }
            } else {
                totalTasks += taskWeight;
                if (task.status === 'purn') totalPurn += 1;
                
                if (isAdminPage) {
                    taskHtml += `
                        <div class="task-card">
                            <span class="task-name">${task.name}</span>
                            <div class="radio-group">
                                <div class="radio-option">
                                    <input type="radio" id="purn-${task.id}" name="status-${task.id}" value="purn" ${task.status === 'purn' ? 'checked' : ''} onchange="updateTaskStatus('${task.id}', 'purn')">
                                    <label for="purn-${task.id}">पूर्ण</label>
                                </div>
                                <div class="radio-option">
                                    <input type="radio" id="apurn-${task.id}" name="status-${task.id}" value="apurn" ${task.status === 'apurn' ? 'checked' : ''} onchange="updateTaskStatus('${task.id}', 'apurn')">
                                    <label for="apurn-${task.id}">अपूर्ण</label>
                                </div>
                                <div class="radio-option">
                                    <input type="radio" id="lambit-${task.id}" name="status-${task.id}" value="lambit" ${task.status === 'lambit' ? 'checked' : ''} onchange="updateTaskStatus('${task.id}', 'lambit')">
                                    <label for="lambit-${task.id}">लंबित</label>
                                </div>
                            </div>
                        </div>
                    `;
                } else {
                    taskHtml += `
                        <div class="task-card">
                            <span class="task-name">${task.name}</span>
                            <span class="status-tag status-${task.status}">${getStatusLabel(task.status)}</span>
                        </div>
                    `;
                }
            }
        });

        taskHtml += `</div>`;
        section.innerHTML = taskHtml;
        container.appendChild(section);
    });

    // Update Progress Bar
    const percent = Math.round((totalPurn / totalTasks) * 100);
    document.getElementById('overall-bar').style.width = percent + '%';
    document.getElementById('progress-val').innerText = percent + '%';
}

function getStatusLabel(status) {
    if (status === 'purn') return 'पूर्ण (Completed)';
    if (status === 'apurn') return 'अपूर्ण (Incomplete)';
    return 'लंबित (Pending)';
}

// 3. Update Status (Admin Only)
function updateTaskStatus(id, newStatus) {
    taskData.forEach(cat => {
        cat.tasks.forEach(task => {
            if (task.id === id) {
                task.status = newStatus;
            }
        });
    });
    calculateOverallProgress();
}

function updateCounterStatus(id, newValue) {
    taskData.forEach(cat => {
        cat.tasks.forEach(task => {
            if (task.id === id) {
                task.completed = parseInt(newValue) || 0;
                if (task.completed > task.total) task.completed = task.total;
            }
        });
    });
    calculateOverallProgress();
}

function updateMapField(id, field, value) {
    taskData.forEach(cat => {
        cat.tasks.forEach(task => {
            if (task.id === id) {
                if (field === 'deadline') {
                    task.deadline = value;
                } else {
                    task[field] = parseInt(value) || 0;
                    if (task[field] > task.total) task[field] = task.total;
                }
            }
        });
    });
    calculateOverallProgress();
}

function calculateOverallProgress() {
    let totalPurn = 0;
    let totalTasks = 0;
    taskData.forEach(cat => {
        cat.tasks.forEach(t => {
            if (t.type === 'counter') {
                totalTasks += 1;
                totalPurn += (t.completed / t.total);
            } else if (t.type === 'map-stats') {
                totalTasks += 1;
                totalPurn += (t.checked / t.total);
            } else if (t.type === 'info') {
                // skip
            } else {
                totalTasks += 1;
                if (t.status === 'purn') totalPurn += 1;
            }
        });
    });
    const percent = Math.round((totalPurn / totalTasks) * 100);
    const bar = document.getElementById('overall-bar');
    const val = document.getElementById('progress-val');
    if (bar) bar.style.width = percent + '%';
    if (val) val.innerText = percent + '%';
}

// 4. Save Changes
function saveChanges() {
    localStorage.setItem('census_tasks', JSON.stringify(taskData));
    alert("बदलाव सुरक्षित कर लिए गए हैं।");
}

// 5. Export XML
function exportData() {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<census_plan>\n`;
    taskData.forEach(cat => {
        xml += `    <category name="${cat.category}">\n`;
        cat.tasks.forEach(task => {
            if (task.type === 'counter') {
                xml += `        <task id="${task.id}" name="${task.name}" type="counter" total="${task.total}" completed="${task.completed}" />\n`;
            } else if (task.type === 'info') {
                xml += `        <task id="${task.id}" name="${task.name}" type="info" content="${task.content}" />\n`;
            } else if (task.type === 'map-stats') {
                xml += `        <task id="${task.id}" name="${task.name}" type="map-stats" total="${task.total}" checked="${task.checked}" correct="${task.correct}" incorrect="${task.incorrect}" deadline="${task.deadline}" status="${task.status}" />\n`;
            } else {
                xml += `        <task id="${task.id}" name="${task.name}" status="${task.status}" />\n`;
            }
        });
        xml += `    </category>\n`;
    });
    xml += `</census_plan>`;
    
    document.getElementById('xml-output').value = xml;
    document.getElementById('export-modal').style.display = 'flex';
}

// Start sequence
loadData();
