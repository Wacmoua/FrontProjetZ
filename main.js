let userInfo;

document.getElementById("loginForm").addEventListener("submit", loginUser);



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

async function loginUser(event) {
    event.preventDefault();

    const usernameInput = document.getElementById("loginUsername");
    const passwordInput = document.getElementById("loginPassword");

    const username = usernameInput.value;
    const password = passwordInput.value;

    try {
        const response = await fetch("http://localhost:5000/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                username,
                password,
            }),
        });

        if (response.ok) {
            const data = await response.json();
            console.log("Connexion réussie:", data);

            // Assurez-vous que la propriété 'token' existe dans la réponse
            if (data.token) {
                console.log("Token reçu lors de la connexion:", data.token);

                // Stockez le token dans une variable
                const token = data.token;

                // Stockez le token dans le stockage local
                localStorage.setItem("token", token);

                // Utilisez le token comme nécessaire
                // ...

                // Déclarez userInfo avec les informations de l'utilisateur
                userInfo = data.user;

                // Directement passer true à activateHomeTab si la connexion réussie
                activateHomeTab(userInfo, true);

                // Appelez fetchData pour récupérer les données des posts après la connexion réussie
                fetchData().then((data) => {
                    if (data) {
                        displayPosts(data);
                    }
                });
            } else {
                console.error("Token manquant dans la réponse.");
            }
        } else {
            const data = await response.json();
            console.error("Erreur lors de la connexion:", data.message);
            $("#loginErrorModalBody").text(data.message);
            $("#loginErrorModal").modal("show");

            // Directement passer false à activateHomeTab si la connexion échoue
            activateHomeTab(null, false);
        }
    } catch (error) {
        console.error("Erreur lors de la connexion:", error);
    }
}

function logout() {
    console.log("Fonction logout appelée");
    // Supprimer le token du local storage
    localStorage.removeItem('token');
    console.log("Token supprimé");
    
    // Rediriger l'utilisateur vers la page de connexion (ou une autre page)
    window.location.reload();
}




function activateHomeTab(userInfo, isLoggedIn) {
    const homeTab = document.getElementById("homeTab");
    homeTab.classList.add("active");

    // Afficher le contenu de l'onglet "Accueil"
    const homeTabContent = document.getElementById("home");
    homeTabContent.classList.add("show", "active");

    // Masquer les autres onglets
    const loginTabContent = document.getElementById("login");
    loginTabContent.classList.remove("show", "active");

    const registerTabContent = document.getElementById("register");
    registerTabContent.classList.remove("show", "active");


    // Afficher les informations de l'utilisateur connecté
    if (isLoggedIn && userInfo && userInfo.username) {
        const loggedInUserInfo = document.getElementById("loggedInUserInfo");
        loggedInUserInfo.innerHTML = `
            <h3>Bienvenue, ${userInfo.username}! N'hésite pas à dire des truks!</h3>
            <!-- Vous pouvez ajouter d'autres informations de l'utilisateur ici -->
            
        `;

         // Créez et ajoutez le formulaire ici
         const newPostForm = document.createElement("form");
         newPostForm.classList.add("mb-3");
         newPostForm.innerHTML = `
         <div class="form-group col-md-8">
         <textarea class="form-control" rows="2" id="newPostMessage" placeholder="Écrire un nouveau truK"></textarea></br>
         <button type="button" class="btn btn-dark" id="postButton">Truker</button>
     </div>
     
         `;
         
         const postAll = document.createElement("div");
        postAll.id="postContainer"
    

        loggedInUserInfo.appendChild(newPostForm);
        loggedInUserInfo.appendChild(postAll);
         // Ajoutez l'écouteur d'événement
         const postButton = document.getElementById("postButton");
         if (postButton) {
             postButton.addEventListener("click", addPost);
         }
        // Utilisez la fonction displayPosts pour afficher les posts
       // fetchData().then((data) => {
        //    displayPosts(data);
      //  });
    }
    const logoutTab = document.getElementById("logoutTab");
    logoutTab.style.display = isLoggedIn ? "block" : "none";
}


