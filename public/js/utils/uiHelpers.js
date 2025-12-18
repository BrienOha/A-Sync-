export function showToast(msg, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const div = document.createElement('div');
    div.className = `toast toast-${type}`;
    div.innerHTML = `<span>${msg}</span>`;
    container.appendChild(div);
    setTimeout(() => div.remove(), 3000);
}

export function getBadgeHTML(status) {
    const classes = { 'Approved': 'badge-verified', 'Rejected': 'badge-rejected', 'Pending': 'badge-pending' };
    return `<span class="badge ${classes[status] || 'badge-pending'}">${status}</span>`;
}