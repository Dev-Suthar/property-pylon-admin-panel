/**
 * API Proxy Server
 * 
 * This Node.js proxy server replaces the PHP proxy and handles API requests
 * from the frontend to the backend server. It properly handles compression
 * and works seamlessly with the JavaScript stack.
 * 
 * Usage:
 *   Development: npm run proxy
 *   Production: npm run proxy:prod
 */

import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PROXY_PORT || 3002;

// Get backend API base URL from environment or use default
// This should be the base domain, not including /api/v1
const API_BASE_URL = process.env.API_BASE_URL || 'https://api.dreamtobuy.com';

// CORS configuration - allow requests from the frontend
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Accept-Encoding'],
}));

// Body parsing middleware for debugging
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'api-proxy',
        timestamp: new Date().toISOString(),
        backend_url: API_BASE_URL,
    });
});

// Debug endpoint
app.get('/debug', (req, res) => {
    res.json({
        proxy_status: 'active',
        backend_url: API_BASE_URL,
        request_method: req.method,
        request_path: req.path,
        headers_received: req.headers,
        node_version: process.version,
    });
});

// Proxy middleware configuration
const proxyOptions = {
    target: API_BASE_URL,
    changeOrigin: true,
    pathRewrite: {
        '^/api': '/api/v1', // Replace /api with /api/v1 to match backend path structure
    },
    // The backend expects /api/v1/... paths
    // Example: /api/auth/login -> https://api.dreamtobuy.com/api/v1/auth/login
    onProxyReq: (proxyReq, req, res) => {
        // Forward all headers except host
        Object.keys(req.headers).forEach((key) => {
            if (key !== 'host' && key !== 'connection') {
                proxyReq.setHeader(key, req.headers[key]);
            }
        });

        // Ensure proper headers
        proxyReq.setHeader('Host', new URL(API_BASE_URL).host);

        // Log request in development
        if (process.env.NODE_ENV === 'development') {
            console.log(`[Proxy] ${req.method} ${req.path} -> ${API_BASE_URL}${req.path}`);
        }
    },
    onProxyRes: (proxyRes, req, res) => {
        // Remove compression-related headers since we're handling it
        // The response from backend is already compressed if Accept-Encoding was set
        // We just pass it through - Node.js/http-proxy-middleware handles this automatically

        // Log response in development
        if (process.env.NODE_ENV === 'development') {
            console.log(`[Proxy] ${req.method} ${req.path} <- ${proxyRes.statusCode}`);
        }
    },
    onError: (err, req, res) => {
        console.error('[Proxy Error]', err.message);
        res.status(500).json({
            error: {
                message: 'Proxy error: ' + err.message,
                url: API_BASE_URL + req.path,
            },
        });
    },
    // Timeout configuration
    proxyTimeout: 30000,
    timeout: 30000,
    // WebSocket support (if needed)
    ws: false,
    // Don't follow redirects
    followRedirects: false,
    // Preserve headers
    preserveHeaderKeyCase: true,
};

// Apply proxy middleware to all /api/* routes
app.use('/api', createProxyMiddleware(proxyOptions));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('[Server Error]', err);
    res.status(500).json({
        error: {
            message: 'Internal server error',
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
        },
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: {
            message: 'Not found',
            path: req.path,
        },
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🚀 API Proxy Server Started');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`📡 Proxy URL: http://localhost:${PORT}/api`);
    console.log(`🔗 Backend URL: ${API_BASE_URL}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('═══════════════════════════════════════════════════════════');
    console.log('💡 Health Check: http://localhost:' + PORT + '/health');
    console.log('💡 Debug Info: http://localhost:' + PORT + '/debug');
    console.log('═══════════════════════════════════════════════════════════');
});

export default app;

