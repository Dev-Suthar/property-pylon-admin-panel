# Migration from PHP Proxy to Node.js Proxy

This guide explains how to migrate from the PHP proxy (`api-proxy.php`) to the new Node.js proxy server.

## Why Migrate?

- ✅ Better integration with JavaScript/TypeScript stack
- ✅ Automatic compression handling (no manual decompression needed)
- ✅ Better error handling and logging
- ✅ Easier to maintain and debug
- ✅ Works seamlessly with Vite development server

## Setup

### 1. Install Dependencies

```bash
npm install
```

This will install:
- `express` - Web server framework
- `http-proxy-middleware` - Proxy middleware
- `cors` - CORS support
- `dotenv` - Environment variable management
- `concurrently` - Run multiple processes (dev dependency)

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Update the values:
```env
API_BASE_URL=https://api.dreamtobuy.com/api/v1
PROXY_PORT=3002
FRONTEND_URL=http://localhost:3001
NODE_ENV=development
```

### 3. Development Usage

#### Option A: Run Proxy and Dev Server Separately

Terminal 1 - Start the proxy:
```bash
npm run proxy
```

Terminal 2 - Start the dev server:
```bash
npm run dev
```

#### Option B: Run Both Together (Recommended)

```bash
npm run dev:with-proxy
```

This runs both the proxy server and Vite dev server concurrently.

### 4. Production Deployment

#### Option A: Run as Separate Service (Recommended)

1. **Start the proxy server:**
   ```bash
   npm run proxy:prod
   ```

2. **Configure Apache/Nginx to route to the proxy:**

   For Apache, update `.htaccess` to use the Node.js proxy:
   ```apache
   # Route /api/* to Node.js proxy
   ProxyPass /api http://localhost:3002/api
   ProxyPassReverse /api http://localhost:3002/api
   ```

   Or use the provided `.htaccess.nodejs` file:
   ```bash
   cp .htaccess.nodejs .htaccess
   ```

3. **Use PM2 or systemd to keep the proxy running:**

   **PM2:**
   ```bash
   npm install -g pm2
   pm2 start proxy-server.js --name api-proxy
   pm2 save
   pm2 startup
   ```

   **systemd:**
   Create `/etc/systemd/system/api-proxy.service`:
   ```ini
   [Unit]
   Description=Property Pylon API Proxy
   After=network.target

   [Service]
   Type=simple
   User=www-data
   WorkingDirectory=/path/to/property-pylon-admin-panel
   Environment="NODE_ENV=production"
   Environment="API_BASE_URL=https://api.dreamtobuy.com/api/v1"
   Environment="PROXY_PORT=3002"
   ExecStart=/usr/bin/node proxy-server.js
   Restart=always
   RestartSec=10

   [Install]
   WantedBy=multi-user.target
   ```

   Then:
   ```bash
   sudo systemctl enable api-proxy
   sudo systemctl start api-proxy
   ```

#### Option B: Use Nginx Reverse Proxy

If you're using Nginx, configure it to route `/api/*` to the Node.js proxy:

```nginx
location /api/ {
    proxy_pass http://localhost:3002;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
}
```

## Features

### Automatic Compression Handling
The Node.js proxy automatically handles compression. The backend sends compressed responses, and the proxy passes them through without manual decompression.

### Health Check Endpoint
- `GET /health` - Check proxy server status
- `GET /debug` - Get debug information

### Testing
Run the test script to verify the proxy is working:
```bash
# Start proxy in one terminal
npm run proxy

# Run tests in another terminal
npm run test:proxy
```

### Error Handling
The proxy includes comprehensive error handling and logging for easier debugging.

## Quick Start

1. **Run the setup script:**
   ```bash
   ./setup-proxy.sh
   ```

2. **Test the proxy server:**
   ```bash
   # Terminal 1: Start the proxy
   npm run proxy
   
   # Terminal 2: Run tests
   npm run test:proxy
   ```

3. **Start development with proxy:**
   ```bash
   npm run dev:with-proxy
   ```

## Migration Checklist

- [x] Install dependencies (`npm install`)
- [x] Create `.env` file with configuration
- [ ] Test in development (`npm run dev:with-proxy`)
- [ ] Update production `.htaccess` or Nginx config
- [ ] Set up process manager (PM2/systemd)
- [ ] Test production deployment
- [x] Remove old PHP proxy files:
  - ✅ `public/api-proxy.php` (removed)
  - ✅ `dist/api-proxy.php` (removed)

## Troubleshooting

### Proxy not starting
- Check if port 3002 is available: `lsof -i :3002`
- Check environment variables in `.env`
- Check logs for errors

### API requests failing
- Verify `API_BASE_URL` is correct
- Check backend server is accessible
- Verify CORS settings if needed

### Compression issues
- The Node.js proxy handles compression automatically
- No manual decompression needed
- Check backend compression settings if responses are too large

## Rollback

If you need to rollback to PHP proxy:
1. Restore original `.htaccess` file
2. Ensure `api-proxy.php` is in `public/` and `dist/` directories
3. Restart Apache/web server

