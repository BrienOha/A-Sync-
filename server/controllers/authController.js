exports.manualLogin = (req, res) => {
    const { email, password } = req.body;

    if (email === "admin@school.edu" && password === "admin123") {
        const redirectURL = `/dashboard.html?name=System Admin&email=admin@school.edu&role=Admin&picture=https://ui-avatars.com/api/?name=Admin&background=4F46E5&color=fff`;
        return res.redirect(redirectURL);
    } 
    else if (email === "head@school.edu" && password === "head123") {
        const redirectURL = `/dashboard.html?name=Dept. Head&email=head@school.edu&role=Head&picture=https://ui-avatars.com/api/?name=Head&background=DB2777&color=fff`;
        return res.redirect(redirectURL);
    }
    else {
        const redirectURL = `/dashboard.html?name=Teacher User&email=${email}&role=Teacher&picture=https://ui-avatars.com/api/?name=Teacher&background=random`;
        return res.redirect(redirectURL);
    }
};

exports.googleCallback = (req, res) => {
    const user = req.user;
    let role = "Teacher";
    if(user.emails[0].value.includes("admin")) role = "Admin";

    const redirectURL = `/dashboard.html?name=${encodeURIComponent(user.displayName)}&email=${encodeURIComponent(user.emails[0].value)}&picture=${encodeURIComponent(user.photos[0].value)}&role=${role}`;
    res.redirect(redirectURL);
};

exports.logout = (req, res) => {
    req.logout(() => res.redirect("/login.html"));
};