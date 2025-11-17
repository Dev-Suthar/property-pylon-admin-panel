# Admin Panel Login Credentials

## Default Credentials (After Database Seeding)

After running the backend seed script, you can login with any of these admin accounts:

### Option 1: Elite Properties
- **Email**: `admin@eliteproperties.com`
- **Password**: `admin123`

### Option 2: Dev Enterprise Company
- **Email**: `admin@deventerprisecompany.com`
- **Password**: `admin123`

### Option 3: Raval Solution
- **Email**: `admin@ravalsolution.com`
- **Password**: `admin123`

## Important Notes

1. **Backend Must Be Running**: The admin panel requires the backend API to be running on `http://localhost:3000`

2. **Database Must Be Seeded**: If you haven't seeded the database yet, run:
   ```bash
   cd backend
   npm run seed
   ```

3. **Any Admin User Works**: Since the admin panel is for system-wide administration, any of the above admin accounts will work.

4. **Creating New Admin Users**: You can create additional admin users through the backend API or directly in the database.

## Troubleshooting

### If login fails:
1. Check that the backend server is running: `http://localhost:3000`
2. Verify the database has been seeded
3. Check browser console for API errors
4. Ensure the API URL in `.env` matches your backend URL

### If you see "Using mock data" message:
- The backend API endpoints for admin operations may not be implemented yet
- The frontend will work with mock data for development
- You can still test the UI, but data won't persist

