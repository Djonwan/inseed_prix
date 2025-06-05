# -*- coding: utf-8 -*-
import pandas as pd
import numpy as np
import matplotlib
matplotlib.use('Agg') 
from flask import Flask, request, session, jsonify, render_template, redirect, url_for, send_file
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from dateutil.relativedelta import relativedelta
from werkzeug.utils import secure_filename
import os
import matplotlib.pyplot as plt
from sklearn.preprocessing import MinMaxScaler
from io import BytesIO
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user




app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:DJONG2252WANg@localhost/prix_inseed_2'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'uploads'
app.secret_key = os.environ.get('SECRET_KEY', os.urandom(24))
db = SQLAlchemy(app)
login_manager = LoginManager(app)
login_manager.login_view = "login" 


# Modèles mis à jour
class Ville(db.Model):
    __tablename__ = 'ville'
    id_ville = db.Column(db.Integer, primary_key=True, autoincrement=True)
    code_ville = db.Column(db.String(255), nullable=False)
    nom_ville = db.Column(db.String(255), nullable=False)
    description_ville = db.Column(db.Text)

class Agent(db.Model):
    __tablename__ = 'agent'
    code_agent = db.Column(db.String(255), primary_key=True)
    type_agent = db.Column(db.String(255), nullable=False)
    nom_agent = db.Column(db.String(255), nullable=False)
    adresse_agent = db.Column(db.String(255))
    id_ville = db.Column(db.Integer, db.ForeignKey('ville.id_ville', ondelete="SET NULL"))
    ville = db.relationship('Ville', backref=db.backref('agents', lazy=True))

class Controlleur(db.Model):
    __tablename__ = 'controlleur'
    code_controlleur = db.Column(db.String(255), primary_key=True)
    nom_controlleur = db.Column(db.String(255), nullable=False)
    type_controlleur = db.Column(db.String(255), nullable=False)

class AgentControlleur(db.Model):
    __tablename__ = 'agent_controlleur'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    code_agent = db.Column(db.String(255), db.ForeignKey('agent.code_agent', ondelete="CASCADE"))
    code_controlleur = db.Column(db.String(255), db.ForeignKey('controlleur.code_controlleur', ondelete="CASCADE"))
    agent = db.relationship('Agent', backref=db.backref('controlleurs', lazy=True))
    controlleur = db.relationship('Controlleur', backref=db.backref('agents', lazy=True))

class Carnet(db.Model):
    __tablename__ = 'carnet'
    id_carnet = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nom_carnet = db.Column(db.String(255), nullable=False)
    code_agent = db.Column(db.String(255), db.ForeignKey('agent.code_agent', ondelete="SET NULL"))
    agent = db.relationship('Agent', backref=db.backref('carnets', lazy=True))

class PointCollecte(db.Model):
    __tablename__ = 'pointcollecte'
    code_point_collecte = db.Column(db.String(255), primary_key=True)
    nom_point_collecte = db.Column(db.String(255), nullable=False)
    description_point_collecte = db.Column(db.String(255))
    type_point_collecte = db.Column(db.String(255))
    latitude = db.Column(db.Numeric(9, 6))
    longitude = db.Column(db.Numeric(9, 6))

class Passage(db.Model):
    __tablename__ = 'passage'
    id_passage = db.Column(db.Integer, primary_key=True)
    id_carnet = db.Column(db.Integer, db.ForeignKey('carnet.id_carnet', ondelete="CASCADE"))
    code_point_collecte = db.Column(db.String(255), db.ForeignKey('pointcollecte.code_point_collecte', ondelete="CASCADE"))
    carnet = db.relationship('Carnet', backref=db.backref('passages', lazy=True))
    point_collecte = db.relationship('PointCollecte', backref=db.backref('passages', lazy=True))

class Releve(db.Model):
    __tablename__ = 'releve'
    id_releve = db.Column(db.Integer, primary_key=True, autoincrement=True)
    id_passage = db.Column(db.Integer, db.ForeignKey('passage.id_passage', ondelete="CASCADE"))
    nom_releve = db.Column(db.String(255))
    passage = db.relationship('Passage', backref=db.backref('releves', lazy=True))

class Produit(db.Model):
    __tablename__ = 'produit'
    code_produit = db.Column(db.String(255), primary_key=True)
    nom_produit = db.Column(db.String(255), nullable=False)
    type_produit = db.Column(db.String(255), nullable=False)
    description_produit = db.Column(db.String(255))

class PointCollecteProduit(db.Model):
    __tablename__ = 'pointcollecte_produit'
    code_point_collecte = db.Column(db.String(255), db.ForeignKey('pointcollecte.code_point_collecte', ondelete="CASCADE"), primary_key=True)
    code_produit = db.Column(db.String(255), db.ForeignKey('produit.code_produit', ondelete="CASCADE"), primary_key=True)

class Prix(db.Model):
    __tablename__ = 'prix'
    id_prix = db.Column(db.Integer, primary_key=True, autoincrement=True)
    somme = db.Column(db.Float, nullable=False)
    quantite = db.Column(db.Integer)
    date_passage = db.Column(db.Date, nullable=False)
    code_produit = db.Column(db.String(255), db.ForeignKey('produit.code_produit', ondelete="SET NULL"))
    id_releve = db.Column(db.Integer, db.ForeignKey('releve.id_releve', ondelete="CASCADE"))
    type_statut = db.Column(db.Enum('N', 'D', 'T'), nullable=False, default='N')
    message = db.Column(db.Text)
    statut = db.Column(db.Enum('Rejeter', 'Valider', 'Ajuster'))
    raison_variation = db.Column(db.String(255))
    produit = db.relationship('Produit', backref=db.backref('prix', lazy=True))
    releve = db.relationship('Releve', backref=db.backref('prix', lazy=True))

class Position(db.Model):
    __tablename__ = 'position'
    id_position = db.Column(db.Integer, primary_key=True, autoincrement=True)
    code_point_collecte = db.Column(db.String(255), db.ForeignKey('pointcollecte.code_point_collecte', ondelete="CASCADE", onupdate="CASCADE"))
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    accuracy = db.Column(db.Float)
    timestamp = db.Column(db.DateTime, server_default=db.func.current_timestamp())





@app.route('/')
def index():
    return render_template('index.html')


@app.route('/dashboard')
def dashboard_a():
    # Vérifier si l'utilisateur est connecté et est un contrôleur
    if 'user_id' not in session:
        return render_template('index.html')  # Rediriger vers la page de connexion si non connecté
    
    # Récupérer les informations de la session
    user_name = session.get('user_name')
    is_controlleur = session.get('is_controlleur', False)
    controlleur_name = session.get('controlleur_name', user_name)  # Par défaut, utiliser user_name si pas de controlleur_name

    if not is_controlleur:
        # Si ce n'est pas un contrôleur, on suppose que c'est un agent
        # Le nom du contrôleur est déjà dans session['controlleur_name'] grâce à /get_agent_data
        return render_template('dashboard.html', nom=controlleur_name)
    else:
        # Si c'est un contrôleur, on utilise son propre nom
        return render_template('dashboard.html', nom=user_name)
    

@app.route('/analyse')
def indexA():
    return render_template('analyse/index.html')


@app.route('/controle')
def indexC():
    if 'user_id' not in session or not session.get('is_controlleur', False):
        return render_template('index.html')  # Rediriger vers la page de connexion si non connecté

    return render_template('indexC.html', nom=session.get('user_name'))


@app.route('/indice')
def indexI():
    return render_template('analyse/indices.html')

@app.route('/rapport')
def indexR():
    return render_template('analyse/rapport.html')

@app.route('/prediction')
def predictionR():
    return render_template('prediction/index.html')



import traceback
from datetime import datetime

@login_manager.user_loader
def load_user(user_id):
    # Vérifier d'abord si c'est un agent
    agent = Agent.query.filter_by(code_agent=user_id).first()
    if agent:
        return agent
    
    # Vérifier si c'est un contrôleur
    controlleur = Controlleur.query.filter_by(code_controlleur=user_id).first()
    if controlleur:
        return controlleur

    return None  # Si l'utilisateur n'existe pas



from flask_login import login_user

from flask import jsonify, request, session


from flask import jsonify, request, session


@app.route('/get_agent_data', methods=['POST'])
def get_agent_data():
    try:
        code_id = request.json.get('code_id')
        if not code_id:
            raise ValueError("Le code_id est manquant dans la requête")
        
        # Vérifier si c'est un agent
        agent = Agent.query.filter_by(code_agent=code_id).first()
        if agent:
            ville = Ville.query.filter_by(id_ville=agent.id_ville).first()
            if not ville:
                return jsonify({'error': 'Ville non trouvée'}), 404
            
            carnets = Carnet.query.filter_by(code_agent=agent.code_agent).all()
            
            # Vérifier si l'agent est associé à un contrôleur
            agent_controlleur = AgentControlleur.query.filter_by(code_agent=agent.code_agent).first()
            controlleur_name = None
            if agent_controlleur:
                controlleur = Controlleur.query.filter_by(code_controlleur=agent_controlleur.code_controlleur).first()
                if controlleur:
                    controlleur_name = controlleur.nom_controlleur
            
            # Stocker les informations de l'agent dans la session
            session['user_id'] = agent.code_agent
            session['user_name'] = agent.nom_agent
            session['is_controlleur'] = False
            if controlleur_name:
                session['controlleur_name'] = controlleur_name
            
            response = {
                'name': agent.nom_agent,
                'city': ville.nom_ville,
                'is_controlleur': False,
                'controlleur_name': controlleur_name,  # Ajout du nom du contrôleur
                'carnets': {c.id_carnet: c.nom_carnet for c in carnets}
            }
            return jsonify(response)
        
        # Vérifier si c'est un contrôleur
        controlleur = Controlleur.query.filter_by(code_controlleur=code_id).first()
        if controlleur:
            # Stocker les informations du contrôleur dans la session
            session['user_id'] = controlleur.code_controlleur
            session['user_name'] = controlleur.nom_controlleur
            session['is_controlleur'] = True
            
            response = {
                'name': controlleur.nom_controlleur,
                'is_controlleur': True,
                'controlleur_name': controlleur.nom_controlleur  # Le contrôleur est son propre "contrôleur"
            }
            return jsonify(response)
        
        return jsonify({'error': 'Code utilisateur non trouvé'}), 404
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


#notification du controlleur
@app.route('/notifications_controlleur', methods=['GET'])
def get_notifications_controlleur():
    # Récupérer l'ID du contrôleur connecté depuis la session
    controleur_id = session.get('user_id')
    if not controleur_id:
        return jsonify({'error': 'Utilisateur non connecté'}), 401

    # Vérifier si le contrôleur existe
    controleur = Controlleur.query.filter_by(code_controlleur=controleur_id).first()
    if not controleur:
        return jsonify({'error': 'Contrôleur non trouvé'}), 404

    # Récupérer les agents associés au contrôleur
    agents_controleur = AgentControlleur.query.filter_by(code_controlleur=controleur_id).all()
    if not agents_controleur:
        return jsonify({'error': 'Aucun agent associé à ce contrôleur'}), 404

    notifications = []
    total_points = 0

    # Parcourir chaque agent associé au contrôleur
    for agent_controleur in agents_controleur:
        agent_id = agent_controleur.code_agent
        agent = Agent.query.filter_by(code_agent=agent_id).first()
        if not agent:
            continue

        # Récupérer la ville associée à l'agent
        ville = Ville.query.filter_by(id_ville=agent.id_ville).first() if agent.id_ville else None

        # Récupérer les carnets de l'agent
        carnets = Carnet.query.filter_by(code_agent=agent_id).all()

        for carnet in carnets:
            # Récupérer les passages associés au carnet
            passages = Passage.query.filter_by(id_carnet=carnet.id_carnet).all()

            for passage in passages:
                # Récupérer le point de collecte associé au passage
                point_collecte = PointCollecte.query.filter_by(code_point_collecte=passage.code_point_collecte).first()
                if not point_collecte:
                    continue

                # Récupérer les relevés associés au passage
                releves = Releve.query.filter_by(id_passage=passage.id_passage).all()

                for releve in releves:
                    # Créer un ensemble pour stocker les dates uniques
                    dates_uniques = set()

                    # Récupérer tous les prix rejetés ou à ajuster pour ce relevé
                    produits_rejetes = (
                        Prix.query
                        .join(Produit, Prix.code_produit == Produit.code_produit)
                        .filter(
                            Prix.id_releve == releve.id_releve,
                            Prix.statut.in_(["Ajuster", "Rejeter"])
                        )
                        .order_by(Prix.date_passage.desc())
                        .all()
                    )

                    # Ajouter chaque passage rejeté ou à ajuster
                    for produit_rejete in produits_rejetes:
                        date_passage = produit_rejete.date_passage.strftime('%Y-%m-%d') if produit_rejete.date_passage else None

                        if date_passage and date_passage not in dates_uniques:
                            dates_uniques.add(date_passage)

                            notifications.append({
                                "ville_id": ville.id_ville if ville else None,
                                "agent_id": agent.code_agent,
                                "carnet_id": carnet.id_carnet,
                                "nom_agent": agent.nom_agent,
                                "ville": ville.nom_ville if ville else None,
                                "nom_carnet": carnet.nom_carnet,
                                "code_point_collecte": point_collecte.code_point_collecte,
                                "point_collecte": point_collecte.nom_point_collecte,
                                "type_point_collecte": point_collecte.type_point_collecte,
                                "type_produit": produit_rejete.produit.type_produit if produit_rejete.produit else None,
                                "message": produit_rejete.raison_variation or "Aucune raison fournie",
                                "statut": produit_rejete.statut,
                                "date_passage": date_passage,
                                "id_releve": releve.id_releve
                            })
                            total_points += 1

    return jsonify({"notifications": notifications, "total_points": total_points})



