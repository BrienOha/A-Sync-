// client-side validation for manual login
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.querySelector('form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            const email = document.querySelector('input[name="email"]').value;
            if (!email.includes('@school.edu')) {
                alert("Please use your school email address.");
                // Optional: e.preventDefault(); // Stop submission if invalid
            }
        });
    }
});