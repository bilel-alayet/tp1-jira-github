USE gestion_pfe;

INSERT INTO utilisateur (nom, prenom, email, mot_de_passe, role) VALUES
('Benali',  'Ahmed',  'etudiant@univ.dz',     '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'etudiant'),
('Zohra',   'Fatima', 'etudiant2@univ.dz',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'etudiant'),
('Kadi',    'Youcef', 'etudiant3@univ.dz',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'etudiant'),
('Meziane', 'Sara',   'tuteur@univ.dz',       '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'tuteur'),
('Hadj',    'Karim',  'coordinateur@univ.dz', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'coordinateur'),
('Bensaid', 'Nadia',  'jury@univ.dz',         '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'jury');

INSERT INTO projet (titre, description, type_projet, statut, technologies, id_etudiant, id_tuteur) VALUES
('Application Mobile de Suivi des PFE', 'Développement d\'une application mobile permettant aux étudiants de suivre l\'avancement de leurs projets.', 'academique', 'valide', 'Flutter,Firebase,Dart', 1, 4),
('Système de Gestion des Absences', 'Plateforme web pour automatiser la gestion des absences des étudiants.', 'entreprise', 'en_cours', 'Django,React,PostgreSQL', 2, 4),
('IA pour la Détection de Plagiat', 'Outil basé sur l\'IA pour détecter le plagiat dans les rapports PFE.', 'academique', 'propose', 'Python,NLP,TensorFlow', 3, NULL);
