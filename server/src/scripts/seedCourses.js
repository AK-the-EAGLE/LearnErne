import { connectDB, disconnectDB } from '../config/database.js';
import { env } from '../config/env.js';
import { Course } from '../models/Course.js';
import { courseCatalog } from '../data/courseCatalog.js';
import { pathToFileURL } from 'node:url';

export async function upsertCourseCatalog() {
  for (const course of courseCatalog) {
    await Course.updateOne(
      { slug: course.slug },
      { $set: { ...course, status: 'published' } },
      { upsert: true, runValidators: true },
    );
  }
  return courseCatalog.length;
}

async function main() {
  try {
    await connectDB(env.MONGODB_URI);
    const count = await upsertCourseCatalog();
    console.log(`Upserted ${count} versioned published LernErne courses. Existing enrollments and progress were not modified.`);
  } catch (error) {
    console.error(`Database initialization failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
