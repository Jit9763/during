let taskData = [];
const DEFAULT_API_URL = 'https://script.google.com/macros/s/AKfycbzdxSYpTIbQEMfBOSSRDQKFWFOC6RWmf2YiW82miETl29uXW-U72zOVubKols-hl8qIew/exec';
const isAdminPage = window.location.pathname.includes('admin.html');

// 1. Load Data
const TASK_STRUCTURE = [
    {
        category: "प्रशासनिक और मैपिंग (Administrative Mapping)",
        tasks: [
            { id: "1", name: "चार्ज प्रोफाइल और ऑफिस विवरण अपडेट करना", status: "purn", type: "simple", deadline: "2026-04-10" },
            { id: "info1", name: "हाउस लिस्टिंग ब्लॉक (HLB) विवरण", type: "info", content: "कुल: 242 | ग्रामीण: 242 | शहरी: 0", deadline: "2026-04-12" },
            { id: "2", name: "242 हाउस-लिस्टिंग ब्लॉक (HLB) का निर्माण", status: "purn", type: "simple", deadline: "2026-04-12" },
            { id: "3", name: "39 सुपरवाइजर सर्किलों का निर्माण", status: "purn", type: "simple", deadline: "2026-04-14" },
            { id: "cell1", name: "जनगणना सेल (Census Cell) विवरण", type: "cell-info", staffCount: 0, computers: 0, printers: 0, staffList: [], deadline: "2026-04-14" },
            { id: "6", name: "सभी 242 ब्लॉकों को पोर्टल पर 'Final Freeze' करना", status: "lambit", type: "simple", deadline: "2026-04-15" },
            { id: "4", name: "सभी 242 ब्लॉकों की जियो-टैगिंग (Geo-Tagging)", type: "counter", total: 242, completed: 150, deadline: "2026-04-20" },
            { id: "5", name: "सभी 242 ब्लॉकों का सीमांकन (Demarcation)", type: "counter", total: 242, completed: 120, deadline: "2026-04-22" },
            { id: "5b", name: "पोर्टल पर HLB विवरण (Description) भरना", status: "apurn", type: "simple", deadline: "2026-04-24" },
            { id: "m1", name: "हाउस लिस्टिंग मैप (97 Maps) की जांच", type: "map-stats", total: 97, checked: 0, correct: 0, incorrect: 0, deadline: "2026-04-27", status: "apurn" }
        ]
    },
    {
        category: "उपयोगकर्ता प्रबंधन (User Management)",
        tasks: [
            { id: "charge1", name: "चार्ज कार्मिक (Charge User) विवरण", type: "info", content: "चार्ज ऑफिसर और सहायक कर्मचारी", deadline: "2026-04-18" },
            { id: "sup1", name: "पर्यवेक्षक (Supervisors) प्रबंधन", type: "user-group", totalCount: 39, reserveCount: 4, uploadedCount: 0, reserveUploadedCount: 0, niyukti: "purn", circleAlloc: "purn", pragnakAlloc: "lambit", hlbAlloc: "lambit", idCard: "lambit", mapDistrib: "lambit", reserveId: "lambit", deadline: "2026-04-25" },
            { id: "enum1", name: "प्रगणक (Enumerators) प्रबंधन", type: "user-group", totalCount: 237, reserveCount: 24, uploadedCount: 0, reserveUploadedCount: 0, niyukti: "purn", alloc: "lambit", hlbAlloc: "lambit", idCard: "lambit", mapDistrib: "lambit", reserveId: "lambit", deadline: "2026-04-26" }
        ]
    },
    {
        category: "प्रशिक्षण प्रबंधन (Training Management)",
        tasks: [
            { id: "t-centers", name: "प्रशिक्षण केंद्र प्रबंधन (Center Management)", type: "training-centers", c1: "रा.उ.मा.वि. देवलिया कला सभागार", c2: "रा.उ.मा.वि. नगोला सभागार", c3: "भिनाय पंचायत सभागार", c4: "रा.उ.मा.वि. बांदनवाड़ा सभागार", deadline: "2026-04-20" },
            { id: "t-logis", name: "प्रशिक्षण रसद (Training Logistics)", type: "training-logistics", centerSelection: "lambit", permissionLetter: "lambit", deadline: "2026-04-25" },
            { id: "13", name: "FIELD Trainners (4) का पंजीकरण और प्रशिक्षण", status: "purn", type: "simple", deadline: "2026-04-15" },
            { id: "t-batch", name: "प्रशिक्षण बैच पोर्टल कार्य और उपस्थिति", type: "training-summary", totalBatches: 7, completedBatches: 0, totalAttended: 0, batchList: [{"id":1,"date":"1-3 May","venue":"रा.उ.मा.वि. देवलिया कला सभागार","time":"8:00 AM - 5:00 PM","nirm":"lambit","alloc":"lambit","down":"lambit","verify":"lambit","up":"lambit"},{"id":2,"date":"1-3 May","venue":"रा.उ.मा.वि. नगोला सभागार","time":"8:00 AM - 5:00 PM","nirm":"lambit","alloc":"lambit","down":"lambit","verify":"lambit","up":"lambit"},{"id":3,"date":"4-5 May","venue":"भिनाय पंचायत सभागार","time":"8:00 AM - 5:00 PM","nirm":"lambit","alloc":"lambit","down":"lambit","verify":"lambit","up":"lambit"},{"id":4,"date":"4-5 May","venue":"रा.उ.मा.वि. बांदनवाड़ा सभागार","time":"8:00 AM - 5:00 PM","nirm":"lambit","alloc":"lambit","down":"lambit","verify":"lambit","up":"lambit"},{"id":5,"date":"6-7 May","venue":"रा.उ.मा.वि. देवलिया कला सभागार","time":"8:00 AM - 5:00 PM","nirm":"lambit","alloc":"lambit","down":"lambit","verify":"lambit","up":"lambit"},{"id":6,"date":"6-7 May","venue":"रा.उ.मा.वि. नगोला सभागार","time":"8:00 AM - 5:00 PM","nirm":"lambit","alloc":"lambit","down":"lambit","verify":"lambit","up":"lambit"},{"id":7,"date":"8-10 May","venue":"भिनाय पंचायत सभागार","time":"8:00 AM - 5:00 PM","nirm":"lambit","alloc":"lambit","down":"lambit","verify":"lambit","up":"lambit"}], deadline: "2026-05-15" },
            { id: "16", name: "हस्ताक्षरित अटेंडेंस शीट पोर्टल पर अपलोड करना", status: "lambit", type: "simple", deadline: "2026-05-20" }
        ]
    },
    {
        category: "रसद और वित्त (Logistics & Finance)",
        tasks: [
            { id: "l-fac", name: "केंद्र व्यवस्थाएं (Facilities Readiness)", type: "logistics-checklist", internet: "lambit", sound: "purn", food: "apurn", water: "purn", deadline: "2026-04-27" }
        ]
    },
    {
        category: "FIELD SURVEY तैयारी (Field Survey Readiness)",
        tasks: [
            { id: "21", name: "HLO मोबाइल ऐप का सिंक और लॉगिन टेस्ट", status: "lambit", type: "simple", deadline: "2026-06-15" },
            { id: "22", name: "ब्लॉक क्यूआर कोड (QR Code) वितरण", status: "lambit", type: "simple", deadline: "2026-06-20" },
            { id: "23", name: "चार्ज रेडीनेस सर्टिफिकेट (CRC) अपलोड", status: "lambit", type: "simple", deadline: "2026-06-25" }
        ]
    }
];

