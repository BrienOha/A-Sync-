/**
 * SCHOOL DTR DASHBOARD LOGIC
 * Handles Role-based access, DTR submission, Approvals, and Reporting.
 */

// --- 1. INITIALIZATION & SETUP ---

// Get User Data from URL (sent by server.js)
const params = new URLSearchParams(window.location.search);
const user = {
    name: params.get("name") || "Guest User",
    email: params.get("email") || "guest@school.edu",
    role: params.get("role") || "Teacher", // Options: Teacher, Head, Admin
    picture: params.get("picture") || ""
};

// State Management (LocalStorage for persistence)
let dbData = JSON.parse(localStorage.getItem('dtrData')) || [];

// DOM Elements
const dom = {
    profileName: document.getElementById("profileName"),
    profileRole: document.getElementById("profileRole"),
    profilePic: document.getElementById("profilePic"),
    currentDate: document.getElementById("currentDate"),
    sidebarNav: document.getElementById('sidebarNav'),
    statsGrid: document.getElementById('statsGrid'),
    pageTitle: document.getElementById('pageTitle'),
    toastContainer: document.getElementById('toast-container'),
    // Tables
    historyBody: document.getElementById('historyTableBody'),
    approvalBody: document.getElementById('approvalTableBody'),
    reportBody: document.getElementById('reportTableBody')
};

// Initialize Dashboard
function init() {
    // Set Profile Info
    dom.profileName.innerText = user.name;
    dom.profileRole.innerText = user.role;
    dom.profilePic.src = user.picture || `https://ui-avatars.com/api/?name=${user.name}&background=random`;
    dom.currentDate.innerText = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' });

    renderSidebar();
    showSection('home'); // Default view
    updateStats();
}

// --- 2. NAVIGATION & UI RENDERING ---

function renderSidebar() {
    dom.sidebarNav.innerHTML = '';
    
    // Define Links based on Role
    let links = [{ id: 'home', icon: 'fa-home', label: 'Dashboard' }];

    if (user.role === 'Teacher') {
        links.push({ id: 'entry', icon: 'fa-clock', label: 'Submit DTR' });
        links.push({ id: 'history', icon: 'fa-history', label: 'My History' });
    } 
    else if (user.role === 'Head') {
        links.push({ id: 'approval', icon: 'fa-check-circle', label: 'Approvals' });
        links.push({ id: 'reports', icon: 'fa-file-alt', label: 'Dept. Reports' });
    } 
    else if (user.role === 'Admin') {
        links.push({ id: 'users', icon: 'fa-users', label: 'Manage Users' });
        links.push({ id: 'approval', icon: 'fa-check-circle', label: 'Approvals' });
        links.push({ id: 'reports', icon: 'fa-file-csv', label: 'Reports & Export' });
    }

    // Render HTML
    links.forEach(link => {
        const btn = document.createElement('button');
        btn.className = 'nav-btn';
        btn.id = `btn-${link.id}`;
        btn.onclick = () => showSection(link.id);
        btn.innerHTML = `<i class="fas ${link.icon}"></i> ${link.label}`;
        dom.sidebarNav.appendChild(btn);
    });
}

