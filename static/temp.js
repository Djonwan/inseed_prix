let currentProductIndex = 0;
let allProducts = [];
let passageIdDefault = null;
let typePrixIdDefault = null;
document.getElementById('logout-button').style.display = 'none';
document.getElementById('notification-button').style.display = 'none';

// Configuration de la base de données IndexedDB
let dbName = 'Inseed_prix';
let dbVersion = 4;


class IndexedDBManager {
  constructor() {
    this.db = null;
  }

    // Initialiser la base de données
    async initDB() {
        return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, dbVersion);
    
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            this.db = request.result;
            resolve(this.db);
        };
    
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
    
            // Création des object stores avec leurs index
    
            const villeStore = db.createObjectStore('Ville', { keyPath: 'id_ville' });
            villeStore.createIndex('code_ville', 'code_ville', { unique: true });
    
            const agentStore = db.createObjectStore('Agent', { keyPath: 'code_agent' });
            agentStore.createIndex('id_ville', 'id_ville', { unique: false });
    
            const controlleurStore = db.createObjectStore('Controlleur', { keyPath: 'code_controlleur' });
            controlleurStore.createIndex('type_controlleur', 'type_controlleur', { unique: false });
    
            const agentControlleurStore = db.createObjectStore('Agent_Controlleur', { keyPath: 'id' });
            agentControlleurStore.createIndex('code_agent', 'code_agent', { unique: false });
            agentControlleurStore.createIndex('code_controlleur', 'code_controlleur', { unique: false });
    
            const carnetStore = db.createObjectStore('Carnet', { keyPath: 'id_carnet' });
            carnetStore.createIndex('code_agent', 'code_agent', { unique: false });
    
            const pointCollecteStore = db.createObjectStore('PointCollecte', { keyPath: 'code_point_collecte' });
            pointCollecteStore.createIndex('id_carnet', 'id_carnet', { unique: false });
    
            const passageStore = db.createObjectStore('Passage', { keyPath: 'id_passage' });
            passageStore.createIndex('code_point_collecte', 'code_point_collecte', { unique: false });

            const typePrixStore = db.createObjectStore('TypePrix', { keyPath: 'id_type_prix' });
            typePrixStore.createIndex('type', 'type', { unique: false });

            const produitStore = db.createObjectStore('Produit', { keyPath: 'code_produit' });
            produitStore.createIndex('nom_produit', 'nom_produit', { unique: false });
    
            const pointCollecteProduitStore = db.createObjectStore('PointCollecte_Produit', { autoIncrement: true });
            pointCollecteProduitStore.createIndex('code_point_collecte', 'code_point_collecte', { unique: false });
            pointCollecteProduitStore.createIndex('code_produit', 'code_produit', { unique: false });

            const prixStore = db.createObjectStore('Prix', { keyPath: 'id_prix' });
            prixStore.createIndex('id_passage', 'id_passage', { unique: false });
            prixStore.createIndex('code_produit', 'code_produit', { unique: false });
            prixStore.createIndex('date_passage', 'date_passage', { unique: false });

            const PendingPrices = db.createObjectStore('PendingPrices', { autoIncrement: true});   
        };
        });
    }
  
}

class IndexedDBStorage {
    constructor(db) {
      this.db = db;
    }
  
    // Méthode utilitaire pour stocker des données dans un objectStore
    async storeData(storeName, data) {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
  
        transaction.onerror = () => reject(transaction.error);
        transaction.oncomplete = () => resolve();
  
        if (Array.isArray(data)) {
          data.forEach(item => store.put(item));
        } else {
          store.put(data);
        }
      });
    }
  
    // Méthode pour récupérer les données des routes et les stocker dans IndexedDB
    async fetchAndStoreData() {
      try {
        const villesResponse = await fetch('/vil');
        const villes = await villesResponse.json();
        await this.storeData('Ville', villes);
  
        const agentsResponse = await fetch('/age');
        const agents = await agentsResponse.json();
        await this.storeData('Agent', agents);

        const controlleursResponse = await fetch('/controlleurs');
        const controlleurs = await controlleursResponse.json();
        await this.storeData('Controlleur', controlleurs);

        const agentControlleursResponse = await fetch('/agent_controlleurs');
        const agentControlleurs = await agentControlleursResponse.json();
        await this.storeData('Agent_Controlleur', agentControlleurs);

        const carnetsResponse = await fetch('/carnets');
        const carnets = await carnetsResponse.json();
        await this.storeData('Carnet', carnets);

        const pointsCollecteResponse = await fetch('/points_collecte');
        const pointsCollecte = await pointsCollecteResponse.json();
        await this.storeData('PointCollecte', pointsCollecte);

        const passagesResponse = await fetch('/passages');
        const passages = await passagesResponse.json();
        await this.storeData('Passage', passages);

        const typesPrixResponse = await fetch('/types_prix');
        const typesPrix = await typesPrixResponse.json();
        await this.storeData('TypePrix', typesPrix);

        const produitsResponse = await fetch('/produits');
        const produits = await produitsResponse.json();
        await this.storeData('Produit', produits);

        const pointCollecteProduitsResponse = await fetch('/point_collecte_produits');
        const pointCollecteProduits = await pointCollecteProduitsResponse.json();
        await this.storeData('PointCollecte_Produit', pointCollecteProduits);
  
        const prixResponse = await fetch('/prix');
        const prix = await prixResponse.json();
        await this.storeData('Prix', prix);
  
        console.log('Toutes les données ont été récupérées et stockées avec succès.');
      } catch (error) {
        console.error('Erreur lors de la récupération et du stockage des données:', error);
        throw error;
      }
    }
}
  
// Étape 2 : Utiliser IndexedDBStorage
async function initializeAndFetchData() {
    const dbManager = new IndexedDBManager();

    try {
        // Supprimer l'ancienne base de données pour la mise à jour
        await indexedDB.deleteDatabase(dbName);

        // Initialiser la nouvelle base de données et stocker les données
        const db = await dbManager.initDB();
        const storage = new IndexedDBStorage(db);
        await storage.fetchAndStoreData();
    } catch (error) {
        console.error("Erreur lors de l'initialisation et de la mise à jour des données :", error);
    }
}

