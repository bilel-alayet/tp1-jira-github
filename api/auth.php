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

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    if (empty($data['email']) || empty($data['mot_de_passe'])) {
        http_response_code(400);
        echo json_encode(['erreur' => 'Email et mot de passe requis.']);
        exit;
    }

    try {
        $pdo = getDB();
        $stmt = $pdo->prepare(
            'SELECT id, nom, prenom, email, mot_de_passe, role FROM utilisateur WHERE email = ? AND est_actif = TRUE'
        );
        $stmt->execute([$data['email']]);
        $utilisateur = $stmt->fetch();

        if (!$utilisateur || !password_verify($data['mot_de_passe'], $utilisateur['mot_de_passe'])) {
            http_response_code(401);
            echo json_encode(['erreur' => 'Email ou mot de passe incorrect.']);
            exit;
        }

        $upd = $pdo->prepare('UPDATE utilisateur SET derniere_connexion = NOW() WHERE id = ?');
        $upd->execute([$utilisateur['id']]);

        $_SESSION['utilisateur'] = [
            'id'     => $utilisateur['id'],
            'nom'    => $utilisateur['nom'],
            'prenom' => $utilisateur['prenom'],
            'email'  => $utilisateur['email'],
            'role'   => $utilisateur['role'],
        ];

        echo json_encode($_SESSION['utilisateur']);
    } catch (PDOException $e) {
        error_log('auth.php PDOException: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['erreur' => 'Erreur serveur.']);
    }
    exit;
}

if ($method === 'DELETE') {
    session_destroy();
    echo json_encode(['message' => 'Déconnecté.']);
    exit;
}

http_response_code(405);
echo json_encode(['erreur' => 'Méthode non autorisée.']);
?>
