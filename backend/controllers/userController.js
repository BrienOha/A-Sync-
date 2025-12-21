const supabaseAdmin = require('../config/supabaseAdmin');

exports.createUser = async (req, res) => {
    const { email, fullName, role, dept } = req.body;
    // Note: We ignore the 'password' from the frontend because the user will set it themselves.

    try {
        console.log(`Inviting user: ${email}...`);

        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
            email, 
            { 
                data: { full_name: fullName },
                redirectTo: 'http://localhost:3000/update-password.html' 
            }
        );

        if (authError) throw authError;

        const newUserId = authData.user.id;
        console.log(`Invite sent (ID: ${newUserId}). Creating/Updating profile...`);

        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
                id: newUserId,
                email: email,
                full_name: fullName,
                role: role,
                department: dept,
                updated_at: new Date()
            });

        if (profileError) {
            throw new Error(`Profile Error: ${profileError.message}`);
        }

        console.log("Success! Invite sent and Profile created.");
        res.json({ success: true, message: "Invitation sent! User must verify email to login." });

    } catch (err) {
        console.error("Invite Error:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        await supabaseAdmin.auth.admin.deleteUser(id);
        await supabaseAdmin.from('profiles').delete().eq('id', id);
        res.json({ success: true, message: "User deleted" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};