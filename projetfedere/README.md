# 🎓 Système de Gestion des PFE

Système d'information pour la gestion des Projets de Fin d'Études - Licence 3.

## 🚀 Installation

### Prérequis
- PHP 7.4+
- MySQL 8.0+
- Apache (XAMPP recommandé)

### Étapes
1. Cloner le dépôt dans `htdocs/` (XAMPP) ou `www/` (WAMP)
2. Ouvrir phpMyAdmin → importer `sql/database.sql`
3. Importer `sql/data_test.sql` pour les données de test
4. Configurer `api/config.php` avec vos identifiants MySQL
5. Ouvrir `http://localhost/projetfedere/index.htm`

## 🔑 Comptes de test (mot de passe : `1234`)

| Rôle | Email |
|------|-------|
| Étudiant | etudiant@univ.dz |
| Tuteur | tuteur@univ.dz |
| Coordinateur | coordinateur@univ.dz |
| Jury | jury@univ.dz |

## 📁 Structure
- `index.htm` — Interface principale
- `style.css` — Styles
- `app.js` — Logique frontend
- `api/` — Backend PHP (auth, projets, notifications)
- `sql/` — Scripts base de données
