<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'config.php';
session_start();

if (empty($_SESSION['utilisateur'])) {
    http_response_code(401);
    echo json_encode(['erreur' => 'Non authentifié.']);
    exit;
}

$user   = $_SESSION['utilisateur'];
$method = $_SERVER['REQUEST_METHOD'];

try {
    $pdo = getDB();

    if ($method === 'GET') {
        $role = $user['role'];

        if ($role === 'etudiant') {
            $stmt = $pdo->prepare(
                'SELECT p.*, u.nom AS tuteur_nom, u.prenom AS tuteur_prenom
                 FROM projet p
                 LEFT JOIN utilisateur u ON u.id = p.id_tuteur
                 WHERE p.id_etudiant = ?
                 ORDER BY p.date_soumission DESC'
            );
            $stmt->execute([$user['id']]);
        } elseif ($role === 'tuteur') {
            $stmt = $pdo->prepare(
                'SELECT p.*, u.nom AS etudiant_nom, u.prenom AS etudiant_prenom
                 FROM projet p
                 JOIN utilisateur u ON u.id = p.id_etudiant
                 WHERE p.id_tuteur = ?
                 ORDER BY p.date_soumission DESC'
            );
            $stmt->execute([$user['id']]);
        } else {
            $stmt = $pdo->prepare(
                'SELECT p.*,
                        e.nom AS etudiant_nom, e.prenom AS etudiant_prenom,
                        t.nom AS tuteur_nom,   t.prenom AS tuteur_prenom
                 FROM projet p
                 JOIN utilisateur e ON e.id = p.id_etudiant
                 LEFT JOIN utilisateur t ON t.id = p.id_tuteur
                 ORDER BY p.date_soumission DESC'
            );
            $stmt->execute();
        }

        echo json_encode($stmt->fetchAll());
        exit;
    }

    if ($method === 'POST') {
        if ($user['role'] !== 'etudiant') {
            http_response_code(403);
            echo json_encode(['erreur' => 'Réservé aux étudiants.']);
            exit;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        if (empty($data['titre']) || empty($data['description'])) {
            http_response_code(400);
            echo json_encode(['erreur' => 'Titre et description requis.']);
            exit;
        }

        $type         = $data['type_projet']  ?? 'academique';
        $technologies = $data['technologies'] ?? null;
        $nomEntreprise = $data['nom_entreprise'] ?? null;

        $stmt = $pdo->prepare(
            'INSERT INTO projet (titre, description, type_projet, statut, technologies, nom_entreprise, id_etudiant)
             VALUES (?, ?, ?, \'propose\', ?, ?, ?)'
        );
        $stmt->execute([$data['titre'], $data['description'], $type, $technologies, $nomEntreprise, $user['id']]);
        $idProjet = $pdo->lastInsertId();

        // Notifier le coordinateur
        $coord = $pdo->prepare('SELECT id FROM utilisateur WHERE role = \'coordinateur\' AND est_actif = TRUE LIMIT 1');
        $coord->execute();
        $coordinateur = $coord->fetch();
        if ($coordinateur) {
            $notif = $pdo->prepare(
                'INSERT INTO notification (id_destinataire, message, type) VALUES (?, ?, \'info\')'
            );
            $notif->execute([
                $coordinateur['id'],
                'Nouveau projet soumis : ' . $data['titre'] . ' par ' . $user['prenom'] . ' ' . $user['nom'],
            ]);
        }

        http_response_code(201);
        echo json_encode(['id' => $idProjet, 'message' => 'Projet créé avec succès.']);
        exit;
    }

    if ($method === 'PUT') {
        if ($user['role'] !== 'coordinateur') {
            http_response_code(403);
            echo json_encode(['erreur' => 'Réservé au coordinateur.']);
            exit;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        if (empty($data['id'])) {
            http_response_code(400);
            echo json_encode(['erreur' => 'ID projet requis.']);
            exit;
        }

        $statutsValides = ['propose', 'valide', 'en_cours', 'soutenu', 'refuse'];
        if (!empty($data['statut']) && !in_array($data['statut'], $statutsValides, true)) {
            http_response_code(400);
            echo json_encode(['erreur' => 'Statut invalide.']);
            exit;
        }

        $setClauses = [];
        $params     = [];

        if (!empty($data['statut'])) {
            $setClauses[] = 'statut = ?';
            $params[]     = $data['statut'];
            if ($data['statut'] === 'valide') {
                $setClauses[] = 'date_validation = NOW()';
            }
        }

        if (array_key_exists('id_tuteur', $data)) {
            $setClauses[] = 'id_tuteur = ?';
            $params[]     = $data['id_tuteur'];
        }

        if (empty($setClauses)) {
            http_response_code(400);
            echo json_encode(['erreur' => 'Aucune modification fournie.']);
            exit;
        }

        $params[] = $data['id'];
        $stmt = $pdo->prepare('UPDATE projet SET ' . implode(', ', $setClauses) . ' WHERE id = ?');
        $stmt->execute($params);

        echo json_encode(['message' => 'Projet mis à jour.']);
        exit;
    }

    http_response_code(405);
    echo json_encode(['erreur' => 'Méthode non autorisée.']);
} catch (PDOException $e) {
    error_log('projets.php PDOException: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['erreur' => 'Erreur serveur.']);
}
?>
