# 📋 Post-Upload Steps: After Uploading Dist Folder to Hostinger

## ✅ Step 1: Verify Upload on Hostinger

1. **Check File Manager:**
   - Login to Hostinger hPanel
   - Go to File Manager → `public_html`
   - Verify these files exist:
     - ✅ `.htaccess`
     - ✅ `index.html`
     - ✅ `assets/` folder (with 4 files inside)

2. **Check File Permissions:**
   - `.htaccess` should be readable (644)
   - `index.html` should be readable (644)
   - `assets/` folder should be readable (755)

## ⚙️ Step 2: Set Up Node.js Proxy Server

**⚠️ IMPORTANT:** Hostinger shared hosting cannot run Node.js. You need to run the proxy on:
- Your backend server (if it's a VPS)
- A separate VPS/server
- Cloud service (AWS, DigitalOcean, etc.)

### Option A: Run Proxy on Backend Server (Recommended)

If your backend API is on a VPS/server:

```bash
# 1. SSH into your backend server
ssh user@your-backend-server

# 2. Navigate to a directory (or create one for the proxy)
cd /opt/property-pylon-proxy
# OR
cd ~/property-pylon-proxy

# 3. Upload proxy-server.js and package.json
# (Use SCP, SFTP, or git to upload these files)

# 4. Install dependencies
npm install express http-proxy-middleware cors dotenv

# 5. Create .env file
cat > .env << EOF
API_BASE_URL=https://api.dreamtobuy.com/api/v1
PROXY_PORT=3002
FRONTEND_URL=https://admin.dreamtobuy.com
NODE_ENV=production
EOF

# 6. Install PM2 (process manager)
npm install -g pm2

# 7. Start the proxy server
pm2 start proxy-server.js --name api-proxy

# 8. Save PM2 configuration
pm2 save

# 9. Set up PM2 to start on boot
pm2 startup
# Follow the instructions it provides

# 10. Check status
pm2 status
pm2 logs api-proxy
```

### Option B: Run Proxy on Separate VPS

Same steps as Option A, but on a different server.

### Option C: Use Backend API Directly (Skip Proxy)

If your backend API allows CORS from your frontend domain, you can skip the proxy:

1. **Update `.htaccess` on Hostinger:**
   ```apache
   # Point directly to backend API
   RewriteCond %{REQUEST_URI} ^/api/
   RewriteRule ^api/(.*)$ https://api.dreamtobuy.com/api/v1/$1 [P,L]
   ```

2. **No proxy server needed!**

## 🔧 Step 3: Update .htaccess on Hostinger

After setting up the proxy server, update `.htaccess` to point to it:

### If Proxy is on Backend Server (Same as API):

```apache
# If backend and proxy are on same server
RewriteCond %{REQUEST_URI} ^/api/
RewriteRule ^api/(.*)$ http://YOUR_BACKEND_IP:3002/api/$1 [P,L]
```

**Replace `YOUR_BACKEND_IP` with:**
- Your backend server's IP address, OR
- Your backend domain (e.g., `api.dreamtobuy.com`)

### If Proxy is on Different Server:

```apache
# If proxy is on separate server
RewriteCond %{REQUEST_URI} ^/api/
RewriteRule ^api/(.*)$ http://YOUR_PROXY_SERVER_IP:3002/api/$1 [P,L]
```

**Replace `YOUR_PROXY_SERVER_IP` with your proxy server's IP or domain.**

### How to Update .htaccess on Hostinger:

1. **Via File Manager:**
   - Go to File Manager → `public_html`
   - Right-click `.htaccess` → Edit
   - Update the RewriteRule line
   - Save

2. **Via FTP:**
   - Download `.htaccess`
   - Edit locally
   - Upload back (overwrite)

3. **Via SSH (if available):**
   ```bash
   nano public_html/.htaccess
   # Edit the file
   # Save: Ctrl+X, then Y, then Enter
   ```

## 🔒 Step 4: Configure Firewall (If Needed)

If your proxy server has a firewall, allow port 3002:

```bash
# Ubuntu/Debian (UFW)
sudo ufw allow 3002/tcp

# CentOS/RHEL (firewalld)
sudo firewall-cmd --permanent --add-port=3002/tcp
sudo firewall-cmd --reload

# Or allow only from Hostinger IP (more secure)
sudo ufw allow from HOSTINGER_IP to any port 3002
```

## ✅ Step 5: Test Your Deployment

### 1. Test Frontend Loading:

```bash
# Visit your site
https://admin.dreamtobuy.com
```

**Expected:** Your React app should load.

### 2. Test API Proxy:

Open browser console (F12) and check:

```javascript
// Try making an API call
fetch('/api/admin/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

**Expected:** Should return API response, not 404 or 502.

### 3. Test Login:

- Try logging in to your admin panel
- This will test the full API proxy flow

### 4. Check Proxy Server Logs:

```bash
# On your proxy server
pm2 logs api-proxy

# Should see incoming requests
```

## 🐛 Step 6: Troubleshooting

### Issue: 502 Bad Gateway

**Cause:** Proxy server not running or not accessible

**Fix:**
```bash
# Check if proxy is running
pm2 status

# Check proxy logs
pm2 logs api-proxy

# Restart if needed
pm2 restart api-proxy

# Verify port is open
netstat -tuln | grep 3002
```

### Issue: 404 Not Found for /api/*

**Cause:** `.htaccess` not working or wrong configuration

**Fix:**
1. Check `.htaccess` is in `public_html` root
2. Verify mod_rewrite is enabled on Hostinger
3. Check `.htaccess` syntax is correct
4. Verify the RewriteRule points to correct IP/domain

### Issue: CORS Errors

**Cause:** Proxy not forwarding requests correctly

**Fix:**
1. Check proxy server logs: `pm2 logs api-proxy`
2. Verify `FRONTEND_URL` in proxy `.env` matches your domain
3. Check proxy server is receiving requests

### Issue: Connection Refused

**Cause:** Firewall blocking port 3002 or proxy not running

**Fix:**
```bash
# Check if proxy is listening
netstat -tuln | grep 3002

# Check firewall
sudo ufw status
# or
sudo firewall-cmd --list-all

# Test connection from Hostinger server (if possible)
curl http://YOUR_PROXY_IP:3002/health
```

### Issue: Site Loads but API Calls Fail

**Cause:** `.htaccess` routing issue

**Fix:**
1. Check browser Network tab - see what URL is being called
2. Verify `.htaccess` RewriteRule is correct
3. Check Apache error logs on Hostinger

## 📊 Step 7: Monitor and Verify

### Check Proxy Server Status:

```bash
pm2 status
pm2 monit
```

### Check Proxy Logs:

```bash
pm2 logs api-proxy --lines 50
```

### Test Health Endpoint:

```bash
curl http://YOUR_PROXY_IP:3002/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "service": "api-proxy",
  "timestamp": "...",
  "backend_url": "https://api.dreamtobuy.com/api/v1"
}
```

## ✅ Final Checklist

- [ ] Files uploaded to Hostinger `public_html`
- [ ] Proxy server running on backend/VPS
- [ ] `.htaccess` updated with correct proxy IP/domain
- [ ] Firewall configured (if needed)
- [ ] Frontend loads correctly
- [ ] API calls work (test login)
- [ ] Proxy server logs show requests
- [ ] No errors in browser console

## 🎯 Quick Reference Commands

```bash
# On Proxy Server:

# Start proxy
pm2 start proxy-server.js --name api-proxy

# Check status
pm2 status

# View logs
pm2 logs api-proxy

# Restart
pm2 restart api-proxy

# Stop
pm2 stop api-proxy

# Delete
pm2 delete api-proxy
```

## 📝 Summary

After uploading dist folder:

1. ✅ **Verify upload** - Check files are in `public_html`
2. ⚙️ **Set up proxy** - Run proxy-server.js on backend/VPS
3. 🔧 **Update .htaccess** - Point to your proxy server IP/domain
4. 🔒 **Configure firewall** - Allow port 3002 (if needed)
5. ✅ **Test** - Visit site and test API calls
6. 🐛 **Troubleshoot** - Fix any issues
7. 📊 **Monitor** - Check logs and status

---

**Need help?** Check the proxy server logs and Hostinger error logs for debugging.