@app.route('/notifications', methods=['GET'])
def get_notifications():
    agent_id = session.get('user_id')  # ID de l'agent stocké en session
    if not agent_id:
        return jsonify({'error': 'Utilisateur non connecté'}), 401

    # Récupérer les carnets de l'agent
    carnets = Carnet.query.filter_by(code_agent=agent_id).all()

    notifications = []
    total_points = 0  # Changé de total_points à total_points pour cohérence

    for carnet in carnets:
        # Récupérer les passages associés au carnet
        passages = Passage.query.filter_by(id_carnet=carnet.id_carnet).all()
        passage_ids = [p.id_passage for p in passages]

        # Récupérer les relevés associés aux passages
        releves = db.session.query(Releve, PointCollecte).join(
            Passage, Releve.id_passage == Passage.id_passage
        ).join(
            PointCollecte, Passage.code_point_collecte == PointCollecte.code_point_collecte
        ).filter(
            Releve.id_passage.in_(passage_ids)
        ).all()

        for releve, point in releves:
            # Vérifier si au moins un produit a un prix avec le statut "Rejeter" pour ce relevé
            produit_rejete = (
                Prix.query
                .filter(
                    Prix.id_releve == releve.id_releve,
                    Prix.statut == "Rejeter"
                )
                .order_by(Prix.date_passage.desc())  # Dernier passage
                .first()  # Prendre un seul résultat
            )

            if produit_rejete:
                notifications.append({
                    "nom_carnet": carnet.nom_carnet,
                    "code_point_collecte": point.code_point_collecte,
                    "point_collecte": point.nom_point_collecte,
                    "message": produit_rejete.message,  # Message du prix rejeté
                    "date_passage": produit_rejete.date_passage.strftime('%Y-%m-%d') if produit_rejete.date_passage else None
                })
                total_points += 1

    return jsonify({"notifications": notifications, "total_points": total_points})


