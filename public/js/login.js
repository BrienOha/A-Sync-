import { loginUser, loginWithGoogle, sendPasswordReset } from './services/authServices.js';
import { showToast } from './utils/uiHelpers.js';

document.addEventListener('DOMContentLoaded', () => {

    // 1. GOOGLE LOGIN
    const googleBtn = document.querySelector('.google-btn');
    if (googleBtn) {
        googleBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                await loginWithGoogle();
            } catch (err) {
                showToast("Google Login Error: " + err.message);
            }
        });
    }

    // 2. MANUAL LOGIN
    const loginForm = document.querySelector('form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = loginForm.querySelector('input[name="email"]').value;
            const password = loginForm.querySelector('input[name="password"]').value;
            const btn = loginForm.querySelector('button');

            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing In...';
            btn.disabled = true;

            try {
                await loginUser(email, password);
                window.location.href = "/dashboard.html";
            } catch (err) {
                showToast(err.message);
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        });
    }

    // 3. FORGOT PASSWORD
    const forgotBtn = document.getElementById('forgotPasswordBtn');
    if (forgotBtn) {
        forgotBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const email = document.querySelector('input[name="email"]').value;
            
            if (!email) {
                showToast("Please enter your email address in the field above first.");
                return;
            }

            try {
                await sendPasswordReset(email);
                showToast(`Password reset link sent to ${email}.`);
            } catch (err) {
                showToast("Error: " + err.message);
            }
        });
    }
});