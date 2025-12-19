import { supabase } from './config/supabaseClient.js';
import { showToast } from './utils/uiHelpers.js';

// Supabase handles the session exchange automatically via URL hash

document.getElementById('updatePasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const newPassword = document.getElementById('newPassword').value;
    const btn = e.target.querySelector('button');

    btn.disabled = true;
    btn.innerHTML = "Updating...";

    // Update the user's password
    const { data, error } = await supabase.auth.updateUser({
        password: newPassword
    });

    if (error) {
        showToast("Error: " + error.message);
        btn.disabled = false;
        btn.innerHTML = "Update Password";
    } else {
        showToast("Password updated successfully! Please sign in again.");
        window.location.href = "/login.html";
    }
});