// Fonction utilitaire pour accéder à IndexedDB
async function getFromIndexedDB(storeName, key = null) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('Inseed_prix');
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const query = key ? store.get(key) : store.getAll();
            
            query.onerror = () => reject(query.error);
            query.onsuccess = () => resolve(query.result);
        };
    });
}


async function handleDatabaseAccess(dbName) {
    if (navigator.onLine) {
        // L'utilisateur est en ligne
        const dbExists = await checkIndexedDBExists(dbName);
        if (dbExists) {
            // La base existe, on la réinitialise
            await initializeAndFetchData();
            console.log("Base de données réinitialisée avec les dernières données");
        } else {
            // La base n'existe pas, on la crée
            await initializeAndFetchData();
            console.log("Première création de la base de données");
        }
    } else {
        // L'utilisateur est hors ligne
        const dbExists = await checkIndexedDBExists(dbName);
        if (dbExists) {
            console.log("Vous êtes hors ligne. La base de données existante sera utilisée");
        } else {
            console.log("Vous devez être connecté à Internet pour la première utilisation de l'application");
        }
    }
}

// async function login() {
//     const agentId = document.getElementById('agent-id').value;

//     try {
//         const response = await fetch('/get_agent_data', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//             },
//             body: JSON.stringify({ code_id: agentId }),
//         });

//         // Vérification de la réponse du serveur
//         if (!response.ok) {
//             throw new Error(`Erreur réseau : ${response.statusText}`);
//         }

//         const user = await response.json();
//         if (user.error) {
//             alert(user.error);
//         } else {
//             if (user.is_controlleur) {
//                 window.location.href = '/controle';
//             } else {
//                 document.getElementById('login-section').style.display = 'none';
//                 document.getElementById('logout-button').style.display = 'block';
//                 document.getElementById('agent-info').style.display = 'block';
//                 document.getElementById('agent-name').innerText = `Nom : ${user.name}`;
//                 document.getElementById('agent-city').innerText = `Ville : ${user.city}`;

//                 const carnetSelect = document.getElementById('carnet-select');
//                 carnetSelect.innerHTML = '<option value="">Sélectionnez un carnet</option>';

//                 for (const [id, nom] of Object.entries(user.carnets)) {
//                     carnetSelect.innerHTML += `<option value="${id}">${nom}</option>`;
//                 }

//                 document.getElementById('carnet-section').style.display = 'block';

                
//             }
//         }
//     } catch (error) {
//         console.error("Une erreur s'est produite lors de la tentative de connexion :", error);
//         alert("Une erreur est survenue lors de la connexion. Veuillez vérifier votre connexion Internet et réessayer.");
//     }
// }

// Fonction utilitaire pour accéder à IndexedDB
async function getFromIndexedDB(storeName, key = null) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('Inseed_prix');

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const query = key ? store.get(key) : store.getAll();

            query.onerror = () => reject(query.error);
            query.onsuccess = () => resolve(query.result);
        };
    });
}


// Fonction pour récupérer le carnet à afficher selon la semaine
function getCurrentCarnet(carnets) {
    const carnetKeys = Object.keys(carnets);
    if (carnetKeys.length === 0) return null;

    const storedData = JSON.parse(localStorage.getItem('carnet_display')) || {};
    const lastDisplayedIndex = storedData.index || 0;
    const lastDisplayedDate = storedData.date ? new Date(storedData.date) : null;
    const currentDate = new Date();
    
    // Vérifier si 7 jours se sont écoulés depuis le dernier affichage
    if (!lastDisplayedDate || (currentDate - lastDisplayedDate) >= 7 * 24 * 60 * 60 * 1000) {
        // Passer au carnet suivant
        const newIndex = (lastDisplayedIndex + 1) % carnetKeys.length;
        localStorage.setItem('carnet_display', JSON.stringify({
            index: newIndex,
            date: currentDate
        }));
        return carnetKeys[newIndex];
    }
    
    // Sinon, garder le même carnet
    return carnetKeys[lastDisplayedIndex];
}


// Fonction pour récupérer les notifications et mettre à jour le span sans ouvrir la modale
async function updateNotificationCount() {
    const notificationCount = document.getElementById("notification-count");

    try {
        const response = await fetch("/notifications");
        if (!response.ok) throw new Error("Erreur lors de la récupération des notifications");

        const data = await response.json();
        if (data.error) {
            console.error("Erreur:", data.error);
            return;
        }

        // Mettre à jour uniquement le nombre de notifications dans le span
        notificationCount.textContent = data.total_points;

    } catch (error) {
        console.error("Erreur lors de la mise à jour du nombre de notifications:", error);
    }
}

// Fonction pour initialiser les notifications et gérer l'affichage de la modale
function initializeNotifications() {
    const notificationButton = document.getElementById("notification-button");
    const notificationCount = document.getElementById("notification-count");

    async function fetchNotifications() {
        try {
            const response = await fetch("/notifications");
            if (!response.ok) throw new Error("Erreur lors de la récupération des notifications");

            const data = await response.json();
            if (data.error) {
                console.error("Erreur:", data.error);
                return;
            }

            // Mettre à jour le nombre de notifications
            notificationCount.textContent = data.total_points;

            // Générer le tableau des notifications (chaque ligne est cliquable)
            let notificationList = `<table class='table table-striped'>
                                        <thead>
                                           <tr><th>Carnet</th><th>Code point collecte</th><th>Nom de point de collecte</th><th>Message</th><th>Date de collecte</th></tr>
                                        </thead>
                                        <tbody>`;

            data.notifications.forEach(notif => {
                notificationList += `<tr class="notification-row" 
                                        data-point="${notif.code_point_collecte}"
                                        point_collecte_nom="${notif.point_collecte}"  
                                        data-date="${notif.date_passage}">
                                        <td>${notif.nom_carnet}</td>
                                        <td>${notif.code_point_collecte}</td>
                                        <td>${notif.point_collecte}</td>
                                        <td>${notif.message}</td>
                                        <td>${notif.date_passage}</td>
                                     </tr>`;
            });

            notificationList += "</tbody></table>";

            document.getElementById("notification-container").innerHTML = notificationList;

            // Afficher la modale des notifications
            const myModal = new bootstrap.Modal(document.getElementById('notificationModal'));
            myModal.show();

            // Ajouter un événement à chaque ligne pour ouvrir la modale des produits rejetés
            document.querySelectorAll('.notification-row').forEach(row => {
                row.addEventListener('click', function() {
                    const pointCollecte = this.getAttribute('data-point');
                    const pointCollecteNom = this.getAttribute('point_collecte_nom');
                    const datePassage = this.getAttribute('data-date');

                    // Fermer la modale des notifications
                    myModal.hide();

                    // Ouvrir la modale des produits rejetés après un court délai
                    setTimeout(() => {
                        fetchRejectedProducts(pointCollecte, datePassage, pointCollecteNom);
                    }, 500);
                });
            });

        } catch (error) {
            console.error("Erreur lors de la récupération des notifications:", error);
        }
    }

    // Charger les notifications au clic sur la cloche
    notificationButton.addEventListener("click", fetchNotifications);
}