document.addEventListener('DOMContentLoaded', () => {
    const isLoggedIn = false;

    if (isLoggedIn) {
        // Affichez le bouton de déconnexion
        document.getElementById("logoutTab").style.display = "block";
    } else {
        // Cachez le bouton de déconnexion
        document.getElementById("logoutTab").style.display = "none";
    }

    const editPostForm = document.getElementById("editPostForm");
    if (editPostForm) {
        editPostForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            // Récupérer l'ID du post en cours d'édition
            const postId = document.getElementById("saveChangesButton").getAttribute("data-post-id");

            // Appeler la fonction editPost avec l'ID du post
            await editPost(postId);
        });
    }

    const logoutModalButton = document.getElementById("logoutButton");
    if (logoutModalButton) {
        logoutModalButton.addEventListener("click", () => {
            console.log("Clic sur le bouton de déconnexion dans la fenêtre modale");
            logout(); // Assurez-vous que cette fonction est appelée
        });
    }
});


 


 
//post function 

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

async function addComment(event, postId) {
    event.preventDefault();

    const commentMessageInput = document.getElementById(`commentMessage-${postId}`);
    const commentMessage = commentMessageInput.value;

    if (!(await checkToken())) {
        return;
    }

    try {
        const token = await getToken();
        const response = await fetch(`http://localhost:5000/post/${postId}/comments`, {
            method: "POST",
            headers: {
                "Authorization": `${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                message: commentMessage,
            }),
        });

        const newComment = await response.json();

        // Utiliser la fonction fetchAndDisplayComments pour obtenir les données mises à jour des commentaires
        await fetchAndDisplayComments(postId);
        
        // Effacer le champ du formulaire
        commentMessageInput.value = "";
    } catch (error) {
        console.error("Erreur lors de l'ajout du commentaire:", error);
    }
}

async function addPost(event) {
    event.preventDefault();

    const messageInput = document.getElementById("newPostMessage");
    const message = messageInput.value;

    if (!(await checkToken())) {
        return;
    }

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
        const response = await fetch(
            `http://localhost:5000/post/like-post/${postId}`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `${token}`,
                },
            }
        );

        const updatedPost = await response.json();
        console.log("Post liked:", updatedPost);

        // Récupérer les données mises à jour des posts après le like
        const updatedPosts = await fetchData();

        // Mettez à jour votre interface utilisateur en conséquence avec les nouveaux posts
        displayPosts(updatedPosts);
    } catch (error) {
        console.error("Erreur lors du like du post:", error);
    }

    
}

async function dislikePost(postId) {
    const token = await getToken();
    console.log("Token value:", token);

    if (!token) {
        console.error("Token d'utilisateur manquant. L'utilisateur doit être connecté pour ne pas aimer un post.");
        return;
    }

    try {
        const response = await fetch(
            `http://localhost:5000/post/dislike-post/${postId}`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `${token}`,
                },
            }
        );

        const updatedPost = await response.json();
        console.log("Post disliked:", updatedPost);

        const updatedPosts = await fetchData();

        // Mettez à jour votre interface utilisateur en conséquence
        displayPosts(updatedPosts); // Mettez à jour le post existant
    } catch (error) {
        console.error("Erreur lors du dislike du post:", error);
    }
}

async function editPost(postId) {
    const token = await getToken();
    console.log("Token value:", token);

    if (!token) {
        console.error("Token d'utilisateur manquant. L'utilisateur doit être connecté pour éditer un post.");
        return;
    }

    try {
        // Récupérer le contenu actuel du post
        const currentContent = document.getElementById("editedPostContent").value;

        const response = await fetch(`http://localhost:5000/post/${postId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `${token}`,
            },
            body: JSON.stringify({
                message: currentContent,
            }),
        });

        const updatedPost = await response.json();
        console.log("Post édité:", updatedPost);

        // Fermer la fenêtre modale après l'édition
        $('#editPostModal').modal('hide');

        // Récupérer les données mises à jour des posts après l'édition
        const updatedPosts = await fetchData();

        // Mettez à jour votre interface utilisateur en conséquence avec les nouveaux posts
        displayPosts(updatedPosts);
    } catch (error) {
        console.error("Erreur lors de l'édition du post:", error);
    }
}

async function deletePost(postId) {
    try {
      const token = await getToken();
      console.log("Token d'authentification:", token);

      const response = await fetch(`http://localhost:5000/post/${postId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `${token}`,
        },
      });
  
      if (response.ok) {
        console.log("Post deleted successfully");
        // Mettez à jour votre interface utilisateur en conséquence
        // ...
      } else {
        const data = await response.json();
        console.error("Error deleting post:", data.message);
      }
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  }
  
 // Fonction générique pour créer des éléments HTML
