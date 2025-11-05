<?php
require 'vendor/autoload.php';

$flight = new \flight\Engine();

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, x-user-id, Origin, Accept");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}


// Koneksi Database
$host = 'localhost';
$dbname = 'db_online_shop';
$user = 'root';
$pass = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die(json_encode(['error' => $e->getMessage()]));
}

function get_request_user_id($flight) {
    // Prioritaskan session
    if (session_status() !== PHP_SESSION_ACTIVE) session_start();
    if (!empty($_SESSION['user_id'])) return (int)$_SESSION['user_id'];

    // Cek header X-User-Id (jika dikirim dari frontend)
    $h = $flight->request()->headers;
    if (!empty($h['X-User-Id'])) return (int)$h['X-User-Id'];

    // Cek data body JSON atau form
    $data = $flight->request()->data->getData();
    if (!empty($data['user_id'])) return (int)$data['user_id'];

    // fallback null jika tidak ditemukan
    return null;
}


// --- 1. GET /products?search=&category=&minPrice=&maxPrice=
$flight->route('GET /products', function () use ($pdo) {
    $query = "SELECT p.*, c.name AS category_name 
              FROM products p 
              LEFT JOIN categories c ON p.category = c.id 
              WHERE 1=1";
    $params = [];

    if (!empty($_GET['search'])) {
        $query .= " AND p.name LIKE ?";
        $params[] = '%' . $_GET['search'] . '%';
    }

    if (!empty($_GET['category'])) {
        $query .= " AND p.category = ?";
        $params[] = $_GET['category'];
    }

    if (!empty($_GET['minPrice'])) {
        $query .= " AND p.price >= ?";
        $params[] = $_GET['minPrice'];
    }

    if (!empty($_GET['maxPrice'])) {
        $query .= " AND p.price <= ?";
        $params[] = $_GET['maxPrice'];
    }

    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($products);
});


