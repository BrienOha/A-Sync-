/**
 * MAIN ENTRY POINT
 * Coordinates global behavior and attaches module functions to the UI.
 */
import { supabase } from './config/supabaseClient.js';
import { handleLogout } from './modules/auth/logout.js';

// --- 1. GLOBAL STATE & NAVIGATION ---

// Handle Logout globally
window.logoutUser = async () => {
    const { error } = await supabase.auth.signOut(); //
    if (!error) {
        window.location.href = "/login.html"; //
    }
};

// --- 2. GLOBAL EVENT DELEGATION ---

document.addEventListener('DOMContentLoaded', () => {
    console.log("DTR System Initialized...");

    // Global Toast Closer (optional)
    document.addEventListener('click', (e) => {
        if (e.target.closest('.toast')) {
            e.target.closest('.toast').remove();
        }
    });

    // Sidebar Mobile Toggle (If your CSS has a 'mobile-open' class)
    const menuBtn = document.getElementById('menuBtn');
    const sidebar = document.querySelector('.sidebar');
    if (menuBtn && sidebar) {
        menuBtn.onclick = () => sidebar.classList.toggle('active');
    }
});

// --- 3. UTILITY HELPERS ---

// A global helper to format currency or dates used in multiple pages
window.formatSimpleDate = (date) => {
    return new Date(date).toLocaleDateString();
};