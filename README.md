# School CRM System

A comprehensive School Management CRM System designed to streamline academic and administrative operations. This platform enables administrators and teachers to effectively manage and track student performance, attendance, and communication.

- **Quick Action CRM**: Streamlined student performance tracking, rapid updates, and bulk WhatsApp messaging integration.
- **Omnichannel Communication**: Integrated alerts via Email, SMS, WhatsApp, and Voice calls.
- **Circulars Broadcasting**: System-wide announcements with file attachments (PDF, Excel, Word docs up to 50MB).
- **HOD Analytics Dashboard**: Comprehensive academic insights, pass rates, and performance distribution for Head of Departments.
- **Bulk Data Management**: Support for high-speed student and data uploads via CSV/Excel.
- **High-Performance Architecture**: Optimized with compression, connection pooling, and PM2 clustering to handle 500+ concurrent requests.
- **AI-Powered Analytics**: Performance prediction and audio processing via Whisper.
- **Secure Authentication**: Role-based access control with JWT-secured endpoints.

## Technology Stack

### Backend
- **Core**: Node.js, Express.js
- **Database**: PostgreSQL with Sequelize ORM (Connection Pooling Enabled)
- **Authentication**: JWT, bcryptjs
- **Notifications**: Nodemailer (Email), Twilio (SMS, WhatsApp, Voice/Telephony)
- **Performance & Security**: PM2 (Clustering), Helmet, Compression, express-rate-limit
- **AI Analytics**: OpenAI/Whisper for transcription and insights
- **Utilities**: Winston (Logging), Joi (Validation), Multer (File Uploads)

### Frontend
- **Framework**: React (Vite-based)
- **Styling**: Tailwind CSS
- **Visualization**: Recharts
- **Icons**: Lucide React
- **State/Routing**: React Router Dom

## Getting Started

### Prerequisites
- **Node.js**: v18.x or later
- **PostgreSQL**: v14.x or later
- **npm**: v9.x or later

### 1. Database Setup
1. **Create Database**:
   ```sql
   CREATE DATABASE school_crm;
   ```
2. **Initialize Schema**: Import the schema from the root directory:
   ```bash
   psql -U postgres -d school_crm -f database/schema.sql
   ```

### 2. Backend Configuration
1. **Install Dependencies**:
   ```bash
   cd backend
   npm install
   ```
2. **Environment Setup**: Copy `.env.example` to `.env` and update your database credentials:
   ```env
   DB_HOST="localhost"
   DB_PORT=5432
   DB_USER="postgres"
   DB_PASSWORD="your_password"
   DB_NAME="school_crm"
   ```
3. **Generate Templates**:
   ```bash
   node tools/create_student_template.js
   ```

### 3. Frontend Configuration
1. **Install Dependencies**:
   ```bash
   cd frontend
   npm install
   ```
2. **Environment Setup**: Ensure `VITE_API_URL` points to your backend:
   ```bash
   # .env
   VITE_API_URL=http://localhost:3001/api
   ```

## Running the Project

### Development Mode
Run both backend and frontend simultaneously for development:

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

### Production Mode
For high-performance deployment:
```bash
cd backend
npx pm2 start ecosystem.config.js
```

## Features & Roles
- **Admin**: Full system management, staff registration, and settings.
- **HOD**: Department analytics, subject assignments, and faculty performance.
- **Teacher**: Student management, attendance, marks, and circulars.

## Bulk Upload Support
- **Students**: Upload via `dummy.csv` or Excel template.
- **Teachers**: Support for "Primary Subject" and profile attributes.
- **Templates**: Available in `backend/public/templates/`.