// 1. Load Data
async function loadData() {
    let apiUrl = localStorage.getItem('census_api_url') || DEFAULT_API_URL;
    const apiInput = document.getElementById('api-url');
    if (apiInput) apiInput.value = apiUrl;

    // Use hardcoded structure as base
    taskData = JSON.parse(JSON.stringify(TASK_STRUCTURE));

    try {
        let savedValues = null;

        // 1) Try cloud (Google Sheets)
        if (apiUrl) {
            try {
                const response = await fetch(apiUrl);
                const data = await response.json();
                if (data && data.values) {
                    savedValues = data.values;
                }
            } catch(e) {
                console.warn("Cloud sync failed, trying localStorage.");
            }
        }

        // 2) Check localStorage if cloud failed
        if (!savedValues) {
            const localData = localStorage.getItem('census_tasks_values');
            if (localData) {
                savedValues = JSON.parse(localData);
            }
        }

        // Merge: overlay saved values onto the structure
        if (savedValues) {
            taskData.forEach(cat => {
                cat.tasks.forEach(task => {
                    if (savedValues[task.id]) {
                        Object.assign(task, savedValues[task.id]);
                    }
                });
            });
        }

        calculateOverallProgress();
        renderPage();
    } catch (error) {
        console.error("Error loading data:", error);
        calculateOverallProgress();
        renderPage();
    }
}