async function login() {
    const agentId = document.getElementById('agent-id').value;

    try {
        let user;
        if (navigator.onLine) {
            const response = await fetch('/get_agent_data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code_id: agentId }),
            });

            if (!response.ok) {
                const errorData = await response.json(); // Récupérer le message d'erreur du serveur
                throw new Error(`Erreur réseau : ${response.status} - ${errorData.error || response.statusText}`);
            }

            user = await response.json();
        } else {
            const agent = await getFromIndexedDB('Agent', agentId);
            if (!agent) throw new Error('Agent non trouvé');

            const ville = await getFromIndexedDB('Ville', agent.id_ville);
            const carnets = await getFromIndexedDB('Carnet');
            const userCarnets = {};
            carnets.forEach(carnet => {
                if (carnet.code_agent === agentId) {
                    userCarnets[carnet.id_carnet] = carnet.nom_carnet;
                }
            });

            user = {
                name: agent.nom_agent,
                city: ville ? ville.nom_ville : '',
                is_controlleur: false,
                carnets: userCarnets
            };
        }

        if (user.error) {
            alert(`Erreur : ${user.error}`);
        } else {
            if (user.is_controlleur) {
                window.location.href = '/controle';
            } else {
                const mainContainer = document.getElementById('main-container');
                if (mainContainer) {
                    mainContainer.setAttribute('data-state', 'logged-in');
                    mainContainer.style.display = 'none';
                    void mainContainer.offsetHeight;
                    mainContainer.style.display = '';
                    console.log('État après login:', mainContainer.getAttribute('data-state'));
                } else {
                    console.error("L'élément 'main-container' n'a pas été trouvé.");
                }

                document.getElementById('login-section').style.display = 'none';
                document.getElementById('notification-button').style.display = 'block';
                document.getElementById('logout-button').style.display = 'block';
                document.getElementById('agent-info').style.display = 'block';
                document.getElementById('agent-name').innerText = `Nom : ${user.name}`;
                document.getElementById('agent-city').innerText = `Ville : ${user.city}`;


                const carnetSelect = document.getElementById('carnet-select');
                carnetSelect.innerHTML = '<option value="">Sélectionnez un carnet</option>';

                for (const [id, nom] of Object.entries(user.carnets)) {
                    carnetSelect.innerHTML += `<option value="${id}">${nom}</option>`;
                }

                // const carnetSelect = document.getElementById('carnet-select');
                // carnetSelect.innerHTML = '<option value="" selected disabled>Sélectionnez un carnet</option>';

                // const currentCarnet = getCurrentCarnet(user.carnets);
                // for (const [id, nom] of Object.entries(user.carnets)) {
                //     if (id === currentCarnet) {
                //         carnetSelect.innerHTML += `<option value="${id}">${nom}</option>`;
                //     } else {
                //         carnetSelect.innerHTML += `<option value="${id}" style="display:none;">${nom}</option>`;
                //     }
                // }

                document.getElementById('carnet-section').style.display = 'block';

                initializeNotifications();
                if (navigator.onLine) {
                    updateNotificationCount();
                }
                handleDatabaseAccess("Inseed_prix");
            }
        }
    } catch (error) {
        console.error("Une erreur s'est produite lors de la tentative de connexion :", error);
        alert(`Une erreur est survenue lors de la connexion : ${error.message}`);
    }
}


// Vérifier si IndexedDB existe déjà
async function checkIndexedDBExists(dbName) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName);
        let dbExists = true;

        request.onsuccess = function () {
            request.result.close();
            resolve(dbExists);
        };
        request.onupgradeneeded = function () {
            dbExists = false;
            resolve(dbExists);
        };
        request.onerror = function () {
            reject(request.error);
        };
    });
}

// Gérer les changements de connexion
window.addEventListener('online', async () => {
    console.log("Connexion rétablie. Mise à jour de la base IndexedDB.");
    await initializeAndFetchData();
});

window.addEventListener('offline', () => {
    console.log("Vous êtes hors ligne. Utilisation de IndexedDB sans mise à jour.");
});


