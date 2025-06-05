document.addEventListener('DOMContentLoaded', function() {
    const villeSelect = document.getElementById('villeSelect');
    const moisSelect = document.getElementById('moisSelect');
    const produitsTableBody = document.getElementById('produitsTableBody');
    const loadingMessage = document.getElementById('loadingMessage');
    const waitingMessage = document.getElementById('waitingMessage');
    const tableHeader = document.querySelector('.table-header');
    const exportContainer = document.querySelector('.export-container');
    const exportExcelButton = document.getElementById('exportExcelButton');
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');

    // Mapping des mois pour affichage et tri
    const moisMap = {
        "01": "Janvier", "02": "Février", "03": "Mars", "04": "Avril",
        "05": "Mai", "06": "Juin", "07": "Juillet", "08": "Août",
        "09": "Septembre", "10": "Octobre", "11": "Novembre", "12": "Décembre"
    };

    // Fonction pour récupérer et afficher les produits
    function fetchProduits() {
        const villeId = villeSelect.value;
        const mois = moisSelect.value;
        const annee = selectYear.val(); // Récupérer l'année sélectionnée

        if (villeId && mois && annee) {
            const dateFormat = `${annee}-${mois}`; // Format YYYY-MM

            waitingMessage.style.display = 'none';
            loadingMessage.style.display = 'block';
            produitsTableBody.innerHTML = '';
            tableHeader.style.display = 'none';
            progressContainer.style.display = 'none'; // Cacher la barre de progression pendant le chargement

            fetch(`/api/villes/${villeId}/produits?mois=${dateFormat}`)
                .then(response => response.json())
                .then(data => {
                    loadingMessage.style.display = 'none';
                    tableHeader.style.display = 'table-header-group';

                    // Afficher les produits
                    produitsTableBody.innerHTML = ''; // Vider le tableau avant d'ajouter de nouvelles données
                    data.produits.forEach(produit => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${produit.code_produit}</td>
                            <td>${produit.date_passage}</td>
                            <td>${produit.nom_ville}</td>
                            <td>${produit.nom_carnet}</td>
                            <td>${produit.somme.toFixed(2)}</td>
                        `;
                        produitsTableBody.appendChild(row);
                    });

                    // Afficher la progression
                    const progression = data.progression;
                    const pourcentage = progression.pourcentage;

                    progressBar.style.width = pourcentage + '%';
                    progressBar.setAttribute('aria-valuenow', pourcentage);
                    progressText.textContent = `Progression : ${pourcentage}% (${progression.points_valides}/${progression.total_points})`;

                    progressContainer.style.display = 'block'; // Afficher la barre de progression

                    exportContainer.style.display = 'block';
                })
                .catch(error => {
                    console.error("Erreur lors de la récupération des produits:", error);
                    loadingMessage.style.display = 'none';
                    progressContainer.style.display = 'none'; // Cacher la barre en cas d'erreur
                });
        }
    }

    // Récupérer les villes
    fetch('/api/villes')
        .then(response => response.json())
        .then(data => {
            data.forEach(ville => {
                const option = document.createElement('option');
                option.value = ville.id_ville;
                option.textContent = ville.nom_ville;
                villeSelect.appendChild(option);
            });
        });

    // Sélectionner l'année
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

    // Récupérer les mois en fonction de la ville sélectionnée
    villeSelect.addEventListener('change', () => {
        const villeId = villeSelect.value;
        moisSelect.innerHTML = '<option value="">Sélectionnez un mois</option>';

        if (villeId) {
            fetch(`/api/villes/${villeId}/mois`)
                .then(response => response.json())
                .then(data => {
                    let uniqueMois = new Set();

                    // Extraire les mois sans doublons
                    data.forEach(mois => uniqueMois.add(mois.split('-')[1]));

                    // Trier les mois dans l'ordre croissant
                    let moisTries = [...uniqueMois].sort((a, b) => a - b);

                    // Ajouter les mois dans la liste déroulante avec leur nom mappé
                    moisTries.forEach(moisValue => {
                        if (moisMap[moisValue]) {
                            const option = document.createElement('option');
                            option.value = moisValue;
                            option.textContent = moisMap[moisValue];
                            moisSelect.appendChild(option);
                        }
                    });
                });
        }
    });

    // Mettre à jour les produits lorsque l'utilisateur change de mois ou d'année
    moisSelect.addEventListener('change', fetchProduits);
    selectYear.on('change', fetchProduits); // Ajout du rafraîchissement des produits lorsqu'on change l'année


    // Fonction d'exportation en Excel
    exportExcelButton.addEventListener('click', () => {
        const wb = XLSX.utils.book_new();
        const wsData = [];

        // Ajouter l'en-tête
        wsData.push([
            'N° ordre *', 'code produit *', 'date passage *', 'code localité *', 'numéro carnet *', 'Position produit *', 
            'Cohérence prix', 'Code unité', 'Code valide *', 'Date de saisie *', 'Prix converti *', 
            'Prix avant estimation', 'Quantité', 'Achete', 'Validité date *', 'Proposition validation', 
            'Prix manquant', 'Prix estimé', 'Code de remplacement', 'Enquêteur', 'N° questionnaire', 
            'Site', 'Créé par', 'Mise à jour par', 'Créé le', 'Mise à jour le', 'Nombre de rel', 
            'Type variétét', '', 'codeproduit', 'Date passage', 'numquestionnaire', '', 'Code produit', 
            'Type variété (HE, O1,O2,O3)'
        ]);

        // Obtenir la date actuelle et la formater
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];
        // Ajouter les données
        let order = 1;
        document.querySelectorAll('#produitsTableBody tr').forEach(row => {
            const cells = row.querySelectorAll('td');
            wsData.push([
                order++,
                cells[0].innerText,
                cells[1].innerText,
                cells[2].innerText,
                cells[3].innerText,
                'N', 'C', '', '1', formattedDate, // Position produit, Cohérence prix, Code unité, Code valide, Date de saisie
                cells[4].innerText,
                '', '', '', '2', '', '', 'N', '', // Prix avant estimation, Quantité, Achete, Validité date, Proposition validation, Prix manquant, Prix estimé, Code de remplacement, Enquêteur
                order++, '', '', '', '', '', '', '', '', '', '4', '','','' // N° questionnaire, Site, Créé par, Mise à jour par, Créé le, Mise à jour le, Nombre de rel, Type variété
            ]);
        });

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, 'Produits');
        XLSX.writeFile(wb, 'produits.xlsx');
    });
});
