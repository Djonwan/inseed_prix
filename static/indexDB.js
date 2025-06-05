// Configuration de la base de données IndexedDB
const dbName = 'CollecteDB';
const dbVersion = 1;

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

        const carnetStore = db.createObjectStore('Carnet', { keyPath: 'id_carnet' });
        carnetStore.createIndex('code_agent', 'code_agent', { unique: false });

        const pointCollecteStore = db.createObjectStore('PointCollecte', { keyPath: 'code_point_collecte' });
        pointCollecteStore.createIndex('id_carnet', 'id_carnet', { unique: false });

        const passageStore = db.createObjectStore('Passage', { keyPath: 'id_passage' });
        passageStore.createIndex('code_point_collecte', 'code_point_collecte', { unique: false });

        const prixStore = db.createObjectStore('Prix', { keyPath: 'id_prix' });
        prixStore.createIndex('id_passage', 'id_passage', { unique: false });
        prixStore.createIndex('code_produit', 'code_produit', { unique: false });
        prixStore.createIndex('date_passage', 'date_passage', { unique: false });
      };
    });
  }
}



class IndexedDBQueries {
    constructor(db) {
      this.db = db;
    }
  
    // Équivalent de get_agent_data
    async getAgentData(codeId) {
      try {
        // Chercher d'abord dans la table Agent
        const agentStore = this.db.transaction('Agent', 'readonly').objectStore('Agent');
        const agent = await agentStore.get(codeId);
  
        if (agent) {
          // Récupérer la ville
          const villeStore = this.db.transaction('Ville', 'readonly').objectStore('Ville');
          const ville = await villeStore.get(agent.id_ville);
  
          // Récupérer les carnets
          const carnetStore = this.db.transaction('Carnet', 'readonly').objectStore('Carnet');
          const carnetIndex = carnetStore.index('code_agent');
          const carnets = await carnetIndex.getAll(codeId);
  
          return {
            name: agent.nom_agent,
            city: ville?.nom_ville,
            is_controlleur: false,
            carnets: carnets.reduce((acc, c) => {
              acc[c.id_carnet] = c.nom_carnet;
              return acc;
            }, {})
          };
        }
  
        // Si pas trouvé dans Agent, chercher dans Controlleur
        const controlleurStore = this.db.transaction('Controlleur', 'readonly').objectStore('Controlleur');
        const controlleur = await controlleurStore.get(codeId);
  
        if (controlleur) {
          return {
            name: controlleur.nom_controlleur,
            is_controlleur: true
          };
        }
  
        throw new Error('Code utilisateur non trouvé');
      } catch (error) {
        throw error;
      }
    }
  
    // Équivalent de get_pointCollecte_types
    async getPointCollecteTypes(idCarnet) {
      try {
        const pointCollecteStore = this.db.transaction('PointCollecte', 'readonly').objectStore('PointCollecte');
        const pointCollecteIndex = pointCollecteStore.index('id_carnet');
        const pointCollectes = await pointCollecteIndex.getAll(idCarnet);
  
        // Obtenir les types uniques
        const types = [...new Set(pointCollectes.map(p => p.type_point_collecte))];
        return types;
      } catch (error) {
        throw error;
      }
    }
  
    // Équivalent de get_points_of_sale
    async getPointsOfSale(idCarnet, typePointCollecte) {
      try {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear();
  
        const pointCollecteStore = this.db.transaction('PointCollecte', 'readonly').objectStore('PointCollecte');
        const pointCollectes = await pointCollecteStore.index('id_carnet').getAll(idCarnet);
  
        const filteredPoints = [];
        for (const point of pointCollectes) {
          if (point.type_point_collecte !== typePointCollecte) continue;
  
          // Vérifier s'il existe déjà des prix pour ce mois
          const passageStore = this.db.transaction('Passage', 'readonly').objectStore('Passage');
          const passages = await passageStore.index('code_point_collecte').getAll(point.code_point_collecte);
  
          const prixStore = this.db.transaction('Prix', 'readonly').objectStore('Prix');
          let hasCurrentMonthPrices = false;
  
          for (const passage of passages) {
            const prix = await prixStore.index('id_passage').getAll(passage.id_passage);
            hasCurrentMonthPrices = prix.some(p => {
              const prixDate = new Date(p.date_passage);
              return prixDate.getMonth() + 1 === currentMonth && 
                     prixDate.getFullYear() === currentYear;
            });
            if (hasCurrentMonthPrices) break;
          }
  
          if (!hasCurrentMonthPrices) {
            filteredPoints.push({
              code: point.code_point_collecte,
              name: point.nom_point_collecte,
              description: point.description_point_collecte,
              latitude: point.latitude,
              longitude: point.longitude
            });
          }
        }
  
        return filteredPoints;
      } catch (error) {
        throw error;
      }
    }
  