async function fetchRejectedProducts(pointCollecte, datePassage, pointCollecteNom) {
    try {
        const response = await fetch(`/rejected-products?point_collecte=${pointCollecte}&date_passage=${datePassage}`);
        if (!response.ok) throw new Error("Erreur lors de la récupération des produits rejetés");

        const data = await response.json();
        if (data.error) {
            console.error("Erreur:", data.error);
            return;
        }

        // Générer l'en-tête avec le code et le nom du point de collecte
        let productsList = `
            <div class="mb-3" style='color:black'>
                <h5>${pointCollecte} - 
                ${pointCollecteNom}</h5>
            </div>
            <table class='table table-striped'>
                <thead style='color:black;'>
                    <tr>
                        <th>Code Produit</th>
                        <th>Nom Produit</th>
                        <th>Description Produit</th>
                        <th>Prix</th>
                    </tr>
                </thead>
                <tbody>`;

        data.products.forEach(product => {
            const displayValue = parseFloat(product.prix) === 0 ? product.type_statut : product.prix;
            
            productsList += `<tr style='color:black'>
                                <td>${product.code_produit}</td>
                                <td>${product.nom_produit}</td>
                                <td>${product.description_produit}</td>
                                <td>
                                    <input type="text" 
                                           class="form-control price-input" 
                                           value="${displayValue}" 
                                           data-code-produit="${product.code_produit}"
                                           placeholder="Prix ou T/D"
                                           oninput="validatePriceInput(this)"
                                           list="optionsPrix">
                                </td>
                            </tr>`;
        });

        productsList += `</tbody>
                        </table>
                        <datalist id="optionsPrix">
                            <option value="T">Rupture Temporaire</option>
                            <option value="D">Rupture Définitive</option>
                        </datalist>
                        <div class="text-center mt-3">
                            <button id="adjustButton" class="btn btn-success">Ajuster</button>
                        </div>`;

        document.getElementById("products-container").innerHTML = productsList;
        //ajouter un evenement au button ajuster
        document.getElementById('adjustButton').addEventListener('click', async function() {
            const priceInputs = document.querySelectorAll('.price-input');
            const updatedProducts = Array.from(priceInputs).map(input => {
                const value = input.value.toUpperCase();
                const codeProduit = input.getAttribute('data-code-produit');
                const isNumber = /^[0-9]*\.?[0-9]*$/.test(value) && value !== '';
        
                if (isNumber) {
                    return {
                        code_produit: codeProduit,
                        prix: parseFloat(value),
                        type_statut: 'N'
                    };
                } else if (value === 'T' || value === 'D') {
                    return {
                        code_produit: codeProduit,
                        prix: 0,
                        type_statut: value
                    };
                }
            }).filter(item => item !== undefined);
        
            // Récupérer la position actuelle de l'agent avec l'API Geolocation
            let positionData = {};
            try {
                const position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject);
                });
                positionData = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy
                };
            } catch (error) {
                console.warn("Impossible de récupérer la position de l'agent:", error);
                positionData = {}; // Si la position n'est pas disponible, envoyer un objet vide
            }
        
            const payload = {
                products: updatedProducts.map(product => ({
                    ...product,
                    statut: 'Ajuster'
                })),
                date_passage: datePassage, // Date à ajuster
                position: positionData // Position actuelle de l'agent
            };
        
            try {
                const response = await fetch('/update-prices', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });
        
                if (response.ok) {
                    const modalElement = document.getElementById('productsModal');
                    const myModal = bootstrap.Modal.getInstance(modalElement);
                    if (myModal) {
                        myModal.hide(); // Fermer le modal
                    }
                    alert('Les prix et la position ont été ajustés avec succès');
                    console.log('Produits et position mis à jour avec succès:', payload);
                } else {
                    console.error('Erreur serveur:', response.status);
                }
            } catch (error) {
                console.error('Erreur lors de la mise à jour:', error);
            }
        });


        const productsModal = new bootstrap.Modal(document.getElementById('productsModal'));
        productsModal.show();

    } catch (error) {
        console.error("Erreur lors de la récupération des produits rejetés:", error);
    }
}


function validatePriceInput(input) {
    const value = input.value.toUpperCase();
    const isNumber = /^[0-9]*\.?[0-9]*$/.test(value);
    const isAllowedLetter = value === "T" || value === "D";

    if (!isNumber && !isAllowedLetter) {
        input.value = value.slice(0, -1);
    }
}



function logout() {
    document.getElementById('login-section').style.display = 'block';
    document.getElementById('notification-button').style.display = 'none';
    document.getElementById('logout-button').style.display = 'none';
    document.getElementById('agent-info').style.display = 'none';

    document.getElementById('agent-id').value = '';
    document.getElementById('agent-name').innerText = '';
    document.getElementById('agent-city').innerText = '';

    document.getElementById('carnet-select').innerHTML = '';
    document.getElementById('typepointcollecte-select').innerHTML = '';
    document.getElementById('pointcollecte-select').innerHTML = '';
    document.getElementById('produit-type-radios').innerHTML = '';
    document.getElementById('product-table').innerHTML = '';
    document.getElementById('typepointcollecte-section').style.display = 'none';
    document.getElementById('carnet-section').style.display = 'none';
    document.getElementById('pointcollecte-section').style.display = 'none';
    
   
    document.getElementById('product-section').style.display = 'none';

    const mainContainer = document.getElementById('main-container');
    if (mainContainer) {
        mainContainer.setAttribute('data-state', 'logged-out');
        mainContainer.style.display = 'none';
        void mainContainer.offsetHeight;
        mainContainer.style.display = '';
        console.log('État après logout:', mainContainer.getAttribute('data-state'));
    } else {
        console.error("L'élément 'main-container' n'a pas été trouvé.");
    }
}




document.getElementById('carnet-select').addEventListener('change', async function() {
    const carnetId = this.value;

    // Réinitialisation
    document.getElementById('typepointcollecte-select').innerHTML = '';
    document.getElementById('pointcollecte-select').innerHTML = '';
    document.getElementById('product-table').innerHTML = '';
    document.getElementById('produit-type-radios').innerHTML = '';
    document.getElementById('typepointcollecte-section').style.display = 'none';
    document.getElementById('produit-type-section').style.display = 'none';
   
    document.getElementById('product-section').style.display = 'none';

    if (!carnetId) {
        document.getElementById('typepointcollecte-section').style.display = 'none';
        document.getElementById('pointcollecte-section').style.display = 'none';
        document.getElementById('produit-type-section').style.display = 'none';
        return;
    }

    try {
        let typesPointCollecte = [];

        if (navigator.onLine) {
            const response = await fetch('/get_pointCollecte_types', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_carnet: carnetId }),
            });
            typesPointCollecte = await response.json();
        } else {
            const pointsCollecte = await getFromIndexedDB('PointCollecte') || [];

            // Vérifier que `pointsCollecte` n'est pas vide
            if (pointsCollecte.length > 0) {
                typesPointCollecte = [...new Set(
                    pointsCollecte
                        .filter(p => p.id_carnet == carnetId) // Comparaison souple
                        .map(p => p.type_point_collecte)
                        .filter(Boolean) // Élimine les valeurs null ou undefined
                )];
            }
        }

        const typePointCollecteSelect = document.getElementById('typepointcollecte-select');
        typePointCollecteSelect.innerHTML = '<option value="">Sélectionnez un type de point de collecte</option>';
        typesPointCollecte.forEach(type => {
            typePointCollecteSelect.innerHTML += `<option value="${type}">${type}</option>`;
        });

        if (typesPointCollecte.length > 0) {
            document.getElementById('typepointcollecte-section').style.display = 'block';
        }
    } catch (error) {
        console.error("Erreur:", error);
        alert("Une erreur est survenue.");
    }
});


