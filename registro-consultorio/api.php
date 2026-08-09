<?php
/**
 * API para registro de nuevos consultorios
 * DR DESK - Sistema Multi-Consultorio
 */

// Configuración de errores y headers
error_reporting(E_ALL);
ini_set('display_errors', 0);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Manejar preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Solo permitir POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Método no permitido. Use POST.'
    ]);
    exit();
}

// =====================================================
// Configuración de la base de datos
// =====================================================
$DB_CONFIG = [
    'host' => 'localhost',
    'database' => 'drdesk',
    'username' => 'root',
    'password' => '',
    'charset' => 'utf8mb4'
];

// =====================================================
// Funciones auxiliares
// =====================================================

/**
 * Genera un UUID v4
 */
function generateUUID(): string {
    $data = random_bytes(16);
    $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
    $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}

/**
 * Genera un slug a partir del nombre
 */
function generateSlug(string $nombre): string {
    $slug = strtolower($nombre);
    // Reemplazar caracteres especiales
    $slug = preg_replace('/[áàäâã]/u', 'a', $slug);
    $slug = preg_replace('/[éèëê]/u', 'e', $slug);
    $slug = preg_replace('/[íìïî]/u', 'i', $slug);
    $slug = preg_replace('/[óòöôõ]/u', 'o', $slug);
    $slug = preg_replace('/[úùüû]/u', 'u', $slug);
    $slug = preg_replace('/[ñ]/u', 'n', $slug);
    // Solo letras, números y guiones
    $slug = preg_replace('/[^a-z0-9]+/', '-', $slug);
    // Eliminar guiones al inicio y final
    $slug = trim($slug, '-');
    // Agregar timestamp para hacerlo único
    return $slug . '-' . substr(time(), -6);
}

/**
 * Sanitiza una cadena de texto
 */
function sanitize(string $value): string {
    return trim(htmlspecialchars($value, ENT_QUOTES, 'UTF-8'));
}

/**
 * Valida formato de email
 */
function isValidEmail(string $email): bool {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

/**
 * Valida formato de teléfono (básico)
 */
function isValidPhone(string $phone): bool {
    $phone = preg_replace('/[\s\-\(\)]+/', '', $phone);
    return preg_match('/^\+?[0-9]{8,15}$/', $phone);
}

/**
 * Responde con JSON y termina la ejecución
 */
function respond(bool $success, string $message, array $data = [], int $statusCode = 200): void {
    http_response_code($statusCode);
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data' => $data
    ]);
    exit();
}

// =====================================================
// Conexión a la base de datos
// =====================================================
try {
    $pdo = new PDO(
        "mysql:host={$DB_CONFIG['host']};dbname={$DB_CONFIG['database']};charset={$DB_CONFIG['charset']}",
        $DB_CONFIG['username'],
        $DB_CONFIG['password'],
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    );
} catch (PDOException $e) {
    respond(false, 'Error de conexión a la base de datos', [], 500);
}

// =====================================================
// Obtener y validar datos del formulario
// =====================================================
$json = file_get_contents('php://input');
$data = json_decode($json, true);

if (!$data) {
    respond(false, 'Datos inválidos. Se esperaba JSON.', [], 400);
}

// Campos requeridos del consultorio (sin plan)
$requiredConsultorio = ['nombre', 'email'];
foreach ($requiredConsultorio as $field) {
    if (empty($data['consultorio'][$field])) {
        respond(false, "El campo '{$field}' del consultorio es requerido.", [], 400);
    }
}

// Campos requeridos del administrador
$requiredAdmin = ['nombre', 'apellidos', 'email', 'password'];
foreach ($requiredAdmin as $field) {
    if (empty($data['admin'][$field])) {
        respond(false, "El campo '{$field}' del administrador es requerido.", [], 400);
    }
}

// Extraer y sanitizar datos del consultorio (plan por defecto 'basico')
$consultorio = [
    'uuid' => generateUUID(),
    'nombre' => sanitize($data['consultorio']['nombre']),
    'email' => sanitize($data['consultorio']['email']),
    'telefono' => sanitize($data['consultorio']['telefono'] ?? ''),
    'direccion' => sanitize($data['consultorio']['direccion'] ?? ''),
    'ciudad' => sanitize($data['consultorio']['ciudad'] ?? ''),
    'estado' => sanitize($data['consultorio']['estado'] ?? ''),
    'codigo_postal' => sanitize($data['consultorio']['codigo_postal'] ?? ''),
    'plan' => 'basico'
];

// Generar slug único
$consultorio['slug'] = generateSlug($consultorio['nombre']);

