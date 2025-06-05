$(document).ready(function() {
    const villeSelect = document.getElementById('ville');
    const dateExportSelect = document.getElementById('date_export');
    const groupBySelect = document.getElementById('group_by');
    const resultDiv = document.getElementById('result');

    // Récupérer les villes
    fetch('/villes')
        .then(response => response.json())
        .then(data => {
            data.forEach(ville => {
                const option = document.createElement('option');
                option.value = ville.id_ville;
                option.textContent = ville.nom_ville;
                villeSelect.appendChild(option);
            });
        });

    // Récupérer les dates d'export
    fetch('/dates_exports')
        .then(response => response.json())
        .then(data => {
            data.forEach(dateExport => {
                const option = document.createElement('option');
                option.value = dateExport.date_export;
                option.textContent = dateExport.date_export;
                dateExportSelect.appendChild(option);
            });
        });

    // Fonction pour générer une liste HTML à partir des produits
    function formatProduitsAsList(produits) {
        //style="background-color: #004080;color: white;"
        // Créez la structure du tableau
        let tableHtml = `
            <table border="1">
                <thead>
                    <tr>
                        <th>Code</th>
                        <th>Nom </th>
                        <th>Indices</th>
                    </tr>
                </thead>
                <tbody>
        `;

        produits.forEach(p => {
            tableHtml += `
                <tr>
                    <td>${p.code_produit}</td>
                    <td>${p.nom_produit}</td>
                    <td>${p.indice_prix.toFixed(2)}</td>
                </tr>
            `;
        });

        tableHtml += `
                </tbody>
            </table>
        `;

        return tableHtml;
    }
    

    
    // Fonction pour générer un tableau HTML à partir des variétés
    function formatVarietesAsTable(varietes) {
        // Créez la structure du tableau
        let tableHtml = `
            <table border="1">
                <thead>
                    <tr>
                        <th>Code</th>
                        <th>Nom </th>
                        <th>Pondération</th>
                        <th>Indices</th>
                        <th>Type</th>
                    </tr>
                </thead>
                <tbody>
        `;

        varietes.forEach(v => {
            tableHtml += `
                <tr>
                    <td>${v.code_variete}</td>
                    <td>${v.nom_variete}</td>
                    <td>${v.ponderation_variete.toFixed(2)}</td>
                    <td>${v.indice_variete.toFixed(2)}</td>
                    <td>${v.type_variete}</td>
                </tr>
            `;
        });

        tableHtml += `
                </tbody>
            </table>
        `;

        return tableHtml;
    }

    // Fonction pour générer un tableau HTML à partir des variétés
    function formatsousGroupesAsTable(postes_list) {
        // Créez la structure du tableau
        let tableHtml = `
            <table border="1">
                <thead>
                    <tr>
                        <th>Code</th>
                        <th>Nom </th>
                        <th>Pondération</th>
                        <th>Indices</th>
                    </tr>
                </thead>
                <tbody>
        `;

        postes_list.forEach(s => {
            tableHtml += `
                <tr>
                    <td>${s.code_poste}</td>
                    <td>${s.nom_poste}</td>
                    <td>${s.moyenne_ponderation_poste.toFixed(2)}</td>
                    <td>${s.indice_poste.toFixed(2)}</td>
                    
                </tr>
            `;
        });

        tableHtml += `
                </tbody>
            </table>
        `;

        return tableHtml;
    }

    // Fonction pour générer un tableau HTML à partir des sous_groupe
    function formatGroupesAsTable(sousGroupe_list) {
        // Créez la structure du tableau
        let tableHtml = `
            <table border="1">
                <thead>
                    <tr>
                        <th>Code</th>
                        <th>Nom </th>
                        <th>Pondération</th>
                        <th>Indices</th>
                    </tr>
                </thead>
                <tbody>
        `;

        sousGroupe_list.forEach(s => {
            tableHtml += `
                <tr>
                    <td>${s.code_sous_groupe}</td>
                    <td>${s.nom_sous_groupe}</td>
                    <td>${s.moyenne_ponderation_sous_groupe.toFixed(2)}</td>
                    <td>${s.indice_sous_groupe.toFixed(2)}</td>
                    
                </tr>
            `;
        });

        tableHtml += `
                </tbody>
            </table>
        `;

        return tableHtml;
    }

    // Fonction pour générer un tableau HTML à partir des sous_groupe
    function formatFonctionsAsTable(Groupe_list) {
        // Créez la structure du tableau
        let tableHtml = `
            <table border="1">
                <thead>
                    <tr>
                        <th>Code</th>
                        <th>Nom </th>
                        <th>Pondération</th>
                        <th>Indices</th>
                    </tr>
                </thead>
                <tbody>
        `;

        Groupe_list.forEach(g => {
            tableHtml += `
                <tr>
                    <td>${g.code_groupe}</td>
                    <td>${g.nom_groupe}</td>
                    <td>${g.ponderation.toFixed(2)}</td>
                    <td>${g.indice_groupe.toFixed(2)}</td>
                    
                </tr>
            `;
        });

        tableHtml += `
                </tbody>
            </table>
        `;

        return tableHtml;
    }


    // Fonction pour rechercher les indices
    function searchIndices() {
        const villeId = villeSelect.value;
        const dateExport = dateExportSelect.value;
        const groupBy = groupBySelect.value;
        waitingMessage.style.display = 'none';

        if (!villeId || !dateExport || !groupBy) {
            return;
        }

        fetch(`/get_indices?ville_id=${villeId}&date_export=${dateExport}&group_by=${groupBy}`)
            .then(response => response.json())
            .then(data => {
                console.log(data); // Vérifier la réponse
                resultDiv.innerHTML = '';  // Vider les résultats précédents

                const table = document.createElement('table');
                table.className = 'table table-bordered';

                if (groupBy === 'indice_elementaire') {
                    const thead = table.createTHead();
                    const headerRow = thead.insertRow();
                    headerRow.insertCell().textContent = 'Code produit';
                    headerRow.insertCell().textContent = 'Nom produit';
                    headerRow.insertCell().textContent = 'Nombre de Points de Collecte'; 
                    headerRow.insertCell().textContent = 'Indice Elementaire';
                    thead.className = 'tabli';

                    const tbody = table.createTBody();
                    data.forEach(row => {
                        const tr = tbody.insertRow();
                        tr.insertCell().textContent = row.code_produit;
                        tr.insertCell().textContent = row.nom_produit;
                        tr.insertCell().textContent = row.points_collecte;  // Afficher le nombre de points de collecte 
                        tr.insertCell().textContent = row.indice_prix.toFixed(2);
                        tr.className = 'tabliBody'; 
                    });
                }else if (groupBy === 'variete') {
                    const thead = table.createTHead();
                    const headerRow = thead.insertRow();
                    headerRow.insertCell().textContent = 'Code Variété';
                    headerRow.insertCell().textContent = 'Nom Variété';
                    headerRow.insertCell().textContent = 'Produit';
                    headerRow.insertCell().textContent = 'Ponderation serie';
                    headerRow.insertCell().textContent = 'Pondération';
                    headerRow.insertCell().textContent = 'Indice Pondéré';
                    thead.className = 'tabli';

                    const tbody = table.createTBody();
                    data.forEach(row => {
                        const tr = tbody.insertRow();
                        tr.insertCell().textContent = row.code_variete;
                        tr.insertCell().textContent = row.nom_variete;
                        // Insérez la liste HTML dans la cellule
                        tr.insertCell().innerHTML = formatProduitsAsList(row.produits);
                        tr.insertCell().textContent = row.ponderation_p.toFixed(2); ;
                        tr.insertCell().textContent = row.ponderation.toFixed(2);
                        tr.insertCell().textContent = row.indice_variete.toFixed(2);
                        tr.className = 'tabliBody'; 
                    });
            
                }else if (groupBy === 'poste') {
                    const thead = table.createTHead();
                    const headerRow = thead.insertRow();
                    headerRow.insertCell().textContent = 'Code poste';
                    headerRow.insertCell().textContent = 'nom poste';
                    headerRow.insertCell().textContent = 'Varieté';
                    headerRow.insertCell().textContent = 'Ponderation';
                    headerRow.insertCell().textContent = 'Indice Poste';
                    thead.className = 'tabli';

                    const tbody = table.createTBody();
                    data.forEach(row => {
                        const tr = tbody.insertRow();
                        tr.insertCell().textContent = row.code_poste;
                        tr.insertCell().textContent = row.nom_poste;
                        tr.insertCell().innerHTML = formatVarietesAsTable(row.varietes);
                        tr.insertCell().textContent = row.moyenne_ponderation_poste.toFixed(2);
                        tr.insertCell().textContent = row.indice_poste.toFixed(2);
                        tr.className = 'tabliBody'; 
                    });
                } else if (groupBy === 'sous_groupe') {  // Ajouter le cas pour sous_groupe
                    const thead = table.createTHead();
                    const headerRow = thead.insertRow();
                    headerRow.insertCell().textContent = 'Code Sous-Groupe';
                    headerRow.insertCell().textContent = 'Nom Sous-Groupe';
                    headerRow.insertCell().textContent = 'Poste';
                    headerRow.insertCell().textContent = 'Pondération';
                    headerRow.insertCell().textContent = 'Indice Pondéré';
                    thead.className = 'tabli';

                    const tbody = table.createTBody();
                    data.forEach(row => {
                        const tr = tbody.insertRow();
                        tr.insertCell().textContent = row.code_sous_groupe;
                        tr.insertCell().textContent = row.nom_sous_groupe;
                        tr.insertCell().innerHTML =  formatsousGroupesAsTable(row.postes);
                        tr.insertCell().textContent = row.ponderation.toFixed(2);
                        tr.insertCell().textContent = row.indice_sous_groupe.toFixed(2);
                        tr.className = 'tabliBody'; 
                    });
                } else if (groupBy === 'groupe') {  // Ajouter le cas pour groupe
                    const thead = table.createTHead();
                    const headerRow = thead.insertRow();
                    headerRow.insertCell().textContent = 'Code Groupe';
                    headerRow.insertCell().textContent = 'Nom Groupe';
                    headerRow.insertCell().textContent = 'Sous-Groupe';
                    headerRow.insertCell().textContent = 'Pondération';
                    headerRow.insertCell().textContent = 'Indice Pondéré';
                    thead.className = 'tabli';

                    const tbody = table.createTBody();
                    data.forEach(row => {
                        const tr = tbody.insertRow();
                        tr.insertCell().textContent = row.code_groupe;
                        tr.insertCell().textContent = row.nom_groupe;
                        tr.insertCell().innerHTML =  formatGroupesAsTable(row.sous_groupes);
                        tr.insertCell().textContent = row.ponderation.toFixed(2);
                        tr.insertCell().textContent = row.indice_groupe.toFixed(2);
                        tr.className = 'tabliBody'; 
                    });
                } else if (groupBy === 'fonction') {  // Ajouter le cas pour fonction
                    const thead = table.createTHead();
                    const headerRow = thead.insertRow();
                    headerRow.insertCell().textContent = 'Code Fonction';
                    headerRow.insertCell().textContent = 'Nom Fonction';
                    headerRow.insertCell().textContent = 'Groupes';
                    headerRow.insertCell().textContent = 'Pondération';
                    headerRow.insertCell().textContent = 'Indice Pondéré';
                    thead.className = 'tabli';

                    const tbody = table.createTBody();
                    data.forEach(row => {
                        const tr = tbody.insertRow();
                        tr.insertCell().textContent = row.code_fonction;
                        tr.insertCell().textContent = row.nom_fonction;
                        tr.insertCell().innerHTML =  formatFonctionsAsTable(row.groupes);
                        tr.insertCell().textContent = row.ponderation.toFixed(2);
                        tr.insertCell().textContent = row.indice_fonction.toFixed(2);
                        tr.className = 'tabliBody'; 
                    });
                }

                resultDiv.appendChild(table);
            })
            .catch(error => {
                console.error('Erreur:', error);
            });
    }


    // Écouter les changements sur les sélecteurs
    villeSelect.addEventListener('change', searchIndices);
    dateExportSelect.addEventListener('change', searchIndices);
    groupBySelect.addEventListener('change', searchIndices);
});
