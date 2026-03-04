<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, PUT, OPTIONS');
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
        $stmt = $pdo->prepare(
            'SELECT id, message, type, est_lue, date_envoi
             FROM notification
             WHERE id_destinataire = ? AND est_lue = FALSE
             ORDER BY date_envoi DESC
             LIMIT 10'
        );
        $stmt->execute([$user['id']]);
        echo json_encode($stmt->fetchAll());
        exit;
    }

    if ($method === 'PUT') {
        $data = json_decode(file_get_contents('php://input'), true);

        if (empty($data['id'])) {
            http_response_code(400);
            echo json_encode(['erreur' => 'ID notification requis.']);
            exit;
        }

        $stmt = $pdo->prepare(
            'UPDATE notification SET est_lue = TRUE WHERE id = ? AND id_destinataire = ?'
        );
        $stmt->execute([$data['id'], $user['id']]);
        echo json_encode(['message' => 'Notification marquée comme lue.']);
        exit;
    }

    http_response_code(405);
    echo json_encode(['erreur' => 'Méthode non autorisée.']);
} catch (PDOException $e) {
    error_log('notifications.php PDOException: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['erreur' => 'Erreur serveur.']);
}
?>
