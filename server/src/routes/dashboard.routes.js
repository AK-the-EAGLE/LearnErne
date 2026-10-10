import { Router } from 'express';
import { User } from '../models/User.js';
import { Course } from '../models/Course.js';
import { Enrollment } from '../models/Enrollment.js';
import { Progress } from '../models/Progress.js';
import { asyncRoute, httpError } from '../lib/httpError.js';
import { publicUser } from '../lib/users.js';
import { courseView } from '../lib/courseView.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();
router.use(requireAuth);

router.get('/', asyncRoute(async (req, res) => {
  const [user, enrollments] = await Promise.all([
    User.findById(req.session.userId),
    Enrollment.find({ userId: req.session.userId, status: { $ne: 'dropped' } }).sort({ updatedAt: -1 }),
  ]);
  if (!user || user.status !== 'active') throw httpError(401, 'AUTHENTICATION_REQUIRED', 'Sign in to continue.');
  const courseIds = enrollments.map((enrollment) => enrollment.courseId);
  const [courses, progressRecords] = await Promise.all([
    Course.find({ _id: { $in: courseIds }, status: 'published' }),
    Progress.find({ userId: req.session.userId, courseId: { $in: courseIds } }),
  ]);
  const courseById = new Map(courses.map((course) => [String(course._id), course]));
  const progressById = new Map(progressRecords.map((progress) => [String(progress.courseId), progress]));
  const learningPaths = enrollments.flatMap((enrollment) => {
    const course = courseById.get(String(enrollment.courseId));
    if (!course) return [];
    const progress = progressById.get(String(course._id));
    const view = courseView(course, enrollment, progress);
    return [{
      id: view.id,
      slug: view.slug,
      title: view.title,
      category: view.category,
      level: view.level,
      description: view.description,
      steps: view.steps,
      weeklyTasks: view.weeklyTasks,
      modules: view.modules.map((module) => ({
        id: module.id,
        title: module.title,
        lessons: module.lessons.map((lesson) => ({ id: lesson.id, title: lesson.title })),
        checkpoint: {
          id: module.checkpoint.id,
          title: module.checkpoint.title,
          completed: module.checkpoint.completed,
        },
      })),
      summary: view.summary,
      enrollment: view.enrollment,
      progress: view.progress,
    }];
  });
  res.json({
    success: true,
    data: {
      user: publicUser(user),
      enrollments: learningPaths,
      activity: progressRecords.map((progress) => ({
        courseId: String(progress.courseId),
        lastAccessedAt: progress.lastAccessedAt,
        percentComplete: progress.percentComplete,
      })),
    },
  });
}));

export default router;
