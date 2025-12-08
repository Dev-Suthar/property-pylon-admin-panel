# Fix 503 Service Unavailable Error

## 🔍 Problem
The `.htaccess` file on Hostinger is pointing to `localhost:3002`, but it needs to point to your EC2 server's IP or domain.

## ✅ Solution Steps

### Step 1: Update .htaccess on Hostinger

**On Hostinger**, edit the `.htaccess` file in `public_html`:

**Change this line (line 19):**
```apache
RewriteRule ^api/(.*)$ http://localhost:3002/api/$1 [P,L]
```

**To this (replace with your EC2 server IP or domain):**
```apache
RewriteRule ^api/(.*)$ http://YOUR_EC2_IP:3002/api/$1 [P,L]
```

**Or if you have a domain for your backend:**
```apache
RewriteRule ^api/(.*)$ http://api.dreamtobuy.com:3002/api/$1 [P,L]
```

**Example:**
```apache
RewriteRule ^api/(.*)$ http://98.92.75.163:3002/api/$1 [P,L]
```

### Step 2: Verify Proxy is Running on EC2

**On your EC2 server:**
```bash
# Check PM2 status
pm2 status
# Should see admin-api-proxy as "online"

# Test proxy locally
curl http://localhost:3002/health
# Should return JSON

# Check if proxy is listening
sudo lsof -i :3002
# Should show node process
```

### Step 3: Open Port 3002 in EC2 Security Group

**In AWS Console:**
1. Go to EC2 → Security Groups
2. Find your EC2 instance's security group
3. Edit Inbound Rules
4. Add rule:
   - Type: Custom TCP
   - Port: 3002
   - Source: 0.0.0.0/0 (or Hostinger's IP for better security)
   - Description: Admin Panel Proxy

### Step 4: Configure Firewall on EC2

**On your EC2 server:**
```bash
# Check firewall status
sudo ufw status

# Allow port 3002
sudo ufw allow 3002/tcp

# If using firewalld (CentOS/RHEL):
sudo firewall-cmd --permanent --add-port=3002/tcp
sudo firewall-cmd --reload
```

### Step 5: Test Connection

**From your local machine:**
```bash
# Replace with your EC2 public IP
curl http://YOUR_EC2_IP:3002/health

# Should return JSON with status: "ok"
```

**If this fails**, the security group or firewall is blocking it.

### Step 6: Verify .htaccess is Updated

**On Hostinger:**
1. Go to File Manager → `public_html`
2. Edit `.htaccess`
3. Verify line 19 points to your EC2 server (not localhost)
4. Save

## 🔧 Alternative: Use mod_proxy (If Available)

If Hostinger has `mod_proxy` enabled, you can use this instead:

```apache
ProxyPass /api http://YOUR_EC2_IP:3002/api
ProxyPassReverse /api http://YOUR_EC2_IP:3002/api
ProxyPreserveHost On
```

## ✅ Checklist

- [ ] `.htaccess` updated to point to EC2 IP (not localhost)
- [ ] Proxy server running on EC2 (pm2 status shows online)
- [ ] Port 3002 open in EC2 Security Group
- [ ] Firewall allows port 3002 on EC2
- [ ] Can curl proxy from outside: `curl http://EC2_IP:3002/health`
- [ ] Test login on admin panel

## 🐛 Still Getting 503?

1. **Check proxy logs:**
   ```bash
   pm2 logs admin-api-proxy --lines 50
   ```

2. **Check if proxy can reach backend:**
   ```bash
   # On EC2 server
   curl http://localhost:3000/api/v1/health
   ```

3. **Check Apache error logs on Hostinger** (if accessible)

4. **Verify .htaccess syntax** - make sure there are no typos

