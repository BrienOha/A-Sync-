// backend/controllers/authController.js
const supabase = require('../config/supabase');

exports.manualLogin = async (req, res) => {
    const { email, password } = req.body;

    // 1. Sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        return res.redirect(`/login.html?error=${encodeURIComponent(error.message)}`);
    }

    // 2. Get Profile Data (Optional, for name/role)
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

    // 3. Redirect to Dashboard
    // CRITICAL: We pass the Access Token so the Frontend can "hydrate" the session
    const params = new URLSearchParams({
        uid: data.user.id,
        name: profile?.full_name || email,
        role: profile?.role || 'Teacher',
        access_token: data.session.access_token, // Pass token to frontend
        refresh_token: data.session.refresh_token
    });

    res.redirect(`/dashboard.html?${params.toString()}`);
};

exports.logout = async (req, res) => {
    // If you are using server-side sessions, destroy them here.
    // Since we are moving to Supabase (Stateless), we just redirect.
    req.logout(() => {
        res.redirect("/login.html");
    });
};