// Extraer y sanitizar datos del administrador
$admin = [
    'uuid' => generateUUID(),
    'nombre' => sanitize($data['admin']['nombre']),
    'apellidos' => sanitize($data['admin']['apellidos']),
    'email' => sanitize($data['admin']['email']),
    'telefono' => sanitize($data['admin']['telefono'] ?? ''),
    'password' => $data['admin']['password'] // No sanitizar la contraseña
];

// =====================================================
// Validaciones adicionales
// =====================================================

// Validar emails
if (!isValidEmail($consultorio['email'])) {
    respond(false, 'El email del consultorio no es válido.', [], 400);
}

if (!isValidEmail($admin['email'])) {
    respond(false, 'El email del administrador no es válido.', [], 400);
}

// Validar teléfono solo si se proporciona
if (!empty($consultorio['telefono']) && !isValidPhone($consultorio['telefono'])) {
    respond(false, 'El teléfono del consultorio no es válido.', [], 400);
}

// Validar contraseña
if (strlen($admin['password']) < 8) {
    respond(false, 'La contraseña debe tener al menos 8 caracteres.', [], 400);
}

// =====================================================
// Verificar que el email del consultorio no exista
// =====================================================
$stmt = $pdo->prepare("SELECT id FROM consultorios WHERE email = ?");
$stmt->execute([$consultorio['email']]);
if ($stmt->fetch()) {
    respond(false, 'Ya existe un consultorio registrado con ese email.', [], 409);
}

// =====================================================
// Iniciar transacción
// =====================================================
try {
    $pdo->beginTransaction();

    // Insertar consultorio
    $stmtConsultorio = $pdo->prepare("
        INSERT INTO consultorios (
            uuid, nombre, slug, email, telefono, 
            direccion, ciudad, estado, codigo_postal, plan
        ) VALUES (
            :uuid, :nombre, :slug, :email, :telefono,
            :direccion, :ciudad, :estado, :codigo_postal, :plan
        )
    ");
    
    $stmtConsultorio->execute([
        ':uuid' => $consultorio['uuid'],
        ':nombre' => $consultorio['nombre'],
        ':slug' => $consultorio['slug'],
        ':email' => $consultorio['email'],
        ':telefono' => $consultorio['telefono'],
        ':direccion' => $consultorio['direccion'],
        ':ciudad' => $consultorio['ciudad'],
        ':estado' => $consultorio['estado'],
        ':codigo_postal' => $consultorio['codigo_postal'],
        ':plan' => $consultorio['plan']
    ]);

    $consultorioId = $pdo->lastInsertId();

    // Hash de la contraseña
    $passwordHash = password_hash($admin['password'], PASSWORD_BCRYPT, ['cost' => 12]);

    // Insertar usuario administrador
    $stmtAdmin = $pdo->prepare("
        INSERT INTO usuarios (
            consultorio_id, uuid, email, password_hash,
            nombre, apellidos, telefono, rol
        ) VALUES (
            :consultorio_id, :uuid, :email, :password_hash,
            :nombre, :apellidos, :telefono, 'admin'
        )
    ");

    $stmtAdmin->execute([
        ':consultorio_id' => $consultorioId,
        ':uuid' => $admin['uuid'],
        ':email' => $admin['email'],
        ':password_hash' => $passwordHash,
        ':nombre' => $admin['nombre'],
        ':apellidos' => $admin['apellidos'],
        ':telefono' => $admin['telefono']
    ]);

    // Confirmar transacción
    $pdo->commit();

    // Responder con éxito
    respond(true, 'Consultorio registrado exitosamente', [
        'consultorio' => [
            'uuid' => $consultorio['uuid'],
            'nombre' => $consultorio['nombre'],
            'slug' => $consultorio['slug'],
            'email' => $consultorio['email'],
            'plan' => $consultorio['plan']
        ],
        'admin' => [
            'uuid' => $admin['uuid'],
            'nombre' => $admin['nombre'],
            'apellidos' => $admin['apellidos'],
            'email' => $admin['email'],
            'telefono' => $admin['telefono'],
            'rol' => 'admin'
        ]
    ], 201);

} catch (PDOException $e) {
    // Revertir transacción en caso de error
    $pdo->rollBack();
    
    // Verificar si es error de duplicado
    if ($e->getCode() == 23000) {
        respond(false, 'El email ya está registrado en el sistema.', [], 409);
    }
    
    // Error genérico
    respond(false, 'Error al registrar el consultorio. Intente nuevamente.', [], 500);
}
