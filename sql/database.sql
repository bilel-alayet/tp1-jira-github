CREATE DATABASE IF NOT EXISTS gestion_pfe CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE gestion_pfe;

CREATE TABLE utilisateur (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  mot_de_passe VARCHAR(255) NOT NULL,
  role ENUM('etudiant','tuteur','coordinateur','jury') NOT NULL,
  est_actif BOOLEAN DEFAULT TRUE,
  date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
  derniere_connexion DATETIME NULL
);

CREATE TABLE projet (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titre VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  type_projet ENUM('academique','entreprise') NOT NULL DEFAULT 'academique',
  statut ENUM('propose','valide','en_cours','soutenu','refuse') NOT NULL DEFAULT 'propose',
  technologies VARCHAR(300) NULL,
  nom_entreprise VARCHAR(200) NULL,
  date_soumission DATETIME DEFAULT CURRENT_TIMESTAMP,
  date_validation DATETIME NULL,
  id_etudiant INT NOT NULL,
  id_tuteur INT NULL,
  FOREIGN KEY (id_etudiant) REFERENCES utilisateur(id) ON DELETE CASCADE,
  FOREIGN KEY (id_tuteur) REFERENCES utilisateur(id) ON DELETE SET NULL
);

CREATE TABLE compte_rendu (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_projet INT NOT NULL,
  id_etudiant INT NOT NULL,
  titre VARCHAR(200) NOT NULL,
  contenu TEXT NOT NULL,
  statut ENUM('en_attente','valide','rejete') NOT NULL DEFAULT 'en_attente',
  commentaire_tuteur TEXT NULL,
  date_depot DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_projet) REFERENCES projet(id) ON DELETE CASCADE,
  FOREIGN KEY (id_etudiant) REFERENCES utilisateur(id) ON DELETE CASCADE
);

CREATE TABLE soutenance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_projet INT NOT NULL UNIQUE,
  date_soutenance DATE NOT NULL,
  heure TIME NOT NULL,
  lieu VARCHAR(200) NOT NULL,
  FOREIGN KEY (id_projet) REFERENCES projet(id) ON DELETE CASCADE
);

CREATE TABLE evaluation (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_projet INT NOT NULL,
  id_jury INT NOT NULL,
  note_rapport DECIMAL(4,2) NOT NULL,
  note_soutenance DECIMAL(4,2) NOT NULL,
  note_implication DECIMAL(4,2) NOT NULL,
  appreciation TEXT NULL,
  note_finale DECIMAL(4,2) GENERATED ALWAYS AS (ROUND((note_rapport * 0.40) + (note_soutenance * 0.40) + (note_implication * 0.20), 2)) STORED,
  date_evaluation DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_projet) REFERENCES projet(id) ON DELETE CASCADE,
  FOREIGN KEY (id_jury) REFERENCES utilisateur(id) ON DELETE CASCADE
);

CREATE TABLE notification (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_destinataire INT NOT NULL,
  message TEXT NOT NULL,
  type ENUM('info','succes','avertissement','erreur') DEFAULT 'info',
  est_lue BOOLEAN DEFAULT FALSE,
  date_envoi DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_destinataire) REFERENCES utilisateur(id) ON DELETE CASCADE
);
