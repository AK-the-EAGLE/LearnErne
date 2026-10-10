import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import session from 'express-session';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/database.js';
import { User } from '../src/models/User.js';
import { Course } from '../src/models/Course.js';
import { Enrollment } from '../src/models/Enrollment.js';
import { Progress } from '../src/models/Progress.js';
import { UserPreference } from '../src/models/UserPreference.js';
import { courseCatalog } from '../src/data/courseCatalog.js';
import { upsertCourseCatalog } from '../src/scripts/seedCourses.js';

let mongoServer;
let app;
const sessionStore = new session.MemoryStore();

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await connectDB(uri);
  app = createApp({ sessionStore });
});

async function createAuthenticatedAgent(email = 'learner@example.com', displayName = 'Learner One') {
  const agent = request.agent(app);
  const csrf = await agent.get('/api/v1/auth/csrf');
  const response = await agent.post('/api/v1/auth/register')
    .set('X-CSRF-Token', csrf.body.data.csrfToken)
    .send({ displayName, email, password: 'valid-password-123' });
  expect(response.status).toBe(201);
  return { agent, user: response.body.data.user, csrfToken: response.body.data.csrfToken };
}

describe('5. Authentication, CSRF, and authenticated API', () => {
  it('registers, restores, logs out, and does not expose authentication secrets', async () => {
    const agent = request.agent(app);
    const csrf = await agent.get('/api/v1/auth/csrf');
    const registration = await agent.post('/api/v1/auth/register')
      .set('X-CSRF-Token', csrf.body.data.csrfToken)
      .send({ displayName: 'New Learner', email: 'NEW@example.com', password: 'valid-password-123' });

    expect(registration.status).toBe(201);
    expect(registration.body.data.user).toMatchObject({ email: 'new@example.com', displayName: 'New Learner' });
    expect(registration.body.data.user.passwordHash).toBeUndefined();
    const storedUser = await User.findById(registration.body.data.user.id).select('+passwordHash');
    expect(storedUser.passwordHash).not.toBe('valid-password-123');
    expect(storedUser.passwordHash).toMatch(/^\$2/);
    expect(registration.body.data.csrfToken).toBeTruthy();
    expect((await agent.get('/api/v1/auth/me')).body.data.user.id).toBe(registration.body.data.user.id);

    const logout = await agent.post('/api/v1/auth/logout').set('X-CSRF-Token', registration.body.data.csrfToken);
    expect(logout.status).toBe(200);
    expect((await agent.get('/api/v1/auth/me')).body.data.user).toBeNull();

    const loginCsrf = await agent.get('/api/v1/auth/csrf');
    const login = await agent.post('/api/v1/auth/login')
      .set('X-CSRF-Token', loginCsrf.body.data.csrfToken)
      .send({ email: 'new@example.com', password: 'valid-password-123' });
    expect(login.status).toBe(200);
    expect((await agent.get('/api/v1/auth/me')).body.data.user.id).toBe(registration.body.data.user.id);
  });

  it('rejects missing CSRF tokens and untrusted mutation origins', async () => {
    const agent = request.agent(app);
    const missingToken = await agent.post('/api/v1/auth/register')
      .send({ displayName: 'Learner', email: 'csrf@example.com', password: 'valid-password-123' });
    expect(missingToken.status).toBe(403);
    expect(missingToken.body.error.code).toBe('CSRF_TOKEN_INVALID');

    const csrf = await agent.get('/api/v1/auth/csrf');
    const deniedOrigin = await agent.post('/api/v1/auth/register')
      .set('X-CSRF-Token', csrf.body.data.csrfToken)
      .set('Origin', 'https://unexpected.example')
      .send({ displayName: 'Learner', email: 'csrf@example.com', password: 'valid-password-123' });
    expect(deniedOrigin.status).toBe(403);
    expect(deniedOrigin.body.error.code).toBe('CORS_ORIGIN_DENIED');
  });

  it('uses generic login errors and validates registration fields', async () => {
    const agent = request.agent(app);
    const csrf = await agent.get('/api/v1/auth/csrf');
    const invalidRegistration = await agent.post('/api/v1/auth/register')
      .set('X-CSRF-Token', csrf.body.data.csrfToken)
      .send({ displayName: '', email: 'not-an-email', password: 'short' });
    expect(invalidRegistration.status).toBe(400);
    expect(invalidRegistration.body.error.code).toBe('VALIDATION_ERROR');

    await createAuthenticatedAgent('valid@example.com');
    const visitor = request.agent(app);
    const loginCsrf = await visitor.get('/api/v1/auth/csrf');
    const invalidLogin = await visitor.post('/api/v1/auth/login')
      .set('X-CSRF-Token', loginCsrf.body.data.csrfToken)
      .send({ email: 'valid@example.com', password: 'wrong-password' });
    expect(invalidLogin.status).toBe(401);
    expect(invalidLogin.body.error).toMatchObject({
      code: 'INVALID_CREDENTIALS',
      message: 'Email or password is incorrect.',
    });
  });

  it('protects private endpoints and persists owner-scoped profile and preferences', async () => {
    expect((await request(app).get('/api/v1/users/me')).status).toBe(401);
    expect((await request(app).get('/api/v1/courses')).status).toBe(401);
    expect((await request(app).get('/api/v1/dashboard')).status).toBe(401);

    const { agent, user } = await createAuthenticatedAgent();
    const csrf = await agent.get('/api/v1/auth/csrf');
    const updated = await agent.patch('/api/v1/users/me')
      .set('X-CSRF-Token', csrf.body.data.csrfToken)
      .send({ displayName: 'Updated Learner', location: 'Wellington', interest: 'Design', bio: 'Learning by doing.' });
    expect(updated.status).toBe(200);
    expect(updated.body.data.user).toMatchObject({
      id: user.id,
      displayName: 'Updated Learner',
      profile: { location: 'Wellington', interest: 'Design', bio: 'Learning by doing.' },
    });

    const preferences = await agent.put('/api/v1/users/me/preferences')
      .set('X-CSRF-Token', csrf.body.data.csrfToken)
      .send({ preferences: { darkMode: true, courseReminders: false, weeklyDigest: true, progressHighlights: true } });
    expect(preferences.status).toBe(200);
    expect((await agent.get('/api/v1/users/me/preferences')).body.data.preferences.darkMode).toBe(true);

    const secondUser = await createAuthenticatedAgent('second@example.com', 'Second Learner');
    expect((await secondUser.agent.get('/api/v1/users/me')).body.data.user.id).not.toBe(user.id);
    expect((await secondUser.agent.get('/api/v1/dashboard')).body.data.enrollments).toEqual([]);
    const secondCsrf = (await secondUser.agent.get('/api/v1/auth/csrf')).body.data.csrfToken;
    const attemptedProfileSpoof = await secondUser.agent.patch('/api/v1/users/me')
      .set('X-CSRF-Token', secondCsrf)
      .send({ userId: user.id, displayName: 'Second Learner Updated' });
    expect(attemptedProfileSpoof.body.data.user.id).not.toBe(user.id);
    expect(attemptedProfileSpoof.body.data.user.displayName).toBe('Second Learner Updated');
  });

  it('persists enrollment and course progress, shared with dashboard', async () => {
    const { agent } = await createAuthenticatedAgent();
    const course = await Course.create({
      title: 'Sample Course',
      slug: 'sample-course',
      description: 'A test course.',
      category: 'Testing',
      level: 'Beginner',
      steps: [
        { stepId: 'step-one', title: 'First step', detail: 'Complete this step.' },
        { stepId: 'step-two', title: 'Second step', detail: 'Complete the next step.' },
      ],
      weeklyTasks: [{ taskId: 'task-one', title: 'Practice' }],
    });
    const csrf = await agent.get('/api/v1/auth/csrf');
    const enroll = await agent.post(`/api/v1/courses/${course.id}/enroll`)
      .set('X-CSRF-Token', csrf.body.data.csrfToken);
    expect(enroll.status).toBe(201);

    const progress = await agent.patch(`/api/v1/courses/${course.id}/progress`)
      .set('X-CSRF-Token', csrf.body.data.csrfToken)
      .send({ completedSteps: ['step-one'], completedWeeklyTasks: ['task-one'] });
    expect(progress.status).toBe(200);
    expect(progress.body.data.course.progress.percentComplete).toBe(50);
    const invalidProgress = await agent.patch(`/api/v1/courses/${course.id}/progress`)
      .set('X-CSRF-Token', csrf.body.data.csrfToken)
      .send({ completedSteps: ['not-a-course-step'], completedWeeklyTasks: [] });
    expect(invalidProgress.status).toBe(400);

    const dashboard = await agent.get('/api/v1/dashboard');
    expect(dashboard.body.data.enrollments).toHaveLength(1);
    expect(dashboard.body.data.enrollments[0]).toMatchObject({
      id: course.id,
      progress: { percentComplete: 50, completedSteps: ['step-one'], completedWeeklyTasks: ['task-one'] },
    });
    const catalog = await agent.get('/api/v1/courses');
    expect(catalog.body.data.courses[0].progress.percentComplete).toBe(50);

    const secondUser = await createAuthenticatedAgent('second@example.com', 'Second Learner');
    const rejectedOtherUserProgress = await secondUser.agent.patch(`/api/v1/courses/${course.id}/progress`)
      .set('X-CSRF-Token', secondUser.csrfToken)
      .send({ completedSteps: ['step-one'], completedWeeklyTasks: [] });
    expect(rejectedOtherUserProgress.status).toBe(409);
  });
});

