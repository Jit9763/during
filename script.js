let taskData = [];
const isAdminPage = window.location.pathname.includes('admin.html');

// 1. Load Data
async function loadData(forceXML = false) {
    try {
        const localData = localStorage.getItem('census_tasks');
        if (localData && !forceXML) {
            taskData = JSON.parse(localData);
            renderPage();
        } else {
            const response = await fetch('data.xml?v=' + new Date().getTime());
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
                    if (taskObj.type === 'cell-info') {
                        taskObj.staffCount = parseInt(t.getAttribute('staffCount')) || 0;
                        taskObj.computers = parseInt(t.getAttribute('computers')) || 0;
                        taskObj.printers = parseInt(t.getAttribute('printers')) || 0;
                        try {
                            taskObj.staffList = JSON.parse(t.getAttribute('staffList') || '[]');
                        } catch (e) {
                            taskObj.staffList = [];
                        }
                    }
                    if (taskObj.type === 'user-group') {
                        taskObj.totalCount = parseInt(t.getAttribute('totalCount')) || 0;
                        taskObj.reserveCount = parseInt(t.getAttribute('reserveCount')) || 0;
                        taskObj.niyukti = t.getAttribute('niyukti') || 'lambit';
                        taskObj.circleAlloc = t.getAttribute('circleAlloc') || 'lambit';
                        taskObj.pragnakAlloc = t.getAttribute('pragnakAlloc') || 'lambit';
                        taskObj.hlbAlloc = t.getAttribute('hlbAlloc') || 'lambit';
                        taskObj.idCard = t.getAttribute('idCard') || 'lambit';
                        taskObj.mapDistrib = t.getAttribute('mapDistrib') || 'lambit';
                        taskObj.reserveId = t.getAttribute('reserveId') || 'lambit';
                        taskObj.uploadedCount = parseInt(t.getAttribute('uploadedCount')) || 0;
                        taskObj.reserveUploadedCount = parseInt(t.getAttribute('reserveUploadedCount')) || 0;
                        taskObj.portalDeadline = t.getAttribute('portalDeadline') || '';
                        taskObj.alloc = t.getAttribute('alloc') || 'lambit'; // for enumerators
                    }
                    if (taskObj.type === 'training-summary') {
                        taskObj.totalBatches = parseInt(t.getAttribute('totalBatches')) || 7;
                        taskObj.completedBatches = parseInt(t.getAttribute('completedBatches')) || 0;
                        taskObj.totalAttended = parseInt(t.getAttribute('totalAttended')) || 0;
                        try {
                            taskObj.batchList = JSON.parse(t.getAttribute('batchList') || '[]');
                        } catch (e) {
                            taskObj.batchList = [];
                        }
                    }
                    if (taskObj.type === 'logistics-checklist') {
                        taskObj.internet = t.getAttribute('internet') || 'lambit';
                        taskObj.sound = t.getAttribute('sound') || 'lambit';
                        taskObj.food = t.getAttribute('food') || 'lambit';
                        taskObj.water = t.getAttribute('water') || 'lambit';
                    }
                    if (taskObj.type === 'training-logistics') {
                        taskObj.centerSelection = t.getAttribute('centerSelection') || 'lambit';
                        taskObj.permissionLetter = t.getAttribute('permissionLetter') || 'lambit';
                    }
                    if (taskObj.type === 'training-centers') {
                        taskObj.c1 = t.getAttribute('c1') || 'Center 1';
                        taskObj.c2 = t.getAttribute('c2') || 'Center 2';
                        taskObj.c3 = t.getAttribute('c3') || 'Center 3';
                        taskObj.c4 = t.getAttribute('c4') || 'Center 4';
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
            } else if (task.type === 'user-group') {
                const subTasks = [
                    { label: 'नियुक्ति', key: 'niyukti' },
                    { label: 'HLB आवंटन', key: 'hlbAlloc' },
                    { label: 'ID वितरण', key: 'idCard' },
                    { label: 'मैप वितरण', key: 'mapDistrib' },
                    { label: 'Reserve ID', key: 'reserveId' }
                ];

                if (task.id === 'sup1') {
                    subTasks.splice(1, 0, { label: 'सर्किल आवंटन', key: 'circleAlloc' });
                    subTasks.splice(2, 0, { label: 'प्रगणक आवंटन', key: 'pragnakAlloc' });
                } else {
                    subTasks.splice(1, 0, { label: 'आवंटन', key: 'alloc' });
                }

                // Calculate group progress
                totalTasks += subTasks.length;
                subTasks.forEach(st => {
                    if (task[st.key] === 'purn') totalPurn += 1;
                });

                const portalPercent = Math.round((task.uploadedCount / task.totalCount) * 100) || 0;
                const reservePortalPercent = Math.round((task.reserveUploadedCount / task.reserveCount) * 100) || 0;
                let portalDeadlineHtml = task.portalDeadline ? `<div class="deadline-tag" style="margin-top:5px; background:#fff7ed; border-color:#fb923c; color:#ea580c;"><i class="fas fa-upload"></i> पोर्टल अपलोड तिथि: ${task.portalDeadline}</div>` : '';

                if (isAdminPage) {
                    let adminInputs = subTasks.map(st => `
                        <div class="admin-sub-status">
                            <label>${st.label}</label>
                            <select onchange="updateUserGroupStatus('${task.id}', '${st.key}', this.value)">
                                <option value="lambit" ${task[st.key] === 'lambit' ? 'selected' : ''}>लंबित (Pending)</option>
                                <option value="apurn" ${task[st.key] === 'apurn' ? 'selected' : ''}>अपूर्ण (Partial)</option>
                                <option value="purn" ${task[st.key] === 'purn' ? 'selected' : ''}>पूर्ण (Done)</option>
                            </select>
                        </div>
                    `).join('');

                    taskHtml += `
                        <div class="task-card" style="grid-column: 1 / -1;">
                             <span class="task-name">${task.name}</span>
                            <div style="margin-bottom:15px; display:grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap:10px;">
                                <div class="counter-input-group">
                                    <label style="font-size:11px;">कुल संख्या:</label>
                                    <input type="number" class="counter-input" value="${task.totalCount}" onchange="updateUserGroupField('${task.id}', 'totalCount', this.value)">
                                </div>
                                <div class="counter-input-group">
                                    <label style="font-size:11px;">Reserve:</label>
                                    <input type="number" class="counter-input" value="${task.reserveCount}" onchange="updateUserGroupField('${task.id}', 'reserveCount', this.value)">
                                </div>
                                <div class="counter-input-group">
                                    <label style="font-size:11px;">पोर्टल अपलोड (Main):</label>
                                    <input type="number" class="counter-input" value="${task.uploadedCount}" onchange="updateUserGroupField('${task.id}', 'uploadedCount', this.value)">
                                </div>
                                <div class="counter-input-group">
                                    <label style="font-size:11px;">पोर्टल अपलोड (Reserve):</label>
                                    <input type="number" class="counter-input" value="${task.reserveUploadedCount}" onchange="updateUserGroupField('${task.id}', 'reserveUploadedCount', this.value)">
                                </div>
                                <div class="counter-input-group">
                                    <label style="font-size:11px;">अपलोड तिथि:</label>
                                    <input type="date" class="counter-input" value="${task.portalDeadline}" onchange="updateUserGroupField('${task.id}', 'portalDeadline', this.value)">
                                </div>
                            </div>
                            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px;">
                                ${adminInputs}
                            </div>
                        </div>
                    `;
                } else {
                    let statusGridHtml = subTasks.map(st => `
                        <div class="sub-status-item">
                            <span class="sub-status-label">${st.label}</span>
                            <span class="status-tag status-${task[st.key]}" style="padding: 2px 6px; font-size: 10px;">${getStatusLabel(task[st.key])}</span>
                        </div>
                    `).join('');

                    taskHtml += `
                        <div class="task-card" style="grid-column: 1 / -1;">
                            <span class="task-name">${task.name}</span>
                            <div style="margin-bottom:10px; font-size:12px; font-weight:700; color:var(--secondary); display:flex; flex-wrap:wrap; gap:15px;">
                                <span><i class="fas fa-users"></i> कुल: ${task.totalCount}</span>
                                <span><i class="fas fa-users-cog"></i> Reserve: ${task.reserveCount}</span>
                                <span style="color:#ea580c;"><i class="fas fa-cloud-upload-alt"></i> पोर्टल अपलोड: ${task.uploadedCount}/${task.totalCount} (${portalPercent}%)</span>
                                <span style="color:#9c27b0;"><i class="fas fa-cloud-upload-alt"></i> Reserve अपलोड: ${task.reserveUploadedCount}/${task.reserveCount} (${reservePortalPercent}%)</span>
                            </div>
                            <div class="mini-progress-track" style="margin-bottom:10px; height:6px;">
                                <div class="mini-bar" style="width: ${portalPercent}%; background:#fb923c;"></div>
                            </div>
                            <div class="mini-progress-track" style="margin-bottom:15px; height:6px;">
                                <div class="mini-bar" style="width: ${reservePortalPercent}%; background:#9c27b0;"></div>
                            </div>
                            <div class="status-grid">
                                ${statusGridHtml}
                            </div>
                            ${portalDeadlineHtml}
                        </div>
                    `;
                }
            } else if (task.type === 'training-logistics') {
                const items = [
                    { label: 'केंद्र का चयन (Center Selection)', key: 'centerSelection' },
                    { label: 'अनुमति पत्र (Permission Letter)', key: 'permissionLetter' }
                ];
                
                if (isAdminPage) {
                    let adminInputs = items.map(it => `
                        <div class="task-card">
                            <span class="task-name" style="font-size:14px;">${it.label}</span>
                            <div class="radio-group">
                                <div class="radio-option"><input type="radio" id="tl-purn-${task.id}-${it.key}" name="tl-${task.id}-${it.key}" value="purn" ${task[it.key] === 'purn' ? 'checked' : ''} onchange="updateGenericField('${task.id}', '${it.key}', this.value)"><label for="tl-purn-${task.id}-${it.key}">पूर्ण</label></div>
                                <div class="radio-option"><input type="radio" id="tl-apurn-${task.id}-${it.key}" name="tl-${task.id}-${it.key}" value="apurn" ${task[it.key] === 'apurn' ? 'checked' : ''} onchange="updateGenericField('${task.id}', '${it.key}', this.value)"><label for="tl-apurn-${task.id}-${it.key}">अपूर्ण</label></div>
                                <div class="radio-option"><input type="radio" id="tl-lambit-${task.id}-${it.key}" name="tl-${task.id}-${it.key}" value="lambit" ${task[it.key] === 'lambit' ? 'checked' : ''} onchange="updateGenericField('${task.id}', '${it.key}', this.value)"><label for="tl-lambit-${task.id}-${it.key}">लंबित</label></div>
                            </div>
                        </div>
                    `).join('');
                    taskHtml += `<div style="display:grid; grid-template-columns:1fr 1fr; gap:15px; grid-column:1/-1;">${adminInputs}</div>`;
                } else {
                    let logisHtml = items.map(it => `
                        <div class="task-card">
                            <span class="task-name">${it.label}</span>
                            <span class="status-tag status-${task[it.key]}">${getStatusLabel(task[it.key])}</span>
                        </div>
                    `).join('');
                    taskHtml += `<div style="display:grid; grid-template-columns:1fr 1fr; gap:15px; grid-column:1/-1;">${logisHtml}</div>`;
                }
            } else if (task.type === 'training-centers') {
                if (isAdminPage) {
                    taskHtml += `
                        <div class="task-card" style="grid-column: 1 / -1; background: #fffde7; border: 1px dashed var(--accent);">
                            <span class="task-name"><i class="fas fa-building"></i> प्रशिक्षण केंद्र नाम प्रबंधन (Training Center Names)</span>
                            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:15px;">
                                <div class="counter-input-group"><label>केंद्र 1:</label><input type="text" class="batch-input" value="${task.c1}" onchange="updateGenericField('${task.id}', 'c1', this.value)"></div>
                                <div class="counter-input-group"><label>केंद्र 2:</label><input type="text" class="batch-input" value="${task.c2}" onchange="updateGenericField('${task.id}', 'c2', this.value)"></div>
                                <div class="counter-input-group"><label>केंद्र 3:</label><input type="text" class="batch-input" value="${task.c3}" onchange="updateGenericField('${task.id}', 'c3', this.value)"></div>
                                <div class="counter-input-group"><label>केंद्र 4:</label><input type="text" class="batch-input" value="${task.c4}" onchange="updateGenericField('${task.id}', 'c4', this.value)"></div>
                            </div>
                        </div>
                    `;
                }
            } else if (task.type === 'training-summary') {
                const batchPercent = Math.round((task.completedBatches / task.totalBatches) * 100);
                
                // Fetch dynamic total from User Management Section
                let totalExpected = 0;
                taskData.forEach(c => c.tasks.forEach(t => {
                    if (t.id === 'sup1' || t.id === 'enum1') totalExpected += (t.totalCount + t.reserveCount);
                }));
                if (totalExpected === 0) totalExpected = 276; // Fallback
                
                const attendPercent = Math.round((task.totalAttended / totalExpected) * 100);
                
                // Recalculate completedBatches from batchList
                const completedCount = task.batchList.filter(b => 
                    b.nirm === 'purn' && b.alloc === 'purn' && b.down === 'purn' && 
                    b.verify === 'purn' && b.up === 'purn'
                ).length;
                task.completedBatches = completedCount;
                
                totalTasks += 1;
                totalPurn += (task.completedBatches / task.totalBatches);

                const steps = [
                    { key: 'nirm', label: 'बैच निर्माण' },
                    { key: 'alloc', label: 'ट्रेनर अलॉटमेंट' },
                    { key: 'down', label: 'शीट डाउनलोड' },
                    { key: 'verify', label: 'डेटा वेरिफिकेशन' },
                    { key: 'up', label: 'शीट अपलोड' }
                ];

                let batchRows = task.batchList.map((b, bIdx) => {
                    const isFullyDone = b.nirm === 'purn' && b.alloc === 'purn' && b.down === 'purn' && b.verify === 'purn' && b.up === 'purn';
                    
                    if (isAdminPage) {
                        const stepControls = steps.map(s => `
                            <div style="margin-bottom:5px;">
                                <label style="font-size:9px; font-weight:700;">${s.label}:</label>
                                <select class="batch-status-select" style="font-size:10px;" onchange="updateBatchStepStatus('${task.id}', ${bIdx}, '${s.key}', this.value)">
                                    <option value="lambit" ${b[s.key] === 'lambit' ? 'selected' : ''}>Pending</option>
                                    <option value="purn" ${b[s.key] === 'purn' ? 'selected' : ''}>Done</option>
                                </select>
                            </div>
                        `).join('');

                        return `
                            <tr>
                                <td style="vertical-align:top;">
                                    <b>Batch ${b.id}</b>
                                    <button class="quick-btn" style="margin-top:10px; display:block;" onclick="quickFinishBatch('${task.id}', ${bIdx})">सब पूर्ण</button>
                                </td>
                                <td style="vertical-align:top;"><input type="text" class="batch-input" value="${b.date}" onchange="updateBatchField('${task.id}', ${bIdx}, 'date', this.value)"></td>
                                <td style="vertical-align:top;">
                                    <select class="batch-input" onchange="updateBatchField('${task.id}', ${bIdx}, 'venue', this.value)">
                                        <option value="${b.venue}">${b.venue}</option>
                                        ${(() => {
                                            const centers = taskData.find(c => c.category.includes('प्रशिक्षण')).tasks.find(t => t.type === 'training-centers');
                                            if (!centers) return '';
                                            return [centers.c1, centers.c2, centers.c3, centers.c4].map(cn => `<option value="${cn}" ${b.venue === cn ? 'selected' : ''}>${cn}</option>`).join('');
                                        })()}
                                    </select>
                                </td>
                                <td style="vertical-align:top;"><input type="text" class="batch-input" value="${b.time}" onchange="updateBatchField('${task.id}', ${bIdx}, 'time', this.value)"></td>
                                <td style="vertical-align:top; border-left:1px solid #ddd;">${stepControls}</td>
                            </tr>
                        `;
                    } else {
                        const stepDots = steps.map(s => `
                            <div class="step-dot ${b[s.key] === 'purn' ? 'done' : ''}"><div class="step-tool">${s.label}</div></div>
                        `).join('');

                        return `
                            <tr>
                                <td style="font-weight:700;">Batch ${b.id}</td>
                                <td>${b.date}</td>
                                <td>${b.venue}</td>
                                <td>${b.time}</td>
                                <td>
                                    <div class="batch-progress-wrapper">${stepDots}</div>
                                    <div style="font-size:9px; margin-top:2px; color:${isFullyDone ? 'var(--success)' : '#666'};">
                                        ${isFullyDone ? '<b>पूर्ण (Completed)</b>' : 'प्रक्रिया जारी (In Progress)'}
                                    </div>
                                </td>
                            </tr>
                        `;
                    }
                }).join('');

                if (isAdminPage) {
                    taskHtml += `
                        <div class="task-card" style="grid-column: 1 / -1; border-left: 5px solid var(--secondary);">
                            <span class="task-name">${task.name}</span>
                            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; margin-top:10px;">
                                <div class="counter-info"><span>बैच पूर्ण: ${task.completedBatches} / ${task.totalBatches}</span></div>
                                <div class="counter-input-group">
                                    <label>कुल उपस्थिति (Expected: ${totalExpected}):</label>
                                    <input type="number" class="counter-input" value="${task.totalAttended}" onchange="updateGenericField('${task.id}', 'totalAttended', this.value)">
                                </div>
                            </div>
                            <div class="batch-schedule-container">
                                <table class="batch-schedule-table">
                                    <thead><tr><th>Batch</th><th>Date</th><th>Venue (जगह)</th><th>Time (समय)</th><th>Status</th></tr></thead>
                                    <tbody>${batchRows}</tbody>
                                </table>
                            </div>
                        </div>
                    `;
                } else {
                    taskHtml += `
                        <div class="task-card" style="grid-column: 1 / -1; border-left: 5px solid var(--secondary);">
                            <span class="task-name">${task.name}</span>
                            <div class="counter-info" style="margin-top:10px;">
                                <span><i class="fas fa-chalkboard-teacher"></i> पूर्ण बैच: ${task.completedBatches} / ${task.totalBatches}</span>
                                <span>${batchPercent}%</span>
                            </div>
                            <div class="mini-progress-track"><div class="mini-bar" style="width: ${batchPercent}%"></div></div>
                            
                            <div class="counter-info" style="margin-top:15px;">
                                <span><i class="fas fa-user-check"></i> कुल उपस्थिति: ${task.totalAttended} / ${totalExpected}</span>
                                <span>${attendPercent}%</span>
                            </div>
                            <div class="mini-progress-track"><div class="mini-bar" style="width: ${attendPercent}%; background: #9c27b0;"></div></div>
                            
                            <div class="batch-schedule-container">
                                <table class="batch-schedule-table">
                                    <thead><tr><th>Batch</th><th>Date</th><th>Venue (जगह)</th><th>Time (समय)</th><th>Status</th></tr></thead>
                                    <tbody>${batchRows}</tbody>
                                </table>
                            </div>
                        </div>
                    `;
                }
            } else if (task.type === 'logistics-checklist') {
                const items = [
                    { label: 'इंटरनेट व्यवस्था', key: 'internet', icon: 'fa-wifi' },
                    { label: 'साउंड & माइक', key: 'sound', icon: 'fa-microphone' },
                    { label: 'भोजन & अल्पाहार', key: 'food', icon: 'fa-utensils' },
                    { label: 'पेयजल व्यवस्था', key: 'water', icon: 'fa-tint' }
                ];
                
                if (isAdminPage) {
                    let adminInputs = items.map(it => `
                        <div class="admin-sub-status">
                            <label>${it.label}</label>
                            <select onchange="updateUserGroupStatus('${task.id}', '${it.key}', this.value)">
                                <option value="lambit" ${task[it.key] === 'lambit' ? 'selected' : ''}>Pending</option>
                                <option value="apurn" ${task[it.key] === 'apurn' ? 'selected' : ''}>Partial</option>
                                <option value="purn" ${task[it.key] === 'purn' ? 'selected' : ''}>Ready</option>
                            </select>
                        </div>
                    `).join('');
                    taskHtml += `
                        <div class="task-card" style="grid-column: 1 / -1;">
                            <span class="task-name">${task.name}</span>
                            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px;">
                                ${adminInputs}
                            </div>
                        </div>
                    `;
                } else {
                    let checklistHtml = items.map(it => `
                        <div class="logistics-item">
                            <i class="fas ${it.icon}"></i>
                            <span>${it.label}</span>
                            <div class="status-dot dot-${task[it.key]}"></div>
                        </div>
                    `).join('');
                    taskHtml += `<div class="task-card" style="grid-column: 1 / -1;"><span class="task-name">${task.name}</span><div class="logistics-grid">${checklistHtml}</div></div>`;
                }
            } else if (task.type === 'cell-info') {
                // We don't weight cell info in overall progress if it's just info
                
                let staffRowsHtml = '';
                task.staffList.forEach((s, sIdx) => {
                    if (isAdminPage) {
                        staffRowsHtml += `
                            <tr>
                                <td><input type="text" class="staff-input" value="${s.name}" onchange="updateStaffDetail('${task.id}', ${sIdx}, 'name', this.value)"></td>
                                <td><input type="text" class="staff-input" value="${s.pad}" onchange="updateStaffDetail('${task.id}', ${sIdx}, 'pad', this.value)"></td>
                                <td><input type="text" class="staff-input" value="${s.role}" onchange="updateStaffDetail('${task.id}', ${sIdx}, 'role', this.value)"></td>
                                <td><button class="row-action-btn btn-remove" onclick="removeStaffRow('${task.id}', ${sIdx})"><i class="fas fa-trash"></i></button></td>
                            </tr>
                        `;
                    } else {
                        staffRowsHtml += `
                            <tr>
                                <td>${s.name}</td>
                                <td>${s.pad}</td>
                                <td>${s.role}</td>
                            </tr>
                        `;
                    }
                });

                if (isAdminPage) {
                    taskHtml += `
                        <div class="task-card" style="grid-column: 1 / -1;">
                            <span class="task-name">${task.name}</span>
                            <div class="cell-stats">
                                <div class="stat-item">
                                    <i class="fas fa-users"></i>
                                    <input type="number" class="counter-input" value="${task.staffCount}" onchange="updateCellField('${task.id}', 'staffCount', this.value)">
                                    <p>कुल कार्मिक</p>
                                </div>
                                <div class="stat-item">
                                    <i class="fas fa-desktop"></i>
                                    <input type="number" class="counter-input" value="${task.computers}" onchange="updateCellField('${task.id}', 'computers', this.value)">
                                    <p>कंप्यूटर</p>
                                </div>
                                <div class="stat-item">
                                    <i class="fas fa-print"></i>
                                    <input type="number" class="counter-input" value="${task.printers}" onchange="updateCellField('${task.id}', 'printers', this.value)">
                                    <p>प्रिंटर</p>
                                </div>
                            </div>
                            <div class="staff-table-container">
                                <table class="staff-table">
                                    <thead>
                                        <tr>
                                            <th>नाम</th>
                                            <th>पद</th>
                                            <th>कार्य/भूमिका</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody id="staff-body-${task.id}">
                                        ${staffRowsHtml}
                                    </tbody>
                                </table>
                                <button class="row-action-btn btn-add" style="margin-top:10px;" onclick="addStaffRow('${task.id}')"><i class="fas fa-plus"></i> नया कार्मिक जोड़ें</button>
                            </div>
                        </div>
                    `;
                } else {
                    taskHtml += `
                        <div class="task-card" style="grid-column: 1 / -1;">
                             <span class="task-name">${task.name}</span>
                            <div class="cell-stats">
                                <div class="stat-item">
                                    <i class="fas fa-users"></i>
                                    <span>${task.staffCount}</span>
                                    <p>कुल कार्मिक</p>
                                </div>
                                <div class="stat-item">
                                    <i class="fas fa-desktop"></i>
                                    <span>${task.computers}</span>
                                    <p>कंप्यूटर</p>
                                </div>
                                <div class="stat-item">
                                    <i class="fas fa-print"></i>
                                    <span>${task.printers}</span>
                                    <p>प्रिंटर</p>
                                </div>
                            </div>
                            <div class="staff-table-container">
                                <table class="staff-table">
                                    <thead>
                                        <tr>
                                            <th>नाम</th>
                                            <th>पद</th>
                                            <th>कार्य/भूमिका</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${staffRowsHtml || '<tr><td colspan="3" style="text-align:center;">डेटा उपलब्ध नहीं</td></tr>'}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    `;
                }
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

// Cell Data Functions
function updateCellField(id, field, value) {
    taskData.forEach(cat => {
        cat.tasks.forEach(task => {
            if (task.id === id) {
                task[field] = parseInt(value) || 0;
            }
        });
    });
    // No progress recalculation needed for info types
}

function addStaffRow(id) {
    taskData.forEach(cat => {
        cat.tasks.forEach(task => {
            if (task.id === id) {
                if (!task.staffList) task.staffList = [];
                task.staffList.push({ name: '', pad: '', role: '' });
            }
        });
    });
    renderPage();
}

function removeStaffRow(id, index) {
    taskData.forEach(cat => {
        cat.tasks.forEach(task => {
            if (task.id === id) {
                task.staffList.splice(index, 1);
            }
        });
    });
    renderPage();
}

function updateStaffDetail(id, index, field, value) {
    taskData.forEach(cat => {
        cat.tasks.forEach(task => {
            if (task.id === id) {
                task.staffList[index][field] = value;
            }
        });
    });
}

// User Group Functions
function updateUserGroupStatus(id, key, value) {
    taskData.forEach(cat => {
        cat.tasks.forEach(task => {
            if (task.id === id) {
                task[key] = value;
            }
        });
    });
    calculateOverallProgress();
}

function updateUserGroupField(id, key, value) {
    taskData.forEach(cat => {
        cat.tasks.forEach(task => {
            if (task.id === id) {
                if (key === 'portalDeadline') {
                    task.portalDeadline = value;
                } else {
                    task[key] = parseInt(value) || 0;
                }
            }
        });
    });
    calculateOverallProgress();
}

function updateGenericField(id, key, value) {
    taskData.forEach(cat => {
        cat.tasks.forEach(task => {
            if (task.id === id) {
                task[key] = parseInt(value) || 0;
            }
        });
    });
    calculateOverallProgress();
}

function updateBatchField(id, index, field, value) {
    taskData.forEach(cat => {
        cat.tasks.forEach(task => {
            if (task.id === id) {
                task.batchList[index][field] = value;
            }
        });
    });
}

function updateBatchStatus(id, index, value) {
    taskData.forEach(cat => {
        cat.tasks.forEach(task => {
            if (task.id === id) {
                task.batchList[index].status = value;
                const completed = task.batchList.filter(b => b.status === 'purn').length;
                task.completedBatches = completed;
            }
        });
    });
    calculateOverallProgress();
}

function updateBatchStepStatus(id, index, stepKey, value) {
    taskData.forEach(cat => {
        cat.tasks.forEach(task => {
            if (task.id === id) {
                task.batchList[index][stepKey] = value;
            }
        });
    });
    calculateOverallProgress();
}

function quickFinishBatch(id, index) {
    taskData.forEach(cat => {
        cat.tasks.forEach(task => {
            if (task.id === id) {
                const b = task.batchList[index];
                b.nirm = 'purn';
                b.alloc = 'purn';
                b.down = 'purn';
                b.verify = 'purn';
                b.up = 'purn';
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
            } else if (t.type === 'user-group') {
                const subKeys = ['niyukti', 'hlbAlloc', 'idCard', 'mapDistrib', 'reserveId'];
                if (t.id === 'sup1') subKeys.push('circleAlloc', 'pragnakAlloc');
                else subKeys.push('alloc');
                
                totalTasks += subKeys.length + 2; // +2 for Main and Reserve uploads
                subKeys.forEach(k => {
                    if (t[k] === 'purn') totalPurn += 1;
                });
                totalPurn += (t.uploadedCount / t.totalCount) || 0;
                totalPurn += (t.reserveUploadedCount / t.reserveCount) || 0;
            } else if (t.type === 'training-summary') {
                totalTasks += 1;
                totalPurn += (t.completedBatches / t.totalBatches);
            } else if (t.type === 'logistics-checklist') {
                // Not weighted significantly or combined as one
                const subKeys = ['internet', 'sound', 'food', 'water'];
                totalTasks += subKeys.length;
                subKeys.forEach(k => {
                    if (t[k] === 'purn') totalPurn += 1;
                });
            } else if (t.type === 'training-logistics') {
                const subKeys = ['centerSelection', 'permissionLetter'];
                totalTasks += subKeys.length;
                subKeys.forEach(k => {
                    if (t[k] === 'purn') totalPurn += 1;
                });
            } else if (t.type === 'info' || t.type === 'cell-info') {
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

// 5. Reset Data (Sync from XML)
function resetData() {
    if (confirm("क्या आप सर्वर से नया डेटा लोड करना चाहते हैं? (इससे आपकी लोकल प्रोग्रेस हट जाएगी)")) {
        localStorage.removeItem('census_tasks');
        location.reload();
    }
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
            } else if (task.type === 'cell-info') {
                const staffListJson = JSON.stringify(task.staffList).replace(/"/g, '&quot;');
                xml += `        <task id="${task.id}" name="${task.name}" type="cell-info" staffCount="${task.staffCount}" computers="${task.computers}" printers="${task.printers}" staffList="${staffListJson}" />\n`;
            } else if (task.type === 'user-group') {
                let attrs = `totalCount="${task.totalCount}" reserveCount="${task.reserveCount}" uploadedCount="${task.uploadedCount}" reserveUploadedCount="${task.reserveUploadedCount}" portalDeadline="${task.portalDeadline}" niyukti="${task.niyukti}" hlbAlloc="${task.hlbAlloc}" idCard="${task.idCard}" mapDistrib="${task.mapDistrib}" reserveId="${task.reserveId}"`;
                if (task.id === 'sup1') attrs += ` circleAlloc="${task.circleAlloc}" pragnakAlloc="${task.pragnakAlloc}"`;
                else attrs += ` alloc="${task.alloc}"`;
                xml += `        <task id="${task.id}" name="${task.name}" type="user-group" ${attrs} />\n`;
            } else if (task.type === 'training-summary') {
                const batchListJson = JSON.stringify(task.batchList).replace(/"/g, '&quot;');
                xml += `        <task id="${task.id}" name="${task.name}" type="training-summary" totalBatches="${task.totalBatches}" completedBatches="${task.completedBatches}" totalAttended="${task.totalAttended}" batchList="${batchListJson}" />\n`;
            } else if (task.type === 'training-logistics') {
                xml += `        <task id="${task.id}" name="${task.name}" type="training-logistics" centerSelection="${task.centerSelection}" permissionLetter="${task.permissionLetter}" />\n`;
            } else if (task.type === 'training-centers') {
                xml += `        <task id="${task.id}" name="${task.name}" type="training-centers" c1="${task.c1}" c2="${task.c2}" c3="${task.c3}" c4="${task.c4}" />\n`;
            } else if (task.type === 'logistics-checklist') {
                xml += `        <task id="${task.id}" name="${task.name}" type="logistics-checklist" internet="${task.internet}" sound="${task.sound}" food="${task.food}" water="${task.water}" />\n`;
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
