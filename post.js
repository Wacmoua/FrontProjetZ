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

async function fetchData() {
    try {
        if (!(await checkToken())) {
            return;
        }

        const token = await getToken();
        console.log("Token value:", token);
        console.log("Fetching data...");

        const response = await fetch("http://localhost:5000/post", {
            headers: {
                'Authorization': `${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log("API Response:", response);

        if (!response.ok) {
            if (response.status === 401) {
                console.error("Erreur d'authentification. Vérifiez le token.");
            } else {
                console.error("Erreur lors de la récupération des données:", response.statusText);
            }
            return;
        }

        const data = await response.json();

        // Retourner les données des posts plutôt que de stocker dans une variable globale
        return data;
    } catch (error) {
        console.error("Erreur lors de la récupération des données:", error);
    }
}

async function addPost(event) {
    event.preventDefault();

    const messageInput = document.getElementById("newPostMessage");
    const message = messageInput.value;

    if (!(await checkToken())) {
        return;
    }

    const token = localStorage.getItem('token');

    try {
        const token = await getToken();
        const response = await fetch("http://localhost:5000/post", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `${token}`,
            },
            body: JSON.stringify({
                message,
            }),
        });

        const newPost = await response.json();

        // Utiliser la fonction fetchData pour obtenir les données mises à jour des posts
        fetchData().then((data) => {
            displayPosts(data);
        });

        // Effacer le champ du formulaire
        messageInput.value = "";
    } catch (error) {
        console.error("Erreur lors de l'ajout du post:", error);
    }
}

async function likePost(postId) {
    const token = await getToken();
    console.log("Token value:", token);

    if (!token) {
        console.error("Token d'utilisateur manquant. L'utilisateur doit être connecté pour aimer un post.");
        return;
    }

    try {
        // Décoder le token JWT pour récupérer l'ID de l'utilisateur
        const decodedToken = jwt_decode(token);
        const userId = decodedToken.sub;

        const response = await fetch(
            `http://localhost:5000/post/like-post/${postId}`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `${token}`,
                },
                body: JSON.stringify({ userId }),
            }
        );

        const updatedPost = await response.json();
        console.log("Post liked:", updatedPost);

        // Mettez à jour votre interface utilisateur en conséquence
        displayPosts([updatedPost]); // Mettez à jour le post existant
    } catch (error) {
        console.error("Erreur lors du like du post:", error);
    }
}

const newPostForm = document.createElement("form");
newPostForm.classList.add("mb-3");
newPostForm.innerHTML = `
    <div class="form-group">
        <textarea class="form-control" rows="2" id="newPostMessage" placeholder="Écrire un nouveau post"></textarea>
    </div>
    <button type="button" class="btn btn-primary" id="postButton">Poster</button>
`;

// Ajouter le formulaire au conteneur des posts une seule fois
const postContainer = document.getElementById("postContainer");
postContainer.appendChild(newPostForm);

// Ajouter l'écouteur d'événement en dehors de la fonction
const postButton = document.getElementById("postButton");
if (postButton) {
    postButton.addEventListener("click", addPost);
}

async function getLikersUsernames(likers) {
    const token = await getToken();
    console.log("Token value:", token);

    if (!token) {
        console.error("Token d'utilisateur manquant. L'utilisateur doit être connecté pour récupérer les likers.");
        return '';
    }

    try {
        const response = await fetch("http://localhost:5000/user/usernames", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `${token}`,
            },
            body: JSON.stringify({
                userIds: likers,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Erreur lors de la récupération des noms d'utilisateur des likers:", data.message);
            return '';
        }

        return data.usernames.join(', ');
    } catch (error) {
        console.error("Erreur lors de la récupération des noms d'utilisateur des likers:", error);
        return '';
    }
}