describe('6. Structured course catalog and learner progress', () => {
  it('seeds versioned lesson content idempotently without deleting learner progress', async () => {
    await upsertCourseCatalog();
    const course = await Course.findOne({ slug: 'learning-plan' });
    const user = await User.create({
      displayName: 'Catalog Learner',
      email: 'catalog@example.com',
      passwordHash: 'test-hash',
    });
    const enrollment = await Enrollment.create({ userId: user.id, courseId: course.id });
    const progress = await Progress.create({
      userId: user.id,
      courseId: course.id,
      completedSteps: ['name-goal'],
      completedLessonIds: ['name-the-outcome'],
      completedCheckpointIds: ['focus-checkpoint'],
      percentComplete: 40,
    });

    await upsertCourseCatalog();

    expect(await Course.countDocuments()).toBe(courseCatalog.length);
    const refreshedCourse = await Course.findById(course.id);
    expect(refreshedCourse.contentVersion).toBe(2);
    expect(refreshedCourse.modules).toHaveLength(2);
    expect(refreshedCourse.modules[0].lessons[0].quiz.questions.length).toBeGreaterThan(0);
    expect(await Enrollment.findById(enrollment.id)).toBeTruthy();
    const refreshedProgress = await Progress.findById(progress.id);
    expect(refreshedProgress.completedSteps).toEqual(['name-goal']);
    expect(refreshedProgress.completedLessonIds).toEqual(['name-the-outcome']);
    expect(refreshedProgress.completedCheckpointIds).toEqual(['focus-checkpoint']);
  });

  it('serves published lessons, gates access, records quizzes and resumes at the next activity', async () => {
    await upsertCourseCatalog();
    const { agent, user, csrfToken } = await createAuthenticatedAgent();
    const course = await Course.findOne({ slug: 'learning-plan' });
    const firstModule = course.modules[0];
    const firstLesson = firstModule.lessons[0];

    const catalog = await agent.get('/api/v1/courses');
    expect(catalog.status).toBe(200);
    expect(catalog.body.data.courses.find((item) => item.slug === course.slug).summary.lessonCount).toBe(4);

    const detail = await agent.get(`/api/v1/courses/${course.slug}`);
    expect(detail.status).toBe(200);
    expect(detail.body.data.course.modules[0].lessons[0]).toMatchObject({
      id: firstLesson.lessonId,
      title: firstLesson.title,
      explanation: firstLesson.explanation,
    });
    expect(JSON.stringify(detail.body.data.course)).not.toContain('correctOptionId');

    const notEnrolled = await agent.post(`/api/v1/courses/${course.slug}/lessons/${firstLesson.lessonId}/open`)
      .set('X-CSRF-Token', csrfToken);
    expect(notEnrolled.status).toBe(409);
    const enrolled = await agent.post(`/api/v1/courses/${course.slug}/enroll`)
      .set('X-CSRF-Token', csrfToken);
    expect(enrolled.status).toBe(201);

    const secondUser = await createAuthenticatedAgent('other-course@example.com', 'Other Learner');
    const foreignOpen = await secondUser.agent.post(`/api/v1/courses/${course.slug}/lessons/${firstLesson.lessonId}/open`)
      .set('X-CSRF-Token', secondUser.csrfToken);
    expect(foreignOpen.status).toBe(409);

    for (const lesson of firstModule.lessons) {
      const opened = await agent.post(`/api/v1/courses/${course.slug}/lessons/${lesson.lessonId}/open`)
        .set('X-CSRF-Token', csrfToken);
      expect(opened.status).toBe(200);
      const answers = lesson.quiz.questions.map((item) => ({
        questionId: item.questionId,
        optionId: item.correctOptionId,
      }));
      const quiz = await agent.post(`/api/v1/courses/${course.slug}/lessons/${lesson.lessonId}/quiz`)
        .set('X-CSRF-Token', csrfToken)
        .send({ answers });
      expect(quiz.status).toBe(200);
      expect(quiz.body.data.result.passed).toBe(true);
      const completed = await agent.post(`/api/v1/courses/${course.slug}/lessons/${lesson.lessonId}/complete`)
        .set('X-CSRF-Token', csrfToken);
      expect(completed.status).toBe(200);
    }

    const beforeCheckpoint = await agent.post(`/api/v1/courses/${course.slug}/lessons/${course.modules[1].lessons[0].lessonId}/open`)
      .set('X-CSRF-Token', csrfToken);
    expect(beforeCheckpoint.status).toBe(409);
    expect(beforeCheckpoint.body.error.code).toBe('PREVIOUS_MODULE_REQUIRED');

    const checkpoint = await agent.post(`/api/v1/courses/${course.slug}/checkpoints/${firstModule.checkpoint.checkpointId}/complete`)
      .set('X-CSRF-Token', csrfToken)
      .send({ response: 'The goal is specific and the first attempt is manageable.' });
    expect(checkpoint.status).toBe(200);
    expect(checkpoint.body.data.course.progress.nextActivity.id).toBe(course.modules[1].lessons[0].lessonId);
    expect(checkpoint.body.data.course.progress.currentLessonId).toBe(course.modules[1].lessons[0].lessonId);

    const persisted = await Progress.findOne({ userId: user.id, courseId: course.id });
    expect(persisted.completedLessonIds).toEqual(firstModule.lessons.map((lesson) => lesson.lessonId));
    expect(persisted.completedCheckpointIds).toContain(firstModule.checkpoint.checkpointId);
    expect(persisted.quizResults).toHaveLength(firstModule.lessons.length);
    expect(persisted.checkpointResponses[0].response).toContain('specific');

    const dashboard = await agent.get('/api/v1/dashboard');
    const dashboardCourse = dashboard.body.data.enrollments.find((item) => item.slug === course.slug);
    expect(dashboardCourse.progress.percentComplete).toBe(50);
    expect(dashboardCourse.progress.nextActivity.id).toBe(course.modules[1].lessons[0].lessonId);
    expect(dashboardCourse.modules[0].lessons[0]).not.toHaveProperty('quiz');
  });

  it('rejects incomplete and invalid quiz submissions without changing lesson completion', async () => {
    await upsertCourseCatalog();
    const { agent, csrfToken } = await createAuthenticatedAgent();
    const course = await Course.findOne({ slug: 'research-basics' });
    const lesson = course.modules[0].lessons[0];
    await agent.post(`/api/v1/courses/${course.slug}/enroll`).set('X-CSRF-Token', csrfToken);
    const rejected = await agent.post(`/api/v1/courses/${course.slug}/lessons/${lesson.lessonId}/quiz`)
      .set('X-CSRF-Token', csrfToken)
      .send({ answers: [] });
    expect(rejected.status).toBe(400);
    const invalidCompletion = await agent.post(`/api/v1/courses/${course.slug}/lessons/${lesson.lessonId}/complete`)
      .set('X-CSRF-Token', csrfToken);
    expect(invalidCompletion.status).toBe(409);
    expect(invalidCompletion.body.error.code).toBe('QUIZ_PASS_REQUIRED');
  });
});