function getProductTypesFromIndexedDB(code_point_collecte) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("Inseed_prix", 1);

        request.onsuccess = function (event) {
            const db = event.target.result;

            if (!db.objectStoreNames.contains("PointCollecte_Produit") || !db.objectStoreNames.contains("Produit")) {
                reject("Stores manquants dans IndexedDB");
                return;
            }

            const transaction = db.transaction(["PointCollecte_Produit", "Produit"], "readonly");
            const pointCollecteProduitStore = transaction.objectStore("PointCollecte_Produit");
            const produitStore = transaction.objectStore("Produit");

            const produitsAssocies = [];
            const uniqueTypes = new Set();

            // Étape 1 : Récupérer les produits liés au PointCollecte
            const index = pointCollecteProduitStore.index("code_point_collecte"); // Assurez-vous que cet index existe
            const request1 = index.getAll(code_point_collecte);

            request1.onsuccess = function (event) {
                const pointCollecteProduits = event.target.result;

                if (!pointCollecteProduits.length) {
                    resolve([]);
                    return;
                }

                // Étape 2 : Récupérer les types de produits associés
                let pending = pointCollecteProduits.length;

                pointCollecteProduits.forEach((pcp) => {
                    const request2 = produitStore.get(pcp.code_produit);

                    request2.onsuccess = function (event) {
                        const produit = event.target.result;
                        if (produit) {
                            uniqueTypes.add(produit.type_produit);
                        }
                        pending--;
                        if (pending === 0) {
                            resolve(Array.from(uniqueTypes)); // Retourne une liste unique des types de produits
                        }
                    };

                    request2.onerror = function () {
                        pending--;
                        if (pending === 0) {
                            resolve(Array.from(uniqueTypes));
                        }
                    };
                });
            };

            request1.onerror = function () {
                reject("Erreur lors de la récupération des produits liés au point de collecte");
            };
        };

        request.onerror = function () {
            reject("Erreur d'ouverture de IndexedDB");
        };
    });
}


document.getElementById('typepointcollecte-select').addEventListener('change', async function() {
    const carnetId = document.getElementById('carnet-select').value;
    const typePointCollecteId = this.value;

    // Réinitialisation

    document.getElementById('produit-type-radios').innerHTML = '';
    document.getElementById('product-table').innerHTML = '';
   
    document.getElementById('produit-type-section').style.display = 'none';
    document.getElementById('product-section').style.display = 'none';

    if (!typePointCollecteId) {
        document.getElementById('pointcollecte-section').style.display = 'none';
        document.getElementById('produit-type-section').style.display = 'none';
        return;
    }

    try {
        let pointsOfSale = [];

        if (navigator.onLine) {
            const response = await fetch('/get_points_of_sale', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_carnet: carnetId, type_point_collecte: typePointCollecteId }),
            });
            pointsOfSale = await response.json();
        } else {
            const pointsCollecte = await getFromIndexedDB('PointCollecte') || [];

            if (pointsCollecte.length > 0) {
                pointsOfSale = pointsCollecte
                    .filter(p => p.id_carnet == carnetId && p.type_point_collecte == typePointCollecteId) // Comparaison souple
                    .map(p => ({
                        code: p.code_point_collecte,
                        name: p.nom_point_collecte,
                        description: p.description_point_collecte || ''
                    }));
            }
        }

        const pointCollecteSelect = document.getElementById('pointcollecte-select');
        pointCollecteSelect.innerHTML = '<option value="">Sélectionnez un point de collecte</option>';

        pointsOfSale.forEach(point => {
            pointCollecteSelect.innerHTML += `<option value="${point.code}">
                ${point.code} | ${point.name} | ${point.description}
            </option>`;
        });

        if (pointsOfSale.length > 0) {
            document.getElementById('pointcollecte-section').style.display = 'block';
        }
    } catch (error) {
        console.error("Erreur:", error);
        alert("Une erreur est survenue.");
    }
});


let id_releve; // Variable globale pour stocker id_releve

document.getElementById('pointcollecte-select').addEventListener('change', async function () {
    const pointCollecteId = this.value;
    const carnetId = document.getElementById('carnet-select').value;

    // Réinitialisation des éléments de l'interface
    const produitTypeRadios = document.getElementById('produit-type-radios');
    const productTable = document.getElementById('product-table');
    const produitTypeSection = document.getElementById('produit-type-section');
    const productSection = document.getElementById('product-section');

    produitTypeRadios.innerHTML = '';
    productTable.innerHTML = '';
    produitTypeSection.style.display = 'none';
    productSection.style.display = 'none';

    if (!pointCollecteId) {
        return; // Si aucun point de collecte n'est sélectionné, tout reste masqué
    }

    try {
        // Récupérer l'id_releve
        const responseReleve = await fetch('/get_releve_id', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id_carnet: carnetId,
                code_point_collecte: pointCollecteId
            }),
        });
        const releveData = await responseReleve.json();
        if (releveData.error) {
            alert('Erreur lors de la récupération de l\'id_releve : ' + releveData.error);
            return;
        }
        id_releve = releveData.id_releve;

        // Récupérer les types de produits
        let produitTypes = [];
        if (navigator.onLine) {
            const response = await fetch('/get_product_types', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code_point_collecte: pointCollecteId }),
            });
            produitTypes = await response.json();
        } else {
            produitTypes = await getProductTypesFromIndexedDB(pointCollecteId);
        }

        // Générer les boutons radio
        produitTypes.forEach((type, index) => {
            const isChecked = index === 0 ? 'checked' : '';
            const radioHtml = `
                <div class = 'ml-2 mr-2' >
                    <input type="radio" id="produit-type-${type}" name="produit-type" value="${type}" ${isChecked}>
                    <label for="produit-type-${type}">${type}</label>
                </div>
            `;
            produitTypeRadios.innerHTML += radioHtml;
        });

        if (produitTypes.length > 0) {
            // Afficher les deux sections simultanément
            produitTypeSection.style.display = 'block';
            const firstType = produitTypes[0];
            await loadProducts(pointCollecteId, firstType); // Charger les produits pour le premier type
            productSection.style.display = 'block'; // Afficher les produits après chargement
        } else {
            // Si aucun type de produit, masquer les deux sections
            produitTypeSection.style.display = 'none';
            productSection.style.display = 'none';
        }
    } catch (error) {
        console.error("Erreur:", error);
        alert("Une erreur est survenue lors de la récupération des données.");
        produitTypeSection.style.display = 'none';
        productSection.style.display = 'none';
    }
});

