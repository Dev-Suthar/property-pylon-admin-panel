# 🚀 Quick Start: Deploy to Hostinger

## ✅ YES, you can upload the dist folder!

But first, read this important note:

## ⚠️ CRITICAL: Two-Part Deployment

You need **TWO things**:

1. ✅ **Frontend (dist folder)** → Upload to Hostinger (this is what you're asking about)
2. ⚠️ **Node.js Proxy Server** → Must run on a VPS or separate server (Hostinger shared hosting CANNOT run Node.js)

## 📦 Step 1: Upload Dist Folder to Hostinger

### Via File Manager (Easiest):

1. **Login to Hostinger hPanel**
2. **Go to File Manager**
3. **Navigate to `public_html`** (or your domain's folder)
4. **Upload ALL contents of `dist/` folder:**
   - `.htaccess`
   - `index.html`
   - `assets/` folder (with all files inside)

   ⚠️ **IMPORTANT:** Upload the **contents** of dist, not the dist folder itself!

### Via FTP:

```bash
# Connect to Hostinger FTP
# Upload these to public_html:
- .htaccess
- index.html  
- assets/ (entire folder)
```

## ⚙️ Step 2: Update .htaccess for Your Proxy Server

Your `.htaccess` currently points to `localhost:3002`. You need to update it based on where your proxy server runs:

### Option A: Proxy on Backend Server (Recommended)

If your backend API server can also run the proxy:

1. **On your backend server**, upload `proxy-server.js` and run it
2. **Update `.htaccess` on Hostinger** to point to your backend server:

```apache
# Replace YOUR_BACKEND_IP with your actual backend server IP/domain
RewriteCond %{REQUEST_URI} ^/api/
RewriteRule ^api/(.*)$ http://YOUR_BACKEND_IP:3002/api/$1 [P,L]
```

### Option B: Proxy on Separate VPS

If you have a separate VPS for the proxy:

1. **On the VPS**, set up and run the proxy server
2. **Update `.htaccess` on Hostinger** to point to the VPS:

```apache
# Replace YOUR_VPS_IP with your VPS IP/domain
RewriteCond %{REQUEST_URI} ^/api/
RewriteRule ^api/(.*)$ http://YOUR_VPS_IP:3002/api/$1 [P,L]
```

### Option C: Use Backend API Directly (If No Proxy Needed)

If you want to skip the proxy and call the backend directly (only if backend allows CORS):

```apache
# Point directly to backend API
RewriteCond %{REQUEST_URI} ^/api/
RewriteRule ^api/(.*)$ https://api.dreamtobuy.com/api/v1/$1 [P,L]
```

## 🔧 Step 3: Set Up Proxy Server (If Not Already Done)

### On Your Backend Server or VPS:

```bash
# 1. Upload proxy-server.js and package.json
# 2. Install dependencies
npm install

# 3. Create .env file
cat > .env << EOF
API_BASE_URL=https://api.dreamtobuy.com/api/v1
PROXY_PORT=3002
FRONTEND_URL=https://admin.dreamtobuy.com
NODE_ENV=production
EOF

# 4. Start with PM2 (recommended)
npm install -g pm2
pm2 start proxy-server.js --name api-proxy
pm2 save
pm2 startup
```

## ✅ Step 4: Verify

1. **Visit your site:** `https://admin.dreamtobuy.com`
2. **Check browser console** (F12) for errors
3. **Try logging in** - this will test the API proxy
4. **Check proxy server logs** if issues occur

## 🎯 Recommended Setup

```
Hostinger (Frontend)
├── public_html/
│   ├── .htaccess (points to proxy)
│   ├── index.html
│   └── assets/
│
Backend Server (Proxy + API)
├── proxy-server.js (running on port 3002)
└── backend API (running on port 3000)
```

## 📝 Quick Checklist

- [ ] Dist folder built (`npm run build`)
- [ ] Uploaded dist contents to Hostinger `public_html`
- [ ] Proxy server running on backend/VPS
- [ ] Updated `.htaccess` with correct proxy server IP/domain
- [ ] Tested the site
- [ ] Verified API calls work

## 🆘 Common Issues

**502 Bad Gateway:**
- Proxy server not running or not accessible
- Check proxy server is running: `pm2 list`
- Check firewall allows port 3002

**404 for /api/***:
- `.htaccess` not working
- Check `.htaccess` is in root of `public_html`
- Verify mod_rewrite is enabled on Hostinger

**CORS errors:**
- Proxy not forwarding correctly
- Check proxy server logs
- Verify `FRONTEND_URL` in proxy `.env`

---

**Ready to upload?** Follow Step 1 above! 🚀