afterAll(async () => {
  await disconnectDB();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  // Clear all collections between tests
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
  await new Promise((resolve) => sessionStore.clear(resolve));
});

describe('1. Express app imports and server separation', () => {
  it('imports createApp without binding to a network port', () => {
    const testApp = createApp({ sessionStore: new session.MemoryStore() });
    expect(testApp).toBeDefined();
    expect(typeof testApp.listen).toBe('function');
  });
});

describe('2. Health endpoint', () => {
  it('returns healthy status code 200 when database is connected', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('status', 'healthy');
    expect(res.body.data.database).toMatchObject({
      status: 'connected',
      readyState: 'connected',
      isReady: true,
    });
  });

  it('accurately reflects degraded state when database is disconnected', async () => {
    // Temporarily disconnect
    await mongoose.disconnect();

    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(503);
    expect(res.body.data.status).toBe('degraded');
    expect(res.body.data.database.isReady).toBe(false);

    // Reconnect for remaining tests
    await connectDB(mongoServer.getUri());
  });
});

describe('3. Centralized 404 and Error Handling', () => {
  it('returns consistent JSON for unknown routes', async () => {
    const res = await request(app).get('/api/v1/non-existent-route');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Cannot GET /api/v1/non-existent-route',
      },
    });
  });
});

