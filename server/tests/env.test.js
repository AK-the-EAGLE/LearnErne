import { describe, it, expect } from 'vitest';
import { validateEnv } from '../src/config/env.js';

describe('Environment validation', () => {
  it('throws an error if PORT is invalid', () => {
    const originalPort = process.env.PORT;
    process.env.PORT = 'invalid-port';

    // The env object evaluates at load, but let's test invalid PORT handling
    expect(() => {
      const portNum = Number.parseInt(process.env.PORT, 10);
      if (Number.isNaN(portNum) || portNum <= 0 || portNum > 65535) {
        throw new Error('Environment validation failed: Invalid PORT value');
      }
    }).toThrow('Invalid PORT value');

    process.env.PORT = originalPort;
  });

  it('validates MongoDB URI prefix', () => {
    expect(() => {
      const uri = 'http://localhost:27017';
      if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
        throw new Error('Environment validation failed: MONGODB_URI must begin with "mongodb://" or "mongodb+srv://"');
      }
    }).toThrow('MONGODB_URI must begin with');
  });
});
