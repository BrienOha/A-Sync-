// public/js/login.js
import { supabase } from './config/supabaseClient.js';
import { showToast } from './utils/uiHelpers.js';

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. HANDLE GOOGLE LOGIN ---
    const googleBtn = document.querySelector('.google-btn');
    
    if (googleBtn) {
        googleBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            // Trigger Supabase OAuth
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    // Redirects back to your dashboard after Google approves
                    redirectTo: `${window.location.origin}/dashboard.html`
                }
            });

            if (error) {
                showErrorToast(error.message);
            }
        });
    }

    // --- 2. HANDLE FORGOT PASSWORD ---
    const forgotBtn = document.getElementById('forgotPasswordBtn');
    if (forgotBtn) {
        forgotBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            // 1. Get email from the input field
            const emailInput = document.querySelector('input[name="email"]');
            const email = emailInput.value.trim();

            if (!email) {
                showToast("Please enter your email address in the field above first.");
                emailInput.focus();
                return;
            }

            // 2. Send Reset Email
            const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
                // Redirect them to a special page to type new password
                redirectTo: `${window.location.origin}/update-password.html`,
            });

            if (error) {
                showErrorToast("Error: " + error.message);
            } else {
                showToast(`Password reset link sent to ${email}. Check your inbox (and spam folder).`);
            }
        });
    }

    // --- 2. HANDLE MANUAL LOGIN ---
    const loginForm = document.querySelector('form');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Get values from input fields
            const email = loginForm.querySelector('input[name="email"]').value;
            const password = loginForm.querySelector('input[name="password"]').value;
            const submitBtn = loginForm.querySelector('button[type="submit"]');

            // UI Feedback
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing In...';
            submitBtn.disabled = true;

            try {
                // Attempt Login
                const { data, error } = await supabase.auth.signInWithPassword({
                    email: email,
                    password: password
                });

                if (error) throw error;

                // Success: Redirect
                window.location.href = "/dashboard.html";

            } catch (err) {
                showErrorToast(err.message);
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }
});

// Helper for Login Page Toasts (Simple version)
function showErrorToast(msg) {
    showToast(msg); // You can replace this with your nice toast UI if you import uiHelpers.js
}