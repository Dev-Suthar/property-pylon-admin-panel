<?php
/**
 * API Proxy Script
 * 
 * This script proxies API requests from the frontend to the backend server.
 * It solves the mixed content (HTTPS/HTTP) issue by routing requests through
 * the same domain.
 * 
 * Usage: All requests to /api/* will be forwarded to http://98.92.75.163:3000/api/v1/*
 */

// Backend API URL
$API_BASE_URL = 'http://98.92.75.163:3000/api/v1';

// Get the path from query parameter (passed by .htaccess rewrite rule)
// Or extract from REQUEST_URI as fallback
if (isset($_GET['path'])) {
    $path = '/' . ltrim($_GET['path'], '/');
} else {
    $request_uri = $_SERVER['REQUEST_URI'];
    $path = parse_url($request_uri, PHP_URL_PATH);
    // Remove /api-proxy.php or /api from the path
    $path = preg_replace('#^/api-proxy\.php#', '', $path);
    $path = preg_replace('#^/api#', '', $path);
}

// Construct the full API URL
$api_url = rtrim($API_BASE_URL, '/') . $path;

// Add query string if present
if (!empty($_SERVER['QUERY_STRING'])) {
    $api_url .= '?' . $_SERVER['QUERY_STRING'];
}

// Get request method
$method = $_SERVER['REQUEST_METHOD'];

// Get request headers (excluding some that shouldn't be forwarded)
$headers = [];
foreach (getallheaders() as $name => $value) {
    $lower_name = strtolower($name);
    // Skip certain headers
    if (!in_array($lower_name, ['host', 'connection', 'content-length'])) {
        $headers[] = "$name: $value";
    }
}

// Get request body
$body = file_get_contents('php://input');

// Initialize cURL
$ch = curl_init($api_url);

// Set cURL options
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_CUSTOMREQUEST => $method,
    CURLOPT_HTTPHEADER => $headers,
    CURLOPT_HEADER => true,
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_SSL_VERIFYHOST => false,
    CURLOPT_TIMEOUT => 30,
]);

// Add request body for POST, PUT, PATCH requests
if (in_array($method, ['POST', 'PUT', 'PATCH']) && !empty($body)) {
    curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
}

// Execute request
$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$header_size = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$error = curl_error($ch);

curl_close($ch);

// Handle cURL errors
if ($error) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'error' => [
            'message' => 'Proxy error: ' . $error
        ]
    ]);
    exit;
}

// Split response into headers and body
$response_headers = substr($response, 0, $header_size);
$response_body = substr($response, $header_size);

// Parse and forward response headers
$header_lines = explode("\r\n", $response_headers);
foreach ($header_lines as $header_line) {
    if (empty($header_line)) continue;
    
    $header_parts = explode(':', $header_line, 2);
    if (count($header_parts) === 2) {
        $header_name = trim($header_parts[0]);
        $header_value = trim($header_parts[1]);
        
        // Skip certain headers
        if (!in_array(strtolower($header_name), ['transfer-encoding', 'connection', 'content-encoding'])) {
            header("$header_name: $header_value");
        }
    }
}

// Set HTTP status code
http_response_code($http_code);

// Output response body
echo $response_body;
?>

