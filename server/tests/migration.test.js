import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { up, down } from '../migrations/20261010000000-initial-indexes.js';
import mongoose from 'mongoose';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

describe('Database Migrations', () => {
  it('applies up migration and registers indexes successfully', async () => {
    const db = mongoose.connection.db;
    await up(db, mongoose.connection.getClient());

    const userIndexes = await db.collection('users').indexes();
    const hasEmailIndex = userIndexes.some((idx) => idx.name === 'email_unique_idx');
    expect(hasEmailIndex).toBe(true);

    const enrollmentIndexes = await db.collection('enrollments').indexes();
    const hasEnrollmentCompoundIndex = enrollmentIndexes.some(
      (idx) => idx.name === 'user_course_enrollment_unique_idx'
    );
    expect(hasEnrollmentCompoundIndex).toBe(true);
  });

  it('rolls down migration cleanly without unhandled errors', async () => {
    const db = mongoose.connection.db;
    await down(db, mongoose.connection.getClient());

    const userIndexes = await db.collection('users').indexes();
    const hasEmailIndex = userIndexes.some((idx) => idx.name === 'email_unique_idx');
    expect(hasEmailIndex).toBe(false);
  });
});
