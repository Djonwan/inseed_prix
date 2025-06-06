$(document).ready(function() {

    $(document).ready(function() {
        function initializeNotifications_controlleur() {
            const notificationButton = document.getElementById("notification-button");
            const notificationCount = document.getElementById("notification-count");
    
            // Fonction pour mettre à jour uniquement le compteur de notifications
            async function updateNotificationCount() {
                try {
                    const response = await fetch("/notifications_controlleur");
                    if (!response.ok) throw new Error("Erreur lors de la récupération des notifications");
    
                    const data = await response.json();
                    if (data.error) {
                        console.error("Erreur:", data.error);
                        return;
                    }
    
                    // Mettre à jour le nombre de notifications
                    notificationCount.textContent = data.total_points;
                } catch (error) {
                    console.error("Erreur lors de la mise à jour du compteur de notifications:", error);
                }
            }
    
            // Fonction complète pour récupérer et afficher les notifications
            async function fetchNotifications(showModal = false) {
                try {
                    const response = await fetch("/notifications_controlleur");
                    if (!response.ok) throw new Error("Erreur lors de la récupération des notifications");
    
                    const data = await response.json();
                    if (data.error) {
                        console.error("Erreur:", data.error);
                        return;
                    }
    
                    notificationCount.textContent = data.total_points;
    
                    let notificationList = `<table class='table table-striped'>
                                                <thead>
                                                    <tr><th>Agent</th><th>Carnet</th><th>Code point collecte</th><th>Nom de point de collecte</th><th>Message</th><th>Date de collecte</th><th>Statut</th><th>ID Relevé</th></tr>
                                                </thead>
                                                <tbody>`;
    
                    data.notifications.forEach(notif => {
                        notificationList += `<tr class="notification-row" 
                                                data-point="${notif.code_point_collecte}"
                                                point_collecte_nom="${notif.point_collecte}"  
                                                data-date="${notif.date_passage}"
                                                data-statut="${notif.statut}"
                                                data-agent="${notif.nom_agent}"
                                                data-carnet="${notif.nom_carnet}"
                                                data-ville="${notif.ville}"
                                                data-type-point="${notif.type_point_collecte}"
                                                data-type-produit="${notif.type_produit}"
                                                data-id-releve="${notif.id_releve}">
                                                <td>${notif.nom_agent}</td>
                                                <td>${notif.nom_carnet}</td>
                                                <td>${notif.code_point_collecte}</td>
                                                <td>${notif.point_collecte}</td>
                                                <td>${notif.message}</td>
                                                <td>${notif.date_passage}</td>
                                                <td>${notif.statut}</td>
                                                <td>${notif.id_releve}</td>
                                             </tr>`;
                    });
    
                    notificationList += "</tbody></table>";
    
                    document.getElementById("notification-container").innerHTML = notificationList;
    
                    if (showModal) {
                        $('#notification-modal').modal('show');
                    }
    
                    document.querySelectorAll('.notification-row').forEach(row => {
                        row.addEventListener('click', async function() {
                            const pointCollecte = this.getAttribute('data-point');
                            const pointCollecteNom = this.getAttribute('point_collecte_nom');
                            const datePassage = this.getAttribute('data-date');
                            const statut = this.getAttribute('data-statut');
                            const nomAgent = this.getAttribute('data-agent');
                            const nomCarnet = this.getAttribute('data-carnet');
                            const villeNom = this.getAttribute('data-ville');
                            const typePointCollecte = this.getAttribute('data-type-point');
                            const typeProduit = this.getAttribute('data-type-produit');
                            const idReleve = this.getAttribute('data-id-releve');
    
                            console.log('ID Relevé cliqué :', idReleve);
    
                            if (statut === "Rejeter") {
                                alert("Vous devez attendre le retour de l'agent après ajustement pour valider les produits rejetés.");
                            } else if (statut === "Ajuster") {
                                const [annee, mois] = datePassage.split('-');
                                const villeSelect = $('#villeSelect');
                                const villeOption = villeSelect.find(`option:contains("${villeNom}")`);
                                if (villeOption.length > 0) {
                                    villeSelect.val(villeOption.val()).trigger('change');
                                }
                                await new Promise(resolve => setTimeout(resolve, 500));
                                const agentSelect = $('#agentSelect');
                                const agentOption = agentSelect.find(`option:contains("${nomAgent}")`);
                                if (agentOption.length > 0) {
                                    agentSelect.val(agentOption.val()).trigger('change');
                                }
                                await new Promise(resolve => setTimeout(resolve, 500));
                                const carnetSelect = $('#carnetSelect');
                                const carnetOption = carnetSelect.find(`option:contains("${nomCarnet}")`);
                                if (carnetOption.length > 0) {
                                    carnetSelect.val(carnetOption.val()).trigger('change');
                                }
                                await new Promise(resolve => setTimeout(resolve, 500));
                                const typePointCollecteSelect = $('#typePointCollecte');
                                const typePointOption = typePointCollecteSelect.find(`option[value="${typePointCollecte}"]`);
                                if (typePointOption.length > 0) {
                                    typePointCollecteSelect.val(typePointOption.val()).trigger('change');
                                }
                                await new Promise(resolve => setTimeout(resolve, 500));
                                const selectYear = $('#select-year');
                                selectYear.val(annee).trigger('change');
                                const moisSelect = $('#moisSelect');
                                moisSelect.val(mois).trigger('change');
                                await new Promise(resolve => setTimeout(resolve, 500));
    
                                const pointCollecteSelect = $('#pointCollecte');
                                const carnetId = carnetSelect.val();
                                const typePointCollecteVal = typePointCollecteSelect.val();
    
                                let pointOptionVal = null;
    
                                if (carnetId && typePointCollecteVal && annee && mois) {
                                    try {
                                        const encodedTypePointCollecteVal = encodeURIComponent(typePointCollecteVal);
                                        const url = `/api/carnets/${carnetId}/types-point-collecte/${encodedTypePointCollecteVal}/points-collecte?annee=${annee}&mois=${mois}`;
                                        const response = await fetch(url);
                                        if (!response.ok) {
                                            const errorData = await response.json();
                                            throw new Error(`Erreur : ${response.status} - ${errorData.error}`);
                                        }
                                        const pointsCollecteData = await response.json();
    
                                        pointCollecteSelect.empty();
                                        pointCollecteSelect.append('<option value="">Sélectionner un point de collecte</option>');
                                        pointsCollecteData.forEach(point => {
                                            pointCollecteSelect.append(`<option value="${point.code_point_collecte}">${point.nom_point_collecte}</option>`);
                                        });
    
                                        const pointOption = pointCollecteSelect.find(`option:contains("${pointCollecteNom}")`);
                                        if (pointOption.length > 0) {
                                            pointCollecteSelect.val(pointOption.val()).trigger('change');
                                            pointOptionVal = pointOption.val();
                                        }
                                    } catch (error) {
                                        console.error("Erreur lors du chargement des points de collecte:", error);
                                    }
                                }
    
                                await new Promise(resolve => setTimeout(resolve, 500));
    
                                const releveSelect = $('#releveSelect');
                                if (idReleve) {
                                    $.ajax({
                                        url: `/api/carnets/${carnetId}/points-collecte/${pointCollecte}/releves`,
                                        method: 'GET',
                                        success: function(data) {
                                            releveSelect.empty();
                                            releveSelect.append('<option value="">Sélectionnez un relevé</option>');
                                            data.forEach(function(releve) {
                                                releveSelect.append(`<option value="${releve.id_releve}">${releve.nom_releve}</option>`);
                                            });
                                            releveSelect.val(idReleve).trigger('change');
                                        },
                                        error: function(error) {
                                            console.error("Erreur lors de la récupération des relevés:", error);
                                        }
                                    });
                                }
    
                                await new Promise(resolve => setTimeout(resolve, 500));
    
                                const typeSelect = $('#typeSelect');
                                const typeProduitOption = typeSelect.find(`option[value="${typeProduit}"]`);
                                if (typeProduitOption.length > 0) {
                                    typeSelect.val(typeProduitOption.val()).trigger('change');
                                }
    
                                const allSelectsLoaded = (
                                    villeSelect.val() === villeOption.val() &&
                                    agentSelect.val() === agentOption.val() &&
                                    carnetSelect.val() === carnetOption.val() &&
                                    typePointCollecteSelect.val() === typePointOption.val() &&
                                    pointCollecteSelect.val() === pointOptionVal &&
                                    releveSelect.val() === idReleve &&
                                    typeSelect.val() === typeProduitOption.val() &&
                                    selectYear.val() === annee &&
                                    moisSelect.val() === mois
                                );
    
                                if (allSelectsLoaded) {
                                    console.log("Tous les selects sont bien chargés, fermeture de la modale...");
                                    $('#notification-modal').modal('hide');
                                } else {
                                    console.error("Certains selects n'ont pas été chargés correctement.");
                                }
                            } else {
                                $('#notification-modal').modal('hide');
                                setTimeout(() => {
                                    fetchRejectedProducts(pointCollecte, datePassage, pointCollecteNom);
                                }, 500);
                            }
                        });
                    });
                } catch (error) {
                    console.error("Erreur lors de la récupération des notifications:", error);
                }
            }
    
            // Charger les notifications au clic sur la cloche (avec modale)
            notificationButton.addEventListener("click", () => fetchNotifications(true));
    
            // Charger les notifications au chargement de la page (sans modale)
            fetchNotifications(false);
    
            // Gestion du clic sur le bouton "Valider la Collecte"
            $('#valide-prices-btn').click(function() {
                var villeId = $('#villeSelect').val();
                var agentId = $('#agentSelect').val();
                var typePointCollecte = $('#typePointCollecte').val();
                var pointCollecteId = $('#pointCollecte').val();
                var typeProduit = $('#typeSelect').val();
                var mois = $('#moisSelect').val();
                var annee = $('#select-year').val();
                var idReleve = $('#releveSelect').val();
                var dateFormatted = annee + '-' + mois;
    
                if (!villeId || !agentId || !typePointCollecte || !pointCollecteId || !typeProduit || !mois || !idReleve) {
                    alert("Veuillez sélectionner tous les critères pour valider les prix.");
                    return;
                }
    
                if (confirm("Êtes-vous sûr de vouloir valider les prix pour ces critères ?")) {
                    $.ajax({
                        url: '/api/valider-prix',
                        method: 'POST',
                        contentType: 'application/json',
                        data: JSON.stringify({
                            id_releve: idReleve,
                            type_produit: typeProduit,
                            mois: dateFormatted
                        }),
                        success: function(response) {
                            alert(response.message);
                            $('#releveSelect').val('').trigger('change');
                            $('#pointCollecte').val('').trigger('change');
                            $('#typePointCollecte').trigger('change');
                            $('#typeSelect').val('').trigger('change');
                            updateNotificationCount();
                        },
                        error: function(xhr) {
                            let errorMessage = xhr.responseJSON?.error || "Une erreur est survenue lors de la validation des prix.";
                            console.error("Erreur lors de la validation des prix:", xhr);
                            alert(errorMessage);
                        }
                    });
                }
            });
    
            // Gestion du clic sur le bouton "Rejeter la Collecte"
            $('#delete-prices-btn').click(function() {
                var villeId = $('#villeSelect').val();
                var agentId = $('#agentSelect').val();
                var typePointCollecte = $('#typePointCollecte').val();
                var pointCollecteId = $('#pointCollecte').val();
                var typeProduit = $('#typeSelect').val();
                var mois = $('#moisSelect').val();
                var annee = $('#select-year').val();
                var idReleve = $('#releveSelect').val();
                var dateFormatted = annee + '-' + mois;
    
                if (!villeId || !agentId || !typePointCollecte || !pointCollecteId || !typeProduit || !mois || !idReleve) {
                    alert("Veuillez sélectionner tous les critères avant de rejeter la collecte.");
                    return;
                }
    
                if (confirm("Êtes-vous sûr de vouloir rejeter ces prix ?")) {
                    var messageRejet = prompt("Veuillez entrer le message de rejet :");
    
                    if (!messageRejet || messageRejet.trim() === "") {
                        alert("Le message de rejet est obligatoire.");
                        return;
                    }
    
                    $.ajax({
                        url: '/api/rejeter-prix',
                        method: 'POST',
                        contentType: 'application/json',
                        data: JSON.stringify({
                            id_releve: idReleve,
                            type_produit: typeProduit,
                            mois: dateFormatted,
                            message: messageRejet
                        }),
                        success: function(response) {
                            alert(response.message);
                            $('#releveSelect').val('').trigger('change');
                            $('#pointCollecte').val('').trigger('change');
                            $('#typePointCollecte').trigger('change');
                            $('#typeSelect').val('').trigger('change');
                            updateNotificationCount();
                        },
                        error: function(xhr) {
                            var errorMessage = xhr.responseJSON?.error || "Une erreur est survenue.";
                            alert(errorMessage);
                        }
                    });
                }
            });
        }
    
        initializeNotifications_controlleur();
    
        
    });
   
    

    function checkSelections() {
        var villeId = $('#villeSelect').val();
        var agentId = $('#agentSelect').val();
        var carnetId = $('#carnetSelect').val();
        var typePointCollecte = $('#typePointCollecte').val();
        var pointCollecteId = $('#pointCollecte').val();
        var typeProduit = $('#typeSelect').val();
        var mois = $('#moisSelect').val();
        var annee = $('#select-year').val();
    
        const selections = [
            { id: villeId, label: "Ville" },
            { id: agentId, label: "Agent" },
            { id: carnetId, label: "Carnet" },
            { id: typePointCollecte, label: "Type de Point de Collecte" },
            { id: pointCollecteId, label: "Point de Collecte" },
            { id: typeProduit, label: "Type de Produit" },
            { id: mois, label: "Mois" },
            { id: annee, label: "Année" }
        ];
    
        const missingFields = selections.filter(selection => !selection.id).map(selection => selection.label);
    
        if (missingFields.length > 0) {
            let message = `<i class="fas fa-exclamation-triangle"></i> Veuillez sélectionner les champs suivants : ${missingFields.join(", ")}.`;
            $('#waitingMessage').html(message).addClass('warning-message').show();
            $('.table-header1').hide();
            $('.export-container').hide();
            $('.table').hide();
        } else {
            $('#waitingMessage').hide();
            $('#loadingMessage').show();
            var dateFormatted = annee + '-' + mois;
            refreshTable(pointCollecteId, dateFormatted, typeProduit);
    
            setTimeout(() => {
                if ($('#produitsTableBody').children().length === 0) {
                    let noDataMessage = `<i class="fas fa-exclamation-triangle"></i> Aucun prix disponible pour les critères sélectionnés.`;
                    $('#waitingMessage').html(noDataMessage).addClass('warning-message').show();
                    $('#loadingMessage').hide();
                    $('.table-header1').hide();
                    $('.export-container').hide();
                    $('.table').hide();
                } else {
                    $('#waitingMessage').hide();
                    $('#loadingMessage').hide();
                    $('.table-header1').show();
                    $('.export-container').show();
                    $('.table').show();
                }
            }, 1000);
        }
    }

    // Charger les villes au chargement de la page
    $.ajax({
        url: '/api/villes',
        method: 'GET',
        success: function(data) {
            var villeSelect = $('#villeSelect');
            data.forEach(function(ville) {
                villeSelect.append('<option value="' + ville.id_ville + '">' + ville.nom_ville + '</option>');
            });
        
        },
        error: function(error) {
            console.log("Error fetching data: ", error);
        }
    }); 
    
    
    $('#villeSelect').change(function() {
    var villeId = $(this).val();
    var agentSelect = $('#agentSelect');
    agentSelect.empty();
    agentSelect.append('<option value="">Sélectionnez un agent</option>');
    $('#typePointCollecte').empty().append('<option value="">Sélectionnez un type de point de collecte</option>');
    $('#carnetSelect').empty().append('<option value="">Sélectionnez un carnet</option>');
    $('#pointCollecte').empty().append('<option value="">Sélectionnez un point de collecte</option>');
    $('#typeSelect').empty().append('<option value="">Sélectionnez un type de produit</option>');
    $('#moisSelect').empty().append('<option value="">Sélectionnez un mois</option>');

    if (villeId) {
        $.ajax({
            url: '/api/villes/' + villeId + '/agents',
            method: 'GET',
            xhrFields: {
                withCredentials: true
            },
            success: function(data) {
                data.forEach(function(agent) {
                    agentSelect.append('<option value="' + agent.code_agent + '">' + agent.nom_agent + '</option>');
                });
            },
            error: function(error) {
                console.log("Error fetching data: ", error);
            }
        });
    }
    checkSelections();
 });

    

    //selectionner l'annee
    var selectYear = $('#select-year');
    // Récupérer les années depuis le serveur
    $.ajax({
        url: '/api/annees',
        method: 'GET',
        success: function(data) {
            selectYear.empty(); // Vider la liste
            data.forEach(function(annee) {
                selectYear.append('<option value="' + annee + '">' + annee + '</option>');
            });
            selectYear.val(new Date().getFullYear()); // Sélectionner l'année actuelle par défaut
        },
        error: function(error) {
            console.log("Erreur lors de la récupération des années: ", error);
        }
        
    });
    // Mapping des mois pour affichage et tri
    const moisMap = {
        "01": "Janvier", "02": "Février", "03": "Mars", "04": "Avril",
        "05": "Mai", "06": "Juin", "07": "Juillet", "08": "Août",
        "09": "Septembre", "10": "Octobre", "11": "Novembre", "12": "Décembre"
    };

    // Charger les carnets lorsque l'agent change
    $('#agentSelect').change(function() {
        var agentId = $(this).val();
        var carnetSelect = $('#carnetSelect'); // Corrigé pour utiliser la bonne liste
        carnetSelect.empty();
        carnetSelect.append('<option value="">Sélectionnez un carnet</option>');
            
        // Réinitialiser les autres sélections
        $('#pointCollecte').empty().append('<option value="">Sélectionnez un point de collecte</option>');
        $('#typeSelect').empty().append('<option value="">Sélectionnez un type de produit</option>');
        $('#moisSelect').empty().append('<option value="">Sélectionnez un mois</option>');

        if (agentId) {
            $.ajax({
                url: '/api/agents/' + agentId + '/carnets', // Vérifier que cette URL est correcte
                method: 'GET',
                success: function(data) {
                    console.log("Carnets récupérés :", data); // Ajout du log pour déboguer

                    data.forEach(function(carnet) {
                        carnetSelect.append('<option value="' + carnet.id_carnet + '">' + carnet.nom_carnet + '</option>'); // Vérifier les clés
                    });
                },
                error: function(error) {
                    console.log("Erreur lors de la récupération des carnets: ", error);
                }
            });
        }

        checkSelections();
    });

    // Charger les mois lorsque l'agent change
    $('#agentSelect').change(function() {
        var agentId = $(this).val();
        var moisSelect = $('#moisSelect');
        moisSelect.empty().append('<option value="">Sélectionnez un mois</option>');

        // Réinitialiser les autres sélections
        $('#typePointCollecte').empty().append('<option value="">Sélectionnez un type de point de collecte</option>');
        $('#pointCollecte').empty().append('<option value="">Sélectionnez un point de collecte</option>');
        $('#typeSelect').empty().append('<option value="">Sélectionnez un type de produit</option>');

        if (agentId) {
            $.ajax({
                url: '/api/agents/' + agentId + '/mois',
                method: 'GET',
                success: function(data) {
                    let uniqueMois = new Set();
                    // Extraire les mois sans doublons
                    data.forEach(mois => uniqueMois.add(mois.split('-')[1]));
                    // Trier les mois dans l'ordre de janvier à décembre
                    let moisTries = [...uniqueMois].sort((a, b) => a - b);
                    // Ajouter les mois triés dans la liste déroulante
                    moisTries.forEach(moisValue => {
                        if (moisMap[moisValue]) {
                            moisSelect.append('<option value="' + moisValue + '">' + moisMap[moisValue] + '</option>');
                        }
                    });
                },
                error: function(error) {
                    console.log("Erreur lors de la récupération des mois: ", error);
                }
            });
        }
        console.log('verifier le moi selectionner',moisSelect)
        checkSelections();
    });

    $('#carnetSelect').change(function() {
        var carnetId = $(this).val();
        var typePointCollecteSelect = $('#typePointCollecte');
        typePointCollecteSelect.empty();
        typePointCollecteSelect.append('<option value="">Sélectionnez un type de point de collecte</option>');

        // Réinitialiser les autres sélections
        $('#pointCollecte').empty().append('<option value="">Sélectionnez un point de collecte</option>');
        $('#typeSelect').empty().append('<option value="">Sélectionnez un type de produit</option>');

        
        if (carnetId) {
            $.ajax({
                 url: '/api/carnets/' + carnetId + '/types-point-collecte', // Route correcte
                method: 'GET',
                success: function(data) {
                    data.forEach(function(typePointCollecte) {
                        typePointCollecteSelect.append('<option value="' + typePointCollecte + '">' + typePointCollecte + '</option>');
                    });
                },
                error: function(error) {
                    console.log("Erreur lors de la récupération des types de points de collecte: ", error);
                }
            });
        }
    
        checkSelections();
    });


    $('#typePointCollecte').change(function() {
        var carnetId = $('#carnetSelect').val();
        var typePointCollecte = $(this).val();
        var annee = $('#select-year').val();
        var mois = $('#moisSelect').val();
        var pointCollecteSelect = $('#pointCollecte');
    
        pointCollecteSelect.empty();
        pointCollecteSelect.append('<option value="">Sélectionnez un point de collecte</option>');
        $('#typeSelect').empty().append('<option value="">Sélectionnez un type de produit</option>');
    
        if (carnetId && typePointCollecte && annee && mois) {
            console.log("Chargement des points de collecte pour:", { carnetId, typePointCollecte, annee, mois });
            $.ajax({
                url: `/api/carnets/${carnetId}/types-point-collecte/${typePointCollecte}/points-collecte`,
                method: 'GET',
                data: { annee: annee, mois: mois },
                success: function(data) {
                    console.log("Points de collecte récupérés:", data);
                    data.forEach(function(pointCollecte) {
                        var statuts = pointCollecte.statuts;
                        var emoji;
                        if (statuts.length === 0) {
                            emoji = '🔘'; // Pas de collecte
                        } else if (statuts.every(statut => statut === null)) {
                            emoji = '🔵'; // Tous NULL
                        } else if (statuts.every(statut => statut === 'Rejeter')) {
                            emoji = '🔴'; // Tous rejetés
                        } else if (statuts.some(statut => statut === 'Valider')) {
                            emoji = '🟢'; // Au moins un validé
                        } else {
                            emoji = '🟠'; // Autres cas (ex: 'Ajuster' ou mélange)
                        }
                        var optionHTML = `<option value="${pointCollecte.code_point_collecte}">${emoji} ${pointCollecte.nom_point_collecte}</option>`;
                        pointCollecteSelect.append(optionHTML);
                    });
                    // Ajouter un journal pour voir le contenu final du select
                    console.log("Contenu final du select #pointCollecte:", pointCollecteSelect.html());
                    updateButtonState();
                },
                error: function(error) {
                    console.error("Erreur lors de la récupération des points de collecte:", error);
                }
            });
        }
        checkSelections();
    });

    // Événement change pour mettre à jour l'état des boutons lorsque l'utilisateur change de point de collecte
    $('#pointCollecte').change(function() {
        updateButtonState(); // Mettre à jour l'état des boutons
    });  
    
    // Charger les relevés lorsque le point de collecte change
    $('#pointCollecte').change(function() {
        var pointCollecteId = $(this).val();
        var carnetId = $('#carnetSelect').val();
        var releveSelect = $('#releveSelect');
        var typeSelect = $('#typeSelect');

        // Réinitialiser les sélecteurs de relevés et types de produits
        releveSelect.empty();
        releveSelect.append('<option value="">Sélectionnez un relevé</option>');
        typeSelect.empty();
        typeSelect.append('<option value="">Sélectionnez un type de produit</option>');

        if (pointCollecteId && carnetId) {
            $.ajax({
                url: '/api/carnets/' + carnetId + '/points-collecte/' + pointCollecteId + '/releves',
                method: 'GET',
                success: function(data) {
                    console.log("Relevés récupérés:", data);
                    data.forEach(function(releve) {
                        releveSelect.append('<option value="' + releve.id_releve + '">' + releve.nom_releve + '</option>');
                    });
                },
                error: function(error) {
                    console.log("Erreur lors de la récupération des relevés: ", error);
                }
            });

            // Charger les types de produits (logique existante)
            $.ajax({
                url: '/api/points-collecte/' + pointCollecteId + '/types-produits',
                method: 'GET',
                success: function(data) {
                    data.forEach(function(typeProduit) {
                        typeSelect.append('<option value="' + typeProduit + '">' + typeProduit + '</option>');
                    });
                },
                error: function(error) {
                    console.log("Erreur lors de la récupération des types de produits: ", error);
                }
            });
        }

        checkSelections();
        updateButtonState();
    });

    // Relancer la récupération des points quand l'année ou le mois change
    $('#select-year').change(function() {
        $('#typePointCollecte').trigger('change');
    });

    $('#moisSelect').change(function() {
        $('#typePointCollecte').trigger('change');
    });

    // Actualiser le tableau lorsque le mois, l'année, le type de produit ou le relevé change
    $('#moisSelect, #select-year, #typeSelect, #releveSelect').change(function() {
        var pointCollecteId = $('#pointCollecte').val();
        var typeProduit = $('#typeSelect').val();
        var mois = $('#moisSelect').val();
        var annee = $('#select-year').val();
        var releveId = $('#releveSelect').val();

        // Vérifier que tous les champs nécessaires sont sélectionnés
        if (pointCollecteId && typeProduit && mois && annee && releveId) {
            var dateFormatted = annee + '-' + mois;  // Concaténer au format YYYY-MM
            refreshTable(pointCollecteId, dateFormatted, typeProduit, releveId);
        }
    });


    // Fonction pour filtrer les produits par nom
    $('#searchProduct').on('input', function() {
        var searchText = $(this).val().toLowerCase();  // Récupérer le texte de recherche en minuscule
            
        // Filtrer les produits dans le tableau en fonction du nom du produit
        $('#produitsTableBody tr').each(function() {
            var productName = $(this).find('td').eq(2).text().toLowerCase();  // Accéder au nom du produit dans la deuxième colonne
            
            // Afficher ou masquer les lignes en fonction de la correspondance du nom
            if (productName.includes(searchText)) {
                $(this).show();
            } else {
                $(this).hide();
            }
        });
    });

    var previousPrices = {}; // Variable globale pour stocker les prix du mois précédent
    

    // Mettre à jour la fonction refreshTable pour utiliser releveId directement
    function refreshTable(pointCollecteId, mois, typeProduit, releveId) {
        var produitsTableBody = $('#produitsTableBody');
        produitsTableBody.empty();
        $('#loadingMessage').show();

        if (pointCollecteId && mois && typeProduit && releveId) {
            $.ajax({
                url: '/api/points-collecte/' + pointCollecteId + '/types-produits/' + typeProduit + '/prix-precedent',
                method: 'GET',
                data: { mois: mois, releve_id: releveId },  // Utiliser releve_id au lieu de carnet_id
                success: function(previousData) {
                    previousPrices = previousData;
                    console.log('Prix précédents:', previousPrices);

                    $.ajax({
                        url: '/api/points-collecte/' + pointCollecteId + '/types-produits/' + typeProduit + '/produits',
                        method: 'GET',
                        data: { mois: mois, releve_id: releveId },  // Utiliser releve_id au lieu de carnet_id
                        success: function(currentData) {
                            console.log('Données actuelles:', currentData);
                            $('#loadingMessage').hide();
                            $('#product-table thead').remove();

                            if (currentData.length === 0) {
                                let noDataMessage = `<i class="fas fa-exclamation-triangle"></i> Aucun prix disponible pour les critères sélectionnés.`;
                                $('#waitingMessage').html(noDataMessage).addClass('warning-message').show();
                                $('.export-container').hide();
                                $('.table').hide();
                            } else {
                                $('#waitingMessage').hide();
                                $('.export-container').show();
                                $('.table').show();

                                // Affichage des en-têtes selon le type de produit
                                if (typeProduit === 'Hétérogene') {
                                    $('#product-table').prepend(`
                                        <thead class="table-header1 tete">
                                            <tr class="table-header1 tete">
                                                <th>N°</th>
                                                <th>Code produit</th>
                                                <th>Nom produit</th>
                                                <th>Prix</th>
                                                <th>Variation</th>
                                                <th>Statut</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                    `);
                                } else if (typeProduit === 'Homogene o1') {
                                    $('#product-table').prepend(`
                                        <thead class="table-header1 tete">
                                            <tr class="table-header1 tete">
                                                <th>N°</th>
                                                <th>Code produit</th>
                                                <th>Nom produit</th>
                                                <th>Prix</th>
                                                <th>Variation</th>
                                                <th>Statut</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                    `);
                                } else if (typeProduit === 'Homogene O2&O3') {
                                    $('#product-table').prepend(`
                                        <thead class="table-header1 tete">
                                            <tr class="table-header1 tete">
                                                <th>N°</th>
                                                <th>Code produit</th>
                                                <th>Nom produit</th>
                                                <th>Prix</th>
                                                <th>Quantité</th>
                                                <th>PKG</th>
                                                <th>Variation</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                    `);
                                }

                                let numero = 1;
                                currentData.forEach(function(produit) {
                                    var previousSomme = previousPrices[produit.code_produit] || 0;
                                    var currentSomme = parseFloat(produit.somme);
                                    var rowClass = '';
                                    var variation = 0;
                                    if (previousSomme && currentSomme) {
                                        variation = ((currentSomme - previousSomme) / previousSomme) * 100;
                                    }
                                    variation = variation.toFixed(2);

                                    if (typeProduit === 'Hétérogene' && previousSomme && (currentSomme > previousSomme * 1.15 || currentSomme < previousSomme * 0.85)) {
                                        rowClass = 'table-danger';
                                    } else if ((typeProduit === 'Homogene o1' || typeProduit === 'Homogene O2&O3') && previousSomme && (currentSomme > previousSomme * 1.5 || currentSomme < previousSomme * 0.5)) {
                                        rowClass = 'table-danger';
                                    }

                                    var raisonVariation = produit.raison_variation || 'Aucune raison fournie';

                                    if (typeProduit === 'Hétérogene') {
                                        produitsTableBody.append(
                                            '<tr class="' + rowClass + '" data-row-class="' + rowClass + '" data-raison-variation="' + encodeURIComponent(raisonVariation) + '">' +
                                            '<td>' + numero++ + '</td>' +
                                            '<td>' + produit.code_produit + '</td>' +
                                            '<td>' + produit.nom_produit + '</td>' +
                                            '<td><span class="prix">' + produit.somme + '</span></td>' +
                                            '<td>' + variation + '%</td>' +
                                            '<td>' + produit.type_statut + '</td>' +
                                            '<td><i class="fas fa-edit modifier-prix" data-id="' + produit.id_prix + '" style="cursor:pointer; color: green;"></i></td>' +
                                            '</tr>'
                                        );
                                    } else if (typeProduit === 'Homogene o1') {
                                        produitsTableBody.append(
                                            '<tr class="' + rowClass + '" data-row-class="' + rowClass + '" data-raison-variation="' + encodeURIComponent(raisonVariation) + '">' +
                                            '<td>' + numero++ + '</td>' +
                                            '<td>' + produit.code_produit + '</td>' +
                                            '<td>' + produit.nom_produit + '</td>' +
                                            '<td><span class="prix">' + produit.somme + '</span></td>' +
                                            '<td>' + variation + '%</td>' +
                                            '<td>' + produit.type_statut + '</td>' +
                                            '<td><i class="fas fa-edit modifier-prix" data-id="' + produit.id_prix + '" style="cursor:pointer; color: green;"></i></td>' +
                                            '</tr>'
                                        );
                                    } else if (typeProduit === 'Homogene O2&O3') {
                                        produitsTableBody.append(
                                            '<tr class="' + rowClass + '" data-row-class="' + rowClass + '" data-raison-variation="' + encodeURIComponent(raisonVariation) + '">' +
                                            '<td>' + numero++ + '</td>' +
                                            '<td>' + produit.code_produit + '</td>' +
                                            '<td>' + produit.nom_produit + '</td>' +
                                            '<td><span class="prix">' + produit.somme + '</span></td>' +
                                            '<td>' + produit.quantite + '</td>' +
                                            '<td>' + (produit.somme * produit.quantite) + '</td>' +
                                            '<td>' + variation + '%</td>' +
                                            '<td><i class="fas fa-edit modifier-prix" data-id="' + produit.id_prix + '" style="cursor:pointer; color: green;"></i></td>' +
                                            '</tr>'
                                        );
                                    }
                                });

                                // Événements pour modifier les prix et filtres (inchangé)
                                $('.modifier-prix').click(function() {
                                    var prixCell = $(this).closest('tr').find('.prix');
                                    var currentPrix = prixCell.text();
                                    var newPrix = prompt("Entrez le nouveau prix:", currentPrix);

                                    if (newPrix !== null) {
                                        var prixId = $(this).data('id');
                                        $.ajax({
                                            url: '/api/prix/' + prixId,
                                            method: 'PUT',
                                            contentType: 'application/json',
                                            data: JSON.stringify({ somme: newPrix }),
                                            success: function(data) {
                                                prixCell.text(newPrix);
                                                var updatedSomme = parseFloat(newPrix);
                                                var produitId = prixId;
                                                var previousSomme = previousPrices[produitId] || 0;
                                                var row = prixCell.closest('tr');

                                                if (typeProduit === 'Hétérogene' && previousSomme && (updatedSomme > previousSomme * 1.15 || updatedSomme < previousSomme * 0.85)) {
                                                    row.addClass('table-danger');
                                                } else if ((typeProduit === 'Homogene o1' || typeProduit === 'Homogene O2&O3') && previousSomme && (updatedSomme > previousSomme * 1.5 || updatedSomme < previousSomme * 0.5)) {
                                                    row.addClass('table-danger');
                                                } else {
                                                    row.removeClass('table-danger');
                                                }
                                                refreshTable(pointCollecteId, mois, typeProduit, releveId);
                                                alert("Prix mis à jour avec succès!");
                                            },
                                            error: function(error) {
                                                console.log("Erreur lors de la mise à jour:", error);
                                                alert("Erreur lors de la mise à jour du prix");
                                            }
                                        });
                                    }
                                });

                                $('#produitsTableBody').on('click', 'tr.table-danger', function() {
                                    var raisonVariation = decodeURIComponent($(this).data('raison-variation'));
                                    $('#raisonVariationContent').text(raisonVariation);
                                    $('#raisonVariationModal').modal('show');
                                });

                                $('input[name="filterOptions"]').change(function() {
                                    var selectedOption = $('input[name="filterOptions"]:checked').attr('id');
                                    if (selectedOption === 'invalidRadio') {
                                        $('tr').each(function() {
                                            var rowClass = $(this).data('row-class');
                                            if (rowClass === 'table-danger' || $(this).hasClass('tete')) {
                                                $(this).show();
                                            } else {
                                                $(this).hide();
                                            }
                                        });
                                    } else if (selectedOption === 'validRadio') {
                                        $('tr').each(function() {
                                            var rowClass = $(this).data('row-class');
                                            if (rowClass === 'table-danger') {
                                                $(this).hide();
                                            } else {
                                                $(this).show();
                                            }
                                        });
                                    } else {
                                        $('tr').show();
                                    }
                                });
                            }
                        },
                        error: function(error) {
                            console.error("Erreur lors de la récupération des données:", error);
                            $('#loadingMessage').hide();
                            let errorMessage = `<i class="fas fa-exclamation-triangle"></i> Erreur lors du chargement des données.`;
                            $('#waitingMessage').html(errorMessage).addClass('warning-message').show();
                            $('.table').hide();
                        }
                    });
                },
                error: function(error) {
                    console.error("Erreur lors de la récupération des prix précédents:", error);
                    $('#loadingMessage').hide();
                    let errorMessage = `<i class="fas fa-exclamation-triangle"></i> Erreur lors du chargement des données.`;
                    $('#waitingMessage').html(errorMessage).addClass('warning-message').show();
                    $('.table').hide();
                }
            });
        } else {
            const missing = [];
            if (!pointCollecteId) missing.push("Point de Collecte");
            if (!mois) missing.push("Mois");
            if (!typeProduit) missing.push("Type de Produit");
            if (!releveId) missing.push("Relevé");
            let message = `<i class="fas fa-exclamation-triangle"></i> Veuillez compléter les champs suivants : ${missing.join(", ")}.`;
            $('#loadingMessage').hide();
            $('#waitingMessage').html(message).addClass('warning-message').show();
            $('.table').hide();
        }
    }


    
    checkSelections();

    // Fonction pour gérer l'état des boutons en fonction de la couleur
    function updateButtonState() {
        var selectedOption = $('#pointCollecte option:selected').text();
        var rejectButton = $('#delete-prices-btn'); // Bouton "Rejeter"
        var validateButton = $('#valide-prices-btn'); // Bouton "Valider"

        // Par défaut, activer tous les boutons
        rejectButton.prop('disabled', false);
        validateButton.prop('disabled', false);

        if (selectedOption) {
            // Vérifier la couleur (emoji) dans le texte de l'option sélectionnée
            if (selectedOption.includes('🔴')) { // Couleur rouge
                validateButton.prop('disabled', true);
                rejectButton.prop('disabled', true); // Désactiver uniquement "Rejeter"
            } else if (selectedOption.includes('🟢')) { // Couleur verte
                rejectButton.prop('disabled', true); // Désactiver "Rejeter"
                validateButton.prop('disabled', true); // Désactiver "Valider"
            }
        }
    }

    // Ajouter des événements aux boutons d'exportation
    $('#exportExcelButton').click(function() {
        exportTableToExcel('.table');
    });

    $('#exportPdfButton').click(function() {
        exportTableToPDF('.table');
    });

       
    // Variable globale pour stocker l'instance de la carte (optionnel, mais utile pour la gestion)
    let mapInstance = null;

    function initMap(mapData) {
        const mapContainer = document.getElementById('mapContainer');

        // Vérifier si une carte existe déjà et la supprimer si nécessaire
        if (mapInstance) {
            mapInstance.remove(); // Supprime l'instance précédente de la carte
            mapInstance = null;   // Réinitialise la référence
        }

        // Créer une nouvelle instance de carte
        mapInstance = L.map(mapContainer).setView(
            [mapData.agent.latitude, mapData.agent.longitude],
            15
        );

        // // Ajouter une couche de tuiles OpenStreetMap
        // L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        //     attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        // }).addTo(mapInstance);

        // Charger OpenStreetMap avec un meilleur cache
        L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            detectRetina: true, // Active le rendu haute résolution
            maxZoom: 18, 
        }).addTo(mapInstance);


        // Ajouter un marqueur pour le point de collecte (en bleu)
        L.marker([mapData.point_collecte.latitude, mapData.point_collecte.longitude], {
            icon: L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34]
            })
        }).addTo(mapInstance)
        .bindPopup(`<b>Point de collecte</b><br>${mapData.point_collecte.name}`);

        // Ajouter un marqueur pour la position de l'agent (en rouge)
        L.marker([mapData.agent.latitude, mapData.agent.longitude], {
            icon: L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34]
            })
        }).addTo(mapInstance)
        .bindPopup(`<b>Position de l'agent</b><br>Précision: ${mapData.agent.accuracy.toFixed(1)} m`);

        // Ajouter un cercle d'incertitude autour de la position de l'agent
        L.circle([mapData.agent.latitude, mapData.agent.longitude], {
            color: 'red',
            fillColor: '#f03',
            fillOpacity: 0.2,
            radius: mapData.agent.accuracy
        }).addTo(mapInstance);

        // Ajuster automatiquement les limites de la carte pour inclure tous les éléments
        const bounds = L.latLngBounds([
            [mapData.point_collecte.latitude, mapData.point_collecte.longitude],
            [mapData.agent.latitude, mapData.agent.longitude]
        ]);
        mapInstance.fitBounds(bounds, { padding: [50, 50] });
    }

    // Gestionnaire d'événements pour le bouton "Analyse géolocalisations" (inchangé)
    $('#analyseGeo').click(function() {
        var pointCollecteId = $('#pointCollecte').val();
        var mois = $('#moisSelect').val();
        var annee = $('#select-year').val();

        if (!pointCollecteId || !mois || !annee) {
            alert('Veuillez sélectionner un point de collecte, un mois et une année avant d\'analyser les géolocalisations.');
            return;
        }

        $('#geoAnalysisMessage').html(`
            <p class="text-center">Chargement des données de géolocalisation...</p>
            <div class="text-center">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Chargement...</span>
                </div>
            </div>
        `);
        $('#mapContainer').html(''); // Vider le conteneur (facultatif, mais conservé pour la cohérence)

        $.ajax({
            url: '/api/analyse-geolocalisation',
            method: 'GET',
            data: {
                point_collecte_id: pointCollecteId,
                mois: mois,
                annee: annee
            },
            success: function(data) {
                $('#geoAnalysisMessage').html(data.message);
                initMap(data.map_data);
            },
            error: function(error) {
                console.log("Erreur lors de la récupération des données de géolocalisation: ", error);
                $('#geoAnalysisMessage').html('<p class="text-danger">Une erreur est survenue lors de l\'analyse des géolocalisations. Veuillez réessayer.</p>');
                $('#mapContainer').html('');
            }
        });
    });


        

});




