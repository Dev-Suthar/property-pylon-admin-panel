# Property Pylon Admin Panel

A comprehensive admin panel for managing the Property Pylon multi-tenant property management system.

## Features

- **Dashboard**: System overview with key metrics and analytics
- **Company Management**: CRUD operations for companies with pagination
- **User Management**: Manage users across all companies
- **Property Management**: View and manage properties (coming soon)
- **Customer Management**: View and manage customers (coming soon)
- **Subscription Management**: Manage subscriptions and billing (coming soon)
- **Activity Logs**: System activity tracking (coming soon)
- **Reports**: Generate system reports (coming soon)
- **Settings**: System configuration (coming soon)

## Tech Stack

- **React 18** with TypeScript
- **Vite** for build tooling
- **React Router** for routing
- **React Query** for data fetching and caching
- **Axios** for API calls
- **shadcn/ui** for UI components
- **Tailwind CSS** for styling
- **Recharts** for data visualization
- **Lucide React** for icons

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Backend API running on http://localhost:3000

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (optional, defaults are set):
```bash
cp .env.example .env
```

Update `.env` if your API URL is different:
```
VITE_API_URL=http://localhost:3000/api/v1
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3001](http://localhost:3001) in your browser

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
admin-panel/
├── src/
│   ├── components/
│   │   ├── layout/       # Layout components (Sidebar, Header, MainLayout)
│   │   └── ui/           # Reusable UI components
│   ├── contexts/         # React contexts (AuthContext)
│   ├── hooks/            # Custom hooks (use-toast)
│   ├── lib/              # Utility functions and API client
│   ├── pages/            # Page components
│   ├── services/         # API service functions
│   ├── App.tsx           # Main app component with routing
│   └── main.tsx          # Entry point
├── public/               # Static assets
└── package.json
```

## Authentication

The admin panel uses JWT token-based authentication. Login credentials should match a user in your backend database.

**Note**: The backend API endpoints for admin operations (`/admin/*`) may need to be created. The frontend is ready to consume these endpoints, but will fall back to mock data if they don't exist yet.

## API Integration

The admin panel is configured to connect to the backend API at `http://localhost:3000/api/v1`. 

### Compression Support

The backend API uses gzip compression for all responses (via `compression()` middleware). The admin panel's API client (Axios) automatically handles compression by:
- Sending `Accept-Encoding: gzip, deflate, br` headers
- Automatically decompressing responses

**Note for API Testing**: When testing API endpoints with `curl`, use the `--compressed` flag to automatically decompress responses:
```bash
curl --compressed -H "Authorization: Bearer <token>" https://admin.dreamtobuy.com/api/admin/companies
```

### Required Backend Endpoints

For full functionality, the following admin endpoints should be implemented:

- `POST /api/v1/auth/login` - User login
- `GET /api/v1/admin/companies` - List all companies
- `GET /api/v1/admin/users` - List all users
- `GET /api/v1/admin/dashboard` - Dashboard statistics

Currently, the app will use mock data if these endpoints are not available, allowing you to develop the UI independently.

## Development Notes

- **Mock Data**: The app includes mock data fallbacks for development when backend endpoints aren't available
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Loading States**: Loading indicators for all async operations
- **Pagination**: Pagination support for all list views
- **Search/Filter**: Search and filter functionality on all data tables

## Environment Variables

Create a `.env` file in the root directory with the following variables:

- `VITE_API_URL`: Backend API base URL (default: `http://localhost:3000/api/v1`)
- `VITE_GOOGLE_MAPS_API_KEY`: Google Maps API key for map functionality (optional)

**Important**: Never commit your `.env` file or API keys to version control. Use `.env.example` as a template.

## License

ISC