// --- 2. GET /cart?user_id=abc123
$flight->route('GET /cart', function () use ($pdo) {
    $user_id = $_GET['user_id'] ?? '';
    $stmt = $pdo->prepare("
        SELECT c.id, c.quantity, p.name, p.price, p.unit_label, p.image_url 
        FROM carts c
        JOIN products p ON c.product_id = p.id
        WHERE c.user_id = ?
    ");
    $stmt->execute([$user_id]);
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
});

// --- 3. POST /cart → tambah item ke keranjang
$flight->route('POST /cart', function () use ($pdo) {
    $data = json_decode(file_get_contents("php://input"), true);
    $user_id = $data['user_id'];
    $product_id = $data['product_id'];
    $quantity = $data['quantity'];

    // Cek apakah produk sudah ada di keranjang user
    $stmt = $pdo->prepare("SELECT id, quantity FROM carts WHERE user_id = ? AND product_id = ?");
    $stmt->execute([$user_id, $product_id]);
    $existing = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($existing) {
        // Produk sudah ada → update quantity
        $newQuantity = $existing['quantity'] + $quantity;
        $updateStmt = $pdo->prepare("UPDATE carts SET quantity = ? WHERE id = ?");
        $updateStmt->execute([$newQuantity, $existing['id']]);
    } else {
        // Produk belum ada → insert baru
        $insertStmt = $pdo->prepare("INSERT INTO carts (user_id, product_id, quantity) VALUES (?, ?, ?)");
        $insertStmt->execute([$user_id, $product_id, $quantity]);
    }

    echo json_encode(['status' => 'success']);
});


// --- 4. DELETE /cart/:id → hapus item dari keranjang
$flight->route('DELETE /cart/@id', function ($id) use ($pdo) {
    $stmt = $pdo->prepare("DELETE FROM carts WHERE id = ?");
    $stmt->execute([$id]);
    echo json_encode(['status' => 'deleted']);
});

// --- 5. POST /checkout
$flight->route('POST /checkout', function () use ($pdo) {

    $data = json_decode(file_get_contents("php://input"), true);
    $user_id = $data['user_id'];
    $name = $data['name'];
    $address = $data['address'];
    $payment_method = $data['payment_method'];

    // Ambil isi keranjang user
    $stmt = $pdo->prepare("
        SELECT c.product_id, c.quantity, p.price 
        FROM carts c
        JOIN products p ON c.product_id = p.id
        WHERE c.user_id = ?
    ");
    $stmt->execute([$user_id]);
    $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (count($items) === 0) {
        echo json_encode(['status' => 'failed', 'message' => 'Cart kosong']);
        return;
    }

    // Hitung total harga
    $total_price = 0;
    foreach ($items as $item) {
        $total_price += $item['quantity'] * $item['price'];
    }

    // Simpan ke tabel transactions
    $stmt = $pdo->prepare(" 
        INSERT INTO transactions (user_id, name, address, payment_method, total_price)
        VALUES (?, ?, ?, ?, ?)
    ");
    $stmt->execute([$user_id, $name, $address, $payment_method, $total_price]);
    $transaction_id = $pdo->lastInsertId();

    // Simpan ke tabel transaction_items
    $stmtItem = $pdo->prepare("
        INSERT INTO transaction_item (transaction_id, product_id, quantity, price)
        VALUES (?, ?, ?, ?)
    ");

    // Persiapan query tambahan
    $stmtUpdateStock = $pdo->prepare("UPDATE products SET unit_label = unit_label - ? WHERE id = ?");
    $stmtBarangKeluar = $pdo->prepare("INSERT INTO outgoing_products (product_id, quantity_outgoing, date_outgoing) VALUES (?, ?, ?)");


    $tanggalHariIni = date('Y-m-d');

    foreach ($items as $item) {
        // Simpan transaction_items
        $stmtItem->execute([
            $transaction_id,
            $item['product_id'],
            $item['quantity'],
            $item['price']
        ]);

        // Kurangi stok di tabel products
        $stmtUpdateStock->execute([
            $item['quantity'],
            $item['product_id']
        ]);

        // Catat ke tabel outgoing_products
        $stmtBarangKeluar->execute([
            $item['product_id'],
            $item['quantity'],
            $tanggalHariIni
        ]);
    }

    // Kosongkan keranjang
    $stmt = $pdo->prepare("DELETE FROM carts WHERE user_id = ?");
    $stmt->execute([$user_id]);

    echo json_encode(['status' => 'success', 'transaction_id' => $transaction_id]);
});

$flight->route('GET /checkout/@user_id', function($user_id) use ($pdo, $flight) {
    // Ambil data user
    $stmtUser = $pdo->prepare("SELECT name, address FROM users WHERE id = ?");
    $stmtUser->execute([$user_id]);
    $user = $stmtUser->fetch(PDO::FETCH_ASSOC);

    // Ambil data keranjang + produk
    $stmtCart = $pdo->prepare("
        SELECT p.name, p.price, c.quantity 
        FROM carts c
        JOIN products p ON c.product_id = p.id
        WHERE c.user_id = ?
    ");
    $stmtCart->execute([$user_id]);
    $items = $stmtCart->fetchAll(PDO::FETCH_ASSOC);

    // Hitung total harga
    $total_price = 0;
    foreach ($items as $item) {
        $total_price += $item['price'] * $item['quantity'];
    }

    $flight->json([
        'user' => $user,
        'items' => $items,
        'total_price' => $total_price
    ]);
});



// --- 6. POST /register
$flight->route('POST /register', function () use ($pdo) {
    $data = json_decode(file_get_contents("php://input"), true);

    $name = trim($data['name']);
    $email = trim($data['email']);
    $password = $data['password'];
    $role = $data['role'] ?? 'pelanggan';

    // Cek apakah email sudah digunakan
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);

    if ($stmt->rowCount() > 0) {
        echo json_encode(['status' => 'error', 'message' => 'Email sudah digunakan']);
        return;
    }

    // Simpan user baru dengan password yang di-hash
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)");
    $stmt->execute([$name, $email, $hashedPassword, $role]);

    echo json_encode(['status' => 'success']);
});


// --- 6. POST /login → validasi login user
$flight->route('POST /login', function () use ($pdo, $flight) {
    session_start();
    $data = json_decode(file_get_contents("php://input"), true);

    $name = $data['name'] ?? '';
    $password = $data['password'] ?? '';

    $stmt = $pdo->prepare("SELECT * FROM users WHERE name = ?");
    $stmt->execute([$name]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user && password_verify($password, $user['password'])) {
        // simpan ke session
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['role'] = $user['role'];

        $flight->json([
            'status' => 'success',
            'user_id' => $user['id'],
            'name' => $user['name'],
            'role' => $user['role']
        ]);
    } else {
        $flight->json([
            'status' => 'error',
            'message' => 'Username atau password salah'
        ]);
    }
});

$flight->route('POST /forgot-password', function () use ($pdo) {
    $data = json_decode(file_get_contents("php://input"), true);
    $emailOrUsername = $data['emailOrUsername'] ?? '';

    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ? OR name = ?");
    $stmt->execute([$emailOrUsername, $emailOrUsername]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        // Di sini bisa ditambahkan logika kirim email atau tampilkan pesan
        echo json_encode(['status' => 'success', 'message' => 'Kami telah mengirim instruksi reset password.']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Pengguna tidak ditemukan.']);
    }
});

$flight->route('POST /logout', function() use ($flight) {
    session_start();
    session_unset();    // hapus semua variabel session
    session_destroy();  // hancurkan session
    $flight->json(['success' => true, 'message' => 'Logout berhasil']);
});



$flight->route('POST /carts/update/@id', function($id) use ($pdo) {
    $data = json_decode(file_get_contents("php://input"), true);
    $quantity = $data['quantity'];

    $stmt = $pdo->prepare("UPDATE carts SET quantity = ? WHERE id = ?");
    $stmt->execute([$quantity, $id]);

    echo json_encode(['status' => 'success']);
});

// Halaman Profile
$flight->route('GET /profile', function () use ($pdo) {
    $user_id = $_GET['user_id'] ?? '';
    $stmt = $pdo->prepare("SELECT name AS username, email, phone, address, profile_picture FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode($user);
});

$flight->route('PUT /profile', function () use ($pdo) {
    $data = json_decode(file_get_contents("php://input"), true);
    $user_id = $data['user_id'];
    $username = $data['username'];
    $email = $data['email'];
    $phone = $data['phone'];
    $address = $data['address'];

    $stmt = $pdo->prepare("UPDATE users SET name = ?, email = ?, phone = ?, address = ? WHERE id = ?");
    $stmt->execute([$username, $email, $phone, $address, $user_id]);

    echo json_encode(['status' => 'success']);
});

$flight->route('POST /upload-photo', function() use ($pdo) {
    if (isset($_FILES['profile_picture']) && isset($_POST['user_id'])) {
        $user_id = $_POST['user_id'];
        $file = $_FILES['profile_picture'];

        $targetDir = __DIR__ . "/uploads/";
        if (!file_exists($targetDir)) {
            mkdir($targetDir, 0777, true);
        }

        $filename = uniqid() . "_" . basename($file["name"]);
        $targetFile = $targetDir . $filename;

        if (move_uploaded_file($file["tmp_name"], $targetFile)) {
            // Simpan nama file ke database
            $stmt = $pdo->prepare("UPDATE users SET profile_picture = ? WHERE id = ?");
            $stmt->execute([$filename, $user_id]);

            echo json_encode(['status' => 'success']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Upload gagal']);
        }
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Data tidak lengkap']);
    }
});

$flight->route('POST /delete-photo', function () use ($pdo) {
    $data = json_decode(file_get_contents("php://input"), true);
    $user_id = $data['user_id'];

    // Ambil nama file dari DB
    $stmt = $pdo->prepare("SELECT profile_picture FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user && $user['profile_picture']) {
        $filepath = __DIR__ . "/uploads/" . $user['profile_picture'];
        if (file_exists($filepath)) {
            unlink($filepath); // hapus file dari server
        }

        // Update database untuk hapus nama file
        $stmt = $pdo->prepare("UPDATE users SET profile_picture = NULL WHERE id = ?");
        $stmt->execute([$user_id]);

        echo json_encode(['status' => 'success']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Foto tidak ditemukan']);
    }
});

$flight->route('GET /products/@id', function($id){
    global $pdo;

    $stmt = $pdo->prepare("
        SELECT p.*, c.name AS category_name
        FROM products p
        JOIN categories c ON p.category = c.id
        WHERE p.id = ?
    ");
    $stmt->execute([$id]);
    $product = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode($product);
});

// GET /riwayat-transaksi/@user_id untuk user
$flight->route('GET /riwayat-transaksi/@user_id', function($user_id) use ($pdo, $flight) {
    $stmt = $pdo->prepare("
        SELECT t.id AS transaction_id, t.total_price, t.status, t.created_at,
               ti.product_id, ti.quantity, ti.price, ti.rating,
               p.name AS product_name, p.image_url
        FROM transactions t
        JOIN transaction_item ti ON t.id = ti.transaction_id
        JOIN products p ON ti.product_id = p.id
        WHERE t.user_id = ?
        ORDER BY t.created_at DESC
    ");
    $stmt->execute([$user_id]);
    $riwayat = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $flight->json($riwayat);
});

// POST beri rating
$flight->route('POST /beri-rating', function() use ($pdo, $flight) {
    $data = json_decode(file_get_contents('php://input'), true);
    $transaction_id = $data['transaction_id'] ?? null;
    $product_id = $data['product_id'] ?? null;
    $rating = $data['rating'] ?? null;

    if (!$transaction_id || !$product_id || !$rating) {
        $flight->json(["status" => "error", "message" => "Data tidak lengkap"], 400);
        return;
    }

    // Simpan rating di transaction_item
    $stmt = $pdo->prepare("
        UPDATE transaction_item 
        SET rating = ? 
        WHERE transaction_id = ? AND product_id = ?
    ");
    $stmt->execute([$rating, $transaction_id, $product_id]);

    // Hitung rata-rata rating produk
    $stmt = $pdo->prepare("SELECT AVG(rating) as avg_rating FROM transaction_item WHERE product_id = ? AND rating IS NOT NULL");
    $stmt->execute([$product_id]);
    $avg_rating = round($stmt->fetch(PDO::FETCH_ASSOC)['avg_rating'], 1);

    // Update ke tabel products
    $stmt = $pdo->prepare("UPDATE products SET rating = ? WHERE id = ?");
    $stmt->execute([$avg_rating, $product_id]);

    $flight->json(["status" => "success", "message" => "Rating berhasil disimpan", "avg_rating" => $avg_rating]);
});

// DETAIL TRANSAKSI (untuk pembeli) - GET /transaction/@id
$flight->route('GET /transaction/@id', function($id) use ($pdo, $flight) {
    try {
        // header transaksi + buyer
        $stmt = $pdo->prepare("
            SELECT t.id, t.user_id, t.name AS buyer_name, t.address AS buyer_address,
                   t.payment_method, t.total_price, t.created_at, t.status
            FROM transactions t
            WHERE t.id = ?
            LIMIT 1
        ");
        $stmt->execute([$id]);
        $header = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$header) {
            return $flight->json(['error' => 'Transaksi tidak ditemukan'], 404);
        }

        // items
        $stmt2 = $pdo->prepare("
            SELECT ti.product_id, p.name AS product_name, p.image_url, ti.quantity, ti.price, ti.rating
            FROM transaction_item ti
            JOIN products p ON ti.product_id = p.id
            WHERE ti.transaction_id = ?
        ");
        $stmt2->execute([$id]);
        $items = $stmt2->fetchAll(PDO::FETCH_ASSOC);

        // shipping/distributor info (cek tabel distributor_orders)
        $stmt3 = $pdo->prepare("
            SELECT do.distributor_id, u.name AS distributor_name, do.tracking_number, do.status AS distributor_status, do.assigned_at, do.completed_at
            FROM distributor_orders do
            LEFT JOIN users u ON do.distributor_id = u.id
            WHERE do.transaction_id = ? LIMIT 1
        ");
        $stmt3->execute([$id]);
        $shipping = $stmt3->fetch(PDO::FETCH_ASSOC);

        // refund info (jika ada)
        $stmt4 = $pdo->prepare("SELECT * FROM refunds WHERE transaction_id = ? ORDER BY created_at DESC");
        $stmt4->execute([$id]);
        $refunds = $stmt4->fetchAll(PDO::FETCH_ASSOC);

        $flight->json([
            'header' => $header,
            'items' => $items,
            'shipping' => $shipping,
            'refunds' => $refunds
        ]);
    } catch (Exception $e) {
        $flight->json(['error' => 'Server error: ' . $e->getMessage()], 500);
    }
});

/**
 * 1️⃣ Ajukan Refund (Pembeli)
 * URL: POST /refunds
 */
$flight->route('POST /refunds', function() use ($pdo, $flight) {
    $user_id = $_POST['user_id'] ?? null;
    $transaction_id = $_POST['transaction_id'] ?? null;
    $reason = $_POST['reason'] ?? '';
    $description = $_POST['description'] ?? '';

    if (!$user_id || !$transaction_id || !$reason) {
        return $flight->json(['error' => 'Data tidak lengkap'], 400);
    }

    // Validasi transaksi milik user
    $stmt = $pdo->prepare("SELECT * FROM transactions WHERE id = ? AND user_id = ?");
    $stmt->execute([$transaction_id, $user_id]);
    $trx = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$trx) {
        return $flight->json(['error' => 'Transaksi tidak ditemukan atau bukan milik Anda'], 404);
    }

    // Cegah refund ganda
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM refunds WHERE transaction_id = ?");
    $stmt->execute([$transaction_id]);
    if ($stmt->fetchColumn() > 0) {
        return $flight->json(['error' => 'Refund sudah pernah diajukan untuk transaksi ini'], 400);
    }

    // Upload file bukti
    $proof_files = [];
    $uploadDir = __DIR__ . "/uploads/refunds/";
    if (!file_exists($uploadDir)) mkdir($uploadDir, 0777, true);

    if (!empty($_FILES['media']['name'][0])) {
        foreach ($_FILES['media']['tmp_name'] as $i => $tmpName) {
            $filename = time() . "_" . basename($_FILES['media']['name'][$i]);
            move_uploaded_file($tmpName, $uploadDir . $filename);
            $proof_files[] = $filename;
        }
    }

    // ✅ Ambil otomatis nama distributor dari distributor_orders
    $stmt = $pdo->prepare("
        SELECT u.name AS distributor_name
        FROM distributor_orders do
        LEFT JOIN users u ON do.distributor_id = u.id
        WHERE do.transaction_id = ?
        LIMIT 1
    ");
    $stmt->execute([$transaction_id]);
    $distributor = $stmt->fetch(PDO::FETCH_ASSOC);
    $distributor_name = $distributor['distributor_name'] ?? null;

    // Simpan refund baru
    $stmt = $pdo->prepare("
        INSERT INTO refunds (transaction_id, user_id, distributor_name, reason, description, proof_files, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW())
    ");
    $stmt->execute([
        $transaction_id,
        $user_id,
        $distributor_name,
        $reason,
        $description,
        json_encode($proof_files)
    ]);

    // Update status transaksi
    $stmt = $pdo->prepare("UPDATE transactions SET status = 'Refund Pending' WHERE id = ?");
    $stmt->execute([$transaction_id]);

    return $flight->json(['success' => true, 'message' => 'Refund berhasil diajukan dan menunggu persetujuan admin']);
});




// -------------------------
// GET refunds by user - GET /refunds/user/@user_id
$flight->route('GET /refunds/user/@user_id', function($user_id) use ($pdo, $flight) {
    try {
        $stmt = $pdo->prepare("SELECT * FROM refunds WHERE user_id = ? ORDER BY created_at DESC");
        $stmt->execute([$user_id]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rows as &$r) {
            $r['proof_files'] = json_decode($r['proof_files'], true);
        }
        $flight->json($rows);
    } catch (Exception $e) {
        $flight->json(['error' => 'Server error: ' . $e->getMessage()], 500);
    }
});

/**
 * 2️⃣ Daftar Refund (Admin)
 * URL: GET /admin/refunds
 */
// === GET semua data refund (untuk halaman admin) ===
$flight->route('GET /admin/refunds', function() use ($pdo) {
    try {
        $query = "
            SELECT 
                r.id,
                r.transaction_id,
                r.user_id,
                u.name AS username,
                r.reason,
                r.description,
                r.status,
                r.created_at,
                r.updated_at,
                r.distributor_name,
                t.total_price
            FROM refunds r
            LEFT JOIN users u ON r.user_id = u.id
            LEFT JOIN transactions t ON r.transaction_id = t.id
            ORDER BY r.created_at DESC
        ";

        $stmt = $pdo->prepare($query);
        $stmt->execute();
        $refunds = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($refunds as &$refund) {
            $refund['proof_files'] = json_decode($refund['proof_files'] ?? '[]', true);
        }

        if (!is_array($refunds)) $refunds = [];
        echo json_encode($refunds);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            "error" => "Gagal mengambil data refund",
            "message" => $e->getMessage()
        ]);
    }
});

$flight->route('GET /admin/refunds/@id', function($id) use ($pdo, $flight) {
    $stmt = $pdo->prepare("
        SELECT 
            r.id,
            r.transaction_id,
            r.user_id,
            u.name AS username,
            r.reason,
            r.description,
            r.status,
            r.created_at,
            r.updated_at,
            r.distributor_name,
            r.proof_files,
            t.total_price
        FROM refunds r
        LEFT JOIN users u ON r.user_id = u.id
        LEFT JOIN transactions t ON r.transaction_id = t.id
        WHERE r.id = ?
    ");
    $stmt->execute([$id]);
    $refund = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$refund) {
        return $flight->json(["error" => "Refund tidak ditemukan"], 404);
    }

    $refund['proof_files'] = json_decode($refund['proof_files'] ?? '[]', true);
    return $flight->json($refund);
});


// -------------------------
// -------------------------
// ADMIN: process refund (approve/reject) - POST /admin/refunds/@id/process
$flight->route('POST /admin/refunds/@id/process', function($id) use ($pdo, $flight) {
    $data = json_decode(file_get_contents('php://input'), true);
    $action = $data['action'] ?? '';

    // 🔹 Setup path untuk log file
    $logDir = __DIR__ . "/logs";
    if (!file_exists($logDir)) mkdir($logDir, 0777, true);
    $logFile = $logDir . "/refund_debug.log";

    // Fungsi untuk tulis log
    $log = function($msg) use ($logFile) {
        file_put_contents($logFile, "[" . date("Y-m-d H:i:s") . "] " . $msg . "\n", FILE_APPEND);
    };

    try {
        // Ambil data refund
        $stmt = $pdo->prepare("SELECT * FROM refunds WHERE id = ?");
        $stmt->execute([$id]);
        $refund = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$refund) {
            $log("Refund ID $id tidak ditemukan.");
            return $flight->json(['error' => 'Refund tidak ditemukan'], 404);
        }

        // Ambil data transaksi
        $trxStmt = $pdo->prepare("SELECT * FROM transactions WHERE id = ?");
        $trxStmt->execute([$refund['transaction_id']]);
        $trx = $trxStmt->fetch(PDO::FETCH_ASSOC);
        if (!$trx) {
            $log("Transaksi {$refund['transaction_id']} tidak ditemukan untuk refund ID $id.");
            return $flight->json(['error' => 'Transaksi terkait tidak ditemukan'], 404);
        }

        // ======= APPROVE =======
        if ($action === 'approve' || $action === 'approved') {
            $log("Memproses APPROVE refund ID $id untuk transaksi {$refund['transaction_id']}.");

            // Ubah status refund & transaksi
            $pdo->prepare("UPDATE refunds SET status = 'approved', updated_at = NOW() WHERE id = ?")
                ->execute([$id]);
            $pdo->prepare("UPDATE transactions SET status = 'Refund Approved' WHERE id = ?")
                ->execute([$refund['transaction_id']]);

            // Kembalikan stok produk yang direfund
            $stmtItems = $pdo->prepare("SELECT * FROM transaction_item WHERE transaction_id = ?");
            $stmtItems->execute([$refund['transaction_id']]);
            foreach ($stmtItems->fetchAll(PDO::FETCH_ASSOC) as $item) {
                $pdo->prepare("UPDATE products SET unit_label = unit_label + ? WHERE id = ?")
                    ->execute([$item['quantity'], $item['product_id']]);
            }

            // 🔹 Ambil distributor_id dari distributor_orders
            $stmtDist = $pdo->prepare("
                SELECT distributor_id 
                FROM distributor_orders 
                WHERE transaction_id = ? 
                LIMIT 1
            ");
            $stmtDist->execute([$refund['transaction_id']]);
            $distributor = $stmtDist->fetch(PDO::FETCH_ASSOC);
            $distributor_id = $distributor['distributor_id'] ?? null;

            if (!$distributor_id) {
                $log("⚠️ Tidak ditemukan distributor_id untuk transaksi {$refund['transaction_id']}.");
            } else {
                $log("✅ Ditemukan distributor_id = $distributor_id untuk transaksi {$refund['transaction_id']}.");
            }

            // 🔹 Ambil data pembeli
            $stmtBuyer = $pdo->prepare("SELECT name FROM users WHERE id = ?");
            $stmtBuyer->execute([$trx['user_id']]);
            $buyer = $stmtBuyer->fetch(PDO::FETCH_ASSOC);

            // 🔹 Ambil nama produk pertama dari transaksi
            $stmtProd = $pdo->prepare("
                SELECT p.name AS product_name
                FROM transaction_item ti
                JOIN products p ON ti.product_id = p.id
                WHERE ti.transaction_id = ?
                LIMIT 1
            ");
            $stmtProd->execute([$refund['transaction_id']]);
            $product = $stmtProd->fetch(PDO::FETCH_ASSOC);

            // 🔹 Simpan data refund ke distributor_refunds
            $stmtInsert = $pdo->prepare("
                INSERT INTO distributor_refunds 
                    (refund_id, distributor_id, transaction_id, name, product_name, reason, created_at)
                VALUES (?, ?, ?, ?, ?, ?, NOW())
            ");
            $stmtInsert->execute([
                $refund['id'],
                $distributor_id,
                $refund['transaction_id'],
                $buyer['name'] ?? 'Tidak diketahui',
                $product['product_name'] ?? 'Tidak diketahui',
                $refund['reason'] ?? ''
            ]);

            $log("✅ Refund ID $id berhasil diteruskan ke distributor_refunds.");
            return $flight->json(['success' => true, 'message' => 'Refund disetujui dan diteruskan ke distributor.']);
        }

        // ======= REJECT =======
        if ($action === 'reject' || $action === 'rejected') {
            $pdo->prepare("UPDATE refunds SET status = 'rejected', updated_at = NOW() WHERE id = ?")
                ->execute([$id]);
            $pdo->prepare("UPDATE transactions SET status = 'Refund Rejected' WHERE id = ?")
                ->execute([$refund['transaction_id']]);
            $log("Refund ID $id ditolak oleh admin.");
            return $flight->json(['success' => true, 'message' => 'Refund ditolak.']);
        }

        // ======= INVALID ACTION =======
        $log("Aksi tidak valid dikirim untuk refund ID $id: '$action'");
        return $flight->json(['error' => 'Aksi tidak valid.'], 400);

    } catch (Exception $e) {
        $log("❌ ERROR: " . $e->getMessage());
        return $flight->json(['error' => 'Server error', 'message' => $e->getMessage()], 500);
    }
});



$flight->route('GET /distributor/refunds/@id', function($id) use ($pdo, $flight) {
    $stmt = $pdo->prepare("
        SELECT 
            dr.id,
            dr.refund_id,
            dr.transaction_id,
            dr.name AS buyer_name,
            dr.product_name,
            dr.reason,
            t.total_price,
            u.name AS user_name,
            u.address AS user_address,
            dr.created_at
        FROM distributor_refunds dr
        JOIN transactions t ON dr.transaction_id = t.id
        JOIN users u ON t.user_id = u.id
        WHERE dr.distributor_id = ?
        ORDER BY dr.created_at DESC
    ");
    $stmt->execute([$id]);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $flight->json($data);
});





// Start Halaman admin Routes
// GET untuk data dashboard admin
$flight->route('GET /Admin/dashboard-data', function() use ($pdo, $flight) {
    // Hitung total produk
    $stmt = $pdo->query("SELECT COUNT(*) AS total_products FROM products");
    $total_products = $stmt->fetch(PDO::FETCH_ASSOC)['total_products'];

    // Hitung total user (role = 'pelanggan')
    $stmt = $pdo->query("SELECT COUNT(*) AS total_users FROM users WHERE role = 'pelanggan'");
    $total_users = $stmt->fetch(PDO::FETCH_ASSOC)['total_users'];

    // Hitung barang masuk
    $stmt = $pdo->query("SELECT COALESCE(SUM(quantity_incoming),0) AS barang_masuk FROM incoming_products");
    $barang_masuk = $stmt->fetch(PDO::FETCH_ASSOC)['barang_masuk'];

    // Hitung barang keluar
    $stmt = $pdo->query("SELECT COALESCE(SUM(quantity_outgoing),0) AS barang_keluar FROM outgoing_products");
    $barang_keluar = $stmt->fetch(PDO::FETCH_ASSOC)['barang_keluar'];

    $flight->json([
        'total_products' => $total_products,
        'total_users' => $total_users,
        'barang_masuk' => $barang_masuk,
        'barang_keluar' => $barang_keluar
    ]);
});



// GET /admin/users
$flight->route('GET /Admin/users', function () use ($pdo, $flight) {
    $stmt = $pdo->prepare("SELECT id, name, email, phone, address, profile_picture FROM users WHERE role = 'pelanggan'");
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $flight->json($users);
});

$flight->route('DELETE /Admin/users/@id', function ($id) use ($pdo, $flight) {
    $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
    $stmt->execute([$id]);

    if ($stmt->rowCount() > 0) {
        $flight->json(["status" => "success", "message" => "User berhasil dihapus"]);
    } else {
        $flight->json(["status" => "error", "message" => "User tidak ditemukan"], 404);
    }
});

// GET /admin/distributors
$flight->route('GET /Admin/distributors', function () use ($pdo, $flight) {
    $stmt = $pdo->prepare("SELECT id, name, email, phone, address, profile_picture FROM users WHERE role = 'distributor'");
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $flight->json($users);
});

$flight->route('DELETE /Admin/distributors/@id', function ($id) use ($pdo, $flight) {
    $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
    $stmt->execute([$id]);

    if ($stmt->rowCount() > 0) {
        $flight->json(["status" => "success", "message" => "User berhasil dihapus"]);
    } else {
        $flight->json(["status" => "error", "message" => "User tidak ditemukan"], 404);
    }
});


// GET /admin/products
$flight->route('GET /Admin/products', function() use ($pdo, $flight) {
    $stmt = $pdo->query("SELECT p.id, p.name, p.price, p.description, p.image_url, p.unit_label, c.name AS category_name
                         FROM products p
                         JOIN categories c ON p.category = c.id;");
    $stmt->execute();                        
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $flight->json($products);
});

// tambah barang admin
$flight->route('POST /Admin/tambah-produk', function () use ($pdo, $flight) {
    $uploadDir = __DIR__ . '/uploads/';
    if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

    // Validasi file
    if (!isset($_FILES['image_url']) || $_FILES['image_url']['error'] !== UPLOAD_ERR_OK) {
        $flight->json(['error' => 'Upload gambar gagal'], 400);
        return;
    }

    $fileName = time() . '_' . basename($_FILES['image_url']['name']);
    $targetPath = $uploadDir . $fileName;
    move_uploaded_file($_FILES['image_url']['tmp_name'], $targetPath);

    // Data input
    $name = $_POST['name'] ?? '';
    $category = $_POST['category'] ?? '';
    $description = $_POST['description'] ?? '';
    $price = $_POST['price'] ?? 0;
    $unit_type = $_POST['unit_type'] ?? 'satuan';
    $unit_label = $_POST['unit_label'] ?? '';
    $image_url = "http://localhost/Online_Shop/uploads/" . $fileName; // <== simpan full URL

    $stmt = $pdo->prepare("INSERT INTO products (name, category, description, price, unit_type, unit_label, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $success = $stmt->execute([$name, $category, $description, $price, $unit_type, $unit_label, $image_url]);

    if ($success) {
        $flight->json(['message' => 'Produk berhasil ditambahkan']);
    } else {
        $flight->json(['error' => 'Gagal menyimpan ke database'], 500);
    }
});

// Hapus produk
$flight->route('DELETE /Admin/delete-produk/@id', function($id) use ($pdo, $flight) {
    // Cek produk ada atau tidak
    $stmt = $pdo->prepare("SELECT image_url FROM products WHERE id = ?");
    $stmt->execute([$id]);
    $product = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$product) {
        $flight->json(['error' => 'Produk tidak ditemukan'], 404);
        return;
    }

    // Hapus gambar di folder jika ada
    $imagePath = __DIR__ . '/../../' . $product['image_url'];
    if (file_exists($imagePath)) {
        unlink($imagePath);
    }

    // Hapus produk (data anak ikut terhapus karena ON DELETE CASCADE)
    $delete = $pdo->prepare("DELETE FROM products WHERE id = ?");
    $success = $delete->execute([$id]);

    if ($success) {
        $flight->json(['message' => 'Produk dan data terkait berhasil dihapus']);
    } else {
        $flight->json(['error' => 'Gagal menghapus produk'], 500);
    }
});


// Ambil data produk berdasarkan ID
$flight->route('GET /Admin/get-produk/@id', function($id) use ($pdo, $flight) {
    $stmt = $pdo->prepare("SELECT * FROM products WHERE id = ?");
    $stmt->execute([$id]);
    $product = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($product) {
        $flight->json($product);
    } else {
        $flight->json(['error' => 'Produk tidak ditemukan'], 404);
    }
});

// Update produk
$flight->route('POST /Admin/update-produk/@id', function($id) use ($pdo, $flight) {
    // Ambil data lama
    $stmt = $pdo->prepare("SELECT image_url FROM products WHERE id = ?");
    $stmt->execute([$id]);
    $oldData = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$oldData) {
        $flight->json(['error' => 'Produk tidak ditemukan'], 404);
        return;
    }

    // Ambil data input
    $name = $_POST['name'] ?? '';
    $category = $_POST['category'] ?? '';
    $description = $_POST['description'] ?? '';
    $price = $_POST['price'] ?? 0;
    $unit_type = $_POST['unit_type'] ?? 'satuan';
    $unit_label = $_POST['unit_label'] ?? '';
    $image_url = $oldData['image_url'];

    // Jika ada gambar baru
    if (isset($_FILES['image_url']) && $_FILES['image_url']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = __DIR__ . '/uploads/';
        if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

        // Hapus gambar lama
        if (strpos($oldData['image_url'], 'http') !== false) {
            $oldFile = str_replace("http://localhost/Online_Shop/", "", $oldData['image_url']);
            if (file_exists(__DIR__ . '/' . $oldFile)) {
                unlink(__DIR__ . '/' . $oldFile);
            }
        }

        $fileName = time() . '_' . basename($_FILES['image_url']['name']);
        $targetPath = $uploadDir . $fileName;
        move_uploaded_file($_FILES['image_url']['tmp_name'], $targetPath);
        $image_url = "http://localhost/Online_Shop/uploads/" . $fileName;
    }

    // Update database
    $stmt = $pdo->prepare("UPDATE products SET name = ?, category = ?, description = ?, price = ?, unit_type = ?, unit_label = ?, image_url = ? WHERE id = ?");
    $success = $stmt->execute([$name, $category, $description, $price, $unit_type, $unit_label, $image_url, $id]);

    if ($success) {
        $flight->json(['message' => 'Produk berhasil diperbarui']);
    } else {
        $flight->json(['error' => 'Gagal update produk'], 500);
    }
});

// GET /admin/categories 
$flight->route('GET /Admin/categories', function() use ($pdo, $flight) {
    $stmt = $pdo->query("SELECT * FROM categories");
    $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $flight->json($categories);
});

// Tambah Kategori
$flight->route('POST /Admin/tambah-kategori', function() use ($pdo, $flight) {
    $data = json_decode(file_get_contents("php://input"), true);
    $name = $data['name'] ?? '';

    if (!empty($name)) {
        $stmt = $pdo->prepare("INSERT INTO categories (name) VALUES (?)");
        $stmt->execute([$name]);
        $flight->json(["success" => true, "message" => "Kategori berhasil ditambahkan"]);
    } else {
        $flight->json(["success" => false, "message" => "Nama kategori wajib diisi"], 400);
    }
});

// Hapus Kategori
$flight->route('DELETE /Admin/hapus-kategori/@id', function($id) use ($pdo, $flight) {
    $stmt = $pdo->prepare("DELETE FROM categories WHERE id = ?");
    $stmt->execute([$id]);
    $flight->json(["success" => true, "message" => "Kategori berhasil dihapus"]);
});

// GET barang masuk (riwayat)
$flight->route('GET /Admin/barang-masuk', function () use ($pdo) {
    $start = $_GET['start'] ?? null;
    $end = $_GET['end'] ?? null;

    if ($start && $end) {
        $stmt = $pdo->prepare("
            SELECT bm.id, p.name AS product_name, bm.quantity_incoming, bm.date_incoming
            FROM incoming_products bm
            JOIN products p ON bm.product_id = p.id
            WHERE bm.date_incoming BETWEEN ? AND ?
            ORDER BY bm.date_incoming DESC
        ");
        $stmt->execute([$start, $end]);
    } else {
        $stmt = $pdo->query("
            SELECT bm.id, p.name AS product_name, bm.quantity_incoming, bm.date_incoming
            FROM incoming_products bm
            JOIN products p ON bm.product_id = p.id
            ORDER BY bm.date_incoming DESC
        ");
    }

    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
});

$flight->route('POST /Admin/barang-masuk', function() use ($pdo, $flight) {
    $data = json_decode(file_get_contents("php://input"), true);
    $items = $data['items'] ?? [];
    $tanggal = date('Y-m-d');

    foreach ($items as $item) {
        $product_id = $item['product_id'];
        $jumlah = $item['jumlah'];

        // Simpan ke tabel incoming_products
        $stmt = $pdo->prepare("INSERT INTO incoming_products (product_id, quantity_incoming, date_incoming) VALUES (?, ?, ?)");
        $stmt->execute([$product_id, $jumlah, $tanggal]);

        // Update stok pada tabel products
        $stmt2 = $pdo->prepare("UPDATE products SET unit_label = unit_label + ? WHERE id = ?");
        $stmt2->execute([$jumlah, $product_id]);
    }

    $flight->json(['message' => 'Semua barang masuk berhasil ditambahkan']);
});

// GET /admin/barang-keluar
$flight->route('GET /Admin/barang-keluar', function() use ($pdo, $flight) {
    $stmt = $pdo->query("SELECT bk.id, p.name AS product_name, bk.quantity_outgoing, bk.date_outgoing
                         FROM outgoing_products bk
                         JOIN products p ON bk.product_id = p.id
                         ORDER BY bk.date_outgoing DESC");
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $flight->json($data);
});


// GET /admin/riwayat-transaksi
$flight->route('GET /Admin/riwayat-transaksi', function() use ($pdo, $flight) {
    $stmt = $pdo->prepare("
        SELECT t.id AS transaction_id, 
               t.total_price, 
               t.status, 
               t.created_at,
               ti.product_id, 
               ti.quantity, 
               ti.price, 
               p.name AS product_name, 
               p.image_url, 
               u.name AS user_name
        FROM transactions t
        JOIN transaction_item ti ON t.id = ti.transaction_id
        JOIN products p ON ti.product_id = p.id
        JOIN users u ON t.user_id = u.id
        WHERE t.status = 'completed'  -- Hanya ambil yang completed
        ORDER BY t.created_at DESC
    ");
    $stmt->execute();
    $riwayat = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $flight->json($riwayat);
});


$flight->route('GET /Admin/status-transaksi', function() use ($pdo, $flight) {
    $stmt = $pdo->prepare("
        SELECT t.id AS transaction_id, t.total_price, t.status, t.created_at,
               ti.product_id, ti.quantity, ti.price, p.name AS product_name, p.image_url, u.name AS user_name
        FROM transactions t
        JOIN transaction_item ti ON t.id = ti.transaction_id
        JOIN products p ON ti.product_id = p.id
        JOIN users u ON t.user_id = u.id
        ORDER BY t.created_at DESC
    ");
    $stmt->execute();
    $riwayat = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $flight->json($riwayat);
});


$flight->route('GET /Admin/status-transaksi/@id', function($id) use ($pdo, $flight) {
    try {
        // ambil data transaksi utama
        $stmt = $pdo->prepare("
            SELECT t.*, u.name AS buyer_name, u.phone AS buyer_phone, u.address AS buyer_address, u.email AS buyer_email
            FROM transactions t
            JOIN users u ON t.user_id = u.id
            WHERE t.id = ?
        ");
        $stmt->execute([$id]);
        $header = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$header) {
            $flight->json(['error' => 'Transaksi tidak ditemukan'], 404);
            return;
        }

        // ambil items
        $stmtItems = $pdo->prepare("
            SELECT p.name AS product_name, ti.quantity, ti.price
            FROM transaction_item ti
            JOIN products p ON ti.product_id = p.id
            WHERE ti.transaction_id = ?
        ");
        $stmtItems->execute([$id]);
        $items = $stmtItems->fetchAll(PDO::FETCH_ASSOC);

        // ambil data shipping (jika ada distributor_orders)
        $stmtShip = $pdo->prepare("
            SELECT do.id, do.transaction_id, do.status, do.assigned_at, do.completed_at,
                   do.proof_image, do.tracking_number,
                   do.assigned_at AS shipped_at,
                   do.notes,
                   d.name AS distributor_name
            FROM distributor_orders do
            JOIN users d ON do.distributor_id = d.id
            WHERE do.transaction_id = ?
            LIMIT 1
        ");
        $stmtShip->execute([$id]);
        $shipping = $stmtShip->fetch(PDO::FETCH_ASSOC);

        $flight->json([
            'header' => $header,
            'items' => $items,
            'shipping' => $shipping
        ]);
    } catch (Exception $e) {
        $flight->json(['error' => 'Server error: ' . $e->getMessage()], 500);
    }
});


// letakkan fungsi helper ini di file yang sama (atau include) sebelum route
function generateTrackingNumber($pdo) {
    // ambil nomor resi terakhir yang tidak null
    $stmt = $pdo->query("SELECT tracking_number FROM distributor_orders WHERE tracking_number IS NOT NULL ORDER BY id DESC LIMIT 1");
    $last = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($last && preg_match('/RESI(\d+)/', $last['tracking_number'], $m)) {
        $next = intval($m[1]) + 1;
    } else {
        $next = 1;
    }
    return "RESI" . str_pad($next, 5, "0", STR_PAD_LEFT);
}

$flight->route('POST /Admin/update-status', function() use ($pdo, $flight) {
    $data = json_decode(file_get_contents("php://input"), true);
    $transaction_id = isset($data['transaction_id']) ? intval($data['transaction_id']) : null;
    $status = isset($data['status']) ? trim($data['status']) : null;
    $shipping = $data['shipping'] ?? [];

    if (!$transaction_id || !$status) {
        $flight->json(['success' => false, 'message' => 'Parameter tidak lengkap (transaction_id/status)'], 400);
        return;
    }

    try {
        // cek transaksi ada
        $stmt = $pdo->prepare("SELECT id, status FROM transactions WHERE id = ? LIMIT 1");
        $stmt->execute([$transaction_id]);
        $tx = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$tx) {
            $flight->json(['success'=>false,'message'=>'Transaksi tidak ditemukan'],404);
            return;
        }

        $pdo->beginTransaction();

        // update transaksi.status selalu dilakukan saat status berubah
        $stmt = $pdo->prepare("UPDATE transactions SET status = ? WHERE id = ?");
        $stmt->execute([$status, $transaction_id]);

        // Kalau status menjadi 'Dikirim' (atau mengandung kata 'dikirim'), tangani distributor_orders & resi
        if (strtolower($status) === 'dikirim' || strpos(strtolower($status), 'dikirim') !== false) {
            $distributor_id = isset($shipping['distributor_id']) ? intval($shipping['distributor_id']) : null;
            $notes = $shipping['notes'] ?? null;

            if (!$distributor_id) {
                $pdo->rollBack();
                $flight->json(['success'=>false,'message'=>'distributor_id wajib saat set Dikirim'],400);
                return;
            }

            // cek apakah distributor_orders untuk transaksi ini sudah ada
            $stmt = $pdo->prepare("SELECT id, distributor_id FROM distributor_orders WHERE transaction_id = ? LIMIT 1");
            $stmt->execute([$transaction_id]);
            $existing = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($existing) {
                // jika ada record dan distributor berbeda -> update distributor_id juga (opsional)
                if ($existing['distributor_id'] != $distributor_id) {
                    $stmt = $pdo->prepare("UPDATE distributor_orders SET distributor_id = ?, status = ?, notes = ?, assigned_at = NOW() WHERE id = ?");
                    $stmt->execute([$distributor_id, $status, $notes, $existing['id']]);
                } else {
                    // update status/notes/tracking jika belum ada
                    // jika tracking_number belum ada, generate
                    $stmtCheck = $pdo->prepare("SELECT tracking_number FROM distributor_orders WHERE id = ?");
                    $stmtCheck->execute([$existing['id']]);
                    $rowCheck = $stmtCheck->fetch(PDO::FETCH_ASSOC);
                    $tracking_number = $rowCheck['tracking_number'] ?? null;
                    if (empty($tracking_number)) {
                        $tracking_number = generateTrackingNumber($pdo);
                    }
                    $stmt = $pdo->prepare("UPDATE distributor_orders SET status = ?, notes = ?, tracking_number = ?, assigned_at = NOW() WHERE id = ?");
                    $stmt->execute([$status, $notes, $tracking_number, $existing['id']]);
                }
            } else {
                // belum ada record → insert baru
                $tracking_number = generateTrackingNumber($pdo);
                $stmt = $pdo->prepare("
                    INSERT INTO distributor_orders (transaction_id, distributor_id, status, assigned_at, tracking_number, notes)
                    VALUES (?, ?, ?, NOW(), ?, ?)
                ");
                $stmt->execute([$transaction_id, $distributor_id, $status, $tracking_number, $notes]);
            }

            $pdo->commit();

            // kembalikan tracking_number agar frontend bisa menampilkan (dan set ship.tracking_number)
            $flight->json(['success'=>true,'message'=>'Transaksi di-set Dikirim dan distributor ditugaskan','tracking_number'=>$tracking_number]);
            return;
        }

        // Untuk status selain 'Dikirim' — update transaksi status saja. 
        // (Jika ingin sinkron status di distributor_orders juga, bisa ditambahkan di sini)
        $pdo->commit();
        $flight->json(['success'=>true,'message'=>'Status transaksi diperbarui']);
        return;

    } catch (Exception $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        // log error untuk debugging lokal (jangan tampilkan stack di production)
        error_log("update-status error: " . $e->getMessage());
        $flight->json(['success'=>false,'message'=>'Server error: '.$e->getMessage()],500);
        return;
    }
});

$flight->route('GET /Admin/status-transaksi', function() use ($pdo, $flight) {
    $stmt = $pdo->prepare("
        SELECT 
            t.id AS transaction_id, 
            u.name AS user_name,
            t.created_at,
            p.name AS product_name,
            ti.quantity,
            (ti.quantity * ti.price) AS total,
            t.status
        FROM transactions t
        JOIN users u ON t.user_id = u.id
        JOIN transaction_item ti ON t.id = ti.transaction_id
        JOIN products p ON ti.product_id = p.id
        ORDER BY t.created_at DESC
    ");
    $stmt->execute();
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $flight->json($data);
});

// ====== ADMIN: LAPORAN LOGISTIK ======
$flight->route('GET /admin/laporan-logistik', function() use ($pdo, $flight) {
    try {
        $params = [];
        $where = [];

        // Filter nama distributor
        if (!empty($_GET['nama'])) {
            $where[] = "u.name LIKE :nama";
            $params[':nama'] = "%" . $_GET['nama'] . "%";
        }

        // Filter tanggal (format: YYYY-MM-DD)
        if (!empty($_GET['tanggal'])) {
            $where[] = "DATE(COALESCE(do.assigned_at, do.completed_at)) = :tanggal";
            $params[':tanggal'] = $_GET['tanggal'];
        }

        $sql = "
            SELECT 
                DATE(COALESCE(do.assigned_at, do.completed_at)) AS tanggal,
                u.name AS distributor_name,
                SUM(CASE WHEN do.status = 'completed' THEN 1 ELSE 0 END) AS total_terkirim,
                SUM(CASE WHEN do.status = 'dikirim' THEN 1 ELSE 0 END) AS total_dikirim,
                SUM(CASE WHEN do.status = 'assigned' THEN 1 ELSE 0 END) AS total_belum_dikirim,
                0 AS total_refund
            FROM distributor_orders do
            JOIN users u ON do.distributor_id = u.id
        ";

        if (!empty($where)) {
            $sql .= " WHERE " . implode(" AND ", $where);
        }

        $sql .= " GROUP BY tanggal, distributor_name ORDER BY tanggal DESC, distributor_name";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $laporan = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $flight->json($laporan);
    } catch (Exception $e) {
        $flight->json(['error' => $e->getMessage()], 500);
    }
});
// End Backend Admin Panel

// Backend Distributor Panel
// ====== HELPER SESSION ======
function require_distributor_session($flight, $pdo) {
    session_start();
    if (!isset($_SESSION['user_id']) || ($_SESSION['role'] ?? '') !== 'distributor') {
        $flight->json(['error' => 'Unauthorized'], 401);
        return false;
    }
    return true;
}

// ====== ADMIN: AMBIL DAFTAR DISTRIBUTOR ======
$flight->route('GET /Admin/distributors', function() use ($pdo, $flight) {
    try {
        $stmt = $pdo->query("SELECT id, name FROM users WHERE role = 'distributor'");
        $distributors = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $flight->json($distributors);
    } catch (Exception $e) {
        $flight->json(['error' => 'Server error: ' . $e->getMessage()], 500);
    }
});

// ====== ADMIN: UPDATE STATUS + ASSIGN DISTRIBUTOR ======
$flight->route('POST /Admin/update-status', function() use ($pdo, $flight) {
    $data = json_decode(file_get_contents("php://input"), true);

    $transaction_id = $data['transaction_id'] ?? null;
    $new_status = $data['status'] ?? null;
    $shipping = $data['shipping'] ?? [];

    if (!$transaction_id || !$new_status) {
        $flight->json(['success' => false, 'message' => 'Data tidak lengkap'], 400);
        return;
    }

    try {
        // update status transaksi
        $stmt = $pdo->prepare("UPDATE transactions SET status = ? WHERE id = ?");
        $stmt->execute([$new_status, $transaction_id]);

        // kalau dikirim → assign distributor
        if (strtolower($new_status) === 'dikirim' && isset($shipping['distributor_id'])) {
            $distributor_id = $shipping['distributor_id'];

            // cek duplikat
            $stmtCheck = $pdo->prepare("SELECT id FROM distributor_orders WHERE transaction_id = ? AND distributor_id = ?");
            $stmtCheck->execute([$transaction_id, $distributor_id]);

            if (!$stmtCheck->fetch()) {
                $stmt = $pdo->prepare("
                    INSERT INTO distributor_orders (transaction_id, distributor_id, status, assigned_at)
                    VALUES (?, ?, 'assigned', NOW())
                ");
                $stmt->execute([$transaction_id, $distributor_id]);
            }
        }

        $flight->json(['success' => true, 'message' => 'Status transaksi diperbarui']);
    } catch (Exception $e) {
        $flight->json(['success' => false, 'message' => 'Error: ' . $e->getMessage()], 500);
    }
});

// ====== DISTRIBUTOR DASHBOARD ======
$flight->route('GET /distributor/dashboard', function() use ($pdo, $flight) {
    if (!require_distributor_session($flight, $pdo)) return;
    $distributor_id = $_SESSION['user_id'];

    try {
        $stmt = $pdo->prepare("SELECT COUNT(*) AS cnt FROM distributor_orders WHERE distributor_id = ? AND status = 'assigned'");
        $stmt->execute([$distributor_id]);
        $assigned = (int)$stmt->fetch(PDO::FETCH_ASSOC)['cnt'];

        $stmt = $pdo->prepare("SELECT COUNT(*) AS cnt FROM distributor_orders WHERE distributor_id = ? AND status = 'dikirim'");
        $stmt->execute([$distributor_id]);
        $dikirim = (int)$stmt->fetch(PDO::FETCH_ASSOC)['cnt'];

        $stmt = $pdo->prepare("SELECT COUNT(*) AS cnt FROM distributor_orders WHERE distributor_id = ? AND status = 'completed'");
        $stmt->execute([$distributor_id]);
        $completed = (int)$stmt->fetch(PDO::FETCH_ASSOC)['cnt'];

        $flight->json([
            'total_assigned' => $assigned,
            'total_dikirim' => $dikirim,
            'total_completed' => $completed,
        ]);
    } catch (Exception $e) {
        $flight->json(['error' => 'Server error: ' . $e->getMessage()], 500);
    }
});

// ====== DISTRIBUTOR: DAFTAR PESANAN ======
$flight->route('GET /distributor/orders', function() use ($pdo, $flight) {
    if (!require_distributor_session($flight, $pdo)) return;
    $distributor_id = $_SESSION['user_id'] ?? null;
    
    if (!$distributor_id) {
        $flight->json(['error' => 'Unauthorized, no distributor session'], 401);
        return;
    }

    try {
        $stmt = $pdo->prepare("
            SELECT do.id AS distributor_order_id,
                   do.transaction_id,
                   do.status,
                   do.assigned_at,
                   t.total_price,
                   u.name AS customer_name,
                   u.address AS customer_address
            FROM distributor_orders do
            JOIN transactions t ON do.transaction_id = t.id
            JOIN users u ON t.user_id = u.id
            WHERE do.distributor_id = ? 
              AND LOWER(do.status) IN ('assigned','dikirim')
            ORDER BY do.assigned_at DESC
        ");
        $stmt->execute([$distributor_id]);
        $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($orders as &$order) {
            $stmtItems = $pdo->prepare("
                SELECT p.name AS product_name, ti.quantity, ti.price, (ti.quantity * ti.price) AS subtotal
                FROM transaction_item ti
                JOIN products p ON ti.product_id = p.id
                WHERE ti.transaction_id = ?
            ");
            $stmtItems->execute([$order['transaction_id']]);
            $order['items'] = $stmtItems->fetchAll(PDO::FETCH_ASSOC);
        }

        $flight->json(['success' => true, 'orders' => $orders]);
    } catch (Exception $e) {
        $flight->json(['error' => 'Server error: ' . $e->getMessage()], 500);
    }
});

// ====== DISTRIBUTOR: DETAIL PESANAN ======
$flight->route('GET /distributor/orders/@id', function($id) use ($pdo, $flight) {
    if (!require_distributor_session($flight, $pdo)) return;
    $distributor_id = $_SESSION['user_id'];

    try {
        $stmt = $pdo->prepare("
            SELECT do.id AS distributor_order_id,
                   do.transaction_id,
                   do.status,
                   do.assigned_at,
                   do.completed_at,
                   t.total_price,
                   t.created_at AS transaction_created_at,
                   u.id AS customer_id,
                   u.name AS customer_name,
                   u.phone AS customer_phone,
                   u.address AS customer_address
            FROM distributor_orders do
            JOIN transactions t ON do.transaction_id = t.id
            JOIN users u ON t.user_id = u.id
            WHERE do.id = ? AND do.distributor_id = ?
            LIMIT 1
        ");
        $stmt->execute([$id, $distributor_id]);
        $order = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$order) {
            $flight->json(['error' => 'Order not found or unauthorized'], 404);
            return;
        }

        $stmtItems = $pdo->prepare("
            SELECT ti.product_id, p.name AS product_name, ti.quantity, ti.price, (ti.quantity * ti.price) AS subtotal
            FROM transaction_item ti
            JOIN products p ON ti.product_id = p.id
            WHERE ti.transaction_id = ?
        ");
        $stmtItems->execute([$order['transaction_id']]);
        $items = $stmtItems->fetchAll(PDO::FETCH_ASSOC);

        $order['items'] = $items;

        $flight->json(['success' => true, 'order' => $order]);
    } catch (Exception $e) {
        $flight->json(['error' => 'Server error: ' . $e->getMessage()], 500);
    }
});

// ====== DISTRIBUTOR: UPDATE STATUS ======
$flight->route('POST /distributor/orders/update', function() use ($pdo, $flight) {
    if (!require_distributor_session($flight, $pdo)) return;
    $distributor_id = $_SESSION['user_id'];

    $data = $flight->request()->data->getData();
    $distributor_order_id = $data['distributor_order_id'] ?? null;
    $new_status = strtolower(trim($data['status'] ?? ''));

    if (!$distributor_order_id || !$new_status) {
        $flight->json(['error' => 'Parameter tidak lengkap'], 400);
        return;
    }

    // izinkan 3 status
    $allowed = ['assigned','dikirim','completed'];
    if (!in_array($new_status, $allowed)) {
        $flight->json(['error' => 'Status tidak valid'], 400);
        return;
    }

    try {
        $stmt = $pdo->prepare("SELECT id FROM distributor_orders WHERE id = ? AND distributor_id = ? LIMIT 1");
        $stmt->execute([$distributor_order_id, $distributor_id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            $flight->json(['error' => 'Order tidak ditemukan atau bukan milik Anda'], 404);
            return;
        }

        if ($new_status === 'completed') {
            $stmt = $pdo->prepare("UPDATE distributor_orders SET status = ?, completed_at = NOW() WHERE id = ?");
            $stmt->execute([$new_status, $distributor_order_id]);
        } else {
            $stmt = $pdo->prepare("UPDATE distributor_orders SET status = ?, completed_at = NULL WHERE id = ?");
            $stmt->execute([$new_status, $distributor_order_id]);
        }

        $flight->json(['success' => true, 'message' => 'Status berhasil diperbarui']);
    } catch (Exception $e) {
        $flight->json(['error' => 'Server error: ' . $e->getMessage()], 500);
    }
});


// ====== DISTRIBUTOR: COMPLETE ORDER DENGAN BUKTI FOTO ======
$flight->route('POST /distributor/orders/complete', function() use ($pdo, $flight) {
    if (!require_distributor_session($flight, $pdo)) return;
    $distributor_id = $_SESSION['user_id'];

    if (empty($_FILES['proof_image']) || empty($_POST['distributor_order_id'])) {
        $flight->json(['error' => 'File bukti foto atau ID order tidak ada'], 400);
        return;
    }

    $distributor_order_id = $_POST['distributor_order_id'];

    try {
        // cek apakah order benar milik distributor
        $stmt = $pdo->prepare("SELECT id FROM distributor_orders WHERE id = ? AND distributor_id = ? LIMIT 1");
        $stmt->execute([$distributor_order_id, $distributor_id]);
        $order = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$order) {
            $flight->json(['error' => 'Order tidak ditemukan atau bukan milik Anda'], 404);
            return;
        }

        // buat nama file unik
        $targetDir = __DIR__ . "/uploads/proof/"; // absolute path
        if (!is_dir($targetDir)) {
            mkdir($targetDir, 0777, true);
        }

        $filename = "proof_" . $distributor_order_id . "_" . time() . ".png";
        $targetFile = $targetDir . $filename;

        // simpan file
        if (!move_uploaded_file($_FILES['proof_image']['tmp_name'], $targetFile)) {
            $flight->json(['error' => 'Gagal menyimpan file'], 500);
            return;
        }

        // update status + bukti foto (hanya filename ke DB)
        $stmt = $pdo->prepare("
            UPDATE distributor_orders 
            SET status = 'completed', proof_image = ?, completed_at = NOW() 
            WHERE id = ?
        ");
        $stmt->execute([$filename, $distributor_order_id]);
        $stmtTrx = $pdo->prepare("
            UPDATE transactions 
            SET status = 'Completed', delivered_at = NOW() 
            WHERE id = (
                SELECT transaction_id 
                FROM distributor_orders 
                WHERE id = ?
                LIMIT 1
            )
        ");
        $stmtTrx->execute([$distributor_order_id]);

        $flight->json(['success' => true, 'message' => 'Pesanan selesai dengan bukti foto']);
    } catch (Exception $e) {
        $flight->json(['error' => 'Server error: ' . $e->getMessage()], 500);
    }
});


// ====== DISTRIBUTOR: RIWAYAT ======
$flight->route('GET /distributor/history', function() use ($pdo, $flight) {
    if (!require_distributor_session($flight, $pdo)) return;
    $distributor_id = $_SESSION['user_id'];

    try {
        $stmt = $pdo->prepare("
            SELECT do.id AS distributor_order_id,
                   do.transaction_id,
                   do.completed_at,
                   do.proof_image,  
                   t.total_price,
                   u.name AS customer_name,
                   u.address AS customer_address
            FROM distributor_orders do
            JOIN transactions t ON do.transaction_id = t.id
            JOIN users u ON t.user_id = u.id
            WHERE do.distributor_id = ? AND do.status = 'completed'
            ORDER BY do.completed_at DESC
        ");
        $stmt->execute([$distributor_id]);
        $history = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $flight->json($history);
    } catch (Exception $e) {
        $flight->json(['error' => 'Server error: ' . $e->getMessage()], 500);
    }
});



// ====================== PROFILE DISTRIBUTOR ======================

// Ambil data profile
$flight->route('GET /distributor/profile', function () use ($pdo) {
    $user_id = $_GET['user_id'] ?? null;

    if (!$user_id) {
        echo json_encode(['status' => 'error', 'message' => 'User ID diperlukan']);
        return;
    }

    $stmt = $pdo->prepare("SELECT name AS name, email, phone, profile_picture 
                           FROM users WHERE id = ? AND role = 'distributor'");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        echo json_encode($user);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'User tidak ditemukan']);
    }
});

// Update data profile
$flight->route('PUT /distributor/profile', function () use ($pdo) {
    $data = json_decode(file_get_contents("php://input"), true);

    $user_id = $data['user_id'] ?? null;
    $name = $data['name'] ?? null;
    $email    = $data['email'] ?? null;
    $phone    = $data['phone'] ?? null;

    if (!$user_id) {
        echo json_encode(['status' => 'error', 'message' => 'User ID diperlukan']);
        return;
    }

    $stmt = $pdo->prepare("UPDATE users 
                           SET name = ?, email = ?, phone = ? 
                           WHERE id = ? AND role = 'distributor'");
    $stmt->execute([$name, $email, $phone, $user_id]);

    echo json_encode(['status' => 'success']);
});

// Upload foto profil
$flight->route('POST /distributor/upload-photo', function () use ($pdo) {
    if (isset($_FILES['profile_picture']) && isset($_POST['user_id'])) {
        $user_id = $_POST['user_id'];
        $file    = $_FILES['profile_picture'];

        $targetDir = __DIR__ . "/uploads/";
        if (!file_exists($targetDir)) {
            mkdir($targetDir, 0777, true);
        }

        $filename   = uniqid() . "_" . basename($file["name"]);
        $targetFile = $targetDir . $filename;

        if (move_uploaded_file($file["tmp_name"], $targetFile)) {
            $stmt = $pdo->prepare("UPDATE users 
                                   SET profile_picture = ? 
                                   WHERE id = ? AND role = 'distributor'");
            $stmt->execute([$filename, $user_id]);

            echo json_encode(['status' => 'success', 'file' => $filename]);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Upload gagal']);
        }
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Data tidak lengkap']);
    }
});

// Hapus foto profil
$flight->route('POST /distributor/delete-photo', function () use ($pdo) {
    $data    = json_decode(file_get_contents("php://input"), true);
    $user_id = $data['user_id'] ?? null;

    if (!$user_id) {
        echo json_encode(['status' => 'error', 'message' => 'User ID diperlukan']);
        return;
    }

    $stmt = $pdo->prepare("SELECT profile_picture FROM users 
                           WHERE id = ? AND role = 'distributor'");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user && $user['profile_picture']) {
        $filepath = __DIR__ . "/uploads/" . $user['profile_picture'];
        if (file_exists($filepath)) {
            unlink($filepath);
        }

        $stmt = $pdo->prepare("UPDATE users 
                               SET profile_picture = NULL 
                               WHERE id = ? AND role = 'distributor'");
        $stmt->execute([$user_id]);

        echo json_encode(['status' => 'success']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Foto tidak ditemukan']);
    }
});

Flight::map('notFound', function(){
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Endpoint tidak ditemukan']);
    exit;
});

Flight::map('error', function(Exception $ex){
    header('Content-Type: application/json');
    echo json_encode(['error' => $ex->getMessage()]);
    exit;
});



$flight->start();