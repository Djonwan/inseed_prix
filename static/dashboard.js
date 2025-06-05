document.addEventListener('DOMContentLoaded', function () {
    // Déclarer agentHistogram dans la portée globale
    let agentHistogram = null;

     // Fonction pour formater le mois et l'année en une chaîne lisible (ex: "Mars 2025")
     function formatDate(month, year) {
        const monthNames = [
            "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
            "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
        ];
        const monthIndex = parseInt(month) - 1; // Les mois sont de 1 à 12
        if (month && year && monthIndex >= 0 && monthIndex < 12) {
            return `${monthNames[monthIndex]} ${year}`;
        }
        return "..."; // Valeur par défaut si la date n'est pas encore sélectionnée
    }

    // Fonction pour mettre à jour les titres des sections "Évolution"
    function updateAgentEvolutionTitle() {
        const month = document.getElementById('select-moi').value;
        const year = document.getElementById('select-date').value;
        const formattedDate = formatDate(month, year);

        // Mettre à jour le titre de la section "Évolution de chaque agent"
        const agentTitleElement = document.getElementById('agent-evolution-title');
        if (agentTitleElement) {
            agentTitleElement.textContent = `Évolution de chaque agent pour la date du ${formattedDate}`;
        }

        // Mettre à jour le titre de la section "Évolution par carnet"
        const carnetTitleElement = document.getElementById('carnet-evolution-title');
        if (carnetTitleElement) {
            carnetTitleElement.textContent = `Évolution par carnet pour la date du ${formattedDate}`;
        }
    }

    // Fonction pour mettre à jour le titre en fonction de la ville sélectionnée
    function updateCollectionPointsTitle() {
        const selectVille = document.getElementById('select-ville');
        const selectedOption = selectVille.options[selectVille.selectedIndex];
        const cityName = selectedOption ? selectedOption.textContent : '...';
        const titleElement = document.getElementById('collection-points-title');
        if (titleElement) {
            titleElement.textContent = `Points de collecte pour la ville de ${cityName}`;
        }
    }

    // Fonction pour remplir le select des villes
    async function loadCities() {
        try {
            const response = await fetch('/get_controlled_cities');
            if (!response.ok) throw new Error('Erreur lors du chargement des villes');
            const data = await response.json();

            const selectVille = document.getElementById('select-ville');
            selectVille.innerHTML = '<option value="">Sélectionnez une ville</option>';
            data.cities.forEach(city => {
                const option = document.createElement('option');
                option.value = city.id_ville;
                option.textContent = city.nom_ville;
                selectVille.appendChild(option);
            });

            if (data.default_city) {
                selectVille.value = data.default_city.id_ville;
                loadAgentProgress();
                loadCarnetProgress(); // Charger les agents avec la ville par défaut
                loadControllerStats();
                updateAgentEvolutionTitle();
                loadCollectionPoints();
                updateCollectionPointsTitle();
                loadAlerts();
            }
        } catch (error) {
            console.error('Erreur:', error);
            alert('Impossible de charger les villes.');
        }
    }

    // Fonction pour remplir les selects des années et mois
    async function loadDates() {
        try {
            const response = await fetch('/get_price_dates');
            if (!response.ok) throw new Error('Erreur lors du chargement des dates');
            const data = await response.json();

            const selectYear = document.getElementById('select-date');
            selectYear.innerHTML = '<option value="">Sélectionnez une année</option>';
            data.years.forEach(year => {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year;
                selectYear.appendChild(option);
            });

            if (data.default_year) {
                selectYear.value = data.default_year;
            }

            const selectMonth = document.getElementById('select-moi');
            selectMonth.innerHTML = '<option value="">Sélectionnez un mois</option>';
            data.months.forEach(month => {
                const option = document.createElement('option');
                option.value = month.value;
                option.textContent = month.label;
                selectMonth.appendChild(option);
            });

            if (data.default_month) {
                selectMonth.value = data.default_month;
                loadAgentProgress();
                loadCarnetProgress(); // Charger les agents avec la date par défaut
                loadControllerStats();
                updateAgentEvolutionTitle();
                loadCollectionPoints();
                updateCollectionPointsTitle();
                loadAlerts();
            }

            selectYear.addEventListener('change', async function () {
                const selectedYear = this.value;
                if (selectedYear) {
                    const response = await fetch(`/get_price_dates?year=${selectedYear}`);
                    const updatedData = await response.json();
                    selectMonth.innerHTML = '<option value="">Sélectionnez un mois</option>';
                    updatedData.months.forEach(month => {
                        const option = document.createElement('option');
                        option.value = month.value;
                        option.textContent = month.label;
                        selectMonth.appendChild(option);
                    });
                    selectMonth.value = updatedData.default_month || '';
                    loadAgentProgress();
                    loadCarnetProgress(); // Mettre à jour les agents
                    loadControllerStats();
                    updateAgentEvolutionTitle();
                    loadCollectionPoints();
                    updateCollectionPointsTitle();
                    loadAlerts();
                }
            });

            selectMonth.addEventListener('change', function () {
                loadAgentProgress();
                loadCarnetProgress();
                loadControllerStats();
                updateAgentEvolutionTitle();
                loadCollectionPoints();
                updateCollectionPointsTitle();
                loadAlerts();
            });
        } catch (error) {
            console.error('Erreur:', error);
            alert('Impossible de charger les dates.');
        }
    }

    // Fonction pour charger et afficher les alertes dans la modale
    async function loadAlerts() {
        try {
            const response = await fetch('/get_delayed_collection_points');
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Erreur lors du chargement des alertes: ${response.status} - ${errorText}`);
            }
            const data = await response.json();

            const alertsList = document.getElementById('alerts-list');
            alertsList.innerHTML = ''; // Vider la liste

            if (data.alerts.length === 0) {
                const noAlertItem = document.createElement('li');
                noAlertItem.className = 'list-group-item';
                noAlertItem.textContent = "Aucune alerte de traitement en retard.";
                alertsList.appendChild(noAlertItem);
            } else {
                data.alerts.forEach(alert => {
                    const alertItem = document.createElement('li');
                    alertItem.className = 'list-group-item alert-item';
                    alertItem.innerHTML = `
                        <strong>${alert.nom_point_collecte}</strong> (Agent: ${alert.agent}, Carnet: ${alert.carnet})<br>
                        ${alert.message}<br>
                        <small>Date de passage: ${alert.date_passage}</small>
                    `;
                    alertsList.appendChild(alertItem);
                });
            }

            // Mettre à jour le compteur de notifications
            const notificationCount = document.getElementById('notification-count');
            notificationCount.textContent = data.alerts.length;
        } catch (error) {
            console.error('Erreur:', error);
            alert('Impossible de charger les alertes.');
        }
    }

    
    // Fonction pour charger et afficher les agents avec leur progression (tableau)
    async function loadAgentProgress() {
        const villeId = document.getElementById('select-ville').value;
        const month = document.getElementById('select-moi').value;
        const year = document.getElementById('select-date').value;

        if (!villeId || !month || !year) return; // Ne rien faire si une sélection manque

        try {
            const response = await fetch(`/get_agent_progress?ville_id=${villeId}&month=${month}&year=${year}`);
            if (!response.ok) throw new Error('Erreur lors du chargement des agents');
            const agents = await response.json();

            const agentList = document.getElementById('agent-progress-list');
            agentList.innerHTML = ''; // Vider le tableau actuel

            agents.forEach(agent => {
                const tr = document.createElement('tr');
                // Créer une barre de progression segmentée avec une partie grisée pour les points restants
                const progressBar = `
                    <div class="progress">
                        <div class="progress-bar bg-success" role="progressbar" style="width: ${agent.progress_by_status.Valider}%;" 
                            aria-valuenow="${agent.progress_by_status.Valider}" aria-valuemin="0" aria-valuemax="100">
                            ${agent.points_by_status.Valider > 0 ? agent.points_by_status.Valider : ''}
                        </div>
                        <div class="progress-bar bg-danger" role="progressbar" style="width: ${agent.progress_by_status.Rejeter}%;" 
                            aria-valuenow="${agent.progress_by_status.Rejeter}" aria-valuemin="0" aria-valuemax="100">
                            ${agent.points_by_status.Rejeter > 0 ? agent.points_by_status.Rejeter : ''}
                        </div>
                        <div class="progress-bar bg-warning" role="progressbar" style="width: ${agent.progress_by_status.ajuster}%;" 
                            aria-valuenow="${agent.progress_by_status.ajuster}" aria-valuemin="0" aria-valuemax="100">
                            ${agent.points_by_status.ajuster > 0 ? agent.points_by_status.ajuster : ''}
                        </div>
                        <div class="progress-bar bg-primary" role="progressbar" style="width: ${agent.progress_by_status.null}%;" 
                            aria-valuenow="${agent.progress_by_status.null}" aria-valuemin="0" aria-valuemax="100">
                            ${agent.points_by_status.null > 0 ? agent.points_by_status.null : ''}
                        </div>
                        <div class="progress-bar bg-secondary" role="progressbar" style="width: ${agent.progress_by_status.remaining}%;" 
                            aria-valuenow="${agent.progress_by_status.remaining}" aria-valuemin="0" aria-valuemax="100">
                            ${agent.remaining_points > 0 ? agent.remaining_points : ''}
                        </div>
                    </div>
                    <div class="progress-text mt-1">
                        ${agent.completed_points}/${agent.total_points} (${agent.progress}%)
                    </div>
                `;
                
                tr.innerHTML = `
                    <td>${agent.nom_agent}</td>
                    <td>${progressBar}</td>
                `;
                agentList.appendChild(tr);
            });
        } catch (error) {
            console.error('Erreur:', error);
            alert('Impossible de charger les données des agents.');
        }
    }

    // Fonction pour charger et afficher les carnets avec une hiérarchie
    async function loadCarnetProgress() {
        const villeId = document.getElementById('select-ville').value;
        const month = document.getElementById('select-moi').value;
        const year = document.getElementById('select-date').value;

        if (!villeId || !month || !year) return; // Ne rien faire si une sélection manque

        try {
            const response = await fetch(`/get_carnet_progress?ville_id=${villeId}&month=${month}&year=${year}`);
            if (!response.ok) throw new Error('Erreur lors du chargement des carnets');
            const agents = await response.json();

            const carnetList = document.getElementById('carnet-progress-list');
            carnetList.innerHTML = ''; // Vider le tableau actuel

            agents.forEach(agent => {
                let firstRow = true; // Variable pour afficher le nom de l'agent seulement une fois

                agent.carnets.forEach(carnet => {
                    // Créer une barre de progression segmentée avec une partie grisée pour les points restants
                    const progressBar = `
                        <div class="progress">
                            <div class="progress-bar bg-success" role="progressbar" style="width: ${carnet.progress_by_status.Valider}%;" 
                                aria-valuenow="${carnet.progress_by_status.Valider}" aria-valuemin="0" aria-valuemax="100">
                                ${carnet.points_by_status.Valider > 0 ? carnet.points_by_status.Valider : ''}
                            </div>
                            <div class="progress-bar bg-danger" role="progressbar" style="width: ${carnet.progress_by_status.Rejeter}%;" 
                                aria-valuenow="${carnet.progress_by_status.Rejeter}" aria-valuemin="0" aria-valuemax="100">
                                ${carnet.points_by_status.Rejeter > 0 ? carnet.points_by_status.Rejeter : ''}
                            </div>
                            <div class="progress-bar bg-warning" role="progressbar" style="width: ${carnet.progress_by_status.ajuster}%;" 
                                aria-valuenow="${carnet.progress_by_status.ajuster}" aria-valuemin="0" aria-valuemax="100">
                                ${carnet.points_by_status.ajuster > 0 ? carnet.points_by_status.ajuster : ''}
                            </div>
                            <div class="progress-bar bg-primary" role="progressbar" style="width: ${carnet.progress_by_status.null}%;" 
                                aria-valuenow="${carnet.progress_by_status.null}" aria-valuemin="0" aria-valuemax="100">
                                ${carnet.points_by_status.null > 0 ? carnet.points_by_status.null : ''}
                            </div>
                            <div class="progress-bar bg-secondary" role="progressbar" style="width: ${carnet.progress_by_status.remaining}%;" 
                                aria-valuenow="${carnet.progress_by_status.remaining}" aria-valuemin="0" aria-valuemax="100">
                                ${carnet.remaining_points > 0 ? carnet.remaining_points : ''}
                            </div>
                        </div>
                        <div class="progress-text mt-1">
                            ${carnet.completed_points}/${carnet.total_points} (${carnet.progress}%)
                        </div>
                    `;

                    const carnetRow = document.createElement('tr');
                    carnetRow.innerHTML = `
                        <td>${firstRow ? `<strong>${agent.nom_agent}</strong>` : ''}</td>
                        <td>${carnet.nom_carnet}</td>
                        <td>${progressBar}</td>
                    `;
                    carnetList.appendChild(carnetRow);

                    firstRow = false; // Ne plus afficher le nom de l'agent après la première ligne
                });
            });
        } catch (error) {
            console.error('Erreur:', error);
            alert('Impossible de charger les données des carnets.');
        }
    }


    // Nouvelle fonction pour charger et afficher les statistiques du contrôleur
    async function loadControllerStats() {
        const villeId = document.getElementById('select-ville').value;
        const month = document.getElementById('select-moi').value;
        const year = document.getElementById('select-date').value;

        if (!villeId || !month || !year) return; // Ne rien faire si une sélection manque

        try {
            const response = await fetch(`/get_controller_stats?ville_id=${villeId}&month=${month}&year=${year}`);
            if (!response.ok) throw new Error('Erreur lors du chargement des statistiques');
            const stats = await response.json();

            // Mettre à jour les valeurs dans les carrés
            document.getElementById('stat-total-points').textContent = stats.total_points;
            document.getElementById('stat-points-priced').textContent = stats.points_with_price;
            document.getElementById('stat-points-rejeter').textContent = stats.points_rejeter;
            document.getElementById('stat-points-ajuster').textContent = stats.points_ajuster;
            document.getElementById('stat-points-valider').textContent = stats.points_valider;
        } catch (error) {
            console.error('Erreur:', error);
            alert('Impossible de charger les statistiques du contrôleur.');
        }
    }
    
    // // Fonction pour charger et afficher les carnets avec une hiérarchie
    // async function loadCarnetProgress() {
    //     const villeId = document.getElementById('select-ville').value;
    //     const month = document.getElementById('select-moi').value;
    //     const year = document.getElementById('select-date').value;
    
    //     if (!villeId || !month || !year) return; // Ne rien faire si une sélection manque
    
    //     try {
    //         const response = await fetch(`/get_carnet_progress?ville_id=${villeId}&month=${month}&year=${year}`);
    //         if (!response.ok) throw new Error('Erreur lors du chargement des carnets');
    //         const agents = await response.json();
    
    //         const carnetList = document.getElementById('carnet-progress-list');
    //         carnetList.innerHTML = ''; // Vider le tableau actuel
    
    //         agents.forEach(agent => {
    //             let firstRow = true; // Variable pour afficher le nom de l'agent seulement une fois
    
    //             agent.carnets.forEach(carnet => {
    //                 const carnetRow = document.createElement('tr');
    //                 carnetRow.innerHTML = `
    //                     <td>${firstRow ? `<strong>${agent.nom_agent}</strong>` : ''}</td>
    //                     <td>${carnet.nom_carnet}</td>
    //                     <td>
    //                         <div class="progress">
    //                             <div class="progress-bar" role="progressbar" style="width: ${carnet.progress}%;" 
    //                                 aria-valuenow="${carnet.progress}" aria-valuemin="0" aria-valuemax="100">
    //                                 ${carnet.completed_points}/${carnet.total_points} (${carnet.progress}%)
    //                             </div>
    //                         </div>
    //                     </td>
    //                 `;
    //                 carnetList.appendChild(carnetRow);
    
    //                 firstRow = false; // Ne plus afficher le nom de l'agent après la première ligne
    //             });
    //         });
    //     } catch (error) {
    //         console.error('Erreur:', error);
    //         alert('Impossible de charger les données des carnets.');
    //     }
    // }


    // Fonction pour charger les points de collecte
    async function loadCollectionPoints() {
        try {
            const selectedCity = document.getElementById('select-ville').value;
            const selectedMonth = document.getElementById('select-moi').value;
            const selectedYear = document.getElementById('select-date').value;

            if (!selectedCity || !selectedMonth || !selectedYear) {
                console.log("Données incomplètes, chargement annulé");
                return;
            }

            let url = '/get_collection_points';
            const params = [];
            if (selectedCity) params.push(`city=${selectedCity}`);
            if (selectedMonth) params.push(`month=${selectedMonth}`);
            if (selectedYear) params.push(`year=${selectedYear}`);
            if (params.length > 0) url += `?${params.join('&')}`;
            console.log("Fetching URL:", url);

            const response = await fetch(url);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Erreur lors du chargement des points de collecte: ${response.status} - ${errorText}`);
            }
            const data = await response.json();

            // Stocker les données brutes
            collectionPointsData = data.points;

            // Remplir les filtres agent et carnet (initialement tous)
            populateFilterOptions();

            // Afficher les données filtrées
            filterAndDisplayPoints();
        } catch (error) {
            console.error('Erreur:', error);
            alert('Impossible de charger les points de collecte.');
        }
    }

    // Fonction pour remplir les options des filtres agent et carnet
    function populateFilterOptions(selectedAgent = '') {
        const agentSelect = document.getElementById('filter-agent');
        const carnetSelect = document.getElementById('filter-carnet');

        // Récupérer les agents uniques (inchangé)
        const uniqueAgents = [...new Set(collectionPointsData.map(point => point.agent))].sort();

        // Remplir les agents uniquement si ce n'est pas déjà fait
        if (agentSelect.options.length === 1) { // Si seul "Tous" est présent
            uniqueAgents.forEach(agent => {
                const option = document.createElement('option');
                option.value = agent;
                option.textContent = agent;
                agentSelect.appendChild(option);
            });
        }

        // Filtrer les carnets en fonction de l'agent sélectionné (ou tous si aucun agent)
        const filteredData = selectedAgent
            ? collectionPointsData.filter(point => point.agent === selectedAgent)
            : collectionPointsData;
        const uniqueCarnets = [...new Set(filteredData.map(point => point.carnet))].sort();

        // Réinitialiser et remplir les carnets
        carnetSelect.innerHTML = '<option value="">Tous les carnets</option>';
        uniqueCarnets.forEach(carnet => {
            const option = document.createElement('option');
            option.value = carnet;
            option.textContent = carnet;
            carnetSelect.appendChild(option);
        });
    }

    // Fonction pour filtrer et afficher les points
    function filterAndDisplayPoints() {
        const filterAgent = document.getElementById('filter-agent').value;
        const filterCarnet = document.getElementById('filter-carnet').value;
        const filterStatut = document.getElementById('filter-statut').value;

        // Filtrer les données
        const filteredPoints = collectionPointsData.filter(point => {
            const agentMatch = filterAgent === '' || point.agent === filterAgent;
            const carnetMatch = filterCarnet === '' || point.carnet === filterCarnet;
            const statutMatch = filterStatut === '' || point.statut === filterStatut;
            return agentMatch && carnetMatch && statutMatch;
        });

        // Mettre à jour le tableau
        const pointsList = document.getElementById('collection-points-list');
        pointsList.innerHTML = ''; // Vider le tableau

        filteredPoints.forEach(point => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${point.code_point_collecte}</td>
                <td>${point.nom_point_collecte}</td>
                <td>${point.nb_produits}</td>
                <td>${point.statut}</td>
                <td>${point.agent}</td>
                <td>${point.carnet}</td>
            `;
            pointsList.appendChild(row);
        });
    }
    
    // Fonction de déconnexion
    window.logout = function () {
        fetch('/logout', { method: 'POST' })
            .then(() => window.location.href = '/')
            .catch(error => console.error('Erreur lors de la déconnexion:', error));
    };

    // Charger les données au démarrage
    loadCities();
    loadDates();

    // Ajouter un événement pour la ville
    document.getElementById('select-ville').addEventListener('change', function () {
        loadAgentProgress();
        loadCarnetProgress();
        loadControllerStats();
        updateAgentEvolutionTitle();
        loadCollectionPoints();
        updateCollectionPointsTitle();
        loadAlerts(); 
    });
    // Ajouter des événements pour les filtres
    document.getElementById('filter-agent').addEventListener('change', function () {
        const selectedAgent = this.value;
        populateFilterOptions(selectedAgent); // Mettre à jour les carnets en fonction de l'agent
        filterAndDisplayPoints();
    });
    document.getElementById('filter-carnet').addEventListener('change', filterAndDisplayPoints);
    document.getElementById('filter-statut').addEventListener('change', filterAndDisplayPoints);

});