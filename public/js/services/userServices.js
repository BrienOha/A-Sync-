import { supabase } from '../config/supabaseClient.js';
export async function fetchAllUsers() {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');
    
    if (error) throw error;
    return data;
}

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

export async function deleteSystemUser(userId) {
    const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE'
    });
    
    const result = await response.json();
    if (!result.success) throw new Error(result.error);
    return result;
}