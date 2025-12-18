const supabaseAdmin = require('../config/supabaseAdmin');

exports.createUser = async (req, res) => {
    const { email, password, fullName, role, dept } = req.body;
    let newUserId = null;
    let isRecovery = false;

    try {
        console.log(`Attempting to create user: ${email}...`);

        // --- STEP 1: Try to Create the Auth User ---
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: password || 'password123',
            email_confirm: true,
            user_metadata: { full_name: fullName }
        });

        if (authError) {
            // CRITICAL FIX: If user exists, find them instead of crashing
            if (authError.message.includes("already been registered")) {
                console.log("User exists in Auth. Attempting to recover ID to fix missing profile...");
                
                // Fetch the list of users to find the matching email
                const { data: userList, error: listError } = await supabaseAdmin.auth.admin.listUsers();
                if (listError) throw listError;

                const existingUser = userList.users.find(u => u.email === email);
                if (!existingUser) throw new Error("Could not recover user ID even though email exists.");
                
                newUserId = existingUser.id;
                isRecovery = true; // Mark as recovery mode
            } else {
                // Some other real error occurred
                throw authError;
            }
        } else {
            // Normal creation success
            newUserId = authData.user.id;
        }

        console.log(`Target User ID: ${newUserId} (Recovery Mode: ${isRecovery})`);

        // --- STEP 2: Create/Update the Profile ---
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

        console.log("Success! Profile linked.");
        res.json({ success: true, message: isRecovery ? "User recovered and profile fixed!" : "User created successfully" });

    } catch (err) {
        console.error("FINAL ERROR:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        await supabaseAdmin.auth.admin.deleteUser(id);
        // Cascade should handle profile, but we delete just in case
        await supabaseAdmin.from('profiles').delete().eq('id', id);
        res.json({ success: true, message: "User deleted" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};