function createElement(tag, attributes, innerHTML) {
    const element = document.createElement(tag);

    for (const key in attributes) {
        element.setAttribute(key, attributes[key]);
    }

    if (innerHTML) {
        element.innerHTML = innerHTML;
    }

    return element;
}

// Fonction pour ajouter un écouteur d'événements de manière programmatique
function addEventListener(element, eventType, callback) {
    element.addEventListener(eventType, callback);
}

// Fonction pour afficher les commentaires
async function fetchAndDisplayComments(postId) {
    try {
        const token = await getToken();
        const response = await fetch(`http://localhost:5000/post/${postId}/comments`, {
            headers: {
                'Authorization': `${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.error("Erreur lors de la récupération des commentaires:", response.statusText);
            return [];
        }

        const comments = await response.json();
        displayComments(comments);
    } catch (error) {
        console.error("Erreur lors de la récupération et de l'affichage des commentaires:", error);
    }
}





// Fonction pour créer et afficher les commentaires

async function displayPosts(posts) {
    const postContainer = document.getElementById("postContainer");
    postContainer.innerHTML = "";

    if (posts && Array.isArray(posts)) {
        posts.forEach((post) => {
            const postElement = createElement("div", { class: "col-md-8 offset-md-2 mb-3" }, `
                <div class="card">
                    <div class="card-body">
                        <p class="card-text" style="white-space: pre-line;">${post.message}</p>
                        <p class="card-text">
                            <small class="text-muted">${post.author.username}</small></br>
                            <small class="text-muted">${post.createdAt}</small></br>
                            <small class="text-primary likers">Liked by: ${post.likers.map(liker => liker.userId.username).join(', ')}</small></br>
                            <small class="text-danger dislikers">Disliked by: ${post.dislikers.map(disliker => disliker.userId.username).join(', ')}</small>
                        </p>
                        
                    </div>

                    <!-- Ajout de la section des commentaires -->
                    <div class="comments-section">
                        <h5>Commentaires</h5>
                        <div id="commentContainer-${post._id}"></div> <!-- Utilisation d'un ID unique pour chaque conteneur de commentaires -->
                        <!-- Ajoutez un formulaire pour ajouter des commentaires si nécessaire -->
                    </div>
                </div>
            `);

            postContainer.appendChild(postElement);

            // ...

            const commentForm = document.createElement("form");
            commentForm.classList.add("card-footer");
            commentForm.innerHTML = `
                <div class="form-group">
                    <textarea class="form-control" rows="1" id="commentMessage-${post._id}" placeholder="Commenter"></textarea>
                </div>
                <button type="button" class="btn btn-success" onclick="addComment(event, '${post._id}')">Commenter</button>
            `;

            postElement.appendChild(commentForm);

            const commentButton = commentForm.querySelector(".btn-success");
            commentButton.addEventListener("click", async () => {
                const postId = post._id;
                await fetchComments(postId).then((comments) => {
                    displayComments(postId, comments);
                });
            });


            // Ajout d'un écouteur d'événements pour afficher les commentaires lorsqu'on clique sur le bouton
            addEventListener(commentButton, "click", async () => {
                const postId = post._id;
                await fetchAndDisplayComments(postId);
            });
            const likeButton = document.createElement("button");
            likeButton.classList.add("btn", "btn-primary", "like-button");
            likeButton.setAttribute("data-post-id", post._id);
            likeButton.innerText = "Like";
            likeButton.addEventListener("click", async () => {
                const postId = likeButton.getAttribute("data-post-id");
                console.log("like button clicked for post ID:", postId);
                await likePost(postId);
            });
            postElement.querySelector(".card-body").appendChild(likeButton);
        
            const dislikeButton = document.createElement("button");
            dislikeButton.classList.add("btn", "btn-danger", "dislike-button");
            dislikeButton.setAttribute("data-post-id", post._id);
            dislikeButton.innerText = "Dislike";
            dislikeButton.addEventListener("click", async () => {
                const postId = dislikeButton.getAttribute("data-post-id");
                console.log("Dislike button cliqué for post ID:", postId);
                await dislikePost(postId);
            });
            postElement.querySelector(".card-body").appendChild(dislikeButton);
        
            // Ajout du bouton d'édition
            if (post.author._id === userInfo._id) {
                const editButton = document.createElement("button");
                editButton.classList.add("btn", "btn-warning", "mr-3","ml-3", "edit-button");
                editButton.setAttribute("data-toggle", "modal");
                editButton.setAttribute("data-target", "#editPostModal");
                editButton.setAttribute("data-post-id", post._id); // Ajoutez cet attribut pour stocker l'ID du post
                editButton.innerText = "Éditer";
                
                // Ajoutez l'écouteur d'événements pour le bouton "Éditer"
                editButton.addEventListener("click", () => {
                    const postId = editButton.getAttribute("data-post-id");
                    console.log("Éditer le bouton cliqué pour le post ID:", postId);
                
                    // Récupérer le contenu actuel du post
                    const currentContent = post.message;
                
                    // Remplir le champ de saisie du modal avec le contenu actuel
                    const editedPostContent = document.getElementById('editedPostContent');
                    editedPostContent.value = currentContent;
                
                    // Stocker l'ID du post en cours d'édition dans un attribut du bouton "Enregistrer les modifications"
                    const saveChangesButton = document.getElementById("saveChangesButton");
                    if (saveChangesButton) {
                        saveChangesButton.setAttribute("data-post-id", postId);
                    }
                
                    // Ouvrir le modal d'édition
                    $('#editPostModal').modal('show');
                });
    
                postElement.querySelector(".card-body").appendChild(editButton);
            }
        
            // Ajout du bouton de suppression
            if (post.author._id === userInfo._id) {
                const deleteButton = document.createElement("button");
                deleteButton.classList.add("btn", "btn-dark", "delete-button");
                deleteButton.setAttribute("data-post-id", post._id);
                deleteButton.innerText = "Supprimer";
              
                // Ajouter l'écouteur d'événements pour le bouton de suppression
                deleteButton.addEventListener("click", async () => {
                  try {
                    const postId = deleteButton.getAttribute("data-post-id");
                    console.log("Supprimer le bouton cliqué pour le post ID:", postId);
              
                    // Appeler la fonction de suppression côté client
                    await deletePost(postId);
              
                    // Mettez à jour votre interface utilisateur en conséquence
                    // ...
              
                    // Vous pouvez également supprimer l'élément du post du DOM si nécessaire
                    postElement.remove();
                  } catch (error) {
                    console.error("Erreur lors de la suppression du post:", error);
                  }
                });
              
                // Ajouter le bouton de suppression à l'élément du post
                postElement.querySelector(".card-body").appendChild(deleteButton);
              }
        });
    }
}

// ...

// Fonction pour afficher les commentaires spécifiques à une publication
function displayComments(postId, comments) {
    const commentContainer = document.getElementById(`commentContainer-${postId}`);

    commentContainer.innerHTML = "";

    if (comments && Array.isArray(comments)) {
        comments.forEach((comment) => {
            const commentElement = createElement("div", { class: "comment mb-2" }, `
                <p class="comment-text">${comment.message}</p>
                <p class="comment-info">
                    <small class="text-muted">${comment.author.username}</small>
                    <small class="text-muted">${comment.createdAt}</small>
                </p>
            `);

            commentContainer.appendChild(commentElement);
        });
    }
}







