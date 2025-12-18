// public/js/dashboard.js
import { fetchLogs, submitLogEntry, updateLogStatus } from './services/dtrServices.js';
import { formatTime } from './utils/formatters.js';
import { showToast, getBadgeHTML } from './utils/uiHelpers.js';
import { fetchAllUsers, createSystemUser, deleteSystemUser } from './services/userServices.js';
import { supabase } from './config/supabaseClient.js';

// Get Current User Info
const params = new URLSearchParams(window.location.search);
let currentUser = {
    id: null,
    name: "Loading...",
    email: "",
    role: "" // Will be set from DB
};

// --- INITIALIZATION ---
async function init() {
    // A. Check for active session
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        window.location.href = '/login.html';
        return;
    }

    // B. Fetch Real User Profile from Database
    try {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
        
        if (error && error.code !== 'PGRST116') {
             console.error("Profile fetch error:", error);
        }

        // C. Update Global State
        currentUser.id = session.user.id;
        currentUser.email = session.user.email;
        currentUser.name = profile?.full_name || session.user.user_metadata.full_name || "User"; 
        currentUser.role = profile?.role || 'Teacher'; 
        
        // --- ADD THIS NEW LINE FOR PICTURE ---
        // Use profile picture OR generate one based on initials
        currentUser.picture = profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=random&color=fff`;

        // D. Update UI Header
        document.getElementById("profileName").innerText = currentUser.name;
        document.getElementById("profileRole").innerText = currentUser.role;
        
        // --- ADD THIS TO FIX THE BROKEN IMAGE ---
        const profilePic = document.getElementById("profilePic");
        if (profilePic) {
            profilePic.src = currentUser.picture;
            // logic to hide broken image if it fails loading
            profilePic.onerror = function() { 
                this.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=random&color=fff`; 
            };
        }

        // E. Render Role-Based Elements
        renderSidebar();
        
        // Inside init() function
        if (currentUser.role === 'Admin') {
            loadUserManagement();
            loadData(); 
        } else if (currentUser.role === 'Head') {
            // Heads don't manage users, but they need to see Data
            loadData(); 
        } else {
            // Teachers
            loadData();
        }

        showSection('home'); 

    } catch (err) {
        console.error("Init failed:", err);
        showToast("Failed to load profile", "error");
    }
}

function renderSidebar() {
    const nav = document.getElementById('sidebarNav');
    if (!nav) return;
    nav.innerHTML = '';
    
    // Define Links based on Role
    let links = [{ id: 'home', icon: 'fa-home', label: 'Dashboard' }];

    if (currentUser.role === 'Teacher') {
        links.push({ id: 'entry', icon: 'fa-clock', label: 'Submit DTR' });
        links.push({ id: 'history', icon: 'fa-history', label: 'My History' });
    } 
    else if (currentUser.role === 'Head') {
        links.push({ id: 'approval', icon: 'fa-check-circle', label: 'Approvals' });
        links.push({ id: 'reports', icon: 'fa-file-alt', label: 'Dept. Reports' });
    } 
    else if (currentUser.role === 'Admin') {
        links.push({ id: 'users', icon: 'fa-users', label: 'Manage Users' });
        links.push({ id: 'approval', icon: 'fa-check-circle', label: 'Approvals' });
        links.push({ id: 'reports', icon: 'fa-file-csv', label: 'Reports & Export' });
    }

    // Render HTML
    links.forEach(link => {
        const btn = document.createElement('button');
        btn.className = 'nav-btn';
        btn.id = `btn-${link.id}`;
        // Create click handler
        btn.onclick = () => showSection(link.id);
        btn.innerHTML = `<i class="fas ${link.icon}"></i> ${link.label}`;
        nav.appendChild(btn);
    });
}

