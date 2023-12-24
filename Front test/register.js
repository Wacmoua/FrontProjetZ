


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

        if (response.ok) {
            console.log("Inscription réussie:", data);
            // Appel de la fonction pour afficher la fenêtre modale
            handleSuccessfulRegistration();
        } else {
            console.error("Erreur lors de l'inscription:", data.message);

            // Afficher le message d'erreur à l'utilisateur
            alert(data.message); // Tu peux utiliser une fenêtre modale Bootstrap ici si tu préfères
        }

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

async function getToken() {
    return localStorage.getItem('token');
}

async function checkToken() {
    const token = await getToken();

    if (!token) {
        console.error("Token d'utilisateur manquant. L'utilisateur doit être connecté pour récupérer les données.");
        return false;
    }

    return true;
}

    document.getElementById("manage-account-tab").addEventListener("click", manageAccount);
   

    async function manageAccount() {
      // Ouvre la fenêtre modale pour gérer le compte
      const accountModal = new bootstrap.Modal(document.getElementById('accountModal'));
      accountModal.show();
  }

  document.getElementById("deleteAccountForm").addEventListener("submit", function (event) {
    event.preventDefault(); 
    console.log("Suppression de compte en cours...");
    deleteAccount(); 
});

async function deleteAccount() {
    try {
        const token = await getToken();
      const response = await fetch("http://localhost:5000/auth/delete-account", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          
           "Authorization": ` ${token}`,
        },
      });
  
      const data = await response.json();
  
      if (response.ok) {
        console.log("Compte supprimé :", data.message);
        alert("Compte supprimé avec succès.");
        location.reload();
        // Redirige l'utilisateur ou effectue d'autres actions après la suppression du compte
      } else {
        console.error("Erreur lors de la suppression du compte :", data.error);
        // Affiche un message d'erreur à l'utilisateur
        alert(data.error);
      }
    } catch (error) {
      console.error("Erreur lors de la suppression du compte :", error);
    }
  }
  
// Ajoute un écouteur d'événements pour la soumission du formulaire
document.getElementById("updateProfileForm").addEventListener("submit", async function(event) {
  event.preventDefault(); // Empêche le comportement par défaut du formulaire (rechargement de la page)

  // Récupére les valeurs du formulaire
  const nouveauNomUtilisateur = document.getElementById("newUsername").value;
  const nouveauMotDePasse = document.getElementById("newPassword").value;

  // Appele la fonction updateProfile avec les valeurs du formulaire
  await updateProfile(nouveauNomUtilisateur, nouveauMotDePasse);
});

// Fonction pour mettre à jour le profil
async function updateProfile(username, newPassword) {
  try {
      const token = await getToken();
      const response = await fetch("http://localhost:5000/auth/update-profile", {
          method: "PUT",
          headers: {
              "Content-Type": "application/json",
              "Authorization": ` ${token}`,
          },
          body: JSON.stringify({ username, newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
          console.log("Profil mis à jour :", data.message);

          alert("Profil mis à jour avec succès!");
          location.reload();
        
      } else {
          console.error("Erreur lors de la mise à jour du profil :", data.error);
          // Affiche un message d'erreur à l'utilisateur
          alert(data.error);
      }
  } catch (error) {
      console.error("Erreur lors de la mise à jour du profil :", error);
  }
}

