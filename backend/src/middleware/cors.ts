import cors from 'cors';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

export const corsOptions: cors.CorsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) {
      callback(null, true);
      return;
    }

    const allowedOrigins = [
      FRONTEND_URL,
      'http://localhost:3000',
      'http://localhost:3001',
    ];

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Payment-Token',
    'X-Requested-With',
  ],
  exposedHeaders: ['X-Payment-Required'],
  maxAge: 86400,
};

export const configureCors = () => cors(corsOptions);
