
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
        const token = localStorage.getItem('token');
        console.log("Token value:", token);

        if (!token) {
            console.error("Token d'utilisateur manquant. L'utilisateur doit être connecté pour récupérer les données.");
            return;
        }
        console.log("Token avant la requête /post:", token);

        try {
            // Vérifiez si la réponse du serveur est correcte avant de la décoder
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
            console.log("Données récupérées:", data);

            // Retourner les données des posts plutôt que de stocker dans une variable globale
            return data;
        } catch (error) {
            console.error("Erreur lors de la récupération des données:", error);
        }
    } catch (error) {
        console.error("Erreur générale lors de la récupération des données:", error);
    }
}

async function displayPosts(posts) {
    const postContainer = document.getElementById("postContainer");

    posts.forEach((post) => {
        const postElement = document.createElement("div");
        postElement.classList.add("col-md-8", "offset-md-2", "mb-3");

        postElement.innerHTML = `
            <div class="card">
                <div class="card-body">
                    <p class="card-text">${post.message}</p>
                    <p class="card-text">
                        <small class="text-muted">${post.author}</small></br>
                        <small class="text-muted">${post.createdAt}</small></br>
                        <small class="text-muted-likers likers">Liked by: ${post.likers.map(liker => liker.username).join(', ')}</small>
                    </p>
                    <button class="btn btn-primary like-button" data-post-id="${post._id}">Like</button>
                </div>
                
                <!-- Ajout du formulaire de commentaire -->
                <form class="card-footer">
                    <div class="form-group">
                        <textarea class="form-control" rows="1" placeholder="Commenter"></textarea>
                    </div>
                    <button type="submit" class="btn btn-primary">Comment'</button>
                </form>
            </div>
        `;

        postContainer.appendChild(postElement);

        const likeButton = postElement.querySelector(".like-button");
        if (likeButton) {
            likeButton.addEventListener("click", async () => {
                const postId = likeButton.getAttribute("data-post-id");
                await likePost(postId);
            });
        }

        // Afficher les noms d'utilisateur des likers
        const likersElement = postElement.querySelector(".text-muted-likers");
        console.log("Likers data:", post.likers);
        likersElement.innerHTML = post.likers.map(liker => liker.username).join(', ');
    });
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
                "Authorization": `Bearer ${token}`,
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
                    "Authorization": `Bearer ${token}`,
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
                "Authorization": `Bearer ${token}`,
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

export { getToken, checkToken, fetchData, addPost, likePost, getLikersUsernames, displayPosts };