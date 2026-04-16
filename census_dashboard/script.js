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
                    catTasks.push({
                        id: t.getAttribute('id'),
                        name: t.getAttribute('name'),
                        status: t.getAttribute('status')
                    });
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
            totalTasks++;
            if (task.status === 'purn') totalPurn++;

            if (isAdminPage) {
                // Admin Radio Buttons
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
                // Public Labels
                taskHtml += `
                    <div class="task-card">
                        <span class="task-name">${task.name}</span>
                        <span class="status-tag status-${task.status}">${getStatusLabel(task.status)}</span>
                    </div>
                `;
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
    // Optional: Recalculate bar immediately in admin
    let totalPurn = 0;
    let totalTasks = 0;
    taskData.forEach(cat => {
        cat.tasks.forEach(t => {
            totalTasks++;
            if (t.status === 'purn') totalPurn++;
        });
    });
    const percent = Math.round((totalPurn / totalTasks) * 100);
    document.getElementById('overall-bar').style.width = percent + '%';
    document.getElementById('progress-val').innerText = percent + '%';
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
            xml += `        <task id="${task.id}" name="${task.name}" status="${task.status}" />\n`;
        });
        xml += `    </category>\n`;
    });
    xml += `</census_plan>`;
    
    document.getElementById('xml-output').value = xml;
    document.getElementById('export-modal').style.display = 'flex';
}

// Start sequence
loadData();
