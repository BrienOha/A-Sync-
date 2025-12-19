// public/js/services/authService.js
import { supabase } from '../config/supabaseClient.js';

export async function loginUser(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });
    if (error) throw error;
    return data;
}

export async function loginWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${window.location.origin}/dashboard.html`
        }
    });
    if (error) throw error;
}

export async function logoutUser() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

export async function sendPasswordReset(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password.html`,
    });
    if (error) throw error;
}

export async function updateUserPassword(newPassword) {
    const { error } = await supabase.auth.updateUser({
        password: newPassword
    });
    if (error) throw error;
}