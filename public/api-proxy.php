<?php
/**
 * API Proxy Script
 * 
 * This script proxies API requests from the frontend to the backend server.
 * It solves the mixed content (HTTPS/HTTP) issue by routing requests through
 * the same domain.
 * 
 * Usage: All requests to /api/* will be forwarded to the backend API server
 * 
 * Configuration priority:
 * 1. Environment variable API_BASE_URL (if set via .htaccess or server config)
 * 2. api.dreamtobuy.com (domain-based, preferred for production)
 * 3. IP address fallback (98.92.75.163:3000)
 */

// Backend API URL Configuration
// Priority: Environment variable > IP fallback
$API_BASE_URL = getenv('API_BASE_URL');

if (!$API_BASE_URL) {
    // Use IP address directly (backend server)
    $API_BASE_URL = 'http://98.92.75.163:3000/api/v1';
}

// Get the path from query parameter (passed by .htaccess rewrite rule)
// Or extract from REQUEST_URI as fallback
$path = '';
if (isset($_GET['path']) && !empty($_GET['path'])) {
    // Path from .htaccess rewrite rule
    $path = '/' . ltrim($_GET['path'], '/');
} else {
    // Fallback: extract from REQUEST_URI
    $request_uri = $_SERVER['REQUEST_URI'];
    $path = parse_url($request_uri, PHP_URL_PATH);
    // Remove /api-proxy.php or /api from the path
    $path = preg_replace('#^/api-proxy\.php#', '', $path);
    $path = preg_replace('#^/api#', '', $path);
    // Ensure path starts with /
    if (empty($path) || $path[0] !== '/') {
        $path = '/' . $path;
    }
}

// If path is still empty, default to root
if (empty($path) || $path === '/') {
    $path = '/';
}

// Get request method (preserve original method)
$method = $_SERVER['REQUEST_METHOD'];

// Debug/test endpoint - show proxy configuration (check before constructing URL)
if (isset($_GET['debug']) && $_GET['debug'] === '1') {
    header('Content-Type: application/json');
    $test_body = file_get_contents('php://input');
    echo json_encode([
        'proxy_status' => 'active',
        'backend_url' => $API_BASE_URL,
        'request_method' => $method,
        'request_path' => $path,
        'constructed_url' => rtrim($API_BASE_URL, '/') . $path,
        'headers_received' => getallheaders(),
        'has_body' => !empty($test_body),
        'body_length' => strlen($test_body),
        'php_version' => PHP_VERSION,
    ]);
    exit;
}

// Construct the full API URL
$api_url = rtrim($API_BASE_URL, '/') . $path;

// Add query string if present (but exclude 'path' parameter which is used for routing)
$query_params = $_GET;
unset($query_params['path']); // Remove 'path' parameter as it's only for routing
unset($query_params['debug']); // Remove debug parameter
if (!empty($query_params)) {
    $query_string = http_build_query($query_params);
    if (!empty($query_string)) {
        $api_url .= '?' . $query_string;
    }
}

// Handle CORS preflight requests
if ($method === 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Access-Control-Max-Age: 86400');
    http_response_code(200);
    exit;
}

// Get request headers (excluding some that shouldn't be forwarded)
$headers = [];
$has_content_type = false;
foreach (getallheaders() as $name => $value) {
    $lower_name = strtolower($name);
    // Skip certain headers that shouldn't be forwarded
    if (!in_array($lower_name, ['host', 'connection'])) {
        $headers[] = "$name: $value";
        if ($lower_name === 'content-type') {
            $has_content_type = true;
        }
    }
}

// Get request body
$body = file_get_contents('php://input');

// Ensure Content-Type is set for POST/PUT/PATCH requests with body
if (in_array($method, ['POST', 'PUT', 'PATCH']) && !empty($body) && !$has_content_type) {
    $headers[] = 'Content-Type: application/json';
}

// Initialize cURL
$ch = curl_init($api_url);

// Set cURL options
$curl_options = [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => false, // Don't follow redirects to preserve method
    CURLOPT_CUSTOMREQUEST => $method, // Preserve original HTTP method
    CURLOPT_HTTPHEADER => $headers,
    CURLOPT_HEADER => true,
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_SSL_VERIFYHOST => false,
    CURLOPT_TIMEOUT => 30,
];

// For POST, PUT, PATCH requests, set the body
if (in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'])) {
    if (!empty($body)) {
        $curl_options[CURLOPT_POSTFIELDS] = $body;
        // Ensure Content-Length is set if body exists
        $content_length_set = false;
        foreach ($headers as $header) {
            if (stripos($header, 'Content-Length:') === 0) {
                $content_length_set = true;
                break;
            }
        }
        if (!$content_length_set) {
            $headers[] = 'Content-Length: ' . strlen($body);
            $curl_options[CURLOPT_HTTPHEADER] = $headers;
        }
    }
}

curl_setopt_array($ch, $curl_options);

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
            'message' => 'Proxy error: ' . $error,
            'url' => $api_url,
            'path' => $path
        ]
    ]);
    exit;
}

// Handle empty response (might indicate connection issue)
if ($response === false || empty($response)) {
    http_response_code(502);
    header('Content-Type: application/json');
    echo json_encode([
        'error' => [
            'message' => 'Proxy error: Empty response from backend',
            'url' => $api_url,
            'curl_error' => $error
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