    // Équivalent de get_product_types
    async getProductTypes(codePointCollecte) {
      try {
        const pointCollecteProduitStore = this.db.transaction('PointCollecte_Produit', 'readonly').objectStore('PointCollecte_Produit');
        const produitStore = this.db.transaction('Produit', 'readonly').objectStore('Produit');
  
        const relations = await pointCollecteProduitStore.index('code_point_collecte').getAll(codePointCollecte);
        const types = new Set();
  
        for (const relation of relations) {
          const produit = await produitStore.get(relation.code_produit);
          if (produit) {
            types.add(produit.type_produit);
          }
        }
  
        return Array.from(types);
      } catch (error) {
        throw error;
      }
    }
  
    // Équivalent de get_passages_by_type
    async getPassagesByType(codePointCollecte, produitType) {
      try {
        const passageStore = this.db.transaction('Passage', 'readonly').objectStore('Passage');
        const passages = await passageStore.index('code_point_collecte').getAll(codePointCollecte);
  
        if (produitType === 'Hétérogene') {
          const passageHeterogene = passages.find(p => p.nom_passage === 'Passage hétérogene');
          return passageHeterogene ? [{
            id: passageHeterogene.id_passage,
            nom: passageHeterogene.nom_passage
          }] : [];
        } else {
          return passages
            .filter(p => p.nom_passage !== 'Passage hétérogene')
            .map(p => ({
              id: p.id_passage,
              nom: p.nom_passage
            }));
        }
      } catch (error) {
        throw error;
      }
    }
  
    // Équivalent de get_TypePrix_by_type
    async getTypePrixByType(codePointCollecte, produitType) {
      try {
        const typePrixStore = this.db.transaction('TypePrix', 'readonly').objectStore('TypePrix');
        const typePrix = await typePrixStore.index('code_point_collecte').getAll(codePointCollecte);
  
        if (produitType === 'Hétérogene') {
          const prixBase = typePrix.find(tp => tp.nom_type_prix === 'Prix de base');
          return prixBase ? [{
            id: prixBase.id_type_prix,
            nom: prixBase.nom_type_prix
          }] : [];
        } else {
          return typePrix
            .filter(tp => tp.nom_type_prix !== 'Prix de base')
            .map(tp => ({
              id: tp.id_type_prix,
              nom: tp.nom_type_prix
            }));
        }
      } catch (error) {
        throw error;
      }
    }
  
    // Équivalent de get_filtered_products
    async getFilteredProducts(codePointCollecte, produitType) {
      try {
        const pointCollecteProduitStore = this.db.transaction('PointCollecte_Produit', 'readonly').objectStore('PointCollecte_Produit');
        const produitStore = this.db.transaction('Produit', 'readonly').objectStore('Produit');
  
        const relations = await pointCollecteProduitStore.index('code_point_collecte').getAll(codePointCollecte);
        const products = [];
  
        for (const relation of relations) {
          const produit = await produitStore.get(relation.code_produit);
          if (produit && (!produitType || produit.type_produit === produitType)) {
            products.push({
              code: produit.code_produit,
              name: produit.nom_produit,
              type: produit.type_produit,
              description: produit.description_produit
            });
          }
        }
  
        return products;
      } catch (error) {
        throw error;
      }
    }
}