function showSection(id) {
    // Handle CSS classes
    document.querySelectorAll('.section-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(id).classList.add('active');
    const activeBtn = document.getElementById('btn-' + id);
    if(activeBtn) activeBtn.classList.add('active');

    // Update Title
    const titles = { 
        home: 'System Overview', 
        entry: 'Submit Daily Time Record', 
        history: 'My Submission History', 
        approval: 'Pending Approvals', 
        reports: 'System Reports', 
        users: 'User Management' 
    };
    dom.pageTitle.innerText = titles[id] || 'Dashboard';

    // Refresh Data
    renderData();
    updateStats();
}

// --- 3. DTR SUBMISSION MODULE ---

function submitDTR(e) {
    e.preventDefault();
    
    const date = document.getElementById('dtrDate').value;
    const timeIn = document.getElementById('dtrTimeIn').value;
    const timeOut = document.getElementById('dtrTimeOut').value;
    const mode = document.getElementById('dtrMode').value;
    const remarks = document.getElementById('dtrRemarks').value;
    const fileInput = document.getElementById('dtrProof');

    // Validation
    if (!date || !timeIn || !timeOut) return showToast("Please fill in Date, Time In, and Time Out", "error");

    // Simulate File Upload (Just getting the name)
    let fileName = "No file attached";
    if(fileInput.files.length > 0) {
        fileName = fileInput.files[0].name;
    }

    const newEntry = {
        id: Date.now(),
        name: user.name,
        email: user.email,
        picture: user.picture,
        date: date,
        timeIn: timeIn,
        timeOut: timeOut,
        mode: mode,
        remarks: remarks,
        proof: fileName,
        status: "Pending",
        adminComment: "" // New field for feedback
    };

    dbData.unshift(newEntry);
    saveData();
    
    showToast("DTR Submitted Successfully!", "success");
    document.getElementById('dtrForm').reset();
    showSection('history'); // Redirect user to history
}

// --- 4. APPROVAL & VERIFICATION MODULE ---

function renderData() {
    // Clear Tables
    if(dom.historyBody) dom.historyBody.innerHTML = "";
    if(dom.approvalBody) dom.approvalBody.innerHTML = "";
    if(dom.reportBody) dom.reportBody.innerHTML = "";

    dbData.forEach(row => {
        const badge = getBadgeHTML(row.status);
        
        // 1. MY HISTORY TABLE (Teacher View)
        if (row.email === user.email && dom.historyBody) {
            let adminFeedback = row.adminComment ? `<br><small class="text-danger"><i class="fas fa-comment"></i> ${row.adminComment}</small>` : '';
            
            dom.historyBody.innerHTML += `
                <tr>
                    <td>
                        <div style="font-weight:600">${row.date}</div>
                        <div style="font-size:0.85rem; color:var(--text-muted)">${formatTime(row.timeIn)} - ${formatTime(row.timeOut)}</div>
                    </td>
                    <td>
                        <b>${row.mode}</b>
                        ${row.proof !== 'No file attached' ? `<div style="font-size:0.8rem;color:var(--primary)"><i class="fas fa-paperclip"></i> ${row.proof}</div>` : ''}
                    </td>
                    <td>
                        ${row.remarks}
                        ${adminFeedback}
                    </td>
                    <td class="text-center">${badge}</td>
                </tr>
            `;
        }

        // 2. APPROVAL TABLE (Admin/Head View) - Only Pending
        if ((user.role === 'Admin' || user.role === 'Head') && row.status === 'Pending' && dom.approvalBody) {
            dom.approvalBody.innerHTML += `
                <tr>
                    <td>
                        <div class="flex items-center gap-2">
                            <img src="${row.picture}" style="width:36px;height:36px;border-radius:50%">
                            <div><b>${row.name}</b><br><small style="color:#777">${row.email}</small></div>
                        </div>
                    </td>
                    <td>
                        <div>${row.date}</div>
                        <small>${formatTime(row.timeIn)} - ${formatTime(row.timeOut)}</small>
                        <div style="font-weight:600; font-size:0.85rem; margin-top:4px">${row.mode}</div>
                    </td>
                    <td>
                        <i>"${row.remarks}"</i>
                        ${row.proof !== 'No file attached' ? `<div style="margin-top:5px; font-size:0.8rem; padding:2px 8px; background:#f3f4f6; border-radius:4px; display:inline-block"><i class="fas fa-file-image"></i> ${row.proof}</div>` : ''}
                    </td>
                    <td class="text-center">
                        <div class="flex justify-center gap-2">
                            <button onclick="processDTR(${row.id}, 'Approved')" class="btn-icon btn-approve" title="Approve">
                                <i class="fas fa-check"></i>
                            </button>
                            <button onclick="processDTR(${row.id}, 'Rejected')" class="btn-icon btn-reject" title="Reject with Comment">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </td>
                </tr>`;
        }

        // 3. REPORTS TABLE (Approved Only)
        if ((user.role === 'Admin' || user.role === 'Head') && row.status === 'Approved' && dom.reportBody) {
            dom.reportBody.innerHTML += `
                <tr>
                    <td>${row.date}</td>
                    <td><b>${row.name}</b></td>
                    <td>${row.mode} <small>(${formatTime(row.timeIn)} - ${formatTime(row.timeOut)})</small></td>
                    <td class="text-center"><span class="badge badge-verified">Verified</span></td>
                </tr>
            `;
        }
    });
}

function processDTR(id, status) {
    const entryIndex = dbData.findIndex(d => d.id === id);
    if (entryIndex === -1) return;

    let comment = "";

    // Requirement: Comments on rejection
    if (status === 'Rejected') {
        comment = prompt("Reason for rejection? (Required)");
        if (!comment) return showToast("Rejection cancelled. Comment required.", "error");
    } else {
        // Optional comment for approval
        // comment = prompt("Add a note? (Optional)"); 
    }

    dbData[entryIndex].status = status;
    dbData[entryIndex].adminComment = comment || "";
    
    saveData();
    showToast(`Entry ${status}`, status === 'Approved' ? 'success' : 'error');
    
    renderData();
    updateStats();
}

// --- 5. REPORTING & EXPORT MODULE ---

function exportToExcel() {
    // Filter only approved data for export
    const approvedData = dbData.filter(d => d.status === 'Approved');
    
    if(approvedData.length === 0) return showToast("No verified data to export.", "error");

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Date,Teacher Name,Email,Time In,Time Out,Mode,Remarks,Status\n";

    approvedData.forEach(row => {
        const rowStr = `${row.date},${row.name},${row.email},${row.timeIn},${row.timeOut},${row.mode},"${row.remarks}",${row.status}`;
        csvContent += rowStr + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "dtr_report_" + new Date().toISOString().slice(0,10) + ".csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast("Report downloaded successfully!", "success");
}

// --- 6. UTILITIES ---

function updateStats() {
    // Calculate counts
    const myPending = dbData.filter(d => d.email === user.email && d.status === 'Pending').length;
    const myVerified = dbData.filter(d => d.email === user.email && d.status === 'Approved').length;
    
    const totalPending = dbData.filter(d => d.status === 'Pending').length;
    const totalVerified = dbData.filter(d => d.status === 'Approved').length;

    // Render Stats HTML based on Role
    let html = '';
    
    if (user.role === 'Teacher') {
        html = `
            <div class="stat-card"><div><span class="text-muted">My Pending</span><h1 class="stat-value">${myPending}</h1></div></div>
            <div class="stat-card"><div><span class="text-muted">My Verified</span><h1 class="stat-value text-success">${myVerified}</h1></div></div>
        `;
    } else {
        html = `
            <div class="stat-card"><div><span class="text-muted">Total Users</span><h1 class="stat-value">25</h1></div></div>
            <div class="stat-card"><div><span class="text-muted">System Pending</span><h1 class="stat-value text-warning">${totalPending}</h1></div></div>
            <div class="stat-card"><div><span class="text-muted">System Verified</span><h1 class="stat-value text-success">${totalVerified}</h1></div></div>
        `;
    }
    
    dom.statsGrid.innerHTML = html;
}

function saveData() {
    localStorage.setItem('dtrData', JSON.stringify(dbData));
}

function showToast(msg, type = 'success') {
    const div = document.createElement('div');
    div.className = `toast toast-${type}`;
    div.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> <span>${msg}</span>`;
    dom.toastContainer.appendChild(div);
    setTimeout(() => {
        div.style.animation = 'slideIn 0.3s reverse forwards';
        setTimeout(() => div.remove(), 300);
    }, 3000);
}

function getBadgeHTML(status) {
    if (status === 'Approved') return `<span class="badge badge-verified">Verified</span>`;
    if (status === 'Rejected') return `<span class="badge badge-rejected">Rejected</span>`;
    return `<span class="badge badge-pending">Pending</span>`;
}

// Simple time formatter (24h to 12h)
function formatTime(timeStr) {
    if(!timeStr) return "";
    const [hour, minute] = timeStr.split(":");
    const h = parseInt(hour);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minute} ${ampm}`;
}

// Start
init();