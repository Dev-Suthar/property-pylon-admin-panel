# Troubleshoot 503 Service Unavailable Error

## ✅ Good News
The frontend is now using the correct path: `/api/auth/login` (relative path)

## ❌ Problem
Getting 503 error means the proxy server on EC2 is not reachable from Hostinger.

## 🔍 Step-by-Step Troubleshooting

### Step 1: Verify Proxy is Running on EC2

**On your EC2 server, run:**
```bash
pm2 status
```

**Expected output:**
```
┌────┬───────────────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┐
│ id │ name                  │ mode    │ pid     │ uptime   │ ↺      │ status    │
├────┼───────────────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┤
│ 0  │ property-pylon-api    │ cluster │ 12345   │ 1h       │ 0      │ online    │
│ 1  │ property-pylon-api    │ cluster │ 12346   │ 1h       │ 0      │ online    │
│ 2  │ admin-api-proxy        │ fork    │ 12347   │ 1h       │ 0      │ online    │ ← Should be online
└────┴───────────────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┘
```

**If `admin-api-proxy` is not online:**
```bash
# Check logs
pm2 logs admin-api-proxy --err --lines 50

# Restart it
pm2 restart admin-api-proxy

# Or start it if it's not running
pm2 start proxy-server.js --name admin-api-proxy
```

### Step 2: Test Proxy Locally on EC2

**On your EC2 server:**
```bash
curl http://localhost:3002/health
```

**Expected response:**
```json
{
  "status": "ok",
  "service": "admin-api-proxy",
  "timestamp": "...",
  "backend_url": "http://localhost:3000/api/v1",
  "proxy_port": 3002
}
```

**If this fails**, the proxy isn't running properly. Check logs:
```bash
pm2 logs admin-api-proxy --lines 50
```

### Step 3: Check .htaccess on Hostinger

**On Hostinger, edit `.htaccess` in `public_html`:**

**Line 19 should be:**
```apache
RewriteRule ^api/(.*)$ http://YOUR_EC2_IP:3002/api/$1 [P,L]
```

**NOT:**
```apache
RewriteRule ^api/(.*)$ http://localhost:3002/api/$1 [P,L]
```

**Replace `YOUR_EC2_IP` with your actual EC2 public IP** (e.g., `98.92.75.163`)

**Example:**
```apache
RewriteRule ^api/(.*)$ http://98.92.75.163:3002/api/$1 [P,L]
```

### Step 4: Test Proxy from Outside (Your Local Machine)

**From your local machine (not on EC2):**
```bash
# Replace with your EC2 public IP
curl http://YOUR_EC2_IP:3002/health
```

**If this fails**, the security group or firewall is blocking port 3002.

### Step 5: Open Port 3002 in EC2 Security Group

**In AWS Console:**
1. Go to **EC2** → **Instances**
2. Select your EC2 instance
3. Click **Security** tab
4. Click on the **Security Group** link
5. Click **Edit inbound rules**
6. Click **Add rule**:
   - **Type:** Custom TCP
   - **Port:** 3002
   - **Source:** 0.0.0.0/0 (or Hostinger's IP for better security)
   - **Description:** Admin Panel Proxy
7. Click **Save rules**

### Step 6: Configure Firewall on EC2

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

### Step 7: Verify Port is Listening

**On your EC2 server:**
```bash
# Check if proxy is listening on port 3002
sudo lsof -i :3002
```

**Expected output:**
```
COMMAND   PID     USER   FD   TYPE DEVICE SIZE/OFF NODE NAME
node      12347   ec2-user   21u  IPv4  12345      0t0  TCP *:3002 (LISTEN)
```

### Step 8: Test Full Flow

**From your local machine:**
```bash
# Test proxy health
curl http://YOUR_EC2_IP:3002/health

# Test actual API call through proxy
curl -X POST http://YOUR_EC2_IP:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'
```

## ✅ Checklist

- [ ] Proxy server running on EC2 (`pm2 status` shows `admin-api-proxy` as online)
- [ ] Proxy responds locally (`curl http://localhost:3002/health` works)
- [ ] `.htaccess` on Hostinger points to EC2 IP (not localhost)
- [ ] Port 3002 open in EC2 Security Group
- [ ] Firewall allows port 3002 on EC2
- [ ] Can access proxy from outside (`curl http://EC2_IP:3002/health` works)
- [ ] Test login on admin panel

## 🐛 Common Issues

### Issue: Proxy not in PM2 status
**Fix:** Start it: `pm2 start proxy-server.js --name admin-api-proxy`

### Issue: Port 3002 not accessible from outside
**Fix:** Check security group and firewall (Steps 5 & 6)

### Issue: .htaccess still has localhost
**Fix:** Update to EC2 IP address (Step 3)

### Issue: Proxy can't reach backend
**Fix:** Check backend is running: `pm2 status` should show `property-pylon-api` online

## 📝 Quick Test Commands

```bash
# On EC2 - Check everything
pm2 status
curl http://localhost:3002/health
sudo lsof -i :3002
sudo ufw status

# From local machine - Test external access
curl http://YOUR_EC2_IP:3002/health
```

