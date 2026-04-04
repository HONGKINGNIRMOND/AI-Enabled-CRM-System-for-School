require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:5173',
  'https://crm-school.up.railway.app',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS policy: origin ${origin} not allowed`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Security Headers middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } // Required if serving images cross-origin
}));

// Rate limiting middleware
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1000, // Limit each IP to 1000 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use('/api', apiLimiter);

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Import routes
const authRoutes = require('./routes/auth.routes');
const studentRoutes = require('./routes/student.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const marksRoutes = require('./routes/marks.routes');
const gradesRoutes = require('./routes/grades.routes');
const reportsRoutes = require('./routes/reports.routes');
const masterRoutes = require('./routes/master.routes');
const teacherRoutes = require('./routes/teacher.routes');
const leadRoutes = require('./routes/leads');
const feeRoutes = require('./routes/fees');
const aiRoutes = require('./routes/ai.routes');
const quickActionRoutes = require('./routes/quick-action.routes');
const classFeeStructureRoutes = require('./routes/classFeeStructure.routes');
const circularRoutes = require('./routes/circulars.routes');
const adminHodRoutes = require('./routes/admin-hod.routes');
const hodRoutes = require('./routes/hod.routes');

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/marks', marksRoutes);
app.use('/api/grades', gradesRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/master', masterRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/quick-action', quickActionRoutes);
app.use('/api/class-fee-structure', classFeeStructureRoutes);
app.use('/api/circulars', circularRoutes);
app.use('/api/admin/hod', adminHodRoutes);
app.use('/api/hod', hodRoutes);

// Static template and circular files
app.use('/templates', express.static(path.join(__dirname, 'public', 'templates')));
app.use('/circulars', express.static(path.join(__dirname, 'public', 'circulars')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'School CRM Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'School Management CRM API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      students: '/api/students',
      attendance: '/api/attendance',
      marks: '/api/marks',
      grades: '/api/grades',
      reports: '/api/reports',
      health: '/health'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
const PORT = process.env.PORT || 3001;
// In production, bind to 0.0.0.0 so Nginx can proxy. In development, bind to localhost.
const HOST = process.env.HOST || (process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost');

app.listen(PORT, HOST, () => {
  console.log('\n========================================');
  console.log('🎓 School Management CRM Server');
  console.log('========================================');
  console.log(`✓ Server running on http://${HOST}:${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✓ Allowed origins: ${allowedOrigins.join(', ')}`);
  console.log('========================================');
});


