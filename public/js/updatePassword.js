import { updateUserPassword } from './services/authServices.js';
import { showToast } from './utils/uiHelpers.js';

document.getElementById('updatePasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const newPassword = document.getElementById('newPassword').value;
    const btn = e.target.querySelector('button');

    btn.disabled = true;
    btn.innerHTML = "Updating...";

    try {
        await updateUserPassword(newPassword);
        showToast("Password updated successfully! PLease sign in again.");
        window.location.href = "/login.html";
    } catch (err) {
        showToast("Error: " + err.message);
        btn.disabled = false;
        btn.innerHTML = "Update Password";
    }
});