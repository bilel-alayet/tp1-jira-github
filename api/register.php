<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['erreur' => 'Méthode non autorisée.']);
    exit;
}

require_once 'config.php';

$data = json_decode(file_get_contents('php://input'), true);

$prenom   = trim($data['prenom']   ?? '');
$nom      = trim($data['nom']      ?? '');
$email    = trim($data['email']    ?? '');
$role     = trim($data['role']     ?? '');
$password = $data['password'] ?? '';
$confirm  = $data['confirm']  ?? '';

if (empty($prenom) || empty($nom) || empty($email) || empty($role) || empty($password) || empty($confirm)) {
    http_response_code(400);
    echo json_encode(['erreur' => 'Tous les champs sont obligatoires.']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['erreur' => 'Adresse e-mail invalide.']);
    exit;
}

if (strlen($password) < 6) {
    http_response_code(400);
    echo json_encode(['erreur' => 'Le mot de passe doit contenir au moins 6 caractères.']);
    exit;
}

if ($password !== $confirm) {
    http_response_code(400);
    echo json_encode(['erreur' => 'Les mots de passe ne correspondent pas.']);
    exit;
}

$rolesAutorises = ['etudiant', 'tuteur', 'jury'];
if (!in_array($role, $rolesAutorises, true)) {
    http_response_code(400);
    echo json_encode(['erreur' => 'Rôle non autorisé.']);
    exit;
}

try {
    $pdo = getDB();

    $stmt = $pdo->prepare('SELECT id FROM utilisateur WHERE email = ?');
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(['erreur' => 'Cette adresse e-mail est déjà utilisée.']);
        exit;
    }

    $hashedPassword = password_hash($password, PASSWORD_BCRYPT);

    $stmt = $pdo->prepare(
        'INSERT INTO utilisateur (prenom, nom, email, mot_de_passe, role) VALUES (?, ?, ?, ?, ?)'
    );
    $stmt->execute([$prenom, $nom, $email, $hashedPassword, $role]);
    $userId = (int) $pdo->lastInsertId();

    session_start();
    $_SESSION['utilisateur'] = [
        'id'     => $userId,
        'nom'    => $nom,
        'prenom' => $prenom,
        'email'  => $email,
        'role'   => $role,
    ];

    echo json_encode([
        'succes'      => true,
        'message'     => 'Compte créé avec succès. Bienvenue !',
        'utilisateur' => $_SESSION['utilisateur'],
    ]);
} catch (PDOException $e) {
    error_log('register.php PDOException: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['erreur' => 'Erreur serveur.']);
}
?>
