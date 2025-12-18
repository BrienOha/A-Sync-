import { supabase } from '../config/supabaseClient.js';

// READ: Fetch users directly from DB (Allowed by RLS for Admins)
export async function fetchAllUsers() {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');
    
    if (error) throw error;
    return data;
}

// WRITE: Call our Node Backend to create user
export async function createSystemUser(userData) {
    const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
    });
    
    const result = await response.json();
    if (!result.success) throw new Error(result.error);
    return result;
}

// DELETE: Call Node Backend
export async function deleteSystemUser(userId) {
    const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE'
    });
    
    const result = await response.json();
    if (!result.success) throw new Error(result.error);
    return result;
}