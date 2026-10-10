export const up = async (db, _client) => {
  // Ensure unique index on users.email
  await db.collection('users').createIndex(
    { email: 1 },
    { unique: true, name: 'email_unique_idx' }
  );

  // Ensure unique index on courses.slug
  await db.collection('courses').createIndex(
    { slug: 1 },
    { unique: true, name: 'slug_unique_idx' }
  );

  // Ensure compound unique index on enrollments (userId, courseId)
  await db.collection('enrollments').createIndex(
    { userId: 1, courseId: 1 },
    { unique: true, name: 'user_course_enrollment_unique_idx' }
  );

  // Ensure compound unique index on progress (userId, courseId)
  await db.collection('progresses').createIndex(
    { userId: 1, courseId: 1 },
    { unique: true, name: 'user_course_progress_unique_idx' }
  );

  // Ensure unique index on userpreferences.userId
  await db.collection('userpreferences').createIndex(
    { userId: 1 },
    { unique: true, name: 'user_preference_userId_unique_idx' }
  );
};

export const down = async (db, _client) => {
  await db.collection('users').dropIndex('email_unique_idx').catch(() => {});
  await db.collection('courses').dropIndex('slug_unique_idx').catch(() => {});
  await db.collection('enrollments').dropIndex('user_course_enrollment_unique_idx').catch(() => {});
  await db.collection('progresses').dropIndex('user_course_progress_unique_idx').catch(() => {});
  await db.collection('userpreferences').dropIndex('user_preference_userId_unique_idx').catch(() => {});
};
