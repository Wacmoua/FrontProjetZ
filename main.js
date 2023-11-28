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
            <h3>Bienvenue, ${userInfo.username} ! n'hesite pas a dire des truk!</h3>
            <!-- Vous pouvez ajouter d'autres informations de l'utilisateur ici -->
            
        `;

         // Créez et ajoutez le formulaire ici
         const newPostForm = document.createElement("form");
         newPostForm.classList.add("mb-3");
         newPostForm.innerHTML = `
         <div class="form-group col-md-8">
         <textarea class="form-control" rows="2" id="newPostMessage" placeholder="Écrire un nouveau post"></textarea></br>
         <button type="button" class="btn btn-dark" id="postButton">Poster</button>
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
    
});


async function logout() {
    try {
        const response = await fetch("http://localhost:5000/logout", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `${localStorage.getItem('token')}`,
            },
        });

        if (response.ok) {
            // Effacez le token côté client
            localStorage.removeItem('token');

            // Redirigez l'utilisateur vers la page de connexion ou effectuez d'autres actions après la déconnexion
            window.location.href = "/login";
        } else {
            console.error("Erreur lors de la déconnexion :", response.statusText);
        }
    } catch (error) {
        console.error("Erreur lors de la déconnexion :", error);
    }
}

// Associez l'événement de déconnexion au bouton correspondant
document.getElementById("logoutTab").addEventListener("click", logout);


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
  


async function displayPosts(posts) {
    const postContainer = document.getElementById("postContainer");
    postContainer.innerHTML = "";

    // Ajoutez une vérification pour s'assurer que posts est défini avant de l'itérer
    if (posts && Array.isArray(posts)) {
        posts.forEach((post) => {
            const postElement = document.createElement("div");
            postElement.classList.add("col-md-8", "offset-md-2", "mb-3");

            postElement.innerHTML = `
                <div class="card">
                    <div class="card-body">
                        <p class="card-text">${post.message}</p>
                        <p class="card-text">
                            <small class="text-muted">${post.author.username}</small></br>
                            <small class="text-muted">${post.createdAt}</small></br>
                            <small class="text-primary likers">Liked by: ${post.likers.map(liker => liker.userId.username).join(', ')}</small></br>
                            <small class="text-danger dislikers">Disliked by: ${post.dislikers.map(disliker => disliker.userId.username).join(', ')}</small>
                           

                        </p>
                        <button class="btn btn-primary like-button" data-post-id="${post._id}">Like</button>
                        <button class="btn btn-danger dislike-button" data-post-id="${post._id}">Dislike</button>
                        
                    </div>
                    
                    <!-- Ajout du formulaire de commentaire -->
                    <form class="card-footer">
                        <div class="form-group">
                            <textarea class="form-control" rows="1" placeholder="Commenter"></textarea>
                        </div>
                        <button type="submit" class="btn btn-success">Comment'</button>
                    </form>
                </div>
            `;

            postContainer.appendChild(postElement);

            const likeButton = postElement.querySelector(".like-button");
            if (likeButton) {
                likeButton.addEventListener("click", async () => {
                    const postId = likeButton.getAttribute("data-post-id");
                    console.log("like button clicked for post ID:", postId);
                    await likePost(postId);
                });
            }

            const dislikeButton = postElement.querySelector(".dislike-button");
            if (dislikeButton) {
                dislikeButton.addEventListener("click", async () => {
                    const postId = dislikeButton.getAttribute("data-post-id");
                    console.log("Dislike button clicked for post ID:", postId);
                    await dislikePost(postId);
                });
            }

            

         

            if (post.author._id === userInfo._id) {
            const editButton = document.createElement("button");
            editButton.classList.add("btn", "btn-warning", "edit-button");
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

            postElement.appendChild(editButton);
        }

  
    if (post.author._id === userInfo._id) {
    const deleteButton = document.createElement("button");
    deleteButton.classList.add("btn", "btn-danger", "delete-button");
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
    postElement.appendChild(deleteButton);
  }
  // ...
  
// ...

         });
        }
      }

        






