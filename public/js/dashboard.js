// 1. IMPORTS
import { supabase } from './config/supabaseClient.js';
import { fetchLogs, submitLogEntry, updateLogStatus } from './services/dtrServices.js';
import { fetchAllUsers, createSystemUser, deleteSystemUser } from './services/userServices.js';
import { showToast } from './utils/uiHelpers.js';
import { logoutUser } from './services/authServices.js';
import { formatTime } from './utils/formatters.js';
import { 
    renderStats, renderHistoryTable, renderApprovalTable, 
    renderReportTable, renderUserTable 
} from './utils/renderer.js';

// 2. GLOBAL STATE
let currentUser = { id: null, name: "Loading...", email: "", role: "", picture: "" };
window.dbData = [];
window.systemUsers = [];

// 3. INITIALIZATION
async function init() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { window.location.href = '/login.html'; return; }

    try {
        // Fetch Profile
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();

        // Set State
        currentUser.id = session.user.id;
        currentUser.email = session.user.email;
        currentUser.name = profile?.full_name || session.user.user_metadata.full_name || "User"; 
        currentUser.role = profile?.role || 'Teacher'; 
        currentUser.picture = profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=random&color=fff`;

        // Update UI Headers
        document.getElementById("profileName").innerText = currentUser.name;
        document.getElementById("profileRole").innerText = currentUser.role;
        const profilePic = document.getElementById("profilePic");
        if (profilePic) {
            profilePic.src = currentUser.picture;
            profilePic.onerror = function() { this.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=random&color=fff`; };
        }

        // Setup Sidebar & Load Initial Data
        renderSidebar();
        
        if (currentUser.role === 'Admin') await loadUserManagement();
        await loadData();
        
        showSection('home');

    } catch (err) {
        console.error("Init failed:", err);
        showToast("Failed to load profile", "error");
    }
}

// 4. LOAD DATA
async function loadData() {
    const { data, error } = await fetchLogs(currentUser.role, currentUser.id);
    if (error) return showToast(error.message, "error");

    window.dbData = data; 
    renderStats(data, currentUser.role, window.systemUsers);
    const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    document.getElementById('currentDate').innerText = currentDate;

    if (currentUser.role === 'Teacher') {
        renderHistoryTable(data);
    } else {
        renderApprovalTable(data);
        renderReportTable(data);
    }
}

async function loadUserManagement() {
    try {
        const users = await fetchAllUsers();
        window.systemUsers = users;
        renderStats(window.dbData || [], currentUser.role, users);
        renderUserTable(users);
    } catch (err) {
        console.error("User load error:", err);
    }
}

// 5. ACTION HANDLERS (The Buttons)

