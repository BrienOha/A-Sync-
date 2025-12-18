// public/js/utils/renderers.js
import { formatTime } from './formatters.js';
import { getBadgeHTML } from './uiHelpers.js';

// --- STATS CARDS ---
export function renderStats(data, userRole, systemUsers = []) {
    const statsGrid = document.getElementById('statsGrid');
    if (!statsGrid) return;

    let html = '';

    // 1. TEACHER VIEW
    if (userRole === 'Teacher') {
        const myPending = data.filter(d => d.status === 'Pending').length;
        const myVerified = data.filter(d => d.status === 'Approved').length;
        
        html = `
            <div class="stat-card">
                <div><span class="text-muted"><i class="fas fa-clock"></i> Pending DTRs</span><h1 class="stat-value text-warning">${myPending}</h1></div>
            </div>
            <div class="stat-card">
                <div><span class="text-muted"><i class="fas fa-check-double"></i> Verified Logs</span><h1 class="stat-value text-success">${myVerified}</h1></div>
            </div>`;
    } 
    // 2. ADMIN VIEW
    else if (userRole === 'Admin') {
        const userCount = systemUsers.length;
        const pendingDTR = data.filter(d => d.status === 'Pending').length;
        const verifiedDTR = data.filter(d => d.status === 'Approved').length;

        html = `
            <div class="stat-card">
                <div><span class="text-muted"><i class="fas fa-users"></i> Total Users</span><h1 class="stat-value" style="color: var(--primary)">${userCount}</h1></div>
            </div>
            <div class="stat-card">
                <div><span class="text-muted"><i class="fas fa-clock"></i> Pending DTRs</span><h1 class="stat-value text-warning">${pendingDTR}</h1></div>
            </div>
            <div class="stat-card">
                <div><span class="text-muted"><i class="fas fa-check-double"></i> Verified Logs</span><h1 class="stat-value text-success">${verifiedDTR}</h1></div>
            </div>`;
    }
    // 3. HEAD VIEW
    else {
        const totalPending = data.filter(d => d.status === 'Pending').length;
        const totalVerified = data.filter(d => d.status === 'Approved').length;
        
        html = `
            <div class="stat-card">
                <div><span class="text-muted"><i class="fas fa-clock"></i> Pending DTRs</span><h1 class="stat-value text-warning">${totalPending}</h1></div>
            </div>
            <div class="stat-card">
                <div><span class="text-muted"><i class="fas fa-check-double"></i> Verified Logs</span><h1 class="stat-value text-success">${totalVerified}</h1></div>
            </div>`;
    }

    statsGrid.innerHTML = html;
}

// --- TEACHER HISTORY TABLE ---
export function renderHistoryTable(data) {
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

// --- ADMIN/HEAD APPROVAL TABLE ---
export function renderApprovalTable(data) {
    const tbody = document.getElementById('approvalTableBody');
    if (!tbody) return;

    const pendingData = data.filter(d => d.status === 'Pending');

    if (pendingData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No pending approvals</td></tr>';
        return;
    }

    tbody.innerHTML = pendingData.map(row => {
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
                    <button onclick="window.processDTR('${row.id}', 'Approved')" class="btn-icon btn-approve" title="Approve"><i class="fas fa-check"></i></button>
                    <button onclick="window.processDTR('${row.id}', 'Rejected')" class="btn-icon btn-reject" title="Reject"><i class="fas fa-times"></i></button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

// --- REPORTS TABLE ---
export function renderReportTable(data) {
    const tbody = document.getElementById('reportTableBody');
    if (!tbody) return;

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

// --- USER MANAGEMENT TABLE ---
export function renderUserTable(users) {
    const tbody = document.getElementById('userTableBody');
    if(!tbody) return;
    
    tbody.innerHTML = users.map(u => `
        <tr>
            <td>
                <div class="flex items-center gap-2">
                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(u.full_name)}&background=random" style="width:32px;height:32px;border-radius:50%">
                    <div><b>${u.full_name}</b><br><small style="color:var(--text-muted)">${u.email}</small></div>
                </div>
            </td>
            <td>${u.department || '-'}</td>
            <td>${u.role}</td>
            <td class="text-center">
                <button onclick="window.handleDeleteUser('${u.id}')" class="btn-icon" style="color:red" title="Delete User"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}