# School CRM System

A comprehensive School Management CRM System designed to streamline academic and administrative operations. This platform enables administrators, teachers, and parents to effectively manage and track student performance, attendance, and communication.

## Key Features
- **Comprehensive Administration**: Efficient management of students, teachers, classes, and roles.
- **Academic Tracking**: Robust systems for recording and monitoring marks, attendance, and exam results.
- **Parent Portal**: Dedicated interface for parents to track their children's academic progress.
- **Automated Notifications**: Integrated Email, SMS, and WhatsApp alerts for attendance and performance updates.
- **Bulk Data Management**: Support for bulk student and data uploads via CSV/Excel.
- **Secure Authentication**: Role-based access control with JWT-secured endpoints.

## Technology Stack

### Backend
- **Core**: Node.js, Express.js
- **Database**: PostgreSQL with Sequelize ORM
- **Authentication**: JWT, bcryptjs
- **Notifications**: Nodemailer (Email), Twilio (SMS/WhatsApp)
- **Utilities**: Winston (Logging), Joi (Validation), Multer (File Uploads)

### Frontend
- **Framework**: React (Vite-based)
- **Styling**: Tailwind CSS
- **Visualization**: Recharts
- **Icons**: Lucide React
- **State/Routing**: React Router Dom

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16.x or later)
- [PostgreSQL](https://www.postgresql.org/)
- npm or yarn

### Deployment Instructions

#### 1. Database Setup
1. **Create Database**: Open your PostgreSQL terminal (psql) or pgAdmin and create a new database:
   ```sql
   CREATE DATABASE school_crm;
   ```
2. **Initialize Schema**: Import the initial tables and data using the provided SQL script:
   ```bash
   psql -d school_crm -f database/schema.sql
   ```
   *(Alternatively, copy-paste the content of `database/schema.sql` into your SQL editor and execute it.)*

#### 2. Backend Configuration
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file and configure your database connection:
   ```bash
   cp .env.example .env
   ```
4. **Configure PostgreSQL Connection**: Open `.env` and update the following variables with your local settings:
   - `DB_HOST`: Set to `localhost` (or your server IP).
   - `DB_PORT`: Default is `5432`.
   - `DB_USER`: Your PostgreSQL username (usually `postgres`).
   - `DB_PASSWORD`: Your PostgreSQL password.
   - `DB_NAME`: Set to `school_crm`.

   Example `.env` configuration:
   ```env
   DB_HOST="localhost"
   DB_PORT=5432
   DB_USER="postgres"
   DB_PASSWORD="your_secure_password"
   DB_NAME="school_crm"
   ```
5. **Run Setup**: Execute the setup script to run migrations and create default administrative users:
   ```bash
   npm run setup
   ```


#### 3. Frontend Configuration
1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file:
   ```bash
   echo "VITE_API_URL=http://localhost:3001/api" > .env
   ```

## Running the Project

### Start Backend
From the `backend` directory:
```bash
npm run dev
```
The API server will start at `http://localhost:3001`.

### Start Frontend
From the `frontend` directory:
```bash
npm run dev
```
The application will be available at `http://localhost:3000` (or the port specified by Vite).

## Available Scripts

### Backend
- `npm start`: Run server in production.
- `npm run dev`: Run server with nodemon for development.
- `npm run migrate`: Run database migrations.
- `npm run setup`: Run migrations and create default users.
- `npm test`: Run tests with coverage.

### Frontend
- `npm run dev`: Start Vite development server.
- `npm run build`: Build for production.
- `npm run preview`: Preview the production build.
- `npm run lint`: Lint code using ESLint.