// Fonction pour exporter les données du tableau en Excel en excluant la colonne "Action"
function exportTableToExcel(tableId, filename = 'export.xlsx') {
    var table = document.querySelector(tableId);
    var wb = XLSX.utils.book_new();
    var ws = XLSX.utils.table_to_sheet(table, { sheet: "Sheet JS" });

    // Supprimer la colonne "Action" (index 3)
    var range = XLSX.utils.decode_range(ws['!ref']);
    for (var R = range.s.r; R <= range.e.r; ++R) {
        for (var C = 7; C <= 7; ++C) {
            var cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
            delete ws[cellAddress];
        }
    }
    ws['!ref'] = XLSX.utils.encode_range(
        { s: { c: range.s.c, r: range.s.r }, e: { c: range.e.c - 1, r: range.e.r } }
    );

    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, filename);
}

// Fonction pour exporter les données du tableau en PDF en incluant les sélections
function exportTableToPDF(tableId, filename = 'export.pdf') {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    var table = document.querySelector(tableId);
    var body = [];

    // Récupérer les informations de sélection
    var ville = $('#villeSelect option:selected').text();
    var agent = $('#agentSelect option:selected').text();
    var typePointCollecte = $('#typePointCollecte option:selected').text();
    var pointCollecte = $('#pointCollecte option:selected').text();
    var typeProduit = $('#typeSelect option:selected').text();
    var mois = $('#moisSelect option:selected').text();
    var annee = $('#select-year option:selected').text();

    // Ajouter les informations de sélection sous forme de tableau
    var selectionTable =[
        ['Ville', ville],
        ['Agent', agent],
        ['Type de Point de Collecte', typePointCollecte],
        ['Point de Collecte', pointCollecte],
        ['Type de Produit', typeProduit],
        ['Mois', mois],
        ['Année', annee]

    ];

    doc.autoTable({
        head: [['Information', 'Valeur']],
        body: selectionTable,
        startY: 10,
        theme: 'grid'
    });

    // Ajouter un espace avant le tableau des produits
    doc.autoTable({
        startY: doc.previousAutoTable ? doc.previousAutoTable.finalY + 10 : 10,
        theme: 'plain',
        head: [[' ']]
    });

    // Déterminer l'entête du tableau en fonction du type de produit
    var tableHeader;
    if (typeProduit === 'Hétérogene') {
        tableHeader = [['N°', 'Code produit', 'Nom Produit', 'Prix', 'Variation en %', 'Carnet']];
    } else if (typeProduit === 'Homogene o1') {
        tableHeader = [['N°', 'Code produit', 'Nom Produit', 'Passage', 'Prix', 'Somme', 'Variation en %']];
    } else if (typeProduit === 'Homogene O2&O3') {
        tableHeader = [['N°', 'Code produit', 'Nom Produit', 'Passage', 'Prix', 'Somme', 'Variation en %', 'Quantité', 'PKG']];
    }

    // Ajouter les données du tableau des produits
    $(table).find('tbody tr:visible').each(function(i, row) {
        var rowData = [];
        $(row).find('td').each(function(j, cell) {
            // Inclure toutes les colonnes sauf la dernière (Action)
            if (typeProduit === 'Hétérogene' && j < 6) {  // Augmenté pour inclure N° et Variation
                rowData.push($(cell).text());
            } else if (typeProduit === 'Homogene o1' && j < 7) {  // Augmenté pour inclure N° et Variation
                rowData.push($(cell).text());
            } else if (typeProduit === 'Homogene O2&O3' && j < 9) {  // Augmenté pour inclure N° et Variation
                rowData.push($(cell).text());
            }
        });
        body.push(rowData);
    });

    // Configuration de l'autoTable pour le tableau principal
    doc.autoTable({
        head: tableHeader,
        body: body,
        startY: doc.previousAutoTable.finalY + 10,
        theme: 'grid',
        styles: {
            fontSize: 8,
            cellPadding: 2
        },
        columnStyles: {
            // Style pour la colonne Variation
            4: {  // Index de la colonne Variation (peut varier selon le type de produit)
                halign: 'right'  // Alignement à droite pour les pourcentages
            }
        },
        didParseCell: function(data) {
            // Colorer les cellules de variation selon les seuils
            if (data.section === 'body' && data.column.dataKey === 4) {  // Ajuster l'index selon le type de produit
                const variation = parseFloat(data.cell.text);
                if (!isNaN(variation)) {
                    if (typeProduit === 'Hétérogene' && (variation > 15 || variation < -15)) {
                        data.cell.styles.textColor = [255, 0, 0];  // Rouge pour les variations hors seuil
                    } else if ((typeProduit === 'Homogene o1' || typeProduit === 'Homogene O2&O3') && 
                             (variation > 50 || variation < -50)) {
                        data.cell.styles.textColor = [255, 0, 0];
                    }
                }
            }
        }
    });

    doc.save(filename);
}



