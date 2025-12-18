import { supabase } from '../config/supabaseClient.js';

export async function fetchLogs(userRole, userId) {
    let query = supabase.from('dtr_logs').select(`
        *,
        profiles:user_id ( full_name, email )
    `).order('date', { ascending: false });

    if (userRole === 'Teacher') {
        query = query.eq('user_id', userId);
    }
    
    return await query;
}

export async function submitLogEntry(userId, formData, file) {
    let proofUrl = null;

    if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}.${fileExt}`;
        const { error: uploadErr } = await supabase.storage.from('proofs').upload(fileName, file);
        if (uploadErr) throw uploadErr;
        
        const { data } = supabase.storage.from('proofs').getPublicUrl(fileName);
        proofUrl = data.publicUrl;
    }

    return await supabase.from('dtr_logs').insert([{
        user_id: userId,
        date: formData.date,
        time_in: formData.timeIn,
        time_out: formData.timeOut,
        mode: formData.mode,
        remarks: formData.remarks,
        proof_url: proofUrl
    }]);
}

export async function updateLogStatus(id, status, comment) {
    return await supabase
        .from('dtr_logs')
        .update({ status: status, admin_comment: comment })
        .eq('id', id);
}