@app.route('/rejected-products', methods=['GET'])
def get_rejected_products():
    try:
        point_collecte = request.args.get('point_collecte')
        date_passage = request.args.get('date_passage')

        if not point_collecte or not date_passage:
            return jsonify({'error': 'point_collecte et date_passage sont requis'}), 400

        # Convertir date_passage en objet date
        try:
            date_passage = datetime.strptime(date_passage, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Format de date_passage invalide (attendu : YYYY-MM-DD)'}), 400

        # Trouver le relevé correspondant via Passage
        releve = db.session.query(Releve).join(
            Passage, Releve.id_passage == Passage.id_passage
        ).join(
            PointCollecte, Passage.code_point_collecte == PointCollecte.code_point_collecte
        ).filter(
            PointCollecte.code_point_collecte == point_collecte,
            Prix.date_passage == date_passage,
            Prix.statut == 'Rejeter'
        ).first()

        if not releve:
            return jsonify({'error': 'Aucun relevé trouvé pour ce point de collecte et cette date avec des prix rejetés'}), 404

        # Récupérer les produits rejetés pour ce relevé
        products = db.session.query(Prix, Produit).join(
            Produit, Prix.code_produit == Produit.code_produit
        ).filter(
            Prix.id_releve == releve.id_releve,
            Prix.date_passage == date_passage,
            Prix.statut == 'Rejeter'
        ).all()

        if not products:
            return jsonify({'error': 'Aucun produit rejeté trouvé pour ce relevé et cette date'}), 404

        # Construire la liste des produits
        product_list = [
            {
                'code_produit': prix.code_produit,
                'nom_produit': produit.nom_produit,
                'description_produit': produit.description_produit or '',
                'prix': str(prix.somme),
                'type_statut': prix.statut,
                'id_releve': prix.id_releve  # Inclure id_releve
            }
            for prix, produit in products
        ]

        return jsonify({'products': product_list})

    except Exception as e:
        print(f"Erreur lors de la récupération des produits rejetés: {str(e)}")
        return jsonify({'error': str(e)}), 500


from math import sin, cos, sqrt, atan2, radians

# Fonction pour calculer la distance entre deux points (latitude, longitude) en mètres
def calculate_distance(lat1, lon1, lat2, lon2):
    # Rayon de la Terre en mètres
    R = 6371000
    # Convertir les coordonnées en radians
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    # Différences de coordonnées
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    # Formule de la distance haversine
    a = sin(dlat / 2)**2 + cos(lat1) * cos(lat2) * sin(dlon / 2)**2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    distance = R * c
    return distance

@app.route('/api/analyse-geolocalisation', methods=['GET'])
def analyse_geolocalisation():
    try:
        # Récupérer les paramètres nécessaires depuis la requête
        point_collecte_id = request.args.get('point_collecte_id')  # Code du point de collecte
        mois = request.args.get('mois')  # Mois sélectionné (01 à 12)
        annee = request.args.get('annee')  # Année sélectionnée

        if not point_collecte_id or not mois or not annee:
            return jsonify({'error': 'Paramètres manquants (point_collecte_id, mois, annee)'}), 400

        # Convertir mois et année en entiers pour les requêtes SQL
        mois = int(mois)
        annee = int(annee)

        # Récupérer le point de collecte depuis la table PointCollecte
        point_collecte = PointCollecte.query.filter_by(code_point_collecte=point_collecte_id).first()
        if not point_collecte:
            return jsonify({'error': 'Point de collecte non trouvé dans la table PointCollecte'}), 404

        # Vérifier que le point de collecte a des coordonnées
        if point_collecte.latitude is None or point_collecte.longitude is None:
            return jsonify({'error': 'Les coordonnées du point de collecte ne sont pas définies'}), 400

        # Récupérer la position de l'agent dans la table Position pour le mois et l'année sélectionnés
        position = (
            Position.query
            .filter(
                Position.code_point_collecte == point_collecte_id,
                db.extract('month', Position.timestamp) == mois,
                db.extract('year', Position.timestamp) == annee
            )
            .order_by(Position.timestamp.desc())  # Prendre la plus récente dans le mois sélectionné
            .first()
        )

        if not position:
            return jsonify({
                'error': f'Aucune position enregistrée pour le point de collecte {point_collecte_id} en {mois}/{annee}'
            }), 404

        # Vérifier que la position de l'agent a des coordonnées et une précision
        if position.latitude is None or position.longitude is None or position.accuracy is None:
            return jsonify({'error': 'Les coordonnées ou la précision de la position de l\'agent ne sont pas définies'}), 400

        # Calculer la distance entre la position de l'agent et le point de collecte
        distance = calculate_distance(
            position.latitude, position.longitude,
            point_collecte.latitude, point_collecte.longitude
        )

        # Préparer le message clair
        message = (
            f"<strong>Point de collecte :</strong> {point_collecte.nom_point_collecte} (Code : {point_collecte.code_point_collecte})<br>"
            f"<strong>Date de la position :</strong> {position.timestamp.strftime('%d/%m/%Y')}<br>"
            f"<strong>Position de l'agent :</strong> Latitude {position.latitude:.6f}, Longitude {position.longitude:.6f}<br>"
            f"<strong>Position du point de collecte :</strong> Latitude {point_collecte.latitude:.6f}, Longitude {point_collecte.longitude:.6f}<br>"
            f"<strong>Précision de la position de l'agent :</strong> La position de l'agent est incertaine dans un cercle de rayon {position.accuracy:.1f} mètres autour de ses coordonnées.<br>"
            f"<strong>Distance entre l'agent et le point de collecte :</strong> {distance:.1f} mètres<br>"
        )

        # Ajouter une analyse de la distance par rapport à la précision
        if distance <= position.accuracy:
            message += (
                "<strong>Analyse :</strong> La position de l'agent est cohérente avec le point de collecte, "
                "car la distance est inférieure ou égale à la précision de la géolocalisation.<br>"
            )
        else:
            message += (
                "<strong>Analyse :</strong> La position de l'agent est potentiellement incohérente avec le point de collecte, "
                f"car la distance ({distance:.1f} m) est supérieure à la précision de la géolocalisation ({position.accuracy:.1f} m). "
                "Cela peut indiquer que l'agent n'était pas exactement au point de collecte ou que la précision GPS était faible.<br>"
            )

        # Préparer les données pour la carte
        map_data = {
            'point_collecte': {
                'latitude': float(point_collecte.latitude),
                'longitude': float(point_collecte.longitude),
                'name': point_collecte.nom_point_collecte
            },
            'agent': {
                'latitude': float(position.latitude),
                'longitude': float(position.longitude),
                'accuracy': float(position.accuracy)
            }
        }

        return jsonify({
            'message': message,
            'map_data': map_data
        }), 200

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/update-prices', methods=['POST'])
def update_prices():
    data = request.get_json()

    # Vérifier les données de la requête
    if not data or 'products' not in data or 'date_passage' not in data or 'id_releve' not in data:
        return jsonify({'error': 'Données invalides, date_passage, products ou id_releve manquant'}), 400

    try:
        # Convertir date_passage en objet date si c'est une chaîne
        date_passage = data['date_passage']
        if isinstance(date_passage, str):
            date_passage = datetime.strptime(date_passage, '%Y-%m-%d').date()

        id_releve = data['id_releve']  # Récupérer id_releve

        # Vérifier si le relevé existe
        releve = Releve.query.filter_by(id_releve=id_releve).first()
        if not releve:
            print(f"Aucun relevé trouvé pour id_releve={id_releve}")
            return jsonify({'error': 'Relevé non trouvé'}), 404

        # Récupérer le point de collecte via Passage
        passage = Passage.query.filter_by(id_passage=releve.id_passage).first()
        if not passage:
            print(f"Aucun passage trouvé pour id_passage={releve.id_passage}")
            return jsonify({'error': 'Passage associé au relevé non trouvé'}), 404

        point_collecte = PointCollecte.query.filter_by(code_point_collecte=passage.code_point_collecte).first()
        if not point_collecte:
            print(f"Point de collecte introuvable pour code_point_collecte={passage.code_point_collecte}")
            return jsonify({'error': 'Point de collecte non trouvé'}), 404

        # Récupérer les produits à modifier
        code_produits = [p['code_produit'] for p in data['products']]
        prix_a_modifier = Prix.query.filter(
            Prix.code_produit.in_(code_produits),
            Prix.id_releve == id_releve,
            Prix.date_passage == date_passage,
            Prix.statut == 'Rejeter'  # On ne modifie que les prix rejetés
        ).all()

        if not prix_a_modifier:
            print(f"Aucun produit rejeté trouvé pour les codes produits {code_produits}, id_releve={id_releve}, et date_passage={date_passage}")
            return jsonify({'error': 'Aucun produit rejeté trouvé pour ce relevé et cette date_passage'}), 404

        # Récupérer les nouvelles données de position
        position_data = data.get('position', {})
        latitude = position_data.get('latitude')
        longitude = position_data.get('longitude')
        accuracy = position_data.get('accuracy')

        # Mettre à jour la position existante si de nouvelles coordonnées sont fournies
        if latitude is not None and longitude is not None:
            if not (-90 <= latitude <= 90) or not (-180 <= longitude <= 180):
                print(f"Coordonnées invalides: latitude={latitude}, longitude={longitude}")
                return jsonify({'error': 'Coordonnées invalides (latitude doit être entre -90 et 90, longitude entre -180 et 180)'}), 400

            # Filtrer les positions par code_point_collecte et date_passage
            position = Position.query.filter(
                Position.code_point_collecte == point_collecte.code_point_collecte,
                db.func.date(Position.timestamp) == date_passage
            ).first()

            if position:
                # Mettre à jour la position existante
                position.latitude = latitude
                position.longitude = longitude
                position.accuracy = accuracy
                position.timestamp = datetime.utcnow()
                print(f"Position mise à jour pour {point_collecte.code_point_collecte} à la date {date_passage}: lat={latitude}, lon={longitude}, acc={accuracy}")
            else:
                print(f"Aucune position trouvée pour {point_collecte.code_point_collecte} à la date {date_passage}. Position non mise à jour.")

        # Mettre à jour les prix
        updated_rows = 0
        for prix in prix_a_modifier:
            for produit in data['products']:
                if prix.code_produit == produit['code_produit']:
                    prix.somme = produit['prix']
                    prix.statut = produit.get('statut', 'Ajuster')  # Par défaut 'Ajuster' si non fourni
                    print(f"Produit {prix.code_produit} mis à jour - Nouveau statut: {prix.statut}, Nouveau prix: {prix.somme}")
                    updated_rows += 1

        if updated_rows > 0:
            db.session.commit()
            return jsonify({'success': f'{updated_rows} prix mis à jour avec succès'}), 200
        else:
            print("Aucun produit mis à jour dans la boucle.")
            return jsonify({'error': 'Aucun produit mis à jour'}), 404

    except Exception as e:
        db.session.rollback()
        print("Erreur lors de la mise à jour des prix ou de la position:", str(e))
        return jsonify({'error': str(e)}), 500


@app.route('/get_pointCollecte_types', methods=['POST'])
def get_pointCollecte_types():
    try:
        id_carnet = request.json.get('id_carnet')
        if not id_carnet:
            return jsonify({'error': 'id_carnet manquant'}), 400

        # Récupérer les types uniques de PointCollecte associés au carnet via Passage
        point_collectes = db.session.query(PointCollecte.type_point_collecte).join(
            Passage, PointCollecte.code_point_collecte == Passage.code_point_collecte
        ).filter(
            Passage.id_carnet == id_carnet
        ).group_by(PointCollecte.type_point_collecte).all()

        response = [p[0] for p in point_collectes]
        return jsonify(response)
    except Exception as e:
        print(f"Erreur: {e}")
        return jsonify({'error': str(e)}), 500




from flask import jsonify, request
from datetime import datetime
from sqlalchemy import extract
import traceback



@app.route('/get_points_of_sale', methods=['POST'])
def get_points_of_sale():
    try:
        data = request.get_json()
        id_carnet = data.get('id_carnet')
        type_point_collecte = data.get('type_point_collecte')

        if not id_carnet or not type_point_collecte:
            return jsonify({'error': 'id_carnet ou type_point_collecte manquant'}), 400

        current_month = datetime.now().month
        current_year = datetime.now().year

        points_of_sale = db.session.query(PointCollecte).join(
            Passage, PointCollecte.code_point_collecte == Passage.code_point_collecte
        ).filter(
            Passage.id_carnet == id_carnet,
            PointCollecte.type_point_collecte == type_point_collecte
        ).all()

        filtered_points = []
        for point in points_of_sale:
            passage = db.session.query(Passage).filter(
                Passage.id_carnet == id_carnet,
                Passage.code_point_collecte == point.code_point_collecte
            ).first()

            if not passage:
                continue

            produits = db.session.query(Produit).join(
                PointCollecteProduit, Produit.code_produit == PointCollecteProduit.code_produit
            ).filter(
                PointCollecteProduit.code_point_collecte == point.code_point_collecte
            ).all()

            if not produits:
                continue

            releves = db.session.query(Releve).filter(
                Releve.id_passage == passage.id_passage
            ).all()

            if not releves:
                continue

            prix_subquery = db.session.query(Prix.code_produit).filter(
                Prix.id_releve.in_([r.id_releve for r in releves]),
                extract('month', Prix.date_passage) == current_month,
                extract('year', Prix.date_passage) == current_year
            ).subquery()

            produits_sans_prix = db.session.query(Produit).join(
                PointCollecteProduit, Produit.code_produit == PointCollecteProduit.code_produit
            ).filter(
                PointCollecteProduit.code_point_collecte == point.code_point_collecte,
                Produit.code_produit.notin_(prix_subquery)
            ).count()

            if produits_sans_prix > 0:
                filtered_points.append({
                    'code': point.code_point_collecte,
                    'name': point.nom_point_collecte,
                    'description': point.description_point_collecte,
                    'latitude': float(point.latitude) if point.latitude else None,
                    'longitude': float(point.longitude) if point.longitude else None,
                    'produits_sans_prix': produits_sans_prix,
                    'total_produits': len(produits)
                })

        return jsonify(filtered_points)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500



@app.route('/get_releve_id', methods=['POST'])
def get_releve_id():
    try:
        data = request.get_json()
        id_carnet = data.get('id_carnet')
        code_point_collecte = data.get('code_point_collecte')

        if not id_carnet or not code_point_collecte:
            return jsonify({'error': 'id_carnet ou code_point_collecte manquant'}), 400

        # Récupérer le Releve existant
        releve = db.session.query(Releve).filter_by(
            id_carnet=id_carnet,
            code_point_collecte=code_point_collecte
        ).first()

        if not releve:
            return jsonify({'error': 'Aucun relevé trouvé pour ce carnet et ce point de collecte'}), 404

        return jsonify({'id_releve': releve.id_releve})
        print(' le releve est',  releve.id_releve)
    except Exception as e:
        print(f"Erreur: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/get_releves', methods=['POST'])
def get_releves():
    try:
        data = request.get_json()
        id_carnet = data.get('id_carnet')
        code_point_collecte = data.get('code_point_collecte')

        if not id_carnet or not code_point_collecte:
            return jsonify({'error': 'id_carnet ou code_point_collecte manquant'}), 400

        # Récupérer les passages pour le carnet et le point de collecte
        passages = db.session.query(Passage).filter_by(
            id_carnet=id_carnet,
            code_point_collecte=code_point_collecte
        ).all()

        if not passages:
            return jsonify({'error': 'Aucun passage trouvé pour ce carnet et ce point de collecte'}), 404

        # Récupérer tous les relevés associés aux passages
        releves = db.session.query(Releve).filter(
            Releve.id_passage.in_([p.id_passage for p in passages])
        ).all()

        if not releves:
            return jsonify({'error': 'Aucun relevé trouvé pour ce point de collecte'}), 404

        # Formatage de la réponse
        response = [
            {
                'id_releve': releve.id_releve,
                'nom_releve': releve.nom_releve or f"Relevé {i+1}"
            }
            for i, releve in enumerate(releves)
        ]

        return jsonify(response)
    except Exception as e:
        print(f"Erreur: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/get_product_types', methods=['POST'])
def get_product_types():
    try:
        id_releve = request.json.get('id_releve')
        code_point_collecte = request.json.get('code_point_collecte')

        if not id_releve or not code_point_collecte:
            return jsonify({'error': 'id_releve ou code_point_collecte manquant'}), 400

        current_month = datetime.now().month
        current_year = datetime.now().year

        prix_subquery = db.session.query(Prix.code_produit).filter(
            Prix.id_releve == id_releve,
            extract('month', Prix.date_passage) == current_month,
            extract('year', Prix.date_passage) == current_year
        ).subquery()

        product_types = db.session.query(Produit.type_produit).join(
            PointCollecteProduit, Produit.code_produit == PointCollecteProduit.code_produit
        ).filter(
            PointCollecteProduit.code_point_collecte == code_point_collecte,
            Produit.code_produit.notin_(prix_subquery)
        ).group_by(Produit.type_produit).all()

        response = [p[0] for p in product_types if p[0]]
        return jsonify(response)
    except Exception as e:
        print(f"Erreur: {e}")
        return jsonify({'error': str(e)}), 500




@app.route('/api/annees', methods=['GET'])
def get_annees():
    annees = db.session.query(db.func.date_format(Prix.date_passage, '%Y')).distinct().all()
    result = [annee[0] for annee in annees]
    return jsonify(result)


@app.route('/api/agents/<agent_id>/mois', methods=['GET'])
def get_mois_by_agent(agent_id):
    try:
        # Récupérer les mois distincts des prix pour l'agent via Prix, Releve, Passage et Carnet
        mois = (
            db.session.query(db.func.date_format(Prix.date_passage, '%Y-%m'))
            .join(Releve, Prix.id_releve == Releve.id_releve)  # Jointure Prix -> Releve
            .join(Passage, Releve.id_passage == Passage.id_passage)  # Jointure Releve -> Passage
            .join(Carnet, Passage.id_carnet == Carnet.id_carnet)  # Jointure Passage -> Carnet
            .filter(Carnet.code_agent == agent_id)
            .distinct()
            .all()
        )

        # Extraire les mois sous forme de liste
        result = [mois[0] for mois in mois if mois[0]]  # Filtrer les valeurs nulles si elles existent

        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

from flask import jsonify, request
from datetime import datetime
from sqlalchemy import extract


@app.route('/get_filtered_products', methods=['POST'])
def get_filtered_products():
    try:
        data = request.json
        code_point_collecte = data.get('code_point_collecte')
        produit_type = data.get('produit_type')

        # Vérification des paramètres obligatoires
        if not code_point_collecte:
            return jsonify({'error': 'code_point_collecte manquant'}), 400

        # Requête de base : jointure entre Produit et PointCollecteProduit
        query = db.session.query(Produit).join(
            PointCollecteProduit, Produit.code_produit == PointCollecteProduit.code_produit
        ).filter(
            PointCollecteProduit.code_point_collecte == code_point_collecte
        )

        # Filtre optionnel sur le type de produit
        if produit_type:
            query = query.filter(Produit.type_produit == produit_type)

        # Exécution de la requête
        products = query.all()

        # Formatage de la réponse
        response = [
            {
                'code': p.code_produit,
                'name': p.nom_produit,
                'type': p.type_produit,
                'description': p.description_produit
            } for p in products
        ]
        return jsonify(response)

    except Exception as e:
        print(f"Erreur: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/get_previous_month_prices', methods=['POST'])
def get_previous_month_prices():
    try:
        data = request.get_json()
        code_point_collecte = data.get('code_point_collecte')
        produit_type = data.get('produit_type')

        # Log des données reçues
        print(f"Received code_point_collecte: {code_point_collecte}, produit_type: {produit_type}")

        # Vérification des paramètres obligatoires
        if not code_point_collecte or not produit_type:
            return jsonify({'error': 'Paramètres requis manquants: code_point_collecte ou produit_type'}), 400

        # Calcul des dates pour le mois précédent
        today = datetime.today()
        first_day_of_current_month = today.replace(day=1)
        last_month = first_day_of_current_month - relativedelta(months=1)
        first_day_of_last_month = last_month.replace(day=1)
        last_day_of_last_month = first_day_of_current_month - relativedelta(days=1)

        # Requête pour obtenir les prix du mois précédent
        previous_prices = db.session.query(Prix.code_produit, Prix.somme).join(
            Releve, Prix.id_releve == Releve.id_releve
        ).join(
            Passage, Releve.id_passage == Passage.id_passage
        ).join(
            Produit, Prix.code_produit == Produit.code_produit
        ).filter(
            Passage.code_point_collecte == code_point_collecte,
            Prix.date_passage.between(first_day_of_last_month, last_day_of_last_month),
            Produit.type_produit == produit_type
        ).all()

        # Construire le dictionnaire des prix
        prices_dict = {code_produit: float(somme) for code_produit, somme in previous_prices}

        # Log des résultats
        print(f"Previous month prices for {code_point_collecte} ({produit_type}): {prices_dict}")
        return jsonify(prices_dict)

    except Exception as e:
        print(f"Error in get_previous_month_prices: {str(e)}")
        return jsonify({'error': f"Erreur serveur: {str(e)}"}), 500


@app.route('/save_prices', methods=['POST'])
def save_prices():
    try:
        data = request.get_json()
        id_releve = data.get('id_releve')
        code_point_collecte = data.get('code_point_collecte')
        prices = data.get('prices')
        
        # Récupérer les informations de position (facultatif)
        position_data = data.get('position', {})
        latitude = position_data.get('latitude')
        longitude = position_data.get('longitude')
        accuracy = position_data.get('accuracy')

        print(f"Data received: {data}")  # Log pour débogage

        # Vérifier les données obligatoires
        if not id_releve:
            return jsonify({'error': 'id_releve manquant'}), 400
        if not code_point_collecte:
            return jsonify({'error': 'code_point_collecte manquant'}), 400
        if not prices:
            return jsonify({'error': 'Liste de prix manquante'}), 400

        # Valider l'existence du Releve
        releve = Releve.query.get(id_releve)
        if not releve:
            return jsonify({'error': 'Relevé non trouvé'}), 404

        # Valider que code_point_collecte correspond au id_releve via Passage
        passage = Passage.query.filter_by(id_passage=releve.id_passage).first()
        if not passage:
            return jsonify({'error': 'Passage associé au relevé non trouvé'}), 404
        if passage.code_point_collecte != code_point_collecte:
            return jsonify({'error': 'Le code_point_collecte fourni ne correspond pas au relevé'}), 400

        # Valider les données de position (si fournies)
        if latitude is not None and longitude is not None:
            # Validation des coordonnées
            if not (-90 <= latitude <= 90) or not (-180 <= longitude <= 180):
                return jsonify({'error': 'Coordonnées invalides (latitude doit être entre -90 et 90, longitude entre -180 et 180)'}), 400

            # Créer un enregistrement dans la table Position
            position = Position(
                code_point_collecte=code_point_collecte,
                latitude=latitude,
                longitude=longitude,
                accuracy=accuracy,
                timestamp=datetime.utcnow()
            )
            db.session.add(position)

        # Enregistrer les prix
        for price in prices:
            # Validation des données de prix
            if 'somme' not in price or 'code_produit' not in price:
                return jsonify({'error': 'Données de prix incomplètes (somme ou code_produit manquant)'}), 400

            # Valider l'existence du produit
            produit = Produit.query.get(price['code_produit'])
            if not produit:
                return jsonify({'error': f"Produit avec code {price['code_produit']} non trouvé"}), 404

            prix = Prix(
                id_releve=id_releve,
                code_produit=price['code_produit'],
                somme=price['somme'],
                quantite=price.get('quantite', 1),
                date_passage=datetime.utcnow().date(),
                type_statut=price.get('type_statut', 'N'),
                raison_variation=price.get('raison_variation'),
                statut=None  # Explicitement défini à NULL, car il est défini plus tard (par exemple, par un contrôleur)
            )
            db.session.add(prix)
        
        # Valider les modifications
        db.session.commit()
        return jsonify({'status': 'success', 'message': 'Prix et position enregistrés avec succès'}), 200

    except Exception as e:
        print(f"Error: {e}")  # Log pour débogage
        db.session.rollback()
        return jsonify({'error': f"Erreur serveur: {str(e)}"}), 500



@app.route('/api/villes', methods=['GET'])
def get_villes():
    villes = Ville.query.all()
    result = [{'id_ville': ville.id_ville, 'nom_ville': ville.nom_ville} for ville in villes]
    return jsonify(result)


@app.route('/api/villes/<int:ville_id>/agents', methods=['GET'])
def get_agents_by_ville(ville_id):
    # Récupérer le code du contrôleur depuis la session
    code_controlleur = session.get('user_id')
    
    if not code_controlleur:
        return jsonify({'error': 'Utilisateur non authentifié en tant que contrôleur'}), 401
    
    # Filtrer les agents par ville et par contrôleur
    agents = (Agent.query
                    .filter_by(id_ville=ville_id)
                    .join(AgentControlleur, Agent.code_agent == AgentControlleur.code_agent)
                    .filter(AgentControlleur.code_controlleur == code_controlleur)
                    .all())
    
    result = [{'code_agent': agent.code_agent, 'nom_agent': agent.nom_agent} for agent in agents]
    return jsonify(result)


@app.route('/api/agents/<string:code_agent>/carnets', methods=['GET'])
def get_carnets_by_agent(code_agent):
    try:
        # Vérifier si l'utilisateur est authentifié en tant que contrôleur
        code_controlleur = session.get('user_id')
        if not code_controlleur:
            return jsonify({'error': 'Utilisateur non authentifié en tant que contrôleur'}), 401

        # Vérifier si le contrôleur existe
        controleur = Controlleur.query.filter_by(code_controlleur=code_controlleur).first()
        if not controleur:
            return jsonify({'error': 'Contrôleur non trouvé'}), 404

        # Vérifier si l'agent existe
        agent = Agent.query.filter_by(code_agent=code_agent).first()
        if not agent:
            return jsonify({'error': 'Agent non trouvé'}), 404

        # Vérifier si l'agent est bien associé au contrôleur
        agent_controlleur = AgentControlleur.query.filter_by(
            code_agent=code_agent,
            code_controlleur=code_controlleur
        ).first()
        if not agent_controlleur:
            return jsonify({'error': 'Cet agent ne vous est pas attribué'}), 403

        # Récupérer les carnets de l'agent sélectionné
        carnets = Carnet.query.filter_by(code_agent=code_agent).all()

        # Construire la liste des carnets
        result = [
            {
                'id_carnet': carnet.id_carnet,
                'nom_carnet': carnet.nom_carnet
            } for carnet in carnets
        ]

        return jsonify(result)

    except Exception as e:
        return jsonify({'error': str(e)}), 500



@app.route('/api/carnets/<int:id_carnet>/types-point-collecte', methods=['GET'])
def get_types_points_collecte_by_carnet(id_carnet):
    try:
        # Vérifier si le carnet existe
        carnet = Carnet.query.filter_by(id_carnet=id_carnet).first()
        if not carnet:
            return jsonify({'error': 'Carnet non trouvé'}), 404

        # Récupérer les types distincts de points de collecte associés au carnet via Passage
        types_points_collecte = (
            db.session.query(PointCollecte.type_point_collecte)
            .join(Passage, PointCollecte.code_point_collecte == Passage.code_point_collecte)  # Jointure PointCollecte -> Passage
            .filter(Passage.id_carnet == id_carnet)
            .distinct()
            .all()
        )

        # Extraire les types sous forme de liste
        result = [type_point_collecte[0] for type_point_collecte in types_points_collecte if type_point_collecte[0]]

        print(result)  # Garder le print pour le débogage si nécessaire
        return jsonify(result)

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/carnets/<int:carnet_id>/types-point-collecte/<string:type_point_collecte>/points-collecte', methods=['GET'])
def get_points_collecte_by_carnet_and_type(carnet_id, type_point_collecte):
    annee = request.args.get('annee')  # Récupérer l'année (ex: "2023")
    mois = request.args.get('mois')    # Récupérer le mois (ex: "01")

    if not annee or not mois:
        return jsonify({'error': 'Année et mois requis'}), 400

    try:
        # Format YYYY-MM pour filtrer Prix.date_passage
        date_filtre = f"{annee}-{mois}"

        # Vérifier si le carnet existe
        carnet = Carnet.query.filter_by(id_carnet=carnet_id).first()
        if not carnet:
            return jsonify({'error': 'Carnet non trouvé'}), 404

        # Récupérer les points de collecte associés au carnet et au type via Passage
        points_collecte = (
            db.session.query(PointCollecte)
            .join(Passage, PointCollecte.code_point_collecte == Passage.code_point_collecte)  # Jointure PointCollecte -> Passage
            .filter(
                Passage.id_carnet == carnet_id,
                PointCollecte.type_point_collecte == type_point_collecte
            )
            .all()
        )

        result = []
        for point in points_collecte:
            # Récupérer le passage pour ce point et ce carnet
            passage = Passage.query.filter_by(
                id_carnet=carnet_id,
                code_point_collecte=point.code_point_collecte
            ).first()

            if not passage:
                statuts = []  # Aucun passage, donc pas de relevé ni de prix
            else:
                # Récupérer le relevé pour ce passage
                releve = Releve.query.filter_by(id_passage=passage.id_passage).first()

                if not releve:
                    statuts = []  # Aucun relevé, donc pas de prix
                else:
                    # Récupérer tous les statuts des prix pour ce relevé à la date donnée
                    prix_statuts = (
                        db.session.query(Prix.statut)
                        .filter(
                            Prix.id_releve == releve.id_releve,
                            db.func.date_format(Prix.date_passage, '%Y-%m') == date_filtre
                        )
                        .all()
                    )
                    # Extraire les statuts sous forme de liste (peut inclure NULL)
                    statuts = [p.statut for p in prix_statuts] if prix_statuts else []

            result.append({
                'code_point_collecte': point.code_point_collecte,
                'nom_point_collecte': point.nom_point_collecte,
                'statuts': statuts  # Liste des statuts (ex: ['Valider', 'Rejeter', None])
            })

        return jsonify(result)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/points-collecte/<point_collecte_id>/types-produits', methods=['GET'])
def get_types_produits_by_point_collecte(point_collecte_id):
    types_produits = db.session.query(Produit.type_produit)\
        .join(PointCollecteProduit, Produit.code_produit == PointCollecteProduit.code_produit)\
        .filter(PointCollecteProduit.code_point_collecte == point_collecte_id)\
        .distinct().all()
    
    result = [type_produit[0] for type_produit in types_produits]
    return jsonify(result)


@app.route('/api/points-collecte/<string:point_collecte_id>/types-produits/<string:type_produit>/produits', methods=['GET'])
def get_produits(point_collecte_id, type_produit):
    mois = request.args.get('mois')
    releve_id = request.args.get('releve_id')  # Récupérer releve_id comme paramètre

    if not mois:
        return jsonify({'error': 'Mois requis'}), 400
    if not releve_id:
        return jsonify({'error': 'releve_id requis pour identifier le relevé'}), 400

    try:
        # Vérifier si le relevé existe
        releve = Releve.query.filter_by(id_releve=releve_id).first()
        if not releve:
            return jsonify({'error': 'Relevé non trouvé'}), 404

        # Maintenant, filtrer les prix avec cet id_releve spécifique
        if type_produit == 'Hétérogene':
            produits = (
                db.session.query(
                    Produit.code_produit,
                    Produit.nom_produit,
                    Prix.somme,
                    Prix.type_statut,
                    Prix.raison_variation,
                    Prix.id_prix,
                    Carnet.nom_carnet
                )
                .join(Prix, Produit.code_produit == Prix.code_produit)
                .join(Releve, Prix.id_releve == Releve.id_releve)
                .join(Passage, Releve.id_passage == Passage.id_passage)
                .join(Carnet, Passage.id_carnet == Carnet.id_carnet)
                .filter(
                    Prix.id_releve == releve_id,
                    Produit.type_produit == type_produit,
                    db.func.date_format(Prix.date_passage, '%Y-%m') == mois
                )
                .all()
            )

            result = [
                {
                    ' code_produit': produit.code_produit,
                    'nom_produit': produit.nom_produit,
                    'somme': float(produit.somme) if produit.somme is not None else None,
                    'id_prix': produit.id_prix,
                    'nom_carnet': produit.nom_carnet,
                    'type_statut': produit.type_statut,
                    'raison_variation': produit.raison_variation,
                    'id_releve': releve_id
                } for produit in produits
            ]

        elif type_produit == 'Homogene o1':
            produits = (
                db.session.query(
                    Produit.nom_produit,
                    Produit.code_produit,
                    Prix.somme,
                    Prix.type_statut,
                    Prix.raison_variation,
                    Prix.id_prix
                )
                .join(Prix, Produit.code_produit == Prix.code_produit)
                .filter(
                    Prix.id_releve == releve_id,
                    Produit.type_produit == type_produit,
                    db.func.date_format(Prix.date_passage, '%Y-%m') == mois
                )
                .all()
            )

            result = [
                {
                    'code_produit': produit.code_produit,
                    'nom_produit': produit.nom_produit,
                    'somme': float(produit.somme) if produit.somme is not None else None,
                    'id_prix': produit.id_prix,
                    'type_statut': produit.type_statut,
                    'raison_variation': produit.raison_variation,
                    'id_releve': releve_id
                } for produit in produits
            ]

        else:  # Homogene O2&O3
            produits = (
                db.session.query(
                    Produit.nom_produit,
                    Produit.code_produit,
                    Prix.somme,
                    Prix.type_statut,
                    Prix.quantite,
                    Prix.raison_variation,
                    (Prix.somme * Prix.quantite).label('PKG'),
                    Prix.id_prix
                )
                .join(Prix, Produit.code_produit == Prix.code_produit)
                .filter(
                    Prix.id_releve == releve_id,
                    Produit.type_produit == type_produit,
                    db.func.date_format(Prix.date_passage, '%Y-%m') == mois
                )
                .all()
            )

            result = [
                {
                    'nom_produit': produit.nom_produit,
                    'code_produit': produit.code_produit,
                    'somme': float(produit.somme) if produit.somme is not None else None,
                    'type_statut': produit.type_statut,
                    'quantite': produit.quantite,
                    'PKG': float(produit.PKG) if produit.PKG is not None else None,
                    'id_prix': produit.id_prix,
                    'raison_variation': produit.raison_variation,
                    'id_releve': releve_id
                } for produit in produits
            ]

        print(result)  # Pour débogage
        return jsonify(result)

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/carnets/<int:carnet_id>/points-collecte/<string:point_collecte_id>/releves', methods=['GET'])
def get_releves_by_carnet_and_point_collecte(carnet_id, point_collecte_id):
    try:
        # Vérifier si le carnet existe
        carnet = Carnet.query.filter_by(id_carnet=carnet_id).first()
        if not carnet:
            return jsonify({'error': 'Carnet non trouvé'}), 404

        # Vérifier si le point de collecte existe
        point_collecte = PointCollecte.query.filter_by(code_point_collecte=point_collecte_id).first()
        if not point_collecte:
            return jsonify({'error': 'Point de collecte non trouvé'}), 404

        # Récupérer les relevés associés au carnet et au point de collecte via Passage
        releves = (
            db.session.query(Releve.id_releve, Releve.nom_releve)
            .join(Passage, Releve.id_passage == Passage.id_passage)
            .filter(
                Passage.id_carnet == carnet_id,
                Passage.code_point_collecte == point_collecte_id
            )
            .all()
        )

        # Construire la réponse
        result = [
            {
                'id_releve': releve.id_releve,
                'nom_releve': releve.nom_releve or f'Relevé {releve.id_releve}'  # Utiliser id_releve si nom_releve est null
            }
            for releve in releves
        ]

        return jsonify(result)

    except Exception as e:
        return jsonify({'error': str(e)}), 500




from sqlalchemy.exc import SQLAlchemyError


@app.route('/api/valider-prix', methods=['POST'])
def valider_produits():
    try:
        # Récupérer les données envoyées par le client
        data = request.get_json()
        id_releve = data.get('id_releve')
        type_produit = data.get('type_produit')
        mois = data.get('mois')

        # Log des paramètres pour le débogage
        print(f"Paramètres reçus : id_releve={id_releve}, type_produit={type_produit}, mois={mois}")

        # Vérifier que tous les paramètres nécessaires sont présents
        if not id_releve or not type_produit or not mois:
            return jsonify({"error": "Missing required parameters: id_releve, type_produit, and mois are required"}), 400

        # Vérifier si le relevé existe
        releve = Releve.query.filter_by(id_releve=id_releve).first()
        if not releve:
            return jsonify({"error": "Relevé non trouvé"}), 404

        # Construire la requête pour récupérer les enregistrements correspondants
        query = db.session.query(Prix).join(Produit, Produit.code_produit == Prix.code_produit).filter(
            Prix.id_releve == id_releve,
            Produit.type_produit == type_produit,
            db.func.date_format(Prix.date_passage, '%Y-%m') == mois
        )

        # Récupérer les produits à modifier
        prix_a_valider = query.all()
        print(f"Nombre de produits trouvés à valider : {len(prix_a_valider)}")
        if not prix_a_valider:
            return jsonify({"message": "Aucun produit trouvé correspondant aux critères."}), 200

        # Modifier l'attribut statut pour chaque produit
        updated_rows = 0
        for prix in prix_a_valider:
            print(f"Mise à jour du produit {prix.id_prix} : statut actuel={prix.statut}")
            prix.statut = 'Valider'
            updated_rows += 1

        # Valider les modifications dans la base de données
        db.session.commit()
        print(f"Nombre de lignes mises à jour : {updated_rows}")

        return jsonify({"message": f"{updated_rows} prix validés avec succès."}), 200

    except SQLAlchemyError as e:
        db.session.rollback()
        print(f"Erreur SQLAlchemy : {str(e)}")
        return jsonify({"error": f"Erreur lors de la validation des prix : {str(e)}"}), 500
    except Exception as e:
        db.session.rollback()
        print(f"Erreur inattendue : {str(e)}")
        return jsonify({"error": f"Erreur inattendue : {str(e)}"}), 500



@app.route('/api/rejeter-prix', methods=['POST'])
def rejeter_produits():
    try:
        # Récupérer les données envoyées par le client
        data = request.get_json()
        id_releve = data.get('id_releve')
        type_produit = data.get('type_produit')
        mois = data.get('mois')
        message = data.get('message')

        # Log des paramètres pour le débogage
        print(f"Paramètres reçus : id_releve={id_releve}, type_produit={type_produit}, mois={mois}, message={message}")

        # Vérifier que tous les paramètres nécessaires sont présents
        if not id_releve or not type_produit or not mois or not message:
            return jsonify({"error": "Missing required parameters: id_releve, type_produit, mois, and message are required"}), 400

        # Vérifier si le relevé existe
        releve = Releve.query.filter_by(id_releve=id_releve).first()
        if not releve:
            return jsonify({"error": "Relevé non trouvé"}), 404

        # Récupérer les enregistrements correspondants
        query = db.session.query(Prix).join(Produit, Produit.code_produit == Prix.code_produit).filter(
            Prix.id_releve == id_releve,
            Produit.type_produit == type_produit,
            db.func.date_format(Prix.date_passage, '%Y-%m') == mois
        )

        prix_a_rejeter = query.all()
        print(f"Produits à rejeter : {len(prix_a_rejeter)}")

        if not prix_a_rejeter:
            return jsonify({"error": "Aucun produit trouvé pour les critères spécifiés."}), 404

        # Modifier l'attribut statut et message
        updated_rows = 0
        for prix in prix_a_rejeter:
            prix.statut = 'Rejeter'
            prix.raison_variation = message  # Utiliser raison_variation pour le message
            updated_rows += 1

        # Valider les modifications
        db.session.commit()

        return jsonify({"message": f"{updated_rows} prix rejetés avec le message '{message}'."}), 200

    except Exception as e:
        db.session.rollback()
        print(f"Erreur inattendue : {str(e)}")
        return jsonify({"error": f"Erreur inattendue : {str(e)}"}), 500


@app.route('/api/points-collecte/<string:point_collecte_id>/types-produits/<string:type_produit>/prix-precedent', methods=['GET'])
def get_previous_month_pricesC(point_collecte_id, type_produit):
    mois = request.args.get('mois')
    releve_id = request.args.get('releve_id')  # Récupérer releve_id comme paramètre

    if not mois:
        return jsonify({'error': 'Mois requis'}), 400
    if not releve_id:
        return jsonify({'error': 'releve_id requis pour identifier le relevé'}), 400

    try:
        # Vérifier si le relevé existe
        releve = Releve.query.filter_by(id_releve=releve_id).first()
        if not releve:
            return jsonify({'error': 'Relevé non trouvé'}), 404

        # Calcul des dates pour le mois précédent
        selected_month_date = datetime.strptime(mois, "%Y-%m")
        first_day_of_current_month = selected_month_date.replace(day=1)
        last_month = first_day_of_current_month - relativedelta(months=1)
        first_day_of_last_month = last_month.replace(day=1)
        last_day_of_last_month = first_day_of_current_month - relativedelta(days=1)

        # Récupérer les prix (non agrégés) du mois précédent pour cet id_releve
        previous_prices = (
            db.session.query(
                Produit.code_produit,
                Prix.somme
            )
            .join(Prix, Produit.code_produit == Prix.code_produit)
            .filter(
                Prix.id_releve == releve_id,
                Produit.type_produit == type_produit,
                Prix.date_passage.between(first_day_of_last_month, last_day_of_last_month)
            )
            .all()
        )

        # Construire un dictionnaire des prix
        previous_prices_dict = {
            prix.code_produit: float(prix.somme) if prix.somme is not None else None
            for prix in previous_prices
        }

        return jsonify(previous_prices_dict)

    except ValueError as e:
        return jsonify({'error': 'Format de mois invalide (attendu : YYYY-MM)'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

    
@app.route('/api/prix/<int:prix_id>', methods=['PUT'])
def update_prix(prix_id):
    data = request.get_json()
    prix = Prix.query.get(prix_id)
    if prix:
        prix.somme = data.get('somme')
        db.session.commit()
        return jsonify({'message': 'Prix mis à jour avec succès!'})
    return jsonify({'message': 'Prix non trouvé'}), 404


@app.route('/releve')
def index1():
    return render_template('indexR.html')


@app.route('/api/villes/<ville_id>/mois', methods=['GET'])
def get_mois_by_ville(ville_id):
    mois = db.session.query(db.func.date_format(Prix.date_passage, '%Y-%m')).join(Passage).join(PointCollecte).join(Carnet).join(Agent).filter(Agent.id_ville == ville_id).distinct().all()
    result = [mois[0] for mois in mois]
    return jsonify(result)


from flask import jsonify, request
from sqlalchemy import func, distinct

@app.route('/api/villes/<ville_id>/produits', methods=['GET'])
def get_produits_by_ville_and_mois(ville_id):
    mois = request.args.get('mois')

    # Étape 1: Calculer la moyenne des prix par type de prix pour chaque passage pour chaque produit
    sous_requete = db.session.query(
        Prix.code_produit,
        Passage.nom_passage,
        Produit.type_produit,
        Prix.date_passage,
        Ville.code_ville,
        Carnet.id_carnet,
        TypePrix.nom_type_prix,
        db.func.avg(
            db.case(
                (Produit.type_produit == 'Homogene O2&O3', (Prix.somme * Prix.quantite)),
                else_=Prix.somme
            )
        ).label('prix_moyen')
    ).join(
        Produit, Produit.code_produit == Prix.code_produit
    ).join(
        Passage, Prix.id_passage == Passage.id_passage
    ).join(
        PointCollecte, Passage.code_point_collecte == PointCollecte.code_point_collecte
    ).join(
        Carnet, PointCollecte.id_carnet == Carnet.id_carnet
    ).join(
        Agent, Carnet.code_agent == Agent.code_agent
    ).join(
        Ville, Agent.id_ville == Ville.id_ville
    ).join(
        TypePrix, Prix.id_type_prix == TypePrix.id_type_prix
    ).filter(
        Agent.id_ville == ville_id,
        db.func.date_format(Prix.date_passage, '%Y-%m') == mois,
        Prix.statut == 'valider'  # Seuls les prix validés
    ).group_by(
        Prix.code_produit,
        Passage.nom_passage,
        Produit.type_produit,
        Prix.date_passage,
        Ville.code_ville,
        Carnet.id_carnet,
        TypePrix.nom_type_prix
    ).subquery()

    # Étape 2: Calculer la moyenne des moyennes pour chaque produit
    produits = db.session.query(
        sous_requete.c.code_produit,
        sous_requete.c.type_produit,
        sous_requete.c.date_passage,
        sous_requete.c.code_ville,
        sous_requete.c.id_carnet,
        db.func.avg(sous_requete.c.prix_moyen).label('prix_moyen_global')
    ).group_by(
        sous_requete.c.code_produit,
        sous_requete.c.type_produit,
        sous_requete.c.date_passage,
        sous_requete.c.code_ville,
        sous_requete.c.id_carnet
    ).all()

    # Étape 3: Calcul de la progression des points de collecte validés
    # Nombre total de points de collecte pour la ville et le mois
    total_points = db.session.query(
        func.count(distinct(PointCollecte.code_point_collecte))
    ).join(
        Carnet, PointCollecte.id_carnet == Carnet.id_carnet
    ).join(
        Agent, Carnet.code_agent == Agent.code_agent
    ).join(
        Ville, Agent.id_ville == Ville.id_ville
    ).filter(
        Agent.id_ville == ville_id
    ).scalar()

    # Nombre de points de collecte ayant au moins un prix validé pour le mois
    points_valides = db.session.query(
        func.count(distinct(PointCollecte.code_point_collecte))
    ).join(
        Passage, Passage.code_point_collecte == PointCollecte.code_point_collecte
    ).join(
        Prix, Prix.id_passage == Passage.id_passage
    ).join(
        Carnet, PointCollecte.id_carnet == Carnet.id_carnet
    ).join(
        Agent, Carnet.code_agent == Agent.code_agent
    ).join(
        Ville, Agent.id_ville == Ville.id_ville
    ).filter(
        Agent.id_ville == ville_id,
        db.func.date_format(Prix.date_passage, '%Y-%m') == mois,
        Prix.statut == 'valider'
    ).scalar()

    # Calcul du pourcentage de progression
    progression = (points_valides / total_points * 100) if total_points > 0 else 0

    # Étape 4: Préparer les résultats des produits
    result = []
    for produit in produits:
        nom_type_prix = 'PKG moy' if produit.type_produit == 'Homogene O2&O3' else 'Prix moy'
        nom_passage = 'PKG moy' if produit.type_produit == 'Homogene O2&O3' else 'passage moy'
        date_passage_formatted = produit.date_passage.strftime('%Y-%m-%d')
        result.append({
            'code_produit': produit.code_produit,
            'nom_type_prix': nom_type_prix,
            'nom_passage': nom_passage,
            'date_passage': date_passage_formatted,
            'nom_ville': produit.code_ville,
            'nom_carnet': produit.id_carnet,
            'somme': produit.prix_moyen_global
        })

    # Étape 5: Retourner les résultats avec la progression
    response = {
        'produits': result,
        'progression': {
            'total_points': total_points,
            'points_valides': points_valides,
            'pourcentage': round(progression, 2)  # Arrondi à 2 décimales
        }
    }

    return jsonify(response)



#########################################################################################################################################################################
#GESTION DE INDEXDB
@app.route('/vil', methods=['GET'])
def get_vil():
    villes = Ville.query.all()
    return jsonify([{
        'id_ville': ville.id_ville,
        'code_ville': ville.code_ville,
        'nom_ville': ville.nom_ville,
        'description_ville': ville.description_ville
    } for ville in villes]), 200

@app.route('/age', methods=['GET'])
def get_agents():
    agents = Agent.query.all()
    return jsonify([{
        'code_agent': agent.code_agent,
        'type_agent': agent.type_agent,
        'nom_agent': agent.nom_agent,
        'adresse_agent': agent.adresse_agent,
        'id_ville': agent.id_ville
    } for agent in agents]), 200
    

@app.route('/controlleurs', methods=['GET'])
def get_controlleurs():
    controlleurs = Controlleur.query.all()
    return jsonify([{
        'code_controlleur': controlleur.code_controlleur,
        'type_controlleur': controlleur.type_controlleur,
        'nom_controlleur': controlleur.nom_controlleur
    } for controlleur in controlleurs]), 200

@app.route('/agent_controlleurs', methods=['GET'])
def get_agent_controlleurs():
    agent_controlleurs = AgentControlleur.query.all()
    return jsonify([{
        'id': ac.id,
        'code_agent': ac.code_agent,
        'code_controlleur': ac.code_controlleur
    } for ac in agent_controlleurs]), 200

@app.route('/carnets', methods=['GET'])
def get_carnets():
    carnets = Carnet.query.all()
    return jsonify([{
        'id_carnet': carnet.id_carnet,
        'nom_carnet': carnet.nom_carnet,
        'code_agent': carnet.code_agent
    } for carnet in carnets]), 200

@app.route('/points_collecte', methods=['GET'])
def get_points_collecte():
    points_collecte = PointCollecte.query.all()
    return jsonify([{
        'code_point_collecte': point.code_point_collecte,
        'nom_point_collecte': point.nom_point_collecte,
        'description_point_collecte': point.description_point_collecte,
        'latitude': point.latitude,
        'longitude': point.longitude,
        'id_carnet': point.id_carnet,
        'type_point_collecte': point.type_point_collecte
    } for point in points_collecte]), 200

@app.route('/passages', methods=['GET'])
def get_pass():
    passages = Passage.query.all()
    # Retourner les données au client
    return jsonify([{
        'id_passage': passage.id_passage,
        'code_point_collecte': passage.code_point_collecte,
        'nom_passage': passage.nom_passage
    } for passage in passages]), 200


@app.route('/types_prix', methods=['GET'])
def get_types_prix():
    types_prix = TypePrix.query.all()
    return jsonify([{
        'id_type_prix': type_prix.id_type_prix,
        'code_point_collecte': type_prix.code_point_collecte,
        'nom_type_prix': type_prix.nom_type_prix
    } for type_prix in types_prix]), 200

@app.route('/produits', methods=['GET'])
def get_prod():
    produits = Produit.query.all()
    return jsonify([{
        'code_produit': produit.code_produit,
        'nom_produit': produit.nom_produit,
        'type_produit': produit.type_produit,
        'description_produit': produit.description_produit,
        'code_variete': produit.code_variete
    } for produit in produits]), 200


@app.route('/prix', methods=['GET'])
def get_prix():
    prix_list = Prix.query.all()
    return jsonify([{
        'id_prix': p.id_prix,
        'somme': p.somme,
        'quantite': p.quantite,
        'date_passage': p.date_passage,
        'code_produit': p.code_produit,
        'id_passage': p.id_passage,
        'id_type_prix': p.id_type_prix
    } for p in prix_list]), 200


@app.route('/point_collecte_produits', methods=['GET'])
def get_point_collecte_produits():
    point_collecte_produits = PointCollecteProduit.query.all()
    return jsonify([{
        'code_point_collecte': pc.code_point_collecte,
        'code_produit': pc.code_produit
    } for pc in point_collecte_produits]), 200


##################################################################################################################################################################
#GESTION POUR LE SUPER ADMINISTRATEUR

from sqlalchemy import func, extract

# @app.route('/dashboard/<code_controlleur>')
# def dashboard(code_controlleur):
#     current_month = datetime.now().month  # Mars = 3
#     current_year = datetime.now().year   # 2025

#     # 1. Nombre d'agents attribués
#     nb_agents = db.session.query(Agent_Controlleur).filter_by(code_controlleur=code_controlleur).count()

#     # 2. Détails des agents et leurs carnets
#     agents = (
#         db.session.query(Agent, func.count(Carnet.id_carnet).label('nb_carnets'))
#         .join(Agent_Controlleur, Agent.code_agent == Agent_Controlleur.code_agent)
#         .outerjoin(Carnet, Agent.code_agent == Carnet.code_agent)
#         .filter(Agent_Controlleur.code_controlleur == code_controlleur)
#         .group_by(Agent.code_agent)
#         .all()
#     )

#     agent_details = {}
#     for agent, nb_carnets in agents:
#         carnets = (
#             db.session.query(Carnet, func.count(PointCollecte.code_point_collecte).label('nb_points'))
#             .outerjoin(PointCollecte, Carnet.id_carnet == PointCollecte.id_carnet)
#             .filter(Carnet.code_agent == agent.code_agent)
#             .group_by(Carnet.id_carnet)
#             .all()
#         )
#         carnet_details = []
#         for carnet, nb_points in carnets:
#             points = (
#                 db.session.query(PointCollecte, func.count(PointCollecteProduit.code_produit).label('nb_produits'))
#                 .outerjoin(PointCollecteProduit, PointCollecte.code_point_collecte == PointCollecteProduit.code_point_collecte)
#                 .filter(PointCollecte.id_carnet == carnet.id_carnet)
#                 .group_by(PointCollecte.code_point_collecte)
#                 .all()
#             )
#             carnet_details.append({'carnet': carnet, 'nb_points': nb_points, 'points': points})
#         agent_details[agent] = {'nb_carnets': nb_carnets, 'carnets': carnet_details}

#     # 3. Statut des points de collecte (pour graphique en donut)
#     statuts = (
#         db.session.query(Prix.statut, func.count(Prix.id_prix).label('nb'))
#         .join(Passage, Prix.id_passage == Passage.id_passage)
#         .join(PointCollecte, Passage.code_point_collecte == PointCollecte.code_point_collecte)
#         .join(Carnet, PointCollecte.id_carnet == Carnet.id_carnet)
#         .join(Agent, Carnet.code_agent == Agent.code_agent)
#         .join(Agent_Controlleur, Agent.code_agent == Agent_Controlleur.code_agent)
#         .filter(
#             Agent_Controlleur.code_controlleur == code_controlleur,
#             extract('month', Prix.date_passage) == current_month,
#             extract('year', Prix.date_passage) == current_year
#         )
#         .group_by(Prix.statut)
#         .all()
#     )
#     statut_counts = {statut or 'Non traité': nb for statut, nb in statuts}
#     statut_labels = ['Validé', 'Rejeté', 'Ajusté', 'Non traité']
#     statut_data = [
#         statut_counts.get('Valider', 0),
#         statut_counts.get('Rejeter', 0),
#         statut_counts.get('Ajuster', 0),
#         statut_counts.get('Non traité', 0)
#     ]

#     # 4. Points de collecte sans prix
#     points_sans_prix = (
#         db.session.query(PointCollecte, Carnet.nom_carnet)
#         .join(Carnet, PointCollecte.id_carnet == Carnet.id_carnet)
#         .join(Agent, Carnet.code_agent == Agent.code_agent)
#         .join(Agent_Controlleur, Agent.code_agent == Agent_Controlleur.code_agent)
#         .outerjoin(Passage, PointCollecte.code_point_collecte == Passage.code_point_collecte)
#         .outerjoin(Prix, Passage.id_passage == Prix.id_prix)
#         .filter(
#             Agent_Controlleur.code_controlleur == code_controlleur,
#             (Prix.id_prix == None) |
#             (extract('month', Prix.date_passage) != current_month) |
#             (extract('year', Prix.date_passage) != current_year)
#         )
#         .distinct()
#         .all()
#     )

#     # 5. Carnets avec au moins un prix
#     carnets_avec_prix = (
#         db.session.query(Carnet)
#         .join(PointCollecte, Carnet.id_carnet == PointCollecte.id_carnet)
#         .join(Passage, PointCollecte.code_point_collecte == Passage.code_point_collecte)
#         .join(Prix, Passage.id_passage == Prix.id_passage)
#         .join(Agent, Carnet.code_agent == Agent.code_agent)
#         .join(Agent_Controlleur, Agent.code_agent == Agent_Controlleur.code_agent)
#         .filter(
#             Agent_Controlleur.code_controlleur == code_controlleur,
#             extract('month', Prix.date_passage) == current_month,
#             extract('year', Prix.date_passage) == current_year
#         )
#         .distinct()
#         .all()
#     )

#     # 6. Données pour graphique en barres : Nombre de points par agent
#     agents_points = (
#         db.session.query(Agent.nom_agent, func.count(PointCollecte.code_point_collecte).label('nb_points'))
#         .join(Agent_Controlleur, Agent.code_agent == Agent_Controlleur.code_agent)
#         .join(Carnet, Agent.code_agent == Carnet.code_agent)
#         .join(PointCollecte, Carnet.id_carnet == PointCollecte.id_carnet)
#         .filter(Agent_Controlleur.code_controlleur == code_controlleur)
#         .group_by(Agent.nom_agent)
#         .all()
#     )
#     agent_labels = [agent for agent, _ in agents_points]
#     agent_points_data = [nb_points for _, nb_points in agents_points]

#     total_points = (
#     db.session.query(func.count(PointCollecte.code_point_collecte))
#     .join(Carnet, PointCollecte.id_carnet == Carnet.id_carnet)
#     .join(Agent, Carnet.code_agent == Agent.code_agent)
#     .join(Agent_Controlleur, Agent.code_agent == Agent_Controlleur.code_agent)
#     .filter(Agent_Controlleur.code_controlleur == code_controlleur)
#     .scalar()
#     )
#     treated_points = sum(statut_counts.values())  # Nombre de points avec un statut
#     progression = (treated_points / total_points * 100) if total_points > 0 else 0

#     produits_par_type = (
#     db.session.query(Produit.type_produit, func.count(Prix.id_prix).label('nb'))
#     .join(Prix, Produit.code_produit == Prix.code_produit)
#     .join(Passage, Prix.id_passage == Passage.id_passage)
#     .join(PointCollecte, Passage.code_point_collecte == PointCollecte.code_point_collecte)
#     .join(Carnet, PointCollecte.id_carnet == Carnet.id_carnet)
#     .join(Agent, Carnet.code_agent == Agent.code_agent)
#     .join(Agent_Controlleur, Agent.code_agent == Agent_Controlleur.code_agent)
#     .filter(
#         Agent_Controlleur.code_controlleur == code_controlleur,
#         extract('month', Prix.date_passage) == current_month,
#         extract('year', Prix.date_passage) == current_year
#     )
#     .group_by(Produit.type_produit)
#     .all()
#     )
#     produit_labels = [type_produit for type_produit, _ in produits_par_type]
#     produit_data = [nb for _, nb in produits_par_type]

#     from datetime import timedelta
#     threshold_date = datetime.now() - timedelta(days=15)
#     points_en_retard = (
#         db.session.query(PointCollecte)
#         .join(Carnet, PointCollecte.id_carnet == Carnet.id_carnet)
#         .join(Agent, Carnet.code_agent == Agent.code_agent)
#         .join(Agent_Controlleur, Agent.code_agent == Agent_Controlleur.code_agent)
#         .outerjoin(Passage, PointCollecte.code_point_collecte == Passage.code_point_collecte)
#         .outerjoin(Prix, Passage.id_passage == Prix.id_prix)
#         .filter(
#             Agent_Controlleur.code_controlleur == code_controlleur,
#             (Prix.id_prix == None) |
#             (Prix.date_passage < threshold_date)
#         )
#         .distinct()
#         .count()
#     )

#     return render_template(
#         'dashboard.html',
#         nb_agents=nb_agents,
#         agent_details=agent_details,
#         statut_counts=statut_counts,
#         points_sans_prix=points_sans_prix,
#         carnets_avec_prix=carnets_avec_prix,
#         controlleur=code_controlleur,
#         statut_labels=statut_labels,
#         statut_data=statut_data,
#         agent_labels=agent_labels,
#         agent_points_data=agent_points_data,
#         progression=progression,
#         produit_labels=produit_labels,
#         produit_data=produit_data,
#         points_en_retard=points_en_retard
#     )





@app.route('/dashboard/<code_controlleur>', methods=['GET'])
def dashboard(code_controlleur):
    # Récupérer les années et mois distincts depuis la table Prix
    years = db.session.query(extract('year', Prix.date_passage).label('year')).distinct().all()
    available_years = sorted([int(year[0]) for year in years if year[0] is not None])
    
    months = db.session.query(extract('month', Prix.date_passage).label('month')).distinct().all()
    available_months = sorted([int(month[0]) for month in months if month[0] is not None])
    
    # Mois en texte pour affichage
    month_names = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ]

    # Récupérer les paramètres de l'URL ou utiliser la date la plus récente par défaut
    selected_year = int(request.args.get('year', available_years[-1] if available_years else datetime.now().year))
    selected_month = int(request.args.get('month', available_months[-1] if available_months else datetime.now().month))

    # Vérifier que les sélections sont valides
    if selected_year not in available_years:
        selected_year = available_years[-1] if available_years else datetime.now().year
    if selected_month not in available_months:
        selected_month = available_months[-1] if available_months else datetime.now().month

    # 1. Nombre d'agents attribués
    nb_agents = db.session.query(Agent_Controlleur).filter_by(code_controlleur=code_controlleur).count()

    # 2. Détails des agents et leurs carnets
    agents = (
        db.session.query(Agent, func.count(Carnet.id_carnet).label('nb_carnets'))
        .join(Agent_Controlleur, Agent.code_agent == Agent_Controlleur.code_agent)
        .outerjoin(Carnet, Agent.code_agent == Carnet.code_agent)
        .filter(Agent_Controlleur.code_controlleur == code_controlleur)
        .group_by(Agent.code_agent)
        .all()
    )

    agent_details = {}
    for agent, nb_carnets in agents:
        carnets = (
            db.session.query(Carnet, func.count(PointCollecte.code_point_collecte).label('nb_points'))
            .outerjoin(PointCollecte, Carnet.id_carnet == PointCollecte.id_carnet)
            .filter(Carnet.code_agent == agent.code_agent)
            .group_by(Carnet.id_carnet)
            .all()
        )
        carnet_details = []
        for carnet, nb_points in carnets:
            points = (
                db.session.query(PointCollecte, func.count(PointCollecteProduit.code_produit).label('nb_produits'))
                .outerjoin(PointCollecteProduit, PointCollecte.code_point_collecte == PointCollecteProduit.code_point_collecte)
                .filter(PointCollecte.id_carnet == carnet.id_carnet)
                .group_by(PointCollecte.code_point_collecte)
                .all()
            )
            carnet_details.append({'carnet': carnet, 'nb_points': nb_points, 'points': points})
        agent_details[agent] = {'nb_carnets': nb_carnets, 'carnets': carnet_details}

    # 3. Statut des points de collecte (pour graphique en donut)
    statuts = (
        db.session.query(Prix.statut, func.count(Prix.id_prix).label('nb'))
        .join(Passage, Prix.id_passage == Passage.id_passage)
        .join(PointCollecte, Passage.code_point_collecte == PointCollecte.code_point_collecte)
        .join(Carnet, PointCollecte.id_carnet == Carnet.id_carnet)
        .join(Agent, Carnet.code_agent == Agent.code_agent)
        .join(Agent_Controlleur, Agent.code_agent == Agent_Controlleur.code_agent)
        .filter(
            Agent_Controlleur.code_controlleur == code_controlleur,
            extract('month', Prix.date_passage) == selected_month,
            extract('year', Prix.date_passage) == selected_year
        )
        .group_by(Prix.statut)
        .all()
    )
    statut_counts = {statut or 'Non traité': nb for statut, nb in statuts}
    statut_labels = ['Validé', 'Rejeté', 'Ajusté', 'Non traité']
    statut_data = [
        statut_counts.get('Valider', 0),
        statut_counts.get('Rejeter', 0),
        statut_counts.get('Ajuster', 0),
        statut_counts.get('Non traité', 0)
    ]

    # 4. Points de collecte sans prix
    points_sans_prix = (
        db.session.query(PointCollecte, Carnet.nom_carnet)
        .join(Carnet, PointCollecte.id_carnet == Carnet.id_carnet)
        .join(Agent, Carnet.code_agent == Agent.code_agent)
        .join(Agent_Controlleur, Agent.code_agent == Agent_Controlleur.code_agent)
        .outerjoin(Passage, PointCollecte.code_point_collecte == Passage.code_point_collecte)
        .outerjoin(Prix, Passage.id_passage == Prix.id_prix)
        .filter(
            Agent_Controlleur.code_controlleur == code_controlleur,
            (Prix.id_prix == None) |
            (extract('month', Prix.date_passage) != selected_month) |
            (extract('year', Prix.date_passage) != selected_year)
        )
        .distinct()
        .all()
    )

    # 5. Carnets avec au moins un prix
    carnets_avec_prix = (
        db.session.query(Carnet)
        .join(PointCollecte, Carnet.id_carnet == PointCollecte.id_carnet)
        .join(Passage, PointCollecte.code_point_collecte == Passage.code_point_collecte)
        .join(Prix, Passage.id_passage == Prix.id_passage)
        .join(Agent, Carnet.code_agent == Agent.code_agent)
        .join(Agent_Controlleur, Agent.code_agent == Agent_Controlleur.code_agent)
        .filter(
            Agent_Controlleur.code_controlleur == code_controlleur,
            extract('month', Prix.date_passage) == selected_month,
            extract('year', Prix.date_passage) == selected_year
        )
        .distinct()
        .all()
    )

    # 6. Données pour graphique en barres : Nombre de points par agent
    agents_points = (
        db.session.query(Agent.nom_agent, func.count(PointCollecte.code_point_collecte).label('nb_points'))
        .join(Agent_Controlleur, Agent.code_agent == Agent_Controlleur.code_agent)
        .join(Carnet, Agent.code_agent == Carnet.code_agent)
        .join(PointCollecte, Carnet.id_carnet == PointCollecte.id_carnet)
        .filter(Agent_Controlleur.code_controlleur == code_controlleur)
        .group_by(Agent.nom_agent)
        .all()
    )
    agent_labels = [agent for agent, _ in agents_points]
    agent_points_data = [nb_points for _, nb_points in agents_points]

    # Progression
    total_points = (
        db.session.query(func.count(PointCollecte.code_point_collecte))
        .join(Carnet, PointCollecte.id_carnet == Carnet.id_carnet)
        .join(Agent, Carnet.code_agent == Agent.code_agent)
        .join(Agent_Controlleur, Agent.code_agent == Agent_Controlleur.code_agent)
        .filter(Agent_Controlleur.code_controlleur == code_controlleur)
        .scalar()
    )
    treated_points = sum(statut_counts.values())
    progression = (treated_points / total_points * 100) if total_points > 0 else 0

    # Produits par type
    produits_par_type = (
        db.session.query(Produit.type_produit, func.count(Prix.id_prix).label('nb'))
        .join(Prix, Produit.code_produit == Prix.code_produit)
        .join(Passage, Prix.id_passage == Passage.id_passage)
        .join(PointCollecte, Passage.code_point_collecte == PointCollecte.code_point_collecte)
        .join(Carnet, PointCollecte.id_carnet == Carnet.id_carnet)
        .join(Agent, Carnet.code_agent == Agent.code_agent)
        .join(Agent_Controlleur, Agent.code_agent == Agent_Controlleur.code_agent)
        .filter(
            Agent_Controlleur.code_controlleur == code_controlleur,
            extract('month', Prix.date_passage) == selected_month,
            extract('year', Prix.date_passage) == selected_year
        )
        .group_by(Produit.type_produit)
        .all()
    )
    produit_labels = [type_produit if type_produit else 'Non spécifié' for type_produit, _ in produits_par_type]
    produit_data = [nb for _, nb in produits_par_type] if produits_par_type else [0]

    # Points en retard
    from datetime import timedelta
    threshold_date = datetime.now() - timedelta(days=15)
    points_en_retard = (
        db.session.query(PointCollecte)
        .join(Carnet, PointCollecte.id_carnet == Carnet.id_carnet)
        .join(Agent, Carnet.code_agent == Agent.code_agent)
        .join(Agent_Controlleur, Agent.code_agent == Agent_Controlleur.code_agent)
        .outerjoin(Passage, PointCollecte.code_point_collecte == Passage.code_point_collecte)
        .outerjoin(Prix, Passage.id_passage == Prix.id_prix)
        .filter(
            Agent_Controlleur.code_controlleur == code_controlleur,
            (Prix.id_prix == None) |
            (Prix.date_passage < threshold_date)
        )
        .distinct()
        .count()
    )

    return render_template(
        'dashboard.html',
        nb_agents=nb_agents,
        agent_details=agent_details,
        statut_counts=statut_counts,
        points_sans_prix=points_sans_prix,
        carnets_avec_prix=carnets_avec_prix,
        controlleur=code_controlleur,
        statut_labels=statut_labels,
        statut_data=statut_data,
        agent_labels=agent_labels,
        agent_points_data=agent_points_data,
        progression=progression,
        produit_labels=produit_labels,
        produit_data=produit_data,
        points_en_retard=points_en_retard,
        available_years=available_years,
        available_months=available_months,
        month_names=month_names,
        selected_year=selected_year,
        selected_month=selected_month
    )



from flask import jsonify, session
from sqlalchemy import distinct, extract


# Route pour récupérer les villes des agents contrôlés par le contrôleur connecté
# Route pour récupérer les villes des agents contrôlés par le contrôleur connecté
@app.route('/get_controlled_cities', methods=['GET'])
def get_controlled_cities():
    if 'user_id' not in session:
        return jsonify({'error': 'Utilisateur non connecté'}), 401
    
    user_id = session['user_id']
    is_controlleur = session.get('is_controlleur', False)
    
    if is_controlleur:
        # Si c'est un contrôleur, récupérer les villes des agents qu'il contrôle
        controlled_agents = Agent_Controlleur.query.filter_by(code_controlleur=user_id).all()
        agent_codes = [ac.code_agent for ac in controlled_agents]
        agents = Agent.query.filter(Agent.code_agent.in_(agent_codes)).all()
        ville_ids = [agent.id_ville for agent in agents if agent.id_ville]
        villes = Ville.query.filter(Ville.id_ville.in_(ville_ids)).all()
    else:
        # Si c'est un agent, récupérer uniquement sa ville
        agent = Agent.query.filter_by(code_agent=user_id).first()
        villes = [agent.ville] if agent and agent.ville else []

    # Retourner la liste des villes avec la première comme défaut
    villes_data = [{'id_ville': ville.id_ville, 'nom_ville': ville.nom_ville} for ville in villes]
    default_city = villes_data[0] if villes_data else None  # Première ville par défaut
    return jsonify({'cities': villes_data, 'default_city': default_city})


# Route pour récupérer les mois et années distincts de la table Prix
@app.route('/get_price_dates', methods=['GET'])
def get_price_dates():
    if 'user_id' not in session:
        return jsonify({'error': 'Utilisateur non connecté'}), 401
    
    selected_year = request.args.get('year')
    
    # Récupérer les années distinctes
    years = db.session.query(distinct(extract('year', Prix.date_passage)).label('year')).all()
    years = sorted([int(y[0]) for y in years if y[0]], reverse=True)
    
    # Récupérer les mois distincts pour l'année spécifiée ou la plus récente
    target_year = int(selected_year) if selected_year else (years[0] if years else None)
    months = db.session.query(distinct(extract('month', Prix.date_passage)).label('month')).filter(
        extract('year', Prix.date_passage) == target_year
    ).all()
    months = sorted([int(m[0]) for m in months if m[0]], reverse=True)
    
    mois_noms = [
        "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
        "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    ]
    
    months_data = [{'value': f"{m:02d}", 'label': mois_noms[m-1]} for m in months]
    
    return jsonify({
        'years': years,
        'months': months_data,
        'default_year': years[0] if years else None,
        'default_month': f"{months[0]:02d}" if months else None
    })

from flask import jsonify, session, render_template
from sqlalchemy import distinct, extract


@app.route('/get_controller_stats', methods=['GET'])
def get_controller_stats():
    if 'user_id' not in session:
        return jsonify({'error': 'Utilisateur non connecté'}), 401
    
    user_id = session['user_id']
    is_controlleur = session.get('is_controlleur', False)
    
    if not is_controlleur:
        return jsonify({'error': 'Utilisateur non autorisé'}), 403
    
    # Récupérer les paramètres de la requête
    ville_id = request.args.get('ville_id')
    month = request.args.get('month')
    year = request.args.get('year')
    
    if not all([ville_id, month, year]):
        return jsonify({'error': 'Paramètres manquants (ville_id, month, year)'}), 400
    
    # Récupérer les agents contrôlés par le contrôleur
    controlled_agents = Agent_Controlleur.query.filter_by(code_controlleur=user_id).all()
    agent_codes = [ac.code_agent for ac in controlled_agents]
    agents = Agent.query.filter(Agent.code_agent.in_(agent_codes)).filter_by(id_ville=ville_id).all()
    
    if not agents:
        return jsonify({
            'total_points': 0,
            'points_with_price': 0,
            'points_rejeter': 0,
            'points_ajuster': 0,
            'points_valider': 0
        })
    
    # Récupérer tous les carnets des agents
    carnets = Carnet.query.filter(Carnet.code_agent.in_(agent_codes)).all()
    carnet_ids = [carnet.id_carnet for carnet in carnets]
    
    # 1. Calculer le nombre total de points de collecte
    total_points = PointCollecte.query.filter(PointCollecte.id_carnet.in_(carnet_ids)).count()
    
    # 2. Calculer le nombre de points de collecte ayant un prix (points_with_price)
    points_with_price = (
        db.session.query(PointCollecte)
        .join(Passage, Passage.code_point_collecte == PointCollecte.code_point_collecte, isouter=True)
        .join(Prix, Prix.id_passage == Passage.id_passage, isouter=True)
        .filter(PointCollecte.id_carnet.in_(carnet_ids))
        .filter(
            (extract('month', Prix.date_passage) == int(month)) &
            (extract('year', Prix.date_passage) == int(year))
        )
        .distinct(PointCollecte.code_point_collecte)
        .count()
    )
    
    # 3. Calculer les points par statut (Rejeter, Ajuster, Valider)
    points_by_status = {
        'Rejeter': 0,
        'Ajuster': 0,
        'Valider': 0
    }
    
    points_with_status = (
        db.session.query(PointCollecte, Prix.statut)
        .join(Passage, Passage.code_point_collecte == PointCollecte.code_point_collecte, isouter=True)
        .join(Prix, Prix.id_passage == Passage.id_passage, isouter=True)
        .filter(PointCollecte.id_carnet.in_(carnet_ids))
        .filter(
            (extract('month', Prix.date_passage) == int(month)) &
            (extract('year', Prix.date_passage) == int(year))
        )
        .distinct(PointCollecte.code_point_collecte)
        .all()
    )
    
    for _, statut in points_with_status:
        if statut in points_by_status:
            points_by_status[statut] += 1
    
    # Retourner les statistiques
    stats = {
        'total_points': total_points,
        'points_with_price': points_with_price,
        'points_rejeter': points_by_status['Rejeter'],
        'points_ajuster': points_by_status['Ajuster'],
        'points_valider': points_by_status['Valider']
    }
    
    return jsonify(stats)




@app.route('/get_agent_progress', methods=['GET'])
def get_agent_progress():
    if 'user_id' not in session:
        return jsonify({'error': 'Utilisateur non connecté'}), 401
    
    user_id = session['user_id']
    is_controlleur = session.get('is_controlleur', False)
    
    ville_id = request.args.get('ville_id')
    month = request.args.get('month')
    year = request.args.get('year')
    
    if not all([ville_id, month, year]):
        return jsonify({'error': 'Paramètres manquants (ville_id, month, year)'}), 400
    
    if is_controlleur:
        controlled_agents = Agent_Controlleur.query.filter_by(code_controlleur=user_id).all()
        agent_codes = [ac.code_agent for ac in controlled_agents]
        agents = Agent.query.filter(Agent.code_agent.in_(agent_codes)).filter_by(id_ville=ville_id).all()
    else:
        agents = Agent.query.filter_by(code_agent=user_id, id_ville=ville_id).all()
    
    agent_progress = []
    for agent in agents:
        carnets = Carnet.query.filter_by(code_agent=agent.code_agent).all()
        total_points = 0
        completed_points = 0
        points_by_status = {'Valider': 0, 'Rejeter': 0, 'ajuster': 0, 'null': 0}
        
        # Récupérer tous les points de collecte pour cet agent
        all_points = []
        for carnet in carnets:
            points = PointCollecte.query.filter_by(id_carnet=carnet.id_carnet).all()
            all_points.extend(points)
            total_points += len(points)
        
        # Récupérer les points de collecte avec des prix pour le mois et l'année sélectionnés
        completed_point_ids = set()
        points_with_status = (
            db.session.query(PointCollecte, Prix.statut)
            .join(Passage, Passage.code_point_collecte == PointCollecte.code_point_collecte, isouter=True)
            .join(Prix, Prix.id_passage == Passage.id_passage, isouter=True)
            .filter(PointCollecte.id_carnet.in_([carnet.id_carnet for carnet in carnets]))
            .filter(
                (extract('month', Prix.date_passage) == int(month)) &
                (extract('year', Prix.date_passage) == int(year))
            )
            .distinct(PointCollecte.code_point_collecte)
            .all()
        )
        
        for point, statut in points_with_status:
            completed_point_ids.add(point.code_point_collecte)
            if statut == 'Valider':
                points_by_status['Valider'] += 1
            elif statut == 'Rejeter':
                points_by_status['Rejeter'] += 1
            elif statut == 'Ajuster':
                points_by_status['ajuster'] += 1
            else:
                points_by_status['null'] += 1
        
        # Calculer les points restants (ceux qui n'ont pas de statut)
        remaining_points = (
            PointCollecte.query
            .filter(PointCollecte.id_carnet.in_([carnet.id_carnet for carnet in carnets]))
            .filter(~PointCollecte.code_point_collecte.in_(completed_point_ids))
            .count()
        )
        
        completed_points = sum(points_by_status.values())
        progress = (completed_points / total_points * 100) if total_points > 0 else 0
        
        progress_by_status = {
            'Valider': (points_by_status['Valider'] / total_points * 100) if total_points > 0 else 0,
            'Rejeter': (points_by_status['Rejeter'] / total_points * 100) if total_points > 0 else 0,
            'ajuster': (points_by_status['ajuster'] / total_points * 100) if total_points > 0 else 0,
            'null': (points_by_status['null'] / total_points * 100) if total_points > 0 else 0,
            'remaining': (remaining_points / total_points * 100) if total_points > 0 else 0
        }
        
        agent_progress.append({
            'nom_agent': agent.nom_agent,
            'total_points': total_points,
            'completed_points': completed_points,
            'remaining_points': remaining_points,  # Ajouter les points restants
            'progress': round(progress, 2),
            'points_by_status': points_by_status,
            'progress_by_status': progress_by_status
        })
    
    return jsonify(agent_progress)


# Route mise à jour pour retourner une structure hiérarchique avec les points par statut et les points restants
@app.route('/get_carnet_progress', methods=['GET'])
def get_carnet_progress():
    if 'user_id' not in session:
        return jsonify({'error': 'Utilisateur non connecté'}), 401
    
    user_id = session['user_id']
    is_controlleur = session.get('is_controlleur', False)
    
    # Récupérer les paramètres de la requête
    ville_id = request.args.get('ville_id')
    month = request.args.get('month')
    year = request.args.get('year')
    
    if not all([ville_id, month, year]):
        return jsonify({'error': 'Paramètres manquants (ville_id, month, year)'}), 400
    
    # Si c'est un contrôleur, récupérer ses agents
    if is_controlleur:
        controlled_agents = Agent_Controlleur.query.filter_by(code_controlleur=user_id).all()
        agent_codes = [ac.code_agent for ac in controlled_agents]
        agents = Agent.query.filter(Agent.code_agent.in_(agent_codes)).filter_by(id_ville=ville_id).all()
    else:
        # Si c'est un agent, ne récupérer que lui-même
        agents = Agent.query.filter_by(code_agent=user_id, id_ville=ville_id).all()
    
    # Préparer les données des agents avec leurs carnets
    agent_carnet_progress = []
    for agent in agents:
        carnets = Carnet.query.filter_by(code_agent=agent.code_agent).all()
        carnets_data = []
        
        for carnet in carnets:
            # Récupérer tous les points de collecte associés au carnet
            total_points = PointCollecte.query.filter_by(id_carnet=carnet.id_carnet).count()
            
            # Récupérer les points de collecte avec des prix pour le mois et l'année sélectionnés, par statut
            points_by_status = {
                'Valider': 0,
                'Rejeter': 0,
                'ajuster': 0,
                'null': 0
            }
            
            # Récupérer les points de collecte distincts avec leurs statuts
            points_with_status = (
                db.session.query(PointCollecte, Prix.statut)
                .join(Passage, Passage.code_point_collecte == PointCollecte.code_point_collecte, isouter=True)
                .join(Prix, Prix.id_passage == Passage.id_passage, isouter=True)
                .filter(PointCollecte.id_carnet == carnet.id_carnet)
                .filter(
                    (extract('month', Prix.date_passage) == int(month)) &
                    (extract('year', Prix.date_passage) == int(year))
                )
                .distinct(PointCollecte.code_point_collecte)
                .all()
            )
            
            # Compter les points par statut
            completed_point_ids = set()  # Garder une trace des points complétés
            for point, statut in points_with_status:
                completed_point_ids.add(point.code_point_collecte)
                if statut == 'Valider':
                    points_by_status['Valider'] += 1
                elif statut == 'Rejeter':
                    points_by_status['Rejeter'] += 1
                elif statut == 'Ajuster':
                    points_by_status['ajuster'] += 1
                else:  # Si statut est null ou autre
                    points_by_status['null'] += 1
            
            # Calculer les points restants (ceux qui n'ont pas de statut)
            remaining_points = (
                PointCollecte.query
                .filter_by(id_carnet=carnet.id_carnet)
                .filter(~PointCollecte.code_point_collecte.in_(completed_point_ids))
                .count()
            )
            
            # Calculer les pourcentages pour chaque statut
            progress_by_status = {
                'Valider': (points_by_status['Valider'] / total_points * 100) if total_points > 0 else 0,
                'Rejeter': (points_by_status['Rejeter'] / total_points * 100) if total_points > 0 else 0,
                'ajuster': (points_by_status['ajuster'] / total_points * 100) if total_points > 0 else 0,
                'null': (points_by_status['null'] / total_points * 100) if total_points > 0 else 0,
                'remaining': (remaining_points / total_points * 100) if total_points > 0 else 0
            }
            
            # Total des points complétés (tous statuts confondus)
            completed_points = sum(points_by_status.values())
            progress = (completed_points / total_points * 100) if total_points > 0 else 0
            
            carnets_data.append({
                'nom_carnet': carnet.nom_carnet,
                'total_points': total_points,
                'completed_points': completed_points,
                'remaining_points': remaining_points,  # Ajouter les points restants
                'progress': round(progress, 2),
                'points_by_status': points_by_status,
                'progress_by_status': progress_by_status
            })
        
        agent_carnet_progress.append({
            'nom_agent': agent.nom_agent,
            'carnets': carnets_data
        })
    
    return jsonify(agent_carnet_progress)


# @app.route('/get_controlled_points', methods=['GET'])
# def get_controlled_points():
#     if 'user_id' not in session:
#         return jsonify({'error': 'Utilisateur non connecté'}), 401
    
#     user_id = session['user_id']
#     is_controlleur = session.get('is_controlleur', False)
    
#     if not is_controlleur:
#         return jsonify({'error': 'Seuls les contrôleurs peuvent accéder à cette ressource'}), 403
    
#     # Récupérer les paramètres de la requête
#     ville_id = request.args.get('ville_id')
#     month = request.args.get('month')
#     year = request.args.get('year')
#     agent_code = request.args.get('agent_code')  # Optionnel
#     carnet_id = request.args.get('carnet_id')    # Optionnel
#     statut = request.args.get('statut')          # Optionnel ("Rejeter", "Valider", "Ajuster", "tout")
    
#     if not all([ville_id, month, year]):
#         return jsonify({'error': 'Paramètres manquants (ville_id, month, year)'}), 400
    
#     # Récupérer les agents contrôlés par le contrôleur
#     controlled_agents = Agent_Controlleur.query.filter_by(code_controlleur=user_id).all()
#     agent_codes = [ac.code_agent for ac in controlled_agents]
#     agents = Agent.query.filter(Agent.code_agent.in_(agent_codes)).filter_by(id_ville=ville_id).all()
    
#     # Filtrer les agents si un agent spécifique est sélectionné
#     if agent_code:
#         agents = [agent for agent in agents if agent.code_agent == agent_code]
    
#     # Préparer la liste des points de collecte
#     points_data = []
    
#     for agent in agents:
#         # Récupérer les carnets de l'agent
#         carnets = Carnet.query.filter_by(code_agent=agent.code_agent).all()
        
#         if carnet_id:
#             carnets = [carnet for carnet in carnets if str(carnet.id_carnet) == carnet_id]
        
#         for carnet in carnets:
#             # Récupérer les points de collecte associés au carnet
#             query = (
#                 db.session.query(PointCollecte, Prix.statut, db.func.count(Prix.code_produit).label('product_count'))
#                 .join(Passage, Passage.code_point_collecte == PointCollecte.code_point_collecte, isouter=True)
#                 .join(Prix, Prix.id_passage == Passage.id_passage, isouter=True)
#                 .filter(PointCollecte.id_carnet == carnet.id_carnet)
#                 .filter(
#                     (extract('month', Prix.date_passage) == int(month)) &
#                     (extract('year', Prix.date_passage) == int(year))
#                 )
#             )
            
#             # Appliquer le filtre par statut si spécifié
#             if statut and statut != 'tout':
#                 query = query.filter(Prix.statut == statut)
            
#             # Exécuter la requête et regrouper par point de collecte
#             points = query.group_by(PointCollecte.code_point_collecte, Prix.statut).all()
            
#             # Ajouter les points avec statut null ou sans passage si "tout" est sélectionné
#             if not statut or statut == 'tout':
#                 remaining_points = (
#                     PointCollecte.query
#                     .filter_by(id_carnet=carnet.id_carnet)
#                     .outerjoin(Passage, Passage.code_point_collecte == PointCollecte.code_point_collecte)
#                     .outerjoin(Prix, Prix.id_passage == Passage.id_passage)
#                     .filter(Prix.id_prix.is_(None))
#                     .all()
#                 )
#                 for point in remaining_points:
#                     product_count = PointCollecteProduit.query.filter_by(code_point_collecte=point.code_point_collecte).count()
#                     points_data.append({
#                         'code_point_collecte': point.code_point_collecte,
#                         'nom_point_collecte': point.nom_point_collecte,
#                         'statut': None,  # Null pour les points sans statut
#                         'product_count': product_count,
#                         'agent': agent.nom_agent,
#                         'carnet': carnet.nom_carnet
#                     })
            
#             # Ajouter les points trouvés avec leurs statuts
#             for point, statut_value, product_count in points:
#                 points_data.append({
#                     'code_point_collecte': point.code_point_collecte,
#                     'nom_point_collecte': point.nom_point_collecte,
#                     'statut': statut_value,
#                     'product_count': product_count,
#                     'agent': agent.nom_agent,
#                     'carnet': carnet.nom_carnet
#                 })
    
#     return jsonify(points_data)


# @app.route('/get_collection_points', methods=['GET'])
# def get_collection_points():
#     if 'user_id' not in session:
#         return jsonify({'error': 'Utilisateur non connecté'}), 401

#     user_id = session['user_id']
#     is_controlleur = session.get('is_controlleur', False)
#     selected_city = request.args.get('city')  # Récupérer la ville sélectionnée

#     if not is_controlleur:
#         return jsonify({'error': 'Utilisateur non autorisé'}), 403

#     # Récupérer les agents contrôlés par le contrôleur connecté
#     controlled_agents = Agent_Controlleur.query.filter_by(code_controlleur=user_id).all()
#     agent_codes = [ac.code_agent for ac in controlled_agents]

#     # Construire la requête pour les points de collecte
#     query = db.session.query(PointCollecte).join(Carnet).join(Agent).filter(
#         Agent.code_agent.in_(agent_codes)
#     )

#     # Filtrer par ville si une ville est sélectionnée
#     if selected_city:
#         query = query.filter(Agent.id_ville == selected_city)

#     points = query.all()

#     # Préparer les données pour le JSON
#     points_data = []
#     for point in points:
#         # Compter le nombre de produits associés au point de collecte
#         nb_produits = PointCollecteProduit.query.filter_by(code_point_collecte=point.code_point_collecte).count()

#         # Récupérer le statut le plus récent depuis la table Prix (si applicable)
#         dernier_prix = Prix.query.filter_by(code_produit=point.code_point_collecte).order_by(Prix.date_passage.desc()).first()
#         statut = dernier_prix.statut if dernier_prix else "Non défini"

#         points_data.append({
#             'code_point_collecte': point.code_point_collecte,
#             'nom_point_collecte': point.nom_point_collecte,
#             'nb_produits': nb_produits,
#             'statut': statut,
#             'agent': point.carnet.agent.nom_agent if point.carnet and point.carnet.agent else "Non assigné",
#             'carnet': point.carnet.nom_carnet if point.carnet else "Non assigné"
#         })

#     return jsonify({'points': points_data})


@app.route('/get_collection_points', methods=['GET'])
def get_collection_points():
    if 'user_id' not in session:
        return jsonify({'error': 'Utilisateur non connecté'}), 401

    user_id = session['user_id']
    is_controlleur = session.get('is_controlleur', False)
    selected_city = request.args.get('city')  # Ville sélectionnée
    selected_month = request.args.get('month')  # Mois sélectionné (ex: "03")
    selected_year = request.args.get('year')  # Année sélectionnée (ex: "2025")

    if not is_controlleur:
        return jsonify({'error': 'Utilisateur non autorisé'}), 403

    # Récupérer les agents contrôlés par le contrôleur connecté
    controlled_agents = Agent_Controlleur.query.filter_by(code_controlleur=user_id).all()
    agent_codes = [ac.code_agent for ac in controlled_agents]

    # Construire la requête pour les points de collecte
    query = db.session.query(PointCollecte).join(Carnet).join(Agent).filter(
        Agent.code_agent.in_(agent_codes)
    )

    # Filtrer par ville si une ville est sélectionnée
    if selected_city:
        query = query.filter(Agent.id_ville == selected_city)

    points = query.all()

    # Préparer les données pour le JSON
    points_data = []
    for point in points:
        # Compter le nombre de produits associés au point de collecte
        nb_produits = PointCollecteProduit.query.filter_by(code_point_collecte=point.code_point_collecte).count()

        # Récupérer le statut le plus récent depuis la table Prix pour la date choisie
        statut_query = Prix.query.join(Passage).filter(
            Passage.code_point_collecte == point.code_point_collecte
        )
        if selected_year and selected_month:
            statut_query = statut_query.filter(
                extract('year', Prix.date_passage) == int(selected_year),
                extract('month', Prix.date_passage) == int(selected_month)
            )
        dernier_prix = statut_query.order_by(Prix.date_passage.desc()).first()

        # Déterminer le statut
        if dernier_prix:
            statut = dernier_prix.statut if dernier_prix.statut else "Non traité"  # Si null, "Non traité"
        else:
            statut = "Non collecté"  # Pas d'enregistrement dans Prix

        points_data.append({
            'code_point_collecte': point.code_point_collecte,
            'nom_point_collecte': point.nom_point_collecte,
            'nb_produits': nb_produits,
            'statut': statut,
            'agent': point.carnet.agent.nom_agent if point.carnet and point.carnet.agent else "Non assigné",
            'carnet': point.carnet.nom_carnet if point.carnet else "Non assigné"
        })
    
    return jsonify({'points': points_data})


from datetime import datetime, timedelta
from sqlalchemy import extract

@app.route('/get_delayed_collection_points', methods=['GET'])
def get_delayed_collection_points():
    if 'user_id' not in session:
        return jsonify({'error': 'Utilisateur non connecté'}), 401

    user_id = session['user_id']
    is_controlleur = session.get('is_controlleur', False)

    if not is_controlleur:
        return jsonify({'error': 'Utilisateur non autorisé'}), 403

    # Date actuelle
    today = datetime.today().date()
    threshold_date = today - timedelta(days=5)  # 5 jours avant aujourd'hui

    # Récupérer les agents contrôlés par le contrôleur connecté
    controlled_agents = Agent_Controlleur.query.filter_by(code_controlleur=user_id).all()
    agent_codes = [ac.code_agent for ac in controlled_agents]

    # Requête pour les points de collecte avec statut "Ajuster" ou "Rejeter" en retard
    delayed_points = (
        db.session.query(PointCollecte, Prix)
        .join(Passage, Passage.code_point_collecte == PointCollecte.code_point_collecte)
        .join(Prix, Prix.id_passage == Passage.id_passage)
        .join(Carnet, Carnet.id_carnet == PointCollecte.id_carnet)
        .join(Agent, Agent.code_agent == Carnet.code_agent)
        .filter(
            Agent.code_agent.in_(agent_codes),
            Prix.statut.in_(['Ajuster', 'Rejeter']),
            Prix.date_passage <= threshold_date
        )
        .all()
    )

    # Préparer les données des alertes
    alerts = []
    for point, prix in delayed_points:
        days_delayed = (today - prix.date_passage).days
        message = f"Le point de collecte '{point.nom_point_collecte}' (Statut: {prix.statut}) attend un traitement depuis {days_delayed} jours."
        alerts.append({
            'code_point_collecte': point.code_point_collecte,
            'nom_point_collecte': point.nom_point_collecte,
            'statut': prix.statut,
            'date_passage': prix.date_passage.strftime('%Y-%m-%d'),
            'agent': point.carnet.agent.nom_agent if point.carnet and point.carnet.agent else "Non assigné",
            'carnet': point.carnet.nom_carnet if point.carnet else "Non assigné",
            'message': message
        })

    return jsonify({'alerts': alerts})





from flask import jsonify, session
from datetime import datetime
from sqlalchemy import extract

@app.route('/get_agent_carnet_progress', methods=['GET'])
def get_agent_carnet_progress():
    if 'user_id' not in session:
        return jsonify({'error': 'Utilisateur non connecté'}), 401
    
    user_id = session['user_id']
    is_controlleur = session.get('is_controlleur', False)
    
    if is_controlleur:
        return jsonify({'error': 'Cette route est réservée aux agents'}), 403
    
    # Obtenir le mois et l'année actuels
    current_month = datetime.now().month
    current_year = datetime.now().year
    
    # Récupérer l'agent connecté
    agent = Agent.query.filter_by(code_agent=user_id).first()
    if not agent:
        return jsonify({'error': 'Agent non trouvé'}), 404
    
    # Récupérer tous les carnets de l'agent
    carnets = Carnet.query.filter_by(code_agent=agent.code_agent).all()
    carnets_data = []
    
    for carnet in carnets:
        # Récupérer tous les passages associés au carnet
        passages = Passage.query.filter_by(id_carnet=carnet.id_carnet).all()
        passage_ids = [p.id_passage for p in passages]
        
        # Récupérer tous les relevés associés aux passages
        total_points = Releve.query.filter(Releve.id_passage.in_(passage_ids)).count()
        
        # Récupérer les relevés avec leurs statuts pour le mois et l'année actuels
        points_by_status = {
            'Valider': 0,
            'Rejeter': 0,
            'ajuster': 0,
            'null': 0
        }
        
        points_with_status = (
            db.session.query(Releve, Prix.statut)
            .join(Prix, Prix.id_releve == Releve.id_releve, isouter=True)
            .filter(Releve.id_passage.in_(passage_ids))
            .filter(
                (extract('month', Prix.date_passage) == current_month) &
                (extract('year', Prix.date_passage) == current_year)
            )
            .distinct(Releve.id_releve)
            .all()
        )
        
        # Compter les points par statut
        completed_point_ids = set()
        for releve, statut in points_with_status:
            completed_point_ids.add(releve.id_releve)
            if statut == 'Valider':
                points_by_status['Valider'] += 1
            elif statut == 'Rejeter':
                points_by_status['Rejeter'] += 1
            elif statut == 'Ajuster':
                points_by_status['ajuster'] += 1
            else:
                points_by_status['null'] += 1
        
        # Calculer les points restants (relevés sans prix)
        remaining_points = (
            Releve.query
            .filter(Releve.id_passage.in_(passage_ids))
            .filter(~Releve.id_releve.in_(completed_point_ids))
            .count()
        )
        
        # Calculer les pourcentages pour chaque statut
        progress_by_status = {
            'Valider': (points_by_status['Valider'] / total_points * 100) if total_points > 0 else 0,
            'Rejeter': (points_by_status['Rejeter'] / total_points * 100) if total_points > 0 else 0,
            'ajuster': (points_by_status['ajuster'] / total_points * 100) if total_points > 0 else 0,
            'null': (points_by_status['null'] / total_points * 100) if total_points > 0 else 0,
            'remaining': (remaining_points / total_points * 100) if total_points > 0 else 0
        }
        
        # Total des points complétés
        completed_points = sum(points_by_status.values())
        progress = (completed_points / total_points * 100) if total_points > 0 else 0
        
        carnets_data.append({
            'nom_carnet': carnet.nom_carnet,
            'total_points': total_points,
            'completed_points': completed_points,
            'remaining_points': remaining_points,
            'progress': round(progress, 2),
            'points_by_status': points_by_status,
            'progress_by_status': progress_by_status
        })
    
    return jsonify({
        'nom_agent': agent.nom_agent,
        'carnets': carnets_data
    })




if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)




# if __name__ == '__main__':
#     app.run(ssl_context=('cert.pem', 'key.pem'))
