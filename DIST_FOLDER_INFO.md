# Dist Folder Structure

## ✅ Current Structure (Correct)

The `dist/` folder contains:

```
dist/
├── .htaccess          # Production Apache configuration (copied from public/)
├── index.html         # Built HTML file
└── assets/            # Built JavaScript and CSS files
    ├── index-*.css
    ├── index-*.js
    ├── ui-*.js
    └── vendor-*.js
```

## 📝 Important Notes

### 1. `.htaccess.nodejs` is NOT needed in dist
- `.htaccess.nodejs` is a **template/reference file** in the root directory
- It's meant for manual Apache configuration reference
- It does NOT need to be in the `dist/` folder
- The actual production `.htaccess` is copied from `public/.htaccess` during build

### 2. How Vite handles files
- Vite automatically copies all files from `public/` folder to `dist/` during `npm run build`
- The `.htaccess` file in `public/` will be copied to `dist/` automatically
- No manual copying needed

### 3. Production Deployment
When deploying to production:
1. Run `npm run build` - this creates the `dist/` folder with all files
2. Upload the entire `dist/` folder to your web server
3. Ensure the Node.js proxy server is running on port 3002
4. The `.htaccess` file in `dist/` will handle routing

### 4. Files NOT in dist (and why)
- `.htaccess.nodejs` - Template file, not needed in production
- `proxy-server.js` - Runs separately, not part of frontend build
- `test-proxy.js` - Testing tool, not needed in production
- `setup-proxy.sh` - Setup script, not needed in production
- Source files (`src/`, `public/`) - Only built files go to dist

## ✅ Verification

To verify your dist folder is correct:

```bash
# Build the project
npm run build

# Check dist folder contents
ls -la dist/

# Should see:
# - .htaccess
# - index.html
# - assets/ (folder)
```

## 🔧 If `.htaccess` is missing from dist

If `.htaccess` is not in dist after build:

1. Check that `public/.htaccess` exists
2. Rebuild: `npm run build`
3. Verify: `ls -la dist/.htaccess`

Vite should automatically copy it. If it doesn't, check your `vite.config.ts` for any custom build settings.

