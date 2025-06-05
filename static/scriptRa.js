$(document).ready(function() {
    const dateExportSelect = document.getElementById('date_export');
    const resultDiv = document.getElementById('result');

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

   
    // Fonction pour rechercher les indices
    function searchIndices() {
        const dateExport = dateExportSelect.value;
        if (!dateExport) {
            return;
        }

        fetch(`/get_rapport?date_export=${dateExport}`)
            .then(response => response.json())
            .then(data => {
                console.log(data); // Vérifier la réponse
                resultDiv.innerHTML = '';  // Vider les résultats précédents

                if (!data || Object.keys(data).length === 0) {
                    console.error('Les données reçues sont invalides.');
                    return;
                }

                const table = document.createElement('table');
                table.className = 'table table-bordered';

                // Créer l'en-tête du tableau
                const thead = document.createElement('thead');
                
                // Première ligne d'en-tête pour les titres principaux
                const mainHeaderRow = document.createElement('tr');
                const mainHeader1 = document.createElement('th');
                mainHeader1.setAttribute('colspan', '3');  // Fusionner les trois premières colonnes
                mainHeaderRow.appendChild(mainHeader1);

                const monthHeader = document.createElement('th');
                monthHeader.setAttribute('colspan', Object.keys(data).length);  // Fusionner les colonnes pour les mois
                monthHeader.textContent = 'Indices des mois de';
                mainHeaderRow.appendChild(monthHeader);

                const variationHeader = document.createElement('th');
                variationHeader.setAttribute('colspan', '4');  // Fusionner les colonnes pour les variations
                variationHeader.textContent = 'Variation en %';
                mainHeaderRow.appendChild(variationHeader);

                thead.appendChild(mainHeaderRow);

                // Deuxième ligne d'en-tête pour les colonnes spécifiques
                const headerRow = document.createElement('tr');
                const headerTitles = ['Code', 'Fonctions', 'Pondération'];

                // Ajouter les mois dynamiquement (incluant le mois actuel)
                const months = Object.keys(data).filter(key => key !== 'variations');
                months.forEach(month => {
                    headerTitles.push(month);
                });
                headerTitles.push('1 mois', '3 mois', '4 mois');  // Ajouter les colonnes de variation

                headerTitles.forEach(title => {
                    const th = document.createElement('th');
                    th.textContent = title;
                    headerRow.appendChild(th);
                });

                thead.appendChild(headerRow);
                table.appendChild(thead);
                thead.className = 'tabli';

                // Initialiser le tbody ici
                const tbody = document.createElement('tbody');

                // Initialiser un objet pour stocker les fonctions uniques
                let fonctionsMap = {};

                // Itérer sur chaque mois et fonction pour remplir le tableau
                for (const [month, fonctions] of Object.entries(data)) {
                    if (month === 'variations') continue; // Sauter la clé 'variations'
                    
                    fonctions.forEach(fonction => {
                        if (!fonctionsMap[fonction.code_fonction]) {
                            // Initialiser la ligne de la fonction si elle n'existe pas
                            const row = document.createElement('tr');

                            // Ajouter la colonne pour le code de la fonction
                            const code_fonctionCell = document.createElement('td');
                            code_fonctionCell.textContent = fonction.code_fonction;
                            row.appendChild(code_fonctionCell);

                            // Ajouter la colonne pour le nom de la fonction
                            const fonctionCell = document.createElement('td');
                            fonctionCell.textContent = fonction.nom_fonction;
                            row.appendChild(fonctionCell);

                            // Ajouter la colonne pour la pondération
                            const ponderationCell = document.createElement('td');
                            ponderationCell.textContent = fonction.ponderation;
                            row.appendChild(ponderationCell);

                            // Initialiser les cellules pour chaque mois avec "#VALEUR!"
                            months.forEach(() => {
                                const emptyCell = document.createElement('td');
                                emptyCell.textContent = '#VALEUR!';
                                row.appendChild(emptyCell);
                            });

                            // Initialiser les cellules de variations
                            ['variation_mois_1', 'variation_mois_3', 'variation_mois_4'].forEach(() => {
                                const variationCell = document.createElement('td');
                                variationCell.textContent = '0.0000%';
                                row.appendChild(variationCell);
                            });

                            // Ajouter la ligne à fonctionsMap
                            fonctionsMap[fonction.code_fonction] = row;
                        }

                        // Trouver la colonne correspondant au mois et y insérer l'indice
                        const monthIndex = headerTitles.indexOf(month);
                        if (monthIndex !== -1) {
                            const row = fonctionsMap[fonction.code_fonction];
                            const cell = row.children[monthIndex];
                            cell.textContent = fonction.indice_fonction ? fonction.indice_fonction.toFixed(5) : '#VALEUR!';
                        }
                    });
                }

                // Ajouter les variations dans les cellules appropriées
                if (data.variations) {
                    for (const [code_fonction, variations] of Object.entries(data.variations)) {
                        const row = fonctionsMap[code_fonction];
                        if (row) {
                            const variationCells = row.querySelectorAll('td:nth-last-child(-n+3)'); // Les trois dernières cellules

                            variationCells[0].textContent = variations.variation_mois_1 ? variations.variation_mois_1.toFixed(3) + '%' : '0.0000%';
                            variationCells[1].textContent = variations.variation_mois_3 ? variations.variation_mois_3.toFixed(3) + '%' : '0.0000%';
                            variationCells[2].textContent = variations.variation_mois_4 ? variations.variation_mois_4.toFixed(3) + '%' : '0.0000%';
                        }
                    }
                }

                // Trier les lignes par le code de la fonction
                const sortedFonctionRows = Object.values(fonctionsMap).sort((a, b) => a.children[0].textContent.localeCompare(b.children[0].textContent));

                // Ajouter toutes les lignes au tableau
                sortedFonctionRows.forEach(row => {
                    tbody.appendChild(row);
                });

                table.appendChild(tbody);
                resultDiv.appendChild(table);
            })
            .catch(error => {
                console.error('Erreur:', error);
            });
    }




    
    
    



    // // Fonction pour rechercher les indices
    // function searchIndices() {
    //     const dateExport = dateExportSelect.value;
    //     if (!dateExport) {
    //         return;
    //     }
    
    //     fetch(`/get_rapport?date_export=${dateExport}`)
    //         .then(response => response.json())
    //         .then(data => {
    //             console.log(data); // Vérifier la réponse
    //             resultDiv.innerHTML = '';  // Vider les résultats précédents
    
    //             if (!data || Object.keys(data).length === 0) {
    //                 console.error('Les données reçues sont invalides.');
    //                 return;
    //             }
    
    //             const table = document.createElement('table');
    //             table.className = 'table table-bordered';
    
    //             // Créer l'en-tête du tableau
    //             const thead = document.createElement('thead');
                
    //             // Première ligne d'en-tête pour les titres principaux
    //             const mainHeaderRow = document.createElement('tr');
    //             const mainHeader1 = document.createElement('th');
    //             mainHeader1.setAttribute('colspan', '3');  // Fusionner les trois premières colonnes
    //             mainHeaderRow.appendChild(mainHeader1);
    
    //             const monthHeader = document.createElement('th');
    //             monthHeader.setAttribute('colspan', Object.keys(data).length);  // Fusionner les colonnes pour les mois
    //             monthHeader.textContent = 'Indices des mois de';
    //             mainHeaderRow.appendChild(monthHeader);
    
    //             const variationHeader = document.createElement('th');
    //             variationHeader.setAttribute('colspan', '3');  // Fusionner les colonnes pour les variations
    //             variationHeader.textContent = 'Variation en %';
    //             mainHeaderRow.appendChild(variationHeader);
    
    //             thead.appendChild(mainHeaderRow);
    
    //             // Deuxième ligne d'en-tête pour les colonnes spécifiques
    //             const headerRow = document.createElement('tr');
    //             const headerTitles = ['Code', 'Fonctions', 'Pondération'];
    
    //             // Ajouter les mois dynamiquement (incluant le mois actuel)
    //             const months = Object.keys(data);
    //             months.forEach(month => {
    //                 headerTitles.push(month);
    //             });
    //             headerTitles.push('1 mois', '3 mois', '12 mois');  // Ajouter les colonnes de variation
    
    //             headerTitles.forEach(title => {
    //                 const th = document.createElement('th');
    //                 th.textContent = title;
    //                 headerRow.appendChild(th);
    //             });
    
    //             thead.appendChild(headerRow);
    //             table.appendChild(thead);
    //             thead.className = 'tabli';
    
    //             // Initialiser le tbody ici
    //             const tbody = document.createElement('tbody');
    
    //             // Créer un objet pour stocker les lignes de fonctions
    //             const fonctionRows = {};
    
    //             // Itérer sur chaque mois et fonction pour remplir le tableau
    //             for (const [month, fonctions] of Object.entries(data)) {
    //                 fonctions.forEach(fonction => {
    //                     if (!fonctionRows[fonction.nom_fonction]) {
    //                         // Initialiser la ligne de la fonction si elle n'existe pas
    //                         const row = document.createElement('tr');
    
    //                         // Ajouter la colonne pour le code de la fonction
    //                         const code_fonctionCell = document.createElement('td');
    //                         code_fonctionCell.textContent = fonction.code_fonction;
    //                         row.appendChild(code_fonctionCell);
    
    //                         // Ajouter la colonne pour le nom de la fonction
    //                         const fonctionCell = document.createElement('td');
    //                         fonctionCell.textContent = fonction.nom_fonction;
    //                         row.appendChild(fonctionCell);
    
    //                         // Ajouter la colonne pour la pondération
    //                         const ponderationCell = document.createElement('td');
    //                         ponderationCell.textContent = fonction.ponderation;
    //                         row.appendChild(ponderationCell);
    
    //                         // Initialiser les cellules pour chaque mois avec "#VALEUR!"
    //                         months.forEach(() => {
    //                             const emptyCell = document.createElement('td');
    //                             emptyCell.textContent = '#VALEUR!';
    //                             row.appendChild(emptyCell);
    //                         });
    
    //                         // Ajouter les cellules pour les variations
    //                         const variation1MCell = document.createElement('td');
    //                         const variation3MCell = document.createElement('td');
    //                         const variation12MCell = document.createElement('td');
    //                         variation1MCell.textContent = '#VALEUR!';
    //                         variation3MCell.textContent = '#VALEUR!';
    //                         variation12MCell.textContent = '#VALEUR!';
    //                         row.appendChild(variation1MCell);
    //                         row.appendChild(variation3MCell);
    //                         row.appendChild(variation12MCell);
    
    //                         fonctionRows[fonction.nom_fonction] = row;
    //                     }
    
    //                     // Trouver la colonne correspondant au mois et y insérer l'indice
    //                     const monthIndex = headerTitles.indexOf(month);
    //                     if (monthIndex !== -1) {
    //                         const row = fonctionRows[fonction.nom_fonction];
    //                         const cell = row.children[monthIndex];
    //                         cell.textContent = fonction.indice_fonction ? fonction.indice_fonction.toFixed(5) : '#VALEUR!';
    //                     }

                        
    
    //                     // Remplir les colonnes de variation
    //                     if (month === '1 mois' || month === '3 mois' || month === '12 mois') {
    //                         const row = fonctionRows[fonction.nom_fonction];
    //                         const variationCell = row.children[headerTitles.indexOf(month)];
    //                         variationCell.textContent = fonction.variation ? fonction.variation.toFixed(5) + '%' : '#VALEUR!';
    //                     }
    //                 });
    //             }
    
    //             // Ajouter toutes les lignes au tableau
    //             for (const row of Object.values(fonctionRows)) {
    //                 tbody.appendChild(row);
    //             }
    
    //             table.appendChild(tbody);
    //             resultDiv.appendChild(table);
    //         })
    //         .catch(error => {
    //             console.error('Erreur:', error);
    //         });
    // }
    





    // Écouter les changements sur les sélecteurs
    dateExportSelect.addEventListener('change', searchIndices);
});