// Événement pour les boutons radio
document.getElementById('produit-type-radios').addEventListener('change', async function(e) {
    const pointCollecteId = document.getElementById('pointcollecte-select').value;
    const produitType = e.target.value;

    if (produitType) {
        const productSection = document.getElementById('product-section');
        document.getElementById('product-table').innerHTML = '';
        productSection.style.display = 'none';
        await loadProducts(pointCollecteId, produitType);
        productSection.style.display = 'block'; // Réafficher après chargement
    }
});


async function loadProducts(pointCollecteId, produitType) {
    try {
        const response = await fetch('/get_filtered_products', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code_point_collecte: pointCollecteId, produit_type: produitType }),
        });

        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des produits');
        }

        allProducts = await response.json();
        currentProductIndex = 0;

        const productTable = document.getElementById('product-table');
        if (!productTable) {
            throw new Error('Élément product-table non trouvé dans le DOM');
        }
        productTable.innerHTML = '';

        if (produitType === 'Hétérogene') {
            productTable.innerHTML = `
                <thead>
                    <tr class="fond-tableau">
                        <th>Code</th>
                        <th>Produit</th>
                        <th>Type</th>
                        <th>Description produit</th>
                        <th>Prix du produit</th>
                    </tr>
                </thead>
                <tbody>
                </tbody>
            `;
        } else if (produitType === 'Homogene o1') {
            productTable.innerHTML = `
                <thead>
                    <tr class="fond-tableau">
                        <th>Code</th>
                        <th>Produit</th>
                        <th>Type</th>
                        <th>Prix</th>
                    </tr>
                </thead>
                <tbody>
                </tbody>
            `;
        } else if (produitType === 'Homogene O2&O3') {
            productTable.innerHTML = `
                <thead>
                    <tr class="fond-tableau">
                        <th>Code</th>
                        <th>Libelle varieté</th>
                        <th>Type</th>
                        <th>Prix</th>
                        <th>Quantité</th>
                    </tr>
                </thead>
                <tbody>
                </tbody>
            `;
        }

        await loadMoreProducts(); // Charger les produits
    } catch (error) {
        console.error('Erreur dans loadProducts:', error);
        document.getElementById('product-section').style.display = 'none';
        document.getElementById('produit-type-section').style.display = 'none'; // Masquer aussi les radios en cas d'erreur
        alert('Une erreur est survenue lors du chargement des produits : ' + error.message);
    }
}

function loadMoreProducts() {
    const selectedRadio = document.querySelector('input[name="produit-type"]:checked');
    const produitType = selectedRadio ? selectedRadio.value : null;

    if (!produitType) {
        alert('Veuillez sélectionner un type de produit.');
        return;
    }

    if (!validateCurrentPrices()) {
        alert('Veuillez remplir tous les champs de prix avant de charger plus de produits.');
        return;
    }

    const productTable = document.getElementById('product-table').querySelector('tbody');
    if (!productTable) {
        console.error('tbody non trouvé dans product-table');
        return;
    }

    const savedValues = {};

    if (produitType === 'Hétérogene') {
        const priceInputs = document.getElementsByClassName('price-input');
        for (let input of priceInputs) {
            savedValues[input.getAttribute('data-id')] = input.value;
        }
    } else if (produitType === 'Homogene o1') {
        const priceInputs = document.getElementsByClassName('price-input');
        for (let input of priceInputs) {
            savedValues[input.getAttribute('data-id')] = input.value;
        }
    } else if (produitType === 'Homogene O2&O3') {
        const priceInputs = document.getElementsByClassName('price-input');
        const quantityInputs = document.getElementsByClassName('quantity-input');
        for (let i = 0; i < priceInputs.length; i++) {
            savedValues[priceInputs[i].getAttribute('data-id')] = {
                prix: priceInputs[i].value,
                quantite: quantityInputs[i].value
            };
        }
    }

    const endIndex = currentProductIndex + 5;
    const productsToDisplay = allProducts.slice(currentProductIndex, endIndex);

    productsToDisplay.forEach(product => {
        if (produitType === 'Hétérogene') {
            productTable.innerHTML += `
                <tr>
                    <td>${product.code}</td>
                    <td>${product.name}</td>
                    <td>${product.type}</td>
                    <td>${product.description}</td>
                    <td>
                        <input type="text" class="price-input" data-id="${product.code}" list="optionsPrix"
                            placeholder="Prix ou T/D" oninput="validatePriceInput(this)">
                        <datalist id="optionsPrix">
                            <option value="T">Rupture Temporaire</option>
                            <option value="D">Rupture Définitive</option>
                        </datalist>
                    </td>
                </tr>
            `;
        } else if (produitType === 'Homogene o1') {
            productTable.innerHTML += `
                <tr>
                    <td>${product.code}</td>
                    <td>${product.name}</td>
                    <td>${product.type}</td>
                    <td>
                        <input type="text" class="price-input" data-id="${product.code}" list="optionsPrix"
                            placeholder="Prix ou T/D" oninput="validatePriceInput(this)">
                        <datalist id="optionsPrix">
                            <option value="T">Rupture Temporaire</option>
                            <option value="D">Rupture Définitive</option>
                        </datalist>
                    </td>
                </tr>
            `;
        } else if (produitType === 'Homogene O2&O3') {
            productTable.innerHTML += `
                <tr>
                    <td>${product.code}</td>
                    <td>${product.name}</td>
                    <td>${product.type}</td>
                    <td>
                        <input type="text" class="price-input" data-id="${product.code}" list="optionsPrix"
                            placeholder="Prix ou T/D" oninput="validatePriceInput(this)">
                        <datalist id="optionsPrix">
                            <option value="T">Rupture Temporaire</option>
                            <option value="D">Rupture Définitive</option>
                        </datalist>
                    </td>
                    <td><input type="number" class="quantity-input" data-id="${product.code}" placeholder="Quantité"></td>
                </tr>
            `;
        }
    });

    for (const [id, values] of Object.entries(savedValues)) {
        if (produitType === 'Hétérogene' || produitType === 'Homogene o1') {
            const input = document.querySelector(`.price-input[data-id="${id}"]`);
            if (input) input.value = values;
        } else if (produitType === 'Homogene O2&O3') {
            const inputPrice = document.querySelector(`.price-input[data-id="${id}"]`);
            const inputQuantity = document.querySelector(`.quantity-input[data-id="${id}"]`);
            if (inputPrice && inputQuantity) {
                inputPrice.value = values.prix;
                inputQuantity.value = values.quantite;
            }
        }
    }

    currentProductIndex = endIndex;

    const loadMoreArrow = document.getElementById('load-more-arrow');
    if (currentProductIndex >= allProducts.length) {
        loadMoreArrow.style.display = 'none';
        document.getElementById('save-prices').style.display = 'block';
    } else {
        loadMoreArrow.style.display = 'block';
        document.getElementById('save-prices').style.display = 'none';
    }
}

