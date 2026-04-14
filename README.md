# School CRM System

A comprehensive School Management CRM System designed to streamline academic and administrative operations. This platform enables administrators and teachers to effectively manage and track student performance, attendance, and communication.

- **Quick Action CRM**: Streamlined student performance tracking, rapid updates, and bulk WhatsApp messaging integration.
- **Omnichannel Communication**: Integrated alerts via Email, SMS, WhatsApp, and Voice calls.
- **Circulars Broadcasting**: System-wide announcements with file attachments (PDF, Excel, Word docs up to 50MB).
- **HOD Analytics Dashboard**: Comprehensive academic insights, pass rates, and performance distribution for Head of Departments.
- **Detailed Student Analytics**: Multi-subject performance comparison, automated attendance summary aggregation, and advanced filtering.
- **Dynamic Reporting**: One-click PDF progress cards and Excel/CSV exports for attendance and academic results.
- **Bulk Data Management**: Robust CSV/Excel processing for student enrollment, attendance marking, and marks entry.
- **High-Performance Architecture**: Optimized with PostgreSQL connection pooling, JSONB for dynamic subject data, and PM2 clustering.
- **AI-Powered Analytics**: Performance prediction and audio processing via Whisper.
- **Secure Authentication**: Role-based access control with JWT-secured endpoints.

## Technology Stack

### Backend
- **Core**: Node.js, Express.js
- **Database**: PostgreSQL with Sequelize ORM (Connection Pooling Enabled)
- **Authentication**: JWT, bcryptjs
- **Notifications**: Email, SMS, WhatsApp integration

### Frontend
- **Framework**: React (Vite-based)
- **Styling**: Tailwind CSS, Vanilla CSS
- **Visualization**: Recharts
- **Icons**: Lucide React

## Getting Started

> **Deploying to a live domain?** See [DEPLOYMENT.md](./DEPLOYMENT.md) for the full step-by-step guide (VPS, Railway, Nginx, SSL, PM2).

### Prerequisites
- **Node.js**: v18.x or later
- **PostgreSQL**: v14.x or later
- **npm**: v9.x or later

### 1. Database & Backend Setup
1. **Create Database**: Open PostgreSQL and run:
   ```sql
   CREATE DATABASE school_crm;
   ```

2. **Backend Configuration**:
   ```bash
   cd backend
   npm install
   ```

3. **Environment Setup**: Copy `.env.example` to `.env` and update your database credentials:
   ```env
   DB_HOST="localhost"
   DB_PORT=5432
   DB_USER="postgres"
   DB_PASSWORD="your_password"
   DB_NAME="school_crm"
   ```

4. **Initialize Project**: Run the automated setup script (idempotent):
   ```bash
   npm run setup
   ```
   *This command creates all tables and inserts the default admin user.*

### 2. Frontend Configuration
1. **Frontend Setup**:
   ```bash
   cd frontend
   npm install
   ```

2. **Environment Setup**: Ensure `VITE_API_URL` points to your backend in `frontend/.env`:
   ```env
   VITE_API_URL=http://localhost:3001/api
   ```

## Running the Project

### Development Mode
Run both backend and frontend simultaneously:

**Backend**:
```bash
cd backend
npm run dev
```

**Frontend**:
```bash
cd frontend
npm run dev
```

### Accessing the System
Once the project is running, you can log in with the default admin account:
- **Email**: `admin@school.com`
- **Password**: `admin123`

## Features & Roles
- **Admin**: Full system management, staff registration, and settings.
- **HOD**: Department analytics, subject assignments, and faculty performance.
- **Teacher**: Student management, attendance, marks, and circulars.

## Bulk Upload Support
- **Students**: Upload via `dummy.csv` or Excel template.
- **Templates**: Available in `backend/public/templates/`.
- **Primary Subject**: Support for teacher-subject association.

## Technical Notes & Maintenance
- **Attendance Summaries**: Monthly attendance statistics are automatically synchronized upon marking. To manually refresh summaries for all historical data, run:
  ```bash
  cd backend
  node tools/backfillAttendanceSummary.js
  ```
- **Analytics Precision**: Academic reports use weighted averages (Total Present / Total Possible Days) to ensure mathematical accuracy across different months.
- **Reporting**: PDF generation uses `pdfkit` and Excel exports use `exceljs`, both optimized for low memory overhead.
