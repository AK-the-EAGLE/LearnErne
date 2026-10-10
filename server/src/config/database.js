import mongoose from 'mongoose';

const READY_STATES = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

export async function connectDB(uri) {
  if (!uri) {
    throw new Error('Database connection failed: MONGODB_URI is required.');
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  mongoose.set('strictQuery', true);

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
  });

  return mongoose.connection;
}

export async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

export function getDatabaseHealth() {
  const stateCode = mongoose.connection.readyState;
  const stateName = READY_STATES[stateCode] || 'unknown';
  const isReady = stateCode === 1;

  return {
    status: isReady ? 'connected' : 'disconnected',
    readyState: stateName,
    isReady,
  };
}
