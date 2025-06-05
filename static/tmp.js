function loadMoreProducts() {
    if (!validateCurrentPrices()) {
        alert('Veuillez remplir tous les champs de prix avant de charger plus de produits.');
        return;
    }

    const produitType = document.getElementById('produit-type-select').value;
    const productTable = document.getElementById('product-table').querySelector('tbody');

    // Enregistrer les valeurs actuelles des champs
    const savedValues = {};

    if (produitType === 'Hétérogene') {
        const priceInputs = document.getElementsByClassName('price-input');
        for (let input of priceInputs) {
            savedValues[input.getAttribute('data-id')] = input.value;
        }
    } else if (produitType === 'Homogene o1') {
        const price1Inputs = document.getElementsByClassName('price-input');
        for (let input of price1Inputs) {
            savedValues[input.getAttribute('data-id')] = { prix1: input.value };
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
        productTable.innerHTML += `
        <tr>
            <td>${product.code}</td>
            <td>${product.name}</td>
            <td>${product.description}</td>
            <td>
                <input type="text" class="price-input" data-id="${product.code}" list="optionsPrix"
                    placeholder="Prix ou T/D" oninput="validatePriceInput(this)">
                <datalist id="optionsPrix">
                    <option value="T">Rupture Temporaire</option>
                    <option value="D">Rupture Définitive</option>
                </datalist>
            </td>
        </tr>`;
    });

    // Réappliquer les valeurs enregistrées
    for (const [id, values] of Object.entries(savedValues)) {
        const input = document.querySelector(`.price-input[data-id="${id}"]`);
        if (input) input.value = values.prix || values.prix1 || values;
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




function loadMoreProducts() {
    if (!validateCurrentPrices()) {
        alert('Veuillez remplir tous les champs de prix avant de charger plus de produits.');
        return;
    }

    const produitType = document.getElementById('produit-type-select').value;
    const productTable = document.getElementById('product-table').querySelector('tbody');

    // Enregistrer les valeurs actuelles des champs de prix et de quantité
    const savedValues = {};

    if (produitType === 'Hétérogene') {
        const priceInputs = document.getElementsByClassName('price-input');
        for (let input of priceInputs) {
            savedValues[input.getAttribute('data-id')] = input.value;
        }
    } else if (produitType === 'Homogene o1') {
        const price1Inputs = document.getElementsByClassName('price-input-1');
        for (let i = 0; i < price1Inputs.length; i++) {
            savedValues[price1Inputs[i].getAttribute('data-id')] = {
                prix1: price1Inputs[i].value,
            };
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

    // Réappliquer les valeurs enregistrées
    for (const [id, values] of Object.entries(savedValues)) {
        if (produitType === 'Hétérogene') {
            const input = document.querySelector(`.price-input[data-id="${id}"]`);
            if (input) input.value = values;
        } else if (produitType === 'Homogene o1') {
            const input1 = document.querySelector(`.price-input-1[data-id="${id}"]`);
            if (input1) {
                input1.value = values.prix1;
            }
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