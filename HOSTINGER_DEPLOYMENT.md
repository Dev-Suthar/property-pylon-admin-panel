# Hostinger Deployment Guide

## ⚠️ Important: Two Components Required

Before uploading, understand that you need **TWO separate deployments**:

1. **Frontend (dist folder)** → Upload to Hostinger
2. **Node.js Proxy Server** → Must run separately (Hostinger VPS or separate server)

## 📋 Pre-Deployment Checklist

- [ ] Dist folder is built (`npm run build`)
- [ ] Node.js proxy server is ready
- [ ] Backend API is accessible
- [ ] Environment variables configured

## 🚀 Step 1: Upload Dist Folder to Hostinger

### Option A: Using File Manager (cPanel)

1. **Login to Hostinger**
   - Go to hPanel (Hostinger control panel)
   - Navigate to **File Manager**

2. **Navigate to public_html**
   - Go to `public_html` folder (or your domain's root folder)
   - **IMPORTANT:** If you have a subdomain like `admin.yourdomain.com`, use that folder instead

3. **Upload dist folder contents**
   - **DO NOT upload the `dist` folder itself**
   - Upload **all contents** of the `dist` folder:
     - `.htaccess`
     - `index.html`
     - `assets/` folder (with all files inside)

4. **Verify upload**
   - Check that `.htaccess` is in the root
   - Check that `index.html` is in the root
   - Check that `assets/` folder exists with all 4 files

### Option B: Using FTP/SFTP

```bash
# Using FTP client (FileZilla, WinSCP, etc.)
# Connect to your Hostinger FTP server

# Upload these files/folders to public_html:
- .htaccess
- index.html
- assets/ (entire folder with contents)
```

### Option C: Using SSH (if available)

```bash
# If you have SSH access
cd /home/username/domains/yourdomain.com/public_html

# Upload via SCP or rsync
scp -r dist/* username@yourdomain.com:/home/username/domains/yourdomain.com/public_html/
```

## ⚙️ Step 2: Configure Node.js Proxy Server

### ⚠️ CRITICAL: Hostinger Shared Hosting Limitation

**Hostinger shared hosting does NOT support running Node.js applications!**

You have **3 options**:

### Option 1: Use Hostinger VPS (Recommended)

If you have a VPS plan:

1. **SSH into your VPS**
2. **Install Node.js** (if not already installed)
3. **Upload proxy-server.js** to your VPS
4. **Set up the proxy server:**

```bash
# On your VPS
cd /path/to/proxy-server
npm install express http-proxy-middleware cors dotenv

# Create .env file
cat > .env << EOF
API_BASE_URL=https://api.dreamtobuy.com/api/v1
PROXY_PORT=3002
FRONTEND_URL=https://admin.dreamtobuy.com
NODE_ENV=production
EOF

# Start with PM2 (recommended)
npm install -g pm2
pm2 start proxy-server.js --name api-proxy
pm2 save
pm2 startup
```

5. **Configure firewall** to allow port 3002 (if needed)

### Option 2: Use Separate Server for Proxy

Run the proxy server on:
- A different VPS
- Your backend server (if it's on a VPS)
- A cloud service (AWS, DigitalOcean, etc.)

Then update `.htaccess` to point to that server's IP/domain.

### Option 3: Use Backend Server as Proxy (Simplest)

If your backend API is on a VPS/server, you can run the proxy there:

```bash
# On your backend server
cd /path/to/property-pylon-admin-panel
npm install
npm run proxy:prod

# Or use PM2
pm2 start proxy-server.js --name admin-proxy
```

Then update `.htaccess` on Hostinger to point to your backend server.

## 📝 Step 3: Update .htaccess for Your Setup

### If Proxy is on Same Server (VPS)

Edit `.htaccess` on Hostinger:

```apache
# If proxy is on localhost (same server)
RewriteCond %{REQUEST_URI} ^/api/
RewriteRule ^api/(.*)$ http://localhost:3002/api/$1 [P,L]
```

### If Proxy is on Different Server

Edit `.htaccess` on Hostinger:

```apache
# Replace YOUR_PROXY_SERVER_IP with actual IP or domain
RewriteCond %{REQUEST_URI} ^/api/
RewriteRule ^api/(.*)$ http://YOUR_PROXY_SERVER_IP:3002/api/$1 [P,L]
```

Or use ProxyPass (if mod_proxy is enabled):

```apache
ProxyPass /api http://YOUR_PROXY_SERVER_IP:3002/api
ProxyPassReverse /api http://YOUR_PROXY_SERVER_IP:3002/api
```

## 🔧 Step 4: Verify Apache Modules

Hostinger needs these Apache modules enabled:
- `mod_rewrite` (usually enabled)
- `mod_proxy` (for ProxyPass, optional)
- `mod_proxy_http` (for ProxyPass, optional)

If `mod_proxy` is not available, use the `mod_rewrite` method (already in your `.htaccess`).

## ✅ Step 5: Test Deployment

1. **Visit your domain:** `https://admin.dreamtobuy.com`
2. **Check browser console** for errors
3. **Test API endpoint:** Try logging in or making an API call
4. **Check proxy logs** on the server running the proxy

## 🐛 Troubleshooting

### Issue: 502 Bad Gateway
- **Cause:** Proxy server not running or not accessible
- **Fix:** Ensure proxy server is running and accessible from Hostinger

### Issue: 404 Not Found for /api/*
- **Cause:** `.htaccess` not working or mod_rewrite disabled
- **Fix:** Check `.htaccess` is in root, verify mod_rewrite is enabled

### Issue: CORS errors
- **Cause:** Proxy not forwarding requests correctly
- **Fix:** Check proxy server logs, verify API_BASE_URL in proxy .env

### Issue: Compression/garbled responses
- **Cause:** This should NOT happen with Node.js proxy (it handles compression automatically)
- **Fix:** If it does, check proxy server configuration

## 📊 Recommended Architecture

```
┌─────────────────┐
│   Hostinger     │
│  (Frontend)     │
│  - dist/ files  │
│  - .htaccess    │
└────────┬────────┘
         │
         │ /api/* requests
         ▼
┌─────────────────┐
│  Proxy Server   │
│  (Node.js)      │
│  Port: 3002     │
└────────┬────────┘
         │
         │ Forwarded requests
         ▼
┌─────────────────┐
│  Backend API    │
│  api.dreamtobuy  │
│  .com           │
└─────────────────┘
```

## 🎯 Quick Deployment Commands

### On Hostinger (via File Manager or FTP):
1. Upload `dist/` contents to `public_html/`
2. Verify `.htaccess` is in root

### On Proxy Server (VPS/Backend Server):
```bash
# Upload proxy-server.js and package.json
npm install
# Create .env with your API URL
npm run proxy:prod
# Or with PM2:
pm2 start proxy-server.js --name api-proxy
```

## ⚠️ Important Notes

1. **Hostinger shared hosting CANNOT run Node.js** - You need VPS or separate server
2. **Proxy must be accessible** from Hostinger (same network or public IP)
3. **Port 3002 must be open** if proxy is on different server
4. **SSL/HTTPS:** If using HTTPS, ensure proxy server also supports HTTPS or use a reverse proxy

## 🔐 Security Considerations

1. **Firewall:** Only allow port 3002 from Hostinger IP (if possible)
2. **Environment variables:** Never commit `.env` files
3. **HTTPS:** Use HTTPS for all connections in production
4. **Rate limiting:** Consider adding rate limiting to proxy server

---

**Need help?** Check the proxy server logs and Hostinger error logs for debugging.