// XML Parsing logic removed as we now use direct JS structure

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
        
        let headerHtml = `
            <div class="category-header">
                <h2 class="category-title" style="margin-bottom:0;">${cat.category}</h2>
                <div style="display:flex; align-items:center; gap:10px;">
                    <div class="category-progress-container">
                        <div class="category-progress-bar" style="width: ${cat.progress || 0}%"></div>
                    </div>
                    <span style="font-size:12px; font-weight:700; color:var(--success);">${cat.progress || 0}%</span>
                </div>
            </div>
        `;
        let taskHtml = headerHtml + `<div class="task-grid">`;
        
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
                            ${getDeadlineTag(task.deadline, task.status, task.id)}
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
                            ${getDeadlineTag(task.deadline, task.status, task.id)}
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
                        ${getDeadlineTag(task.deadline, 'purn', task.id)}
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
                             ${getDeadlineTag(task.deadline, task.niyukti === 'purn' && task.uploadedCount >= task.totalCount ? 'purn' : 'lambit', task.id)}
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
                            ${getDeadlineTag(task.deadline, task.niyukti === 'purn' && task.uploadedCount >= task.totalCount ? 'purn' : 'lambit', task.id)}
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
                            ${getDeadlineTag(task.deadline, task[it.key], task.id)}
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
                            ${getDeadlineTag(task.deadline, task[it.key], task.id)}
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
                        const stepDots = steps.map((s, idx) => `
                            <div class="step-dot ${b[s.key] === 'purn' ? 'done' : ''}" style="display:flex; align-items:center; justify-content:center; width:20px; height:20px;">
                                <span style="font-size:11px; font-weight:bold; color:${b[s.key] === 'purn' ? 'white' : '#666'};">${idx + 1}</span>
                                <div class="step-tool">${idx + 1}. ${s.label}</div>
                            </div>
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
                            <!-- Legend for dots -->
                            <div class="batch-legend" style="margin-top:12px; padding-top:10px; border-top:1px dashed #ddd; display:flex; flex-wrap:wrap; gap:12px; justify-content:center;">
                                ${steps.map((s, idx) => `<span style="font-size:12px; color:#444;"><b>${idx + 1}:</b> ${s.label}</span>`).join('')}
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
                            <!-- Legend for dots -->
                            <div class="batch-legend" style="margin-top:12px; padding-top:10px; border-top:1px dashed #ddd; display:flex; flex-wrap:wrap; gap:12px; justify-content:center;">
                                ${steps.map((s, idx) => `<span style="font-size:12px; color:#444;"><b>${idx + 1}:</b> ${s.label}</span>`).join('')}
                            </div>
                        </div>
                    `;
                }
            } else if (task.type === 'logistics-checklist') {
                    const items = [
                        { label: 'WiFi (इंटरनेट)', key: 'internet', icon: 'fa-wifi' },
                        { label: 'Mic (साउंड)', key: 'sound', icon: 'fa-microphone' },
                        { label: 'Food (भोजन)', key: 'food', icon: 'fa-utensils' },
                        { label: 'Water (पानी)', key: 'water', icon: 'fa-tint' }
                    ];
                    
                    if (isAdminPage) {
                        let selects = items.map(it => `
                            <div class="admin-sub-status" style="cursor:pointer;" onclick="toggleUserGroupStep('${task.id}', '${it.key}')">
                                <label>${it.label}</label>
                                <span class="status-tag status-${task[it.key]}">${task[it.key] === 'purn' ? 'पूर्ण' : 'लंबित'}</span>
                            </div>
                        `).join('');
                        taskHtml += `
                            <div class="task-card" style="grid-column: 1 / -1;">
                                <span class="task-name">${task.name} (एडमिन व्यू: क्लिक करें)</span>
                                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px;">
                                    ${selects}
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

                let deadlineHtml = getDeadlineTag(task.deadline, task.status, task.id);

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
                            ${getDeadlineTag(task.deadline, task.status, task.id)}
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

// 3. Progress Calculation (Category & Overall)
function calculateOverallProgress() {
    let totalPurnGlobal = 0;
    let totalTasksGlobal = 0;

    taskData.forEach(cat => {
        let catPurn = 0;
        let catTasks = 0;

        cat.tasks.forEach(t => {
            if (t.type === 'counter') {
                catTasks += 1;
                catPurn += (t.completed / t.total) || 0;
            } else if (t.type === 'map-stats') {
                catTasks += 1;
                catPurn += (t.checked / t.total) || 0;
            } else if (t.type === 'user-group') {
                const subKeys = ['niyukti', 'hlbAlloc', 'idCard', 'mapDistrib', 'reserveId'];
                if (t.id === 'sup1') subKeys.push('circleAlloc', 'pragnakAlloc');
                else subKeys.push('alloc');
                
                catTasks += subKeys.length + 2; 
                subKeys.forEach(k => { if (t[k] === 'purn') catPurn += 1; });
                catPurn += (t.uploadedCount / t.totalCount) || 0;
                catPurn += (t.reserveUploadedCount / t.reserveCount) || 0;
            } else if (t.type === 'training-summary') {
                catTasks += 1;
                catPurn += (t.completedBatches / t.totalBatches) || 0;
            } else if (t.type === 'training-logistics') {
                const subKeys = ['centerSelection', 'permissionLetter'];
                catTasks += subKeys.length;
                subKeys.forEach(k => { if (t[k] === 'purn') catPurn += 1; });
            } else if (t.type === 'logistics-checklist') {
                const subKeys = ['internet', 'sound', 'food', 'water'];
                catTasks += subKeys.length;
                subKeys.forEach(k => { if (t[k] === 'purn') catPurn += 1; });
            } else if (t.type !== 'info' && t.type !== 'cell-info' && t.type !== 'training-centers') {
                catTasks += 1;
                if (t.status === 'purn') catPurn += 1;
            }
        });

        cat.progress = catTasks > 0 ? Math.round((catPurn / catTasks) * 100) : 0;
        totalPurnGlobal += catPurn;
        totalTasksGlobal += catTasks;
    });

    const percent = totalTasksGlobal > 0 ? Math.round((totalPurnGlobal / totalTasksGlobal) * 100) : 0;
    const bar = document.getElementById('overall-bar');
    const val = document.getElementById('progress-val');
    if (bar) bar.style.width = percent + '%';
    if (val) val.innerText = percent + '%';
    
    updateDailyScheduler();
}

function getDeadlineTag(deadline, status, taskId) {
    let editHtml = '';
    // Admin page: show editable date input
    if (isAdminPage && taskId) {
        editHtml = `<input type="date" class="counter-input" style="width:130px; font-size:11px; padding:3px 5px; margin-right:8px;" value="${deadline || ''}" onchange="updateDeadline('${taskId}', this.value)">`;
    }

    if (!deadline) return editHtml || '';
    
    let statusHtml = '';
    if (status === 'purn') {
        statusHtml = `<span style="color:var(--success); font-size:11px;"><i class="fas fa-check-circle"></i> समय पर पूर्ण</span>`;
    } else {
        const today = new Date();
        today.setHours(0,0,0,0);
        const dl = new Date(deadline);
        const diff = Math.ceil((dl - today) / (1000 * 60 * 60 * 24));
        
        if (diff < 0) statusHtml = `<span class="deadline-critical"><i class="fas fa-exclamation-triangle"></i> ${Math.abs(diff)} दिन विलंब</span>`;
        else if (diff <= 1) statusHtml = `<span class="deadline-warning"><i class="fas fa-clock"></i> केवल 1 दिन बचा!</span>`;
        else statusHtml = `<span class="deadline-normal"><i class="fas fa-calendar-alt"></i> ${diff} दिन शेष (${deadline})</span>`;
    }

    return `<div style="display:flex; align-items:center; flex-wrap:wrap; gap:5px; margin:4px 0;">${editHtml}${statusHtml}</div>`;
}

function updateDeadline(taskId, newDate) {
    taskData.forEach(cat => {
        cat.tasks.forEach(t => {
            if (t.id === taskId) {
                t.deadline = newDate;
            }
        });
    });
    calculateOverallProgress();
    renderPage();
}

function updateDailyScheduler() {
    const scheduler = document.getElementById('daily-scheduler');
    if (!scheduler) return;
    
    const todayNum = new Date().setHours(0,0,0,0);
    const urgentTasks = [];
    
    taskData.forEach(cat => {
        cat.tasks.forEach(t => {
            if (t.status !== 'purn' && t.deadline) {
                const dl = new Date(t.deadline).getTime();
                const diffDays = (dl - todayNum) / (1000 * 60 * 60 * 24);
                
                // Show tasks due today, overdue, or due in the next 7 days
                if (diffDays <= 7) {
                    urgentTasks.push({ name: t.name, days: diffDays });
                }
            }
        });
    });

    if (urgentTasks.length > 0) {
        // Sort by urgency
        urgentTasks.sort((a,b) => a.days - b.days);
        
        const taskLabels = urgentTasks.slice(0, 3).map(ut => {
            let label = ut.name;
            if (ut.days < 0) label += ` (Overdue!)`;
            else if (ut.days === 0) label += ` (आज!)`;
            else label += ` (अगले ${Math.ceil(ut.days)} दिन)`;
            return label;
        });

        scheduler.innerHTML = `
            <div class="scheduler-banner">
                <i class="fas fa-bullhorn fa-2x"></i>
                <div>
                    <strong style="display:block; font-size:16px;">आगामी और लंबित कार्य (Priority Focus):</strong>
                    <span style="font-size:13px;">${taskLabels.join(' | ')}</span>
                </div>
            </div>
        `;
    } else {
        scheduler.innerHTML = `
            <div class="scheduler-banner" style="border-color: var(--success);">
                <i class="fas fa-check-double fa-2x" style="color: var(--success);"></i>
                <div>
                    <strong style="display:block; font-size:16px;">सभी कार्य ट्रैक पर हैं!</strong>
                    <span style="font-size:13px;">आज के लिए कोई तत्काल लंबित कार्य नहीं है।</span>
                </div>
            </div>
        `;
    }
}

// 4. Save Changes
async function saveChanges() {
    // 1) Always save values only to localStorage
    const valuesOnly = {};
    taskData.forEach(cat => {
        cat.tasks.forEach(t => {
            const { id, name, type, ...values } = t;
            valuesOnly[id] = values;
        });
    });
    localStorage.setItem('census_tasks_values', JSON.stringify(valuesOnly));
    
    // 2) Always try to sync values to Google Sheets (cloud)
    const apiUrl = localStorage.getItem('census_api_url') || DEFAULT_API_URL;
    if (apiUrl) {
        try {
            await fetch(apiUrl, {
                method: 'POST',
                mode: 'no-cors',
                body: JSON.stringify({ values: valuesOnly })
            });
            alert("✅ बदलाव सुरक्षित हो गए!\n• लोकल मेमोरी: ✅\n• Google Sheets (Cloud): ✅ डेटा भेज दिया गया");
        } catch (e) {
            console.error("Cloud sync error:", e);
            alert("⚠️ बदलाव लोकल मेमोरी में सुरक्षित हैं।\nCloud सिंक में समस्या: " + e.message);
        }
    } else {
        alert("✅ बदलाव लोकल मेमोरी में सुरक्षित कर लिए गए हैं।\nCloud sync के लिए API URL डालें।");
    }
}

function saveApiUrl() {
    const url = document.getElementById('api-url').value;
    if (url) {
        localStorage.setItem('census_api_url', url);
        alert("API लिंक सुरक्षित हो गया है। अब डेटा सिंक करें।");
    }
}

async function forceCloudSync() {
    const apiUrl = localStorage.getItem('census_api_url') || DEFAULT_API_URL;
    if (!apiUrl) {
        alert("पहले API लिंक डालें!");
        return;
    }

    const valuesOnly = {};
    taskData.forEach(cat => {
        cat.tasks.forEach(t => {
            const { id, name, type, ...values } = t;
            valuesOnly[id] = values;
        });
    });

    try {
        await fetch(apiUrl, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify({ values: valuesOnly })
        });
        alert("डेटा क्लाउड (Google Sheets) पर भेज दिया गया है!");
    } catch (e) {
        console.error(e);
        alert("सिंक करने में एरर आया। कृपया URL चेक करें।");
    }
}

// XML Generation logic removed

// 5. Reset Data
function resetData() {
    if (confirm("क्या आप डेटा को रीसेट करना चाहते हैं? (इससे आपकी लोकल प्रोग्रेस हट जाएगी)")) {
        localStorage.removeItem('census_tasks_values');
        location.reload();
    }
}

function exportToJSON() {
    const valuesOnly = {};
    taskData.forEach(cat => {
        cat.tasks.forEach(t => {
            const { id, name, type, ...values } = t;
            valuesOnly[id] = values;
        });
    });
    const blob = new Blob([JSON.stringify({ values: valuesOnly }, null, 4)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'census_backup.json';
    a.click();
    URL.revokeObjectURL(url);
    alert("डाटा बैकअप (JSON) जनरेट हो गया है।");
}

// Start sequence
// Toggle Handlers for Click-to-Update UI
function toggleUserGroupStep(id, key) {
    taskData.forEach(cat => {
        cat.tasks.forEach(t => {
            if (t.id === id) {
                t[key] = t[key] === 'purn' ? 'lambit' : 'purn';
            }
        });
    });
    calculateOverallProgress();
    renderPage();
}

function toggleBatchStep(id, bIdx, step) {
    taskData.forEach(cat => {
        cat.tasks.forEach(t => {
            if (t.id === id) {
                t.batchList[bIdx][step] = t.batchList[bIdx][step] === 'purn' ? 'lambit' : 'purn';
            }
        });
    });
    calculateOverallProgress();
    renderPage();
}

// 7. Generate Formal Report (प्रतिवेदन)
function generateReport() {
    const today = new Date();
    const dateStr = today.toLocaleDateString('hi-IN', { year: 'numeric', month: 'long', day: 'numeric' });
    
    // Calculate overall progress
    let totalP = 0, totalT = 0;
    taskData.forEach(cat => {
        cat.tasks.forEach(t => {
            if (t.type === 'counter') { totalT++; totalP += (t.completed / t.total) || 0; }
            else if (t.type === 'map-stats') { totalT++; totalP += (t.checked / t.total) || 0; }
            else if (t.type === 'training-summary') { totalT++; totalP += (t.completedBatches / t.totalBatches) || 0; }
            else if (t.type === 'logistics-checklist') {
                ['internet','sound','food','water'].forEach(k => { totalT++; if(t[k]==='purn') totalP++; });
            } else if (t.type === 'user-group') {
                const keys = ['niyukti','hlbAlloc','idCard','mapDistrib','reserveId'];
                if (t.id === 'sup1') keys.push('circleAlloc','pragnakAlloc');
                else keys.push('alloc');
                keys.forEach(k => { totalT++; if(t[k]==='purn') totalP++; });
            } else if (t.type === 'training-logistics') {
                ['centerSelection','permissionLetter'].forEach(k => { totalT++; if(t[k]==='purn') totalP++; });
            } else if (t.type !== 'info' && t.type !== 'cell-info' && t.type !== 'training-centers') {
                totalT++; if(t.status === 'purn') totalP++;
            }
        });
    });
    const overallPercent = totalT > 0 ? Math.round((totalP / totalT) * 100) : 0;

    // Build category-wise report
    let categoryReports = '';
    let catIndex = 1;

    taskData.forEach(cat => {
        let catName = cat.category;
        let taskLines = '';
        let taskNum = 1;

        cat.tasks.forEach(t => {
            if (t.type === 'info' || t.type === 'training-centers') return;

            let statusText = '';
            if (t.type === 'counter') {
                const pct = Math.round((t.completed / t.total) * 100);
                statusText = `कुल ${t.total} में से ${t.completed} पूर्ण (${pct}%)`;
            } else if (t.type === 'map-stats') {
                statusText = `कुल ${t.total} में से ${t.checked} जांच पूर्ण। सही: ${t.correct}, गलत: ${t.incorrect}`;
            } else if (t.type === 'user-group') {
                const keys = t.id === 'sup1' 
                    ? ['niyukti','circleAlloc','pragnakAlloc','hlbAlloc','idCard','mapDistrib','reserveId']
                    : ['niyukti','alloc','hlbAlloc','idCard','mapDistrib','reserveId'];
                const done = keys.filter(k => t[k] === 'purn').length;
                statusText = `कुल: ${t.totalCount}, रिजर्व: ${t.reserveCount}, पोर्टल अपलोड: ${t.uploadedCount}/${t.totalCount}। चरण पूर्ण: ${done}/${keys.length}`;
            } else if (t.type === 'training-summary') {
                statusText = `कुल बैच: ${t.totalBatches}, पूर्ण: ${t.completedBatches}, कुल उपस्थिति: ${t.totalAttended}`;
            } else if (t.type === 'training-logistics') {
                const s1 = t.centerSelection === 'purn' ? 'पूर्ण' : 'लंबित';
                const s2 = t.permissionLetter === 'purn' ? 'पूर्ण' : 'लंबित';
                statusText = `केंद्र चयन: ${s1}, अनुमति पत्र: ${s2}`;
            } else if (t.type === 'logistics-checklist') {
                const items = [
                    { label: 'इंटरनेट', key: 'internet' },
                    { label: 'साउंड/माइक', key: 'sound' },
                    { label: 'भोजन', key: 'food' },
                    { label: 'पेयजल', key: 'water' }
                ];
                statusText = items.map(i => `${i.label}: ${t[i.key] === 'purn' ? '✅ पूर्ण' : '⏳ लंबित'}`).join(', ');
            } else if (t.type === 'cell-info') {
                statusText = `कार्मिक: ${t.staffCount}, कंप्यूटर: ${t.computers}, प्रिंटर: ${t.printers}`;
            } else {
                const label = t.status === 'purn' ? '✅ पूर्ण' : t.status === 'apurn' ? '⚠️ अपूर्ण' : '⏳ लंबित';
                statusText = `स्थिति: ${label}`;
            }

            const dlText = t.deadline ? ` (समय सीमा: ${t.deadline})` : '';
            taskLines += `<tr><td style="padding:6px 10px; border:1px solid #ccc; text-align:center;">${catIndex}.${taskNum}</td><td style="padding:6px 10px; border:1px solid #ccc;">${t.name}${dlText}</td><td style="padding:6px 10px; border:1px solid #ccc;">${statusText}</td></tr>`;
            taskNum++;
        });

        if (taskLines) {
            categoryReports += `
                <tr style="background:#e8f0fe;">
                    <td colspan="3" style="padding:8px 10px; border:1px solid #ccc; font-weight:bold; font-size:14px;">
                        ${catIndex}. ${catName}
                    </td>
                </tr>
                ${taskLines}
            `;
            catIndex++;
        }
    });

    const reportHTML = `
    <!DOCTYPE html>
    <html lang="hi">
    <head>
        <meta charset="UTF-8">
        <title>प्रतिवेदन - जनगणना 2027</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700&display=swap');
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Noto Sans Devanagari', sans-serif; padding: 40px; color: #1a1a1a; font-size: 13px; line-height: 1.8; }
            .header { text-align: center; border-bottom: 3px double #1a1a1a; padding-bottom: 15px; margin-bottom: 20px; }
            .header h1 { font-size: 20px; color: #1a237e; }
            .header h2 { font-size: 16px; color: #333; margin-top: 5px; }
            .meta { display: flex; justify-content: space-between; margin-bottom: 20px; }
            .meta div { font-size: 13px; }
            .subject { text-align: center; font-weight: 700; font-size: 15px; margin: 15px 0; padding: 8px; background: #f5f5f5; border-radius: 5px; }
            .body-text { text-align: justify; margin-bottom: 15px; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 12px; }
            th { background: #1a237e; color: white; padding: 8px 10px; border: 1px solid #ccc; text-align: left; }
            .progress-box { text-align: center; margin: 20px 0; padding: 15px; background: linear-gradient(135deg, #e8f5e9, #f1f8e9); border-radius: 10px; border: 2px solid #4caf50; }
            .progress-box .pct { font-size: 36px; font-weight: 700; color: #2e7d32; }
            .signature { margin-top: 50px; display: flex; justify-content: space-between; }
            .signature div { text-align: center; min-width: 200px; }
            .signature .line { border-top: 1px solid #333; margin-top: 40px; padding-top: 5px; }
            @media print { body { padding: 20px; font-size: 12px; } .no-print { display: none; } }
        </style>
    </head>
    <body>
        <button class="no-print" onclick="window.print()" style="position:fixed; top:15px; right:15px; padding:10px 25px; background:#1a237e; color:white; border:none; border-radius:8px; font-size:14px; cursor:pointer; font-family:inherit; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">🖨️ प्रिंट करें</button>

        <div class="header">
            <h1>कार्यालय चार्ज अधिकारी, जनगणना 2027</h1>
            <h2>भिनाय ब्लॉक, जिला अजमेर (राजस्थान)</h2>
        </div>

        <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
            <div><strong>पत्रांक:</strong> भिनाय/जनगणना/2027/</div>
            <div style="text-align:right;"><strong>दिनांक:</strong> ${dateStr}</div>
        </div>

        <div class="meta">
            <div><strong>सेवा में,</strong><br>श्रीमान तहसीलदार महोदय,<br>तहसील भिनाय, जिला अजमेर</div>
        </div>

        <div class="subject">विषय: जनगणना 2027 की पूर्व तैयारी का प्रगति प्रतिवेदन</div>

        <div class="body-text">
            <p>महोदय,</p>
            <p>सविनय निवेदन है कि जनगणना 2027 की पूर्व तैयारी के संबंध में भिनाय ब्लॉक की वर्तमान प्रगति का विस्तृत प्रतिवेदन निम्नानुसार प्रस्तुत है:</p>
        </div>

        <div class="progress-box">
            <div>समग्र प्रगति (Overall Progress)</div>
            <div class="pct">${overallPercent}%</div>
        </div>

        <h3 style="margin:15px 0 5px; color:#1a237e;">📋 श्रेणी-वार विस्तृत विवरण:</h3>
        <table>
            <thead>
                <tr>
                    <th style="width:60px;">क्र.सं.</th>
                    <th>कार्य विवरण</th>
                    <th style="width:35%;">स्थिति / प्रगति</th>
                </tr>
            </thead>
            <tbody>
                ${categoryReports}
            </tbody>
        </table>

        <div class="body-text" style="margin-top:20px;">
            <p>अतः उपरोक्त प्रतिवेदन आपकी सेवा में सादर प्रस्तुत है। कृपया अवलोकन कर आवश्यक दिशा-निर्देश प्रदान करने की कृपा करें।</p>
            <p>सधन्यवाद।</p>
        </div>

        <div class="signature">
            <div>
                <div class="line">चार्ज अधिकारी<br>जनगणना 2027, भिनाय ब्लॉक</div>
            </div>
            <div>
                <div class="line">तहसीलदार<br>तहसील भिनाय, जिला अजमेर</div>
            </div>
        </div>
    </body>
    </html>`;

    const reportWindow = window.open('', '_blank');
    reportWindow.document.write(reportHTML);
    reportWindow.document.close();
}

// Final Start Sequence
loadData();