describe('4. Mongoose Schemas and Validation', () => {
  it('validates required fields on User model', async () => {
    const user = new User({});
    let error;
    try {
      await user.validate();
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.errors.displayName).toBeDefined();
    expect(error.errors.email).toBeDefined();
    expect(error.errors.passwordHash).toBeDefined();
  });

  it('normalizes email to lowercase and enforces email format', async () => {
    const user = new User({
      displayName: 'Alice Learner',
      email: 'Alice.Test@Example.COM',
      passwordHash: 'hashed_secret_123',
    });
    await user.save();

    expect(user.email).toBe('alice.test@example.com');
  });

  it('enforces email uniqueness constraint', async () => {
    await User.init(); // Ensure indexes are built in memory
    const user1 = new User({
      displayName: 'First User',
      email: 'unique@example.com',
      passwordHash: 'hash1',
    });
    await user1.save();

    const user2 = new User({
      displayName: 'Duplicate User',
      email: 'UNIQUE@example.com',
      passwordHash: 'hash2',
    });

    let duplicateError;
    try {
      await user2.save();
    } catch (err) {
      duplicateError = err;
    }

    expect(duplicateError).toBeDefined();
    expect(duplicateError.code).toBe(11000);
  });

  it('never leaks passwordHash in toJSON transform', async () => {
    const user = new User({
      displayName: 'Secret Learner',
      email: 'secret@example.com',
      passwordHash: 'super_secret_hash',
    });
    await user.save();

    const json = user.toJSON();
    expect(json.passwordHash).toBeUndefined();
    expect(json.displayName).toBe('Secret Learner');
  });

  it('validates Course model fields', async () => {
    const course = new Course({
      title: 'Design Foundations',
      slug: 'design-foundations',
      description: 'Explore visual hierarchy and intentional design choices.',
      category: 'Design',
      level: 'Beginner',
      steps: [
        { stepId: 'step-1', title: 'Review a principle', detail: 'Note what it helps communicate' },
      ],
      weeklyTasks: [
        { taskId: 'task-1', title: 'Make a quick sketch' },
      ],
    });
    await course.save();
    expect(course._id).toBeDefined();
    expect(course.steps.length).toBe(1);
  });

  it('enforces compound uniqueness on Enrollment (userId, courseId)', async () => {
    await Enrollment.init(); // Ensure compound index exists
    const userId = new mongoose.Types.ObjectId();
    const courseId = new mongoose.Types.ObjectId();

    const enrollment1 = new Enrollment({ userId, courseId, status: 'active' });
    await enrollment1.save();

    const enrollment2 = new Enrollment({ userId, courseId, status: 'active' });
    let duplicateError;
    try {
      await enrollment2.save();
    } catch (err) {
      duplicateError = err;
    }

    expect(duplicateError).toBeDefined();
    expect(duplicateError.code).toBe(11000);
  });

  it('tracks progress and enforces single progress document per user and course', async () => {
    await Progress.init();
    const userId = new mongoose.Types.ObjectId();
    const courseId = new mongoose.Types.ObjectId();

    const progress1 = new Progress({
      userId,
      courseId,
      completedSteps: ['step-1'],
      percentComplete: 33,
    });
    await progress1.save();

    const progress2 = new Progress({
      userId,
      courseId,
      completedSteps: ['step-2'],
    });

    let duplicateError;
    try {
      await progress2.save();
    } catch (err) {
      duplicateError = err;
    }

    expect(duplicateError).toBeDefined();
    expect(duplicateError.code).toBe(11000);
  });

  it('saves user preferences with valid defaults', async () => {
    const userId = new mongoose.Types.ObjectId();
    const prefs = new UserPreference({ userId });
    await prefs.save();

    expect(prefs.darkMode).toBe(false);
    expect(prefs.courseReminders).toBe(true);
    expect(prefs.weeklyDigest).toBe(true);
    expect(prefs.progressHighlights).toBe(false);
  });
});