// Expose showSection to window just in case HTML needs it
function showSection(id) {
    // 1. Hide all sections
    document.querySelectorAll('.section-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    // 2. Show target section
    const target = document.getElementById(id);
    if(target) target.classList.add('active');
    
    // 3. Highlight Sidebar Button
    const activeBtn = document.getElementById('btn-' + id);
    if(activeBtn) activeBtn.classList.add('active');

    // 4. Update Header Title
    const titles = { 
        home: 'System Overview', 
        entry: 'Submit Daily Time Record', 
        history: 'My Submission History', 
        approval: 'Pending Approvals', 
        reports: 'System Reports', 
        users: 'User Management' 
    };
    const titleEl = document.getElementById('pageTitle');
    if(titleEl) titleEl.innerText = titles[id] || 'Dashboard';
}

// Expose showSection to window just in case HTML needs it
window.showSection = showSection;

function renderUserTable(users) {
    const tbody = document.getElementById('userTableBody');
    if(!tbody) return;
    
    tbody.innerHTML = users.map(u => `
        <tr>
            <td><b>${u.full_name}</b><br><small>${u.email}</small></td>
            <td>${u.department || '-'}</td>
            <td>${u.role}</td>
            <td class="text-center">
                <button onclick="window.handleDeleteUser('${u.id}')" class="btn-icon" style="color:red"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

async function loadUserManagement() {
    try {
        const users = await fetchAllUsers();

        window.systemUsers = users; // Save users to global scope
        renderStats(window.dbData || []); // Refresh stats immediately

        renderUserTable(users);
    } catch (err) {
        console.error("User load error:", err);
        showToast("Failed to load users", "error");
    }
}

// Expose handlers to global window for HTML onclick attributes
window.handleCreateUser = async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;

    try {
        const userData = {
            fullName: document.getElementById('newFullName').value,
            email: document.getElementById('newEmail').value,
            password: 'password123', // Default password or add input for it
            role: document.getElementById('newRole').value,
            dept: document.getElementById('newDept').value
        };

        await createSystemUser(userData);
        showToast("User created successfully!");
        document.getElementById('userModal').style.display = 'none';
        document.getElementById('addUserForm').reset();
        loadUserManagement(); // Refresh table
    } catch (err) {
        showToast(err.message, "error");
    } finally {
        btn.disabled = false;
    }
};

window.handleDeleteUser = async (id) => {
    if(!confirm("Permanently delete this user?")) return;
    try {
        await deleteSystemUser(id);
        showToast("User deleted.");
        loadUserManagement();
    } catch (err) {
        showToast(err.message, "error");
    }
};

// --- VIEW LOGIC ---
async function loadData() {
    // Fetch data
    const { data, error } = await fetchLogs(currentUser.role, currentUser.id);
    
    if (error) {
        showToast(error.message, "error");
        return;
    }

    // Save to global variable for Export feature
    window.dbData = data; 

    // Render Stats
    renderStats(data);

    // Render Tables based on Role
    if (currentUser.role === 'Teacher') {
        renderHistoryTable(data);
    } 
    else {
        // Admins and Heads see these
        renderApprovalTable(data);
        renderReportTable(data);
    }
}

function renderHistoryTable(data) {
    const tbody = document.getElementById('historyTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = data.map(row => `
        <tr>
            <td>
                <div style="font-weight:600">${row.date}</div>
                <div style="font-size:0.85rem; color:#6b7280">${formatTime(row.time_in)} - ${formatTime(row.time_out)}</div>
            </td>
            <td>
                <b>${row.mode}</b>
                ${row.proof_url ? `<a href="${row.proof_url}" target="_blank" style="font-size:0.8rem;display:block">View Proof</a>` : ''}
            </td>
            <td>${row.remarks || '-'}</td>
            <td class="text-center">${getBadgeHTML(row.status)}</td>
        </tr>
    `).join('');
}

// --- INTERACTION LOGIC ---
function setupEventListeners() {
    const form = document.getElementById('dtrForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = form.querySelector('button');
            btn.innerHTML = 'Submitting...';
            btn.disabled = true;

            try {
                const formData = {
                    date: document.getElementById('dtrDate').value,
                    timeIn: document.getElementById('dtrTimeIn').value,
                    timeOut: document.getElementById('dtrTimeOut').value,
                    mode: document.getElementById('dtrMode').value,
                    remarks: document.getElementById('dtrRemarks').value,
                };
                const file = document.getElementById('dtrProof').files[0];

                await submitLogEntry(currentUser.id, formData, file);
                showToast("Submitted successfully!");
                form.reset();
                loadData(); // Refresh table
            } catch (err) {
                showToast(err.message, "error");
            } finally {
                btn.innerHTML = 'Submit Entry';
                btn.disabled = false;
            }
        });
    }
}

function renderStats(data) {
    const statsGrid = document.getElementById('statsGrid');
    if (!statsGrid) return;

    // 1. TEACHER VIEW (My Stats)
    if (currentUser.role === 'Teacher') {
        const myPending = data.filter(d => d.status === 'Pending').length;
        const myVerified = data.filter(d => d.status === 'Approved').length;
        
        statsGrid.innerHTML = `
            <div class="stat-card">
                <div>
                    <span class="text-muted"><i class="fas fa-clock"></i> Pending DTRs</span>
                    <h1 class="stat-value text-warning">${myPending}</h1>
                </div>
            </div>
            <div class="stat-card">
                <div>
                    <span class="text-muted"><i class="fas fa-check-double"></i> Verified Logs</span>
                    <h1 class="stat-value text-success">${myVerified}</h1>
                </div>
            </div>
        `;
    } 
    // 2. ADMIN VIEW (System Stats)
    else if (currentUser.role === 'Admin') {
        const userCount = window.systemUsers ? window.systemUsers.length : 0;
        const pendingDTR = data.filter(d => d.status === 'Pending').length;
        const verifiedDTR = data.filter(d => d.status === 'Approved').length;

        statsGrid.innerHTML = `
            <div class="stat-card">
                <div>
                    <span class="text-muted"><i class="fas fa-users"></i> Total Users</span>
                    <h1 class="stat-value" style="color: var(--primary)">${userCount}</h1>
                </div>
            </div>
            <div class="stat-card">
                <div>
                    <span class="text-muted"><i class="fas fa-clock"></i> Pending DTRs</span>
                    <h1 class="stat-value text-warning">${pendingDTR}</h1>
                </div>
            </div>
            <div class="stat-card">
                <div>
                    <span class="text-muted"><i class="fas fa-check-double"></i> Verified Logs</span>
                    <h1 class="stat-value text-success">${verifiedDTR}</h1>
                </div>
            </div>
        `;
    }
    // 3. HEAD VIEW (Dept Stats - No user count needed)
    else {
        const totalPending = data.filter(d => d.status === 'Pending').length;
        const totalVerified = data.filter(d => d.status === 'Approved').length;
        
        statsGrid.innerHTML = `
            <div class="stat-card">
                <div>
                    <span class="text-muted"><i class="fas fa-clock"></i> Pending DTRs</span>
                    <h1 class="stat-value text-warning">${totalPending}</h1>
                </div>
            </div>
            <div class="stat-card">
                <div>
                    <span class="text-muted"><i class="fas fa-check-double"></i> Verified Logs</span>
                    <h1 class="stat-value text-success">${totalVerified}</h1>
                </div>
            </div>
        `;
    }
}

// --- LOGOUT LOGIC ---

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        // 1. Sign out from Supabase
        const { error } = await supabase.auth.signOut();
        
        if (error) console.error("Logout error:", error);

        // 2. Redirect to Login Page
        window.location.href = "/login.html";
    });
}

// --- MODAL LOGIC (Add this to the bottom) ---

function addUserPrompt() {
    const modal = document.getElementById('userModal');
    if (modal) modal.style.display = 'flex';
}

function closeUserModal() {
    const modal = document.getElementById('userModal');
    if (modal) {
        modal.style.display = 'none';
        // Optional: Reset form when closing
        const form = document.getElementById('addUserForm');
        if (form) form.reset();
    }
}

// Close modal when clicking outside the box
window.onclick = function(event) {
    const modal = document.getElementById('userModal');
    if (event.target === modal) {
        closeUserModal();
    }
};

// --- SUBMIT DTR LOGIC ---
async function submitDTR(e) {
    e.preventDefault();
    
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    
    // 1. Validation
    const date = document.getElementById('dtrDate').value;
    const timeIn = document.getElementById('dtrTimeIn').value;
    const timeOut = document.getElementById('dtrTimeOut').value;
    
    if (!date || !timeIn || !timeOut) {
        showToast("Please complete date and time fields.", "error");
        return;
    }

    try {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
        btn.disabled = true;

        // 2. Prepare Data
        const formData = {
            date: date,
            timeIn: timeIn,
            timeOut: timeOut,
            mode: document.getElementById('dtrMode').value,
            remarks: document.getElementById('dtrRemarks').value,
        };
        const file = document.getElementById('dtrProof').files[0];

        // 3. Send to Supabase (via dtrService)
        await submitLogEntry(currentUser.id, formData, file);

        // 4. Success UI
        showToast("Entry submitted successfully!", "success");
        document.getElementById('dtrForm').reset();
        
        // 5. Refresh Data & Redirect
        await loadData();
        showSection('history');

    } catch (err) {
        console.error(err);
        showToast("Submission failed: " + err.message, "error");
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// --- APPROVAL LOGIC (Heads & Admins) ---
// --- APPROVAL LOGIC (Heads & Admins) ---
async function processDTR(id, status) {
    let comment = "";
    
    // If rejecting, require a reason
    if (status === 'Rejected') {
        comment = prompt("Reason for rejection?");
        if (comment === null) return; // Cancelled
        if (comment.trim() === "") {
            showToast("Rejection reason is required.", "error");
            return;
        }
    }

    try {
        // Call Service
        await updateLogStatus(id, status, comment);
        
        showToast(`Entry ${status}`, status === 'Approved' ? 'success' : 'error');
        
        // Refresh Tables
        await loadData();
        
    } catch (err) {
        console.error(err);
        showToast("Action failed: " + err.message, "error");
    }
}

// --- EXPORT LOGIC ---
function exportToExcel() {
    // Use the global variable we set in loadData()
    const dataToExport = window.dbData ? window.dbData.filter(d => d.status === 'Approved') : [];

    if (dataToExport.length === 0) {
        showToast("No verified records to export.", "error");
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Date,Name,Time In,Time Out,Mode,Remarks,Status\n";

    dataToExport.forEach(row => {
        const name = row.profiles?.full_name || 'Unknown';
        // Clean remarks to remove commas (which break CSVs)
        const remarks = (row.remarks || '').replace(/,/g, ' '); 
        
        const rowStr = `${row.date},${name},${row.time_in},${row.time_out},${row.mode},${remarks},${row.status}`;
        csvContent += rowStr + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "A_SYNC_Report.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
}

// --- RENDER APPROVAL TABLE (Heads/Admins) ---
function renderApprovalTable(data) {
    const tbody = document.getElementById('approvalTableBody');
    if (!tbody) return;

    // Filter: Only Pending items
    const pendingData = data.filter(d => d.status === 'Pending');

    if (pendingData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No pending approvals</td></tr>';
        return;
    }

    tbody.innerHTML = pendingData.map(row => {
        // Handle missing profile data gracefully
        const name = row.profiles?.full_name || 'Unknown User';
        const email = row.profiles?.email || 'No Email';
        const pic = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;

        return `
        <tr>
            <td>
                <div class="flex items-center gap-2">
                    <img src="${pic}" style="width:36px;height:36px;border-radius:50%">
                    <div><b>${name}</b><br><small style="color:var(--text-muted)">${email}</small></div>
                </div>
            </td>
            <td>
                <div>${row.date}</div>
                <small>${formatTime(row.time_in)} - ${formatTime(row.time_out)}</small>
                <div style="font-weight:600; font-size:0.85rem; margin-top:4px">${row.mode}</div>
            </td>
            <td>
                <i>"${row.remarks || ''}"</i>
                ${row.proof_url ? `<a href="${row.proof_url}" target="_blank" class="btn-secondary" style="font-size:0.7rem; padding:2px 5px; margin-left:5px;"><i class="fas fa-image"></i> View Proof</a>` : ''}
            </td>
            <td class="text-center">
                <div class="flex justify-center gap-2">
                    <button onclick="window.processDTR('${row.id}', 'Approved')" class="btn-icon btn-approve" title="Approve">
                        <i class="fas fa-check"></i>
                    </button>
                    <button onclick="window.processDTR('${row.id}', 'Rejected')" class="btn-icon btn-reject" title="Reject">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

// --- RENDER REPORTS TABLE (Heads/Admins) ---
function renderReportTable(data) {
    const tbody = document.getElementById('reportTableBody');
    if (!tbody) return;

    // Filter: Only Approved items
    const approvedData = data.filter(d => d.status === 'Approved');

    if (approvedData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No verified records found</td></tr>';
        return;
    }

    tbody.innerHTML = approvedData.map(row => {
        const name = row.profiles?.full_name || 'Unknown';
        return `
        <tr>
            <td>${row.date}</td>
            <td><b>${name}</b></td>
            <td>${row.mode} <small>(${formatTime(row.time_in)} - ${formatTime(row.time_out)})</small></td>
            <td class="text-center"><span class="badge badge-verified">Verified</span></td>
        </tr>`;
    }).join('');
}

window.addUserPrompt = addUserPrompt;
window.closeUserModal = closeUserModal;
window.submitDTR = submitDTR;
window.processDTR = processDTR;
window.exportToExcel = exportToExcel;

// Start
init();