function validateCurrentPrices() {
    const selectedRadio = document.querySelector('input[name="produit-type"]:checked');
    const produitType = selectedRadio ? selectedRadio.value : null;

    const priceInputs = document.getElementsByClassName('price-input');
    const quantityInputs = document.getElementsByClassName('quantity-input');

    let allFilled = true;

    if (!produitType) {
        return false;
    }

    if (produitType === 'Hétérogene') {
        for (let input of priceInputs) {
            if (!input.value) {
                allFilled = false;
                break;
            }
        }
    } else if (produitType === 'Homogene o1') {
        for (let input of priceInputs) {
            if (!input.value) {
                allFilled = false;
                break;
            }
        }
    } else if (produitType === 'Homogene O2&O3') {
        for (let i = 0; i < priceInputs.length; i++) {
            if (!priceInputs[i].value || !quantityInputs[i].value) {
                allFilled = false;
                break;
            }
        }
    }

    return allFilled;
}


function validatePriceInput(input) {
    const value = input.value.toUpperCase(); // Convertir en majuscule pour éviter la casse
    const isNumber = /^[0-9]*\.?[0-9]*$/.test(value); // Vérifie si c'est un nombre
    const isAllowedLetter = value === "T" || value === "D"; // Vérifie si c'est "T" ou "D"

    if (!isNumber && !isAllowedLetter) {
        input.value = value.slice(0, -1); // Supprime le dernier caractère saisi
    }
}



document.getElementById('load-more-arrow').addEventListener('click', loadMoreProducts);


function showDialog(message) {
    const dialog = document.getElementById('dialog');
    const dialogMessage = document.getElementById('dialog-message');

    dialogMessage.innerHTML = message;
    dialog.style.display = 'flex';

    document.getElementById('dialog-ok-button').addEventListener('click', function() {
        dialog.style.display = 'none';
    });
}