// -- DTR --
async function submitDTR(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    
    const date = document.getElementById('dtrDate').value;
    const timeIn = document.getElementById('dtrTimeIn').value;
    const timeOut = document.getElementById('dtrTimeOut').value;
    
    if (!date || !timeIn || !timeOut) return showToast("Please complete date and time fields.", "error");

    try {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
        btn.disabled = true;

        const formData = {
            date: date, timeIn: timeIn, timeOut: timeOut,
            mode: document.getElementById('dtrMode').value,
            remarks: document.getElementById('dtrRemarks').value,
        };
        const file = document.getElementById('dtrProof').files[0];

        await submitLogEntry(currentUser.id, formData, file);
        showToast("Entry submitted successfully!", "success");
        document.getElementById('dtrForm').reset();
        
        await loadData();
        showSection('history');

    } catch (err) {
        showToast("Submission failed: " + err.message, "error");
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// -- Approvals --
async function processDTR(id, status) {
    let comment = "";
    if (status === 'Rejected') {
        comment = prompt("Reason for rejection?");
        if (!comment || comment.trim() === "") return showToast("Rejection reason is required.", "error");
    }

    try {
        await updateLogStatus(id, status, comment);
        showToast(`Entry ${status}`, status === 'Approved' ? 'success' : 'error');
        await loadData();
    } catch (err) {
        showToast("Action failed: " + err.message, "error");
    }
}

// -- User Management --
async function handleCreateUser(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;

    try {
        const userData = {
            fullName: document.getElementById('newFullName').value,
            email: document.getElementById('newEmail').value,
            password: 'password123',
            role: document.getElementById('newRole').value,
            dept: document.getElementById('newDept').value
        };
        await createSystemUser(userData);
        showToast("User created successfully!");
        closeUserModal();
        await loadUserManagement();
    } catch (err) {
        showToast(err.message, "error");
    } finally {
        btn.disabled = false;
    }
};

async function handleDeleteUser(id) {
    if(!confirm("Permanently delete this user?")) return;
    try {
        await deleteSystemUser(id);
        showToast("User deleted.");
        await loadUserManagement();
    } catch (err) {
        showToast(err.message, "error");
    }
};

// -- Export --
function exportToExcel() {
    const dataToExport = window.dbData ? window.dbData.filter(d => d.status === 'Approved') : [];
    if (dataToExport.length === 0) return showToast("No verified records to export.", "error");

    let csvContent = "data:text/csv;charset=utf-8,Date,Name,Time In,Time Out,Mode,Remarks,Status\n";
    dataToExport.forEach(row => {
        const name = row.profiles?.full_name || 'Unknown';
        const remarks = (row.remarks || '').replace(/,/g, ' '); 
        csvContent += `${row.date},${name},${row.time_in},${row.time_out},${row.mode},${remarks},${row.status}\n`;
    });

    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `A_SYNC_Report.csv`;
    link.click();
}

// 6. UI HELPERS (Sidebar & Modals)

function renderSidebar() {
    const nav = document.getElementById('sidebarNav');
    nav.innerHTML = '';
    
    let links = [{ id: 'home', icon: 'fa-home', label: 'Dashboard' }];

    if (currentUser.role === 'Teacher') {
        links.push({ id: 'entry', icon: 'fa-clock', label: 'Submit DTR' });
        links.push({ id: 'history', icon: 'fa-history', label: 'My History' });
    } else if (currentUser.role === 'Head') {
        links.push({ id: 'approval', icon: 'fa-check-circle', label: 'Approvals' });
        links.push({ id: 'reports', icon: 'fa-file-alt', label: 'Dept. Reports' });
    } else if (currentUser.role === 'Admin') {
        links.push({ id: 'users', icon: 'fa-users', label: 'Manage Users' });
        links.push({ id: 'approval', icon: 'fa-check-circle', label: 'Approvals' });
        links.push({ id: 'reports', icon: 'fa-file-csv', label: 'Reports & Export' });
    }

    links.forEach(link => {
        const btn = document.createElement('button');
        btn.className = 'nav-btn';
        btn.id = `btn-${link.id}`;
        btn.onclick = () => showSection(link.id);
        btn.innerHTML = `<i class="fas ${link.icon}"></i> ${link.label}`;
        nav.appendChild(btn);
    });
}

function showSection(id) {
    document.querySelectorAll('.section-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    const target = document.getElementById(id);
    if(target) target.classList.add('active');
    
    const activeBtn = document.getElementById('btn-' + id);
    if(activeBtn) activeBtn.classList.add('active');

    const titles = { home: 'System Overview', entry: 'Submit Daily Time Record', history: 'My Submission History', approval: 'Pending Approvals', reports: 'System Reports', users: 'User Management' };
    document.getElementById('pageTitle').innerText = titles[id] || 'Dashboard';
}

function addUserPrompt() { document.getElementById('userModal').style.display = 'flex'; }
function closeUserModal() { 
    document.getElementById('userModal').style.display = 'none';
    document.getElementById('addUserForm').reset();
}
window.onclick = function(event) { if (event.target === document.getElementById('userModal')) closeUserModal(); };

document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    try {
        await logoutUser();
        window.location.href = "/login.html";
    } catch (err) {
        console.error("Logout failed:", err);
    }
});

// 7. WINDOW EXPORTS
window.submitDTR = submitDTR;
window.processDTR = processDTR;
window.exportToExcel = exportToExcel;
window.handleCreateUser = handleCreateUser;
window.handleDeleteUser = handleDeleteUser;
window.addUserPrompt = addUserPrompt;
window.closeUserModal = closeUserModal;

document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.location.href = "/login.html";
});

// START
init();