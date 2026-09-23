import app from '../backend/src/app.js';
import mongoose from 'mongoose';

let cachedConnection = null;

/**
 * Connect to MongoDB once and reuse the connection between serverless invocations.
 */
async function connectToMongo() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (cachedConnection) {
    return cachedConnection;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    return null;
  }

  try {
    cachedConnection = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
    });
    return cachedConnection;
  } catch (err) {
    console.error('MongoDB connection error in Vercel function:', err.message);
    cachedConnection = null;
    return null;
  }
}

/**
 * Vercel Serverless Function entry point serving the Express application.
 */
export default async function handler(req, res) {
  await connectToMongo();

  // If Vercel rewrites altered req.url to /api/index, restore original path from headers or query
  const matchedPath = req.headers['x-matched-path'] || req.headers['x-forwarded-uri'] || req.headers['x-invoke-path'];
  if (matchedPath && req.url && (req.url === '/api/index' || req.url.startsWith('/api/index?') || req.url === '/api' || req.url.startsWith('/api?'))) {
    const queryIndex = req.url.indexOf('?');
    const queryString = queryIndex !== -1 ? req.url.slice(queryIndex) : '';
    req.url = matchedPath.split('?')[0] + (queryString || (matchedPath.includes('?') ? '?' + matchedPath.split('?')[1] : ''));
  }

  return app(req, res);
}

export { app };
