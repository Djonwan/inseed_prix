document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('importForm');
    const fileInput = document.getElementById('fileInput');
    const progressBar = document.getElementById('progressBar');
    const successMessage = document.getElementById('successMessage');
    const errorMessage = document.getElementById('errorMessage');

    form.addEventListener('submit', function(event) {
        event.preventDefault();
        
        const file = fileInput.files[0];

        // Vérifiez que le fichier est un fichier .xlsx
        const validExtensions = /(\.xlsx)$/i;
        
        if (!file || !validExtensions.test(file.name)) {
            alert('Veuillez sélectionner un fichier .xlsx valide.');
            return;
        }

        // Réinitialiser les messages et la barre de progression
        progressBar.style.width = '0%';
        progressBar.textContent = '';
        progressBar.style.display = 'none';
        successMessage.style.display = 'none';
        errorMessage.style.display = 'none';

        // Créez une instance FormData pour envoyer le fichier
        const formData = new FormData();
        formData.append('file', file);

        // Afficher la barre de progression
        progressBar.style.display = 'block';

        // Effectuer une requête AJAX pour envoyer le fichier
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/import', true);

        xhr.upload.onprogress = function(event) {
            if (event.lengthComputable) {
                const percentComplete = (event.loaded / event.total) * 100;
                progressBar.style.width = percentComplete + '%';
                progressBar.textContent = Math.round(percentComplete) + '%';
            }
        };

        xhr.onreadystatechange = function() {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                // Masquer la barre de progression
                progressBar.style.display = 'none';

                if (xhr.status >= 200 && xhr.status < 300) {
                    const response = JSON.parse(xhr.responseText);
                    if (response.error) {
                        errorMessage.style.display = 'block';
                        errorMessage.textContent = response.error;
                    } else {
                        successMessage.style.display = 'block';
                        successMessage.textContent = 'Importation réussie !';
                    }
                } else {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        errorMessage.style.display = 'block';
                        errorMessage.textContent = response.error || 'Une erreur s\'est produite lors de l\'importation.';
                    } catch (e) {
                        errorMessage.style.display = 'block';
                        errorMessage.textContent = 'Une erreur s\'est produite lors de l\'importation.';
                    }
                }
            }
        };

        xhr.send(formData);
    });
});
