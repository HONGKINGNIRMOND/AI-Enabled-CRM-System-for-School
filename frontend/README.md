# AI-Enabled CRM Frontend

A modern React-based frontend for an AI-Enabled CRM system with comprehensive lead management, AI-powered calling features, and advanced analytics.

## Features

- **User Authentication**: Secure login with role-based access control
- **Dashboard**: Comprehensive overview with key metrics and analytics
- **Lead Management**: Full CRUD operations for leads with search and filtering
- **AI Call Integration**: Real-time call status, transcripts, and sentiment analysis
- **Analytics**: Advanced data visualization with multiple chart types
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

- **React 18**: Modern component-based architecture
- **Vite**: Fast build tool and development server
- **TailwindCSS**: Utility-first CSS framework
- **React Router**: Client-side routing
- **Recharts**: Data visualization library
- **Lucide React**: Beautiful icon library
- **Axios**: HTTP client for API communication

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following content:
```env
VITE_API_BASE_URL=http://localhost:3001/api
VITE_ENV=development
```

4. Start the development server:
```bash
npm run dev
```

## Environment Variables

- `VITE_API_BASE_URL`: Base URL for the backend API (default: `http://localhost:3001/api`)
- `VITE_ENV`: Environment mode (development, staging, production)

## Scripts

- `npm run dev`: Start the development server
- `npm run build`: Build the application for production
- `npm run preview`: Preview the production build locally
- `npm run lint`: Lint the codebase

## API Integration

The frontend communicates with the backend through a centralized API service layer located at `src/services/api.js`. All API calls include automatic token management and error handling.

## Project Structure

```
src/
├── components/           # React components organized by feature
│   ├── auth/            # Authentication components
│   ├── dashboard/       # Dashboard components
│   ├── leads/           # Lead management components
│   ├── calls/           # AI call components
│   ├── analytics/       # Analytics components
│   └── layout/          # Layout components
├── services/            # API services and utilities
├── contexts/            # React context providers
├── hooks/               # Custom React hooks
├── assets/              # Static assets
└── App.jsx              # Main application component
```

## Key Components

- **AuthProvider**: Manages authentication state and token persistence
- **API Service**: Centralized API client with interceptors for authentication
- **ProtectedRoute**: Wrapper component for authenticated routes
- **MainLayout**: Consistent layout with sidebar navigation
- **StatCard**: Reusable component for displaying key metrics
- **LeadForm**: Form component for creating/editing leads
- **CallStatus**: Real-time call monitoring component

## Security Features

- Token-based authentication stored in localStorage
- Protected routes with automatic redirect to login
- Automatic logout on 401 responses
- Secure request interception

## Responsive Design

The application is built with responsive design in mind using TailwindCSS, ensuring optimal viewing experience across various devices and screen sizes.

## Development Best Practices

- Component-based architecture
- Centralized state management
- Reusable UI components
- Proper error handling
- Loading states
- Form validation
- Clean code organization