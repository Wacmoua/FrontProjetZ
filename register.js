


document.getElementById("registerForm").addEventListener("submit", registerUser);

async function registerUser(event) {
    event.preventDefault();

    const usernameInput = document.getElementById("registerUsername");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("registerPassword");

    const username = usernameInput.value;
    const email = emailInput.value;
    const password = passwordInput.value;

    try {
        const response = await fetch("http://localhost:5000/auth/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                username,
                email,
                password,
            }),
        });

        const data = await response.json();
        console.log("Inscription réussie:", data);

        // Appel de la fonction pour afficher la fenêtre modale
        handleSuccessfulRegistration();

        // Vous pouvez rediriger l'utilisateur ou effectuer d'autres actions après l'inscription réussie
    } catch (error) {
        console.error("Erreur lors de l'inscription:", error);
    }
}


function handleSuccessfulRegistration() {
    // Sélectionnez votre fenêtre modale par son ID
    const registrationSuccessModal = new bootstrap.Modal(document.getElementById('registrationSuccessModal'));

    // Affichez la fenêtre modale
    registrationSuccessModal.show();
}