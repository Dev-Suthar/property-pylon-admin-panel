# AWS Cost Tracking - Admin Panel Implementation Plan

## Overview

This plan outlines the implementation of AWS cost tracking functionality in the Property Pylon admin panel. The backend API is already implemented with the following endpoints:

- `GET /api/v1/billing/usage/:company_id` - Get company usage data
- `GET /api/v1/billing/report/:company_id` - Get company billing report
- `GET /api/v1/billing/reports` - Get all companies usage report (admin only)

## Implementation Tasks

### Task 1: Create Billing Service (`src/services/billingService.ts`)

**Status:** Pending

**Description:** Create a service layer to interact with the billing API endpoints.

**Implementation Details:**
- Create TypeScript interfaces for API responses:
  - `CompanyUsage` - Single usage record
  - `CompanyUsageResponse` - Response from `/usage/:company_id`
  - `BillingReport` - Response from `/report/:company_id`
  - `AllCompaniesUsageReport` - Response from `/reports`
- Implement service methods:
  - `getCompanyUsage(companyId, startDate?, endDate?)` - Fetch company usage
  - `getCompanyBillingReport(companyId, period?)` - Fetch billing report
  - `getAllCompaniesUsageReport(startDate?, endDate?)` - Fetch all companies report
- Use `apiClient` from `@/lib/api`
- Use `handleApiError` for error handling
- Follow the same pattern as `companyService.ts`

**Files to Create:**
- `src/services/billingService.ts`

**Dependencies:**
- `@/lib/api` (apiClient, handleApiError)

---

### Task 2: Create Billing Page Component (`src/pages/Billing.tsx`)

**Status:** Pending

**Description:** Create the main billing/cost tracking page with comprehensive data visualization.

**Implementation Details:**

#### 2.1 Summary Cards Section
- Display 4 summary cards:
  - **Total AWS Costs** - Sum of all companies' total costs
  - **Total S3 Storage (GB)** - Sum of all S3 storage in GB
  - **Total API Requests** - Sum of all API requests
  - **Average Cost per Company** - Average total cost across companies
- Use Card components from `@/components/ui/card`
- Use icons from `lucide-react` (DollarSign, Database, Activity, TrendingUp)
- Format currency with `$X,XXX.XX` format
- Format storage with appropriate units (GB, MB)
- Show loading skeletons while fetching

#### 2.2 Charts Section
Use `recharts` library (already installed) to create:

**Chart 1: Total Costs by Company (Bar Chart)**
- X-axis: Company names
- Y-axis: Total cost ($)
- Show top 10 companies by cost
- Use gradient colors
- Responsive container

**Chart 2: Cost Breakdown by Service (Pie Chart)**
- Segments: EC2, S3, Data Transfer
- Show percentages
- Color-coded segments
- Legend

**Chart 3: Cost Trends Over Time (Line Chart)**
- X-axis: Time periods (months/days)
- Y-axis: Total cost ($)
- Multiple lines for different cost types (EC2, S3, Data Transfer)
- Tooltip with detailed breakdown

**Chart 4: S3 Storage Usage by Company (Bar Chart)**
- X-axis: Company names
- Y-axis: Storage (GB)
- Show top 10 companies by storage
- Responsive container

#### 2.3 Data Table Section
Create a table showing:
- Company name
- API requests count (formatted with commas)
- S3 storage (GB, formatted to 2 decimals)
- EC2 costs ($, formatted to 2 decimals)
- S3 costs ($, formatted to 2 decimals)
- Data transfer costs ($, formatted to 2 decimals)
- Total costs ($, formatted to 2 decimals)
- Actions column with "View Details" button

Use AG Grid or a custom table component (check existing pages for pattern).

#### 2.4 Date Range Filter
- Add date picker component
- Preset options:
  - Current Month (default)
  - Last Month
  - Last 3 Months
  - Last 6 Months
  - Custom Range
- Update data when date range changes
- Use `react-day-picker` (already installed) or date-fns utilities

#### 2.5 Company Details Drawer/Modal
- Click "View Details" to open drawer
- Show detailed breakdown:
  - Company information
  - Period information
  - Usage breakdown (API requests, S3 storage, S3 requests)
  - Cost breakdown (EC2, S3, Data Transfer, Total)
  - Metadata (if available)
- Use Drawer component from `@/components/ui/drawer` or Dialog

#### 2.6 Export Functionality (Optional)
- Add export button
- Export to CSV format
- Include all table data
- Format dates and currency properly

#### 2.7 Loading and Error States
- Show loading skeletons for all sections
- Display error messages using Alert component
- Handle empty states (no data available)
- Retry functionality

**Files to Create:**
- `src/pages/Billing.tsx`

**Dependencies:**
- `@tanstack/react-query` (useQuery hook)
- `recharts` (charts)
- `@/services/billingService`
- `@/components/ui/*` (Card, Table, Button, Drawer/Dialog, Alert, etc.)
- `lucide-react` (icons)
- `date-fns` (date formatting)

---

### Task 3: Update Sidebar Navigation (`src/components/layout/Sidebar.tsx`)

**Status:** Pending

**Description:** Add billing/cost tracking menu item to the sidebar.

**Implementation Details:**
- Import `DollarSign` or `TrendingUp` icon from `lucide-react`
- Add new menu item to `menuItems` array:
  ```typescript
  {
    icon: DollarSign, // or TrendingUp
    label: 'Cost Tracking', // or 'Billing'
    path: '/billing'
  }
  ```
- Place it after "Subscriptions" or "Reports" in the menu order
- Ensure active state highlighting works correctly

**Files to Modify:**
- `src/components/layout/Sidebar.tsx`

**Dependencies:**
- `lucide-react` (DollarSign or TrendingUp icon)

---

