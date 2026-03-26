import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import 'express-async-errors';

import { env, isDev } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import { swaggerSpec } from './config/swagger.js';
import routes from './routes/index.js';
import './docs/api.docs.js'; // Load API documentation

const app = express();

// Security middleware - allow Swagger UI assets
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration - allow multiple origins
const allowedOrigins = env.FRONTEND_URL.split(',').map(url => url.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Logging
if (isDev) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Swagger UI at /api (root API docs)
app.use('/api', swaggerUi.serve);
app.get('/api', swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Predictly API Docs',
}));

// API routes
app.use('/api', routes);

// Root endpoint - redirect to API docs
app.get('/', (req, res) => {
  res.redirect('/api');
});

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

export default app;
