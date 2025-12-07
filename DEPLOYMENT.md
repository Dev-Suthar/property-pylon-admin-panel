# Deployment Guide for admin.dreamtobuy.com

This guide walks you through deploying the Property Pylon Admin Panel to `admin.dreamtobuy.com` on Hostinger shared hosting.

## Prerequisites

- Node.js >= 18.0.0 installed on your local machine
- Access to Hostinger hosting account
- Subdomain `admin.dreamtobuy.com` already created in Hostinger (see below if not created)

## Step 1: Create Subdomain in Hostinger (if not already done)

1. Log in to your Hostinger account at [hpanel.hostinger.com](https://hpanel.hostinger.com)
2. Navigate to **Domains** → **Subdomains**
3. Click **Create** or **Add Subdomain**
4. Enter:
   - **Subdomain**: `admin`
   - **Domain**: `dreamtobuy.com`
5. Note the **Directory** path (typically: `/home/u[username]/domains/dreamtobuy.com/public_html/admin`)
6. Click **Create**

## Step 2: Configure Environment Variables (Optional)

If you need to change the API URL for production:

1. Create a `.env` file in the project root (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and set your production API URL:
   ```
   VITE_API_URL=https://api.dreamtobuy.com/api/v1
   ```

   **Note**: If you don't create a `.env` file, the app will use the default API URL: `http://98.92.75.163:3000/api/v1`

## Step 3: Build the Application

1. Install dependencies (if not already done):
   ```bash
   npm install
   ```

2. Build the application for production:
   ```bash
   npm run build
   ```

   This creates a `dist/` directory with all production-ready files.

## Step 4: Upload Files to Hostinger

You have two options for uploading files:

### Option A: Using Hostinger File Manager

1. Log in to Hostinger hPanel
2. Navigate to **Files** → **File Manager**
3. Browse to your subdomain directory:
   ```
   /domains/dreamtobuy.com/public_html/admin
   ```
4. **Important**: Make sure you're in the `admin` folder (not `public_html`)
5. Delete any existing files in this directory (if any)
6. Upload all files from your local `dist/` folder:
   - Select all files in `dist/` (including `index.html`, `assets/` folder, `.htaccess`, etc.)
   - Upload them to the `admin` directory
   - Ensure `.htaccess` is uploaded (it may be hidden - enable "Show hidden files" in File Manager)

### Option B: Using FTP Client

1. Get your FTP credentials from Hostinger:
   - Go to **Hosting** → **Manage** → **FTP Accounts**
   - Note your FTP host, username, and password

2. Connect using an FTP client (FileZilla, Cyberduck, etc.):
   - **Host**: `ftp.dreamtobuy.com` or your FTP host
   - **Username**: Your FTP username
   - **Password**: Your FTP password
   - **Port**: 21 (or 22 for SFTP)

3. Navigate to:
   ```
   /domains/dreamtobuy.com/public_html/admin
   ```

4. Upload all contents from your local `dist/` folder to the `admin` directory

## Step 5: Verify .htaccess File

The `.htaccess` file is crucial for React Router to work correctly. Ensure it's uploaded to the subdomain root directory.

The file should be located at:
```
/domains/dreamtobuy.com/public_html/admin/.htaccess
```

If it's missing, you can create it directly in File Manager or re-upload it from the `dist/` folder.

## Step 6: Set File Permissions (if needed)

In File Manager, ensure file permissions are set correctly:
- Files: `644`
- Folders: `755`

Right-click on files/folders → **Change Permissions** → Set the values above.

## Step 7: Verify Deployment

1. Wait a few minutes for DNS propagation (if subdomain was just created)
2. Open your browser and visit: `https://admin.dreamtobuy.com`
3. Verify:
   - The admin panel loads correctly
   - Login page appears
   - Navigation works (try clicking different menu items)
   - No console errors in browser DevTools (F12)

## Troubleshooting

### Issue: Blank page or 404 errors

**Solution**: 
- Verify `.htaccess` file is present in the subdomain directory
- Check that you uploaded files to the correct directory (`admin`, not `public_html`)
- Ensure Apache mod_rewrite is enabled (contact Hostinger support if needed)

### Issue: Assets not loading (CSS/JS files 404)

**Solution**:
- Check browser console for exact file paths
- Verify all files from `dist/` folder were uploaded
- Ensure `assets/` folder and its contents were uploaded
- Check file permissions (should be 644 for files)

### Issue: API calls failing

**Solution**:
- Verify your API server is accessible from the internet
- Check if API URL needs to be updated in `.env` before building
- Review browser console Network tab for API request errors
- Ensure CORS is configured on your backend API

### Issue: Routing doesn't work (direct URL access shows 404)

**Solution**:
- Verify `.htaccess` file is present and correct
- Check that mod_rewrite is enabled on your server
- Contact Hostinger support to enable mod_rewrite if needed

## Updating the Deployment

When you make changes to the code:

1. Make your code changes locally
2. Rebuild the application:
   ```bash
   npm run build
   ```
3. Upload the new `dist/` contents to replace the old files in Hostinger
4. Clear browser cache or do a hard refresh (Ctrl+F5 / Cmd+Shift+R)

## Directory Structure After Deployment

Your Hostinger subdomain directory should look like this:

```
/domains/dreamtobuy.com/public_html/admin/
├── index.html
├── .htaccess
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── [other asset files]
└── [other static files]
```

## Additional Notes

- The `.htaccess` file handles client-side routing for React Router
- All environment variables are embedded at build time (not runtime)
- To change the API URL, you must rebuild the application with the new `.env` values
- The build output is optimized and minified for production
- Static assets are cached for better performance (configured in `.htaccess`)

## Support

If you encounter issues not covered here:
1. Check Hostinger documentation: [hostinger.com/tutorials](https://www.hostinger.com/tutorials)
2. Contact Hostinger support for server-related issues
3. Review browser console and network logs for application errors