### Task 4: Add Billing Route (`src/App.tsx`)

**Status:** Pending

**Description:** Add the billing route to the application router.

**Implementation Details:**
- Import `Billing` component from `./pages/Billing`
- Add new route:
  ```tsx
  <Route
    path="/billing"
    element={
      <ProtectedRoute>
        <MainLayout>
          <Billing />
        </MainLayout>
      </ProtectedRoute>
    }
  />
  ```
- Place it after subscriptions or reports route
- Ensure route matches the path in Sidebar

**Files to Modify:**
- `src/App.tsx`

**Dependencies:**
- `./pages/Billing` (Billing component)

---

## TypeScript Interfaces

### CompanyUsage Interface
```typescript
export interface CompanyUsage {
  id: string;
  period_start: string;
  period_end: string;
  api_requests: number;
  s3_storage_bytes: number;
  s3_storage_gb: string;
  s3_requests: number;
  ec2_cost: number;
  s3_cost: number;
  data_transfer_cost: number;
  total_cost: number;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}
```

### CompanyUsageResponse Interface
```typescript
export interface CompanyUsageResponse {
  company_id: string;
  period: {
    start: string;
    end: string;
  };
  usage: CompanyUsage[];
}
```

### BillingReport Interface
```typescript
export interface BillingReport {
  company: {
    id: string;
    name: string;
    email: string;
  };
  period: {
    start: string;
    end: string;
    month: string;
  };
  usage: {
    api_requests: number;
    s3_storage_bytes: number;
    s3_storage_gb: number;
    s3_requests: number;
  };
  costs: {
    ec2: number;
    s3: number;
    data_transfer: number;
    total: number;
  };
  breakdown: {
    api_requests_cost: number;
    s3_storage_cost: number;
    ec2_cost: number;
    data_transfer_cost: number;
  };
  metadata?: Record<string, any>;
  generated_at: string;
}
```

### AllCompaniesUsageReport Interface
```typescript
export interface AllCompaniesUsageReport {
  period: {
    start: string;
    end: string;
  };
  total_companies: number;
  total_api_requests: number;
  total_s3_storage_bytes: number;
  total_s3_storage_gb: string;
  total_costs: {
    ec2: number;
    s3: number;
    data_transfer: number;
    total: number;
  };
  companies: Array<{
    company: {
      id: string;
      name: string;
      email: string;
    };
    usage: {
      api_requests: number;
      s3_storage_bytes: number;
      s3_storage_gb: string;
      s3_requests: number;
    };
    costs: {
      ec2: number;
      s3: number;
      data_transfer: number;
      total: number;
    };
  }>;
  generated_at: string;
}
```

## Utility Functions

### Currency Formatting
```typescript
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};
```

### Storage Formatting
```typescript
export const formatStorage = (bytes: number): string => {
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1) {
    return `${gb.toFixed(2)} GB`;
  }
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(2)} MB`;
};
```

### Number Formatting
```typescript
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US').format(num);
};
```

## Component Structure

```
Billing.tsx
├── Header Section
│   ├── Title
│   └── Description
├── Date Range Filter
│   ├── Preset Buttons
│   └── Custom Date Picker
├── Summary Cards
│   ├── Total AWS Costs Card
│   ├── Total S3 Storage Card
│   ├── Total API Requests Card
│   └── Average Cost per Company Card
├── Charts Section
│   ├── Total Costs by Company (Bar Chart)
│   ├── Cost Breakdown by Service (Pie Chart)
│   ├── Cost Trends Over Time (Line Chart)
│   └── S3 Storage Usage by Company (Bar Chart)
├── Data Table
│   ├── Company Name
│   ├── API Requests
│   ├── S3 Storage
│   ├── EC2 Costs
│   ├── S3 Costs
│   ├── Data Transfer Costs
│   ├── Total Costs
│   └── Actions (View Details)
└── Company Details Drawer
    ├── Company Info
    ├── Period Info
    ├── Usage Breakdown
    ├── Cost Breakdown
    └── Metadata
```

## Implementation Order

1. **Task 1** - Create billingService.ts (Foundation)
2. **Task 3** - Update Sidebar (Quick win, visual feedback)
3. **Task 4** - Add Route (Enable navigation)
4. **Task 2** - Create Billing.tsx (Main implementation)
   - Start with basic structure and data fetching
   - Add summary cards
   - Add data table
   - Add charts one by one
   - Add date filters
   - Add company details drawer
   - Add export functionality (optional)
   - Polish UI and add loading/error states

## Testing Checklist

- [ ] Service methods correctly call API endpoints
- [ ] Error handling works for API failures
- [ ] Loading states display correctly
- [ ] Empty states display when no data
- [ ] Date range filters update data correctly
- [ ] Charts render with correct data
- [ ] Table displays all columns correctly
- [ ] Company details drawer opens and displays data
- [ ] Currency formatting is correct
- [ ] Storage formatting is correct
- [ ] Navigation works from sidebar
- [ ] Route protection works (requires authentication)
- [ ] Responsive design works on mobile/tablet
- [ ] Export functionality works (if implemented)

## Dependencies Check

All required dependencies are already installed:
- ✅ `@tanstack/react-query` - Data fetching
- ✅ `recharts` - Charts
- ✅ `lucide-react` - Icons
- ✅ `date-fns` - Date utilities
- ✅ `react-day-picker` - Date picker
- ✅ `axios` - HTTP client (via apiClient)
- ✅ UI components from shadcn/ui

## Notes

- The backend API is already implemented and ready to use
- Follow existing patterns from other pages (Dashboard, Companies, etc.)
- Use the same UI components and styling patterns
- Ensure responsive design for mobile devices
- Consider adding pagination if the number of companies grows large
- Consider adding search/filter functionality for the table
- Consider adding sorting functionality for table columns