document.getElementById('save-prices').addEventListener('click', async function() {
    // Récupérer le type de produit depuis le bouton radio sélectionné
    const selectedRadio = document.querySelector('input[name="produit-type"]:checked');
    const produitType = selectedRadio ? selectedRadio.value : null;
    const pointCollecte = document.getElementById('pointcollecte-select');
    const pointCollecteText = pointCollecte.options[pointCollecte.selectedIndex].text;

    const priceInputs = document.getElementsByClassName('price-input');
    const quantityInputs = document.getElementsByClassName('quantity-input');

    const prices = [];
    let hasError = false;

    if (!produitType) {
        alert('Veuillez sélectionner un type de produit.');
        return;
    }

    const previousPrices = await fetchPreviousMonthPrices(pointCollecte.value, produitType);
    const priceErrors = [];

    if (produitType === 'Hétérogene') {
        for (let i = 0; i < priceInputs.length; i++) {
            priceInputs[i].classList.remove('input-error', 'input-success');
            const inputValue = priceInputs[i].value.trim();
            const productId = priceInputs[i].getAttribute('data-id');
    
            let newPrice = parseFloat(inputValue);
            let typeStatut = "N";
            let somme = newPrice;
            let raisonVariation = null;
    
            if (inputValue === "T" || inputValue === "D") {
                typeStatut = inputValue;
                somme = 0;
            } else if (isNaN(newPrice) || newPrice <= 0) {
                priceInputs[i].classList.add('input-error');
                hasError = true;
                continue;
            }
    
            if (previousPrices[productId]) {
                const prevPrice = previousPrices[productId];
                const maxAllowed = prevPrice * 1.15;
                if (somme > maxAllowed || somme < prevPrice) {
                    if (typeStatut === "N") {
                        raisonVariation = prompt(`La variation du prix pour le produit ${productId} doit être entre ${prevPrice} et ${maxAllowed}. Veuillez fournir une raison :`);
                        if (!raisonVariation || raisonVariation.trim() === "") {
                            priceInputs[i].classList.add('input-error');
                            alert("La raison est obligatoire pour une variation hors intervalle. Traitement interrompu.");
                            return;
                        }
                    } else {
                        priceErrors.push({ element: priceInputs[i], productId });
                    }
                }
            }
    
            prices.push({
                code_produit: productId,
                somme: somme,
                quantite: 1,
                type_statut: typeStatut,
                raison_variation: raisonVariation
            });
        }
    } else if (produitType === 'Homogene o1') {
        for (let i = 0; i < priceInputs.length; i++) {
            priceInputs[i].classList.remove('input-error', 'input-success');
            const inputValue = priceInputs[i].value.trim();
            const productId = priceInputs[i].getAttribute('data-id');
    
            let newPrice = parseFloat(inputValue);
            let typeStatut = "N";
            let somme = newPrice;
            let raisonVariation = null;
    
            if (inputValue === "T" || inputValue === "D") {
                typeStatut = inputValue;
                somme = 0;
            } else if (isNaN(newPrice) || newPrice <= 0) {
                priceInputs[i].classList.add('input-error');
                hasError = true;
                continue;
            }
    
            if (previousPrices[productId]) {
                const prevPrice = previousPrices[productId];
                const maxAllowed = prevPrice * 1.5;
                if (somme > maxAllowed || somme < prevPrice) {
                    if (typeStatut === "N") {
                        raisonVariation = prompt(`La variation du prix pour le produit ${productId} doit être entre ${prevPrice} et ${maxAllowed}. Veuillez fournir une raison :`);
                        if (!raisonVariation || raisonVariation.trim() === "") {
                            priceInputs[i].classList.add('input-error');
                            alert("La raison est obligatoire pour une variation hors intervalle. Traitement interrompu.");
                            return;
                        }
                    } else {
                        priceErrors.push({ element: priceInputs[i], productId });
                    }
                }
            }
    
            prices.push({
                code_produit: productId,
                somme: somme,
                quantite: 1,
                type_statut: typeStatut,
                raison_variation: raisonVariation
            });
        }
    } else if (produitType === 'Homogene O2&O3') {
        for (let i = 0; i < priceInputs.length; i++) {
            priceInputs[i].classList.remove('input-error', 'input-success');
            quantityInputs[i].classList.remove('input-error', 'input-success');
    
            const inputValue = priceInputs[i].value.trim();
            const quantity = parseInt(quantityInputs[i].value, 10);
            const productId = priceInputs[i].getAttribute('data-id');
    
            let newPrice = parseFloat(inputValue);
            let typeStatut = "N";
            let somme = newPrice;
            let raisonVariation = null;
    
            if (inputValue === "T" || inputValue === "D") {
                typeStatut = inputValue;
                somme = 0;
            } else if (isNaN(newPrice) || newPrice <= 0 || isNaN(quantity) || quantity <= 0) {
                if (isNaN(newPrice) || newPrice <= 0) priceInputs[i].classList.add('input-error');
                if (isNaN(quantity) || quantity <= 0) quantityInputs[i].classList.add('input-error');
                hasError = true;
                continue;
            }
    
            if (previousPrices[productId]) {
                const prevPrice = previousPrices[productId];
                const maxAllowed = prevPrice * 1.5;
                if (somme > maxAllowed || somme < prevPrice) {
                    if (typeStatut === "N") {
                        raisonVariation = prompt(`La variation du prix pour le produit ${productId} doit être entre ${prevPrice} et ${maxAllowed}. Veuillez fournir une raison :`);
                        if (!raisonVariation || raisonVariation.trim() === "") {
                            priceInputs[i].classList.add('input-error');
                            alert("La raison est obligatoire pour une variation hors intervalle. Traitement interrompu.");
                            return;
                        }
                    } else {
                        priceErrors.push({ element: priceInputs[i], productId });
                    }
                }
            }
    
            prices.push({
                code_produit: productId,
                somme: somme,
                quantite: quantity,
                type_statut: typeStatut,
                raison_variation: raisonVariation
            });
        }
    }

    if (hasError) {
        alert('Il y a un ou plusieurs produits sans prix ou quantité valide. Veuillez remplir tous les champs.');
        return;
    }
    
    if (priceErrors.length > 0) {
        const proceed = confirm('Un ou plusieurs nouveaux prix dépassent ou sont inférieurs de 15% aux prix du mois précédent. Voulez-vous continuer à enregistrer ?');
        if (!proceed) {
            priceErrors.forEach(error => {
                error.element.classList.add('input-error');
            });
            return;
        }
    }

    console.log('Prices to save:', prices);

    if (!id_releve) {
        alert('Erreur : aucun relevé sélectionné. Veuillez choisir un point de collecte.');
        return;
    }

    const getPosition = () => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('La géolocalisation n\'est pas prise en charge par votre navigateur.'));
            } else {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        console.log('Position obtenue avec succès:', position.coords);
                        resolve({
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                            accuracy: position.coords.accuracy
                        });
                    },
                    (error) => {
                        console.error('Erreur dans getCurrentPosition:', error.message, 'Code:', error.code);
                        reject(error);
                    },
                    { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
                );
            }
        });
    };

    let position;
    try {
        position = await getPosition();
    } catch (error) {
        console.error('Erreur de géolocalisation:', error.message, 'Code:', error.code);
        if (error.code === 1) { // PERMISSION_DENIED
            alert('Vous avez refusé l\'accès à la géolocalisation. Veuillez autoriser l\'accès pour enregistrer les prix.');
            return;
        } else if (error.code === 2) { // POSITION_UNAVAILABLE
            alert('La position n\'est pas disponible. Veuillez vérifier que la géolocalisation est activée sur votre appareil.');
            return;
        } else if (error.code === 3) { // TIMEOUT
            alert('La demande de géolocalisation a expiré. Veuillez réessayer.');
            return;
        } else {
            alert('Une erreur inattendue est survenue lors de la récupération de la position : ' + error.message);
            return;
        }
    }

    try {
        const response = await fetch('/save_prices', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id_releve: id_releve,
                code_point_collecte: pointCollecte.value,
                prices: prices,
                position: position
            }),
        });

        const result = await response.json();
        if (result.status === 'success') {
            showDialog(`Les prix des produits du point de collecte <span>${pointCollecteText}</span> ont été enregistrés avec succès ! À bientôt le mois prochain pour ce point de collecte. Veuillez choisir un autre point de collecte pour continuer.`);
            const carnetId = document.getElementById('carnet-select').value;
            const typePointCollecteId = document.getElementById('typepointcollecte-select').value;
            if (typeof loadPointsOfSale === 'function') {
                await loadPointsOfSale(carnetId, typePointCollecteId);
            } else {
                console.warn('loadPointsOfSale n\'est pas défini. Les points de collecte ne sont pas rechargés.');
            }
            // Réinitialiser les boutons radio et masquer les sections
            document.getElementById('produit-type-radios').innerHTML = '';
            document.getElementById('produit-type-section').style.display = 'none';
            document.getElementById('product-section').style.display = 'none';
        } else {
            alert('Une erreur est survenue lors de l\'enregistrement des prix : ' + (result.message || 'Erreur inconnue'));
        }
    } catch (error) {
        console.error('Erreur lors de l\'envoi des données au serveur:', error);
        alert('Une erreur est survenue lors de l\'envoi des données au serveur : ' + error.message);
    }
});

document.getElementById('product-section').addEventListener('input', function(event) {
    if (event.target.classList.contains('price-input') || event.target.classList.contains('price-input-1') || event.target.classList.contains('price-input-2') || event.target.classList.contains('quantity-input')) {
        if (event.target.value) {
            event.target.classList.remove('input-error');
            event.target.classList.add('input-success');
        } else {
            event.target.classList.remove('input-success');
            event.target.classList.add('input-error');
        }
    }
});

document.getElementById('load-more-arrow').addEventListener('click', loadMoreProducts);


async function fetchPreviousMonthPrices(codePointCollecte, produitType) {
    const response = await fetch('/get_previous_month_prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            code_point_collecte: codePointCollecte,
            produit_type: produitType
        }),
    });
    return await response.json();
}

