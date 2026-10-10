import { Router } from 'express';
import mongoose from 'mongoose';
import { Course } from '../models/Course.js';
import { Enrollment } from '../models/Enrollment.js';
import { Progress } from '../models/Progress.js';
import { asyncRoute, httpError } from '../lib/httpError.js';
import { courseView, getCourseActivity, getLesson, lessonIsAvailable } from '../lib/courseView.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

router.use(requireAuth);

router.get('/', asyncRoute(async (req, res) => {
  const courses = await Course.find({ status: 'published' }).sort({ title: 1 });
  const [enrollments, progressRecords] = await Promise.all([
    Enrollment.find({ userId: req.session.userId, status: { $ne: 'dropped' } }),
    Progress.find({ userId: req.session.userId }),
  ]);
  const byCourse = new Map(enrollments.map((enrollment) => [String(enrollment.courseId), enrollment]));
  const progressByCourse = new Map(progressRecords.map((record) => [String(record.courseId), record]));
  res.json({
    success: true,
    data: {
      courses: courses.map((course) => courseView(
        course,
        byCourse.get(String(course._id)),
        progressByCourse.get(String(course._id)),
      )),
    },
  });
}));

router.post('/:courseId/enroll', asyncRoute(async (req, res) => {
  const course = await findPublishedCourse(req.params.courseId);
  const enrollment = await Enrollment.findOneAndUpdate(
    { userId: req.session.userId, courseId: course._id },
    { $set: { status: 'active' }, $setOnInsert: { userId: req.session.userId, courseId: course._id } },
    { upsert: true, returnDocument: 'after', runValidators: true, setDefaultsOnInsert: true },
  );
  const progress = await Progress.findOneAndUpdate(
    { userId: req.session.userId, courseId: course._id },
    { $setOnInsert: { userId: req.session.userId, courseId: course._id } },
    { upsert: true, returnDocument: 'after', runValidators: true, setDefaultsOnInsert: true },
  );
  res.status(201).json({ success: true, data: { course: courseView(course, enrollment, progress) } });
}));

router.post('/:courseId/lessons/:lessonId/open', asyncRoute(async (req, res) => {
  const course = await findPublishedCourse(req.params.courseId);
  const { enrollment, progress } = await findLearnerProgress(req.session.userId, course._id);
  const location = getLesson(course, req.params.lessonId);
  if (!location) throw httpError(404, 'LESSON_NOT_FOUND', 'Lesson not found.');
  if (!lessonIsAvailable(course, req.params.lessonId, progress)) {
    throw httpError(409, 'PREVIOUS_MODULE_REQUIRED', 'Complete the previous module checkpoint before continuing.');
  }
  progress.currentLessonId = req.params.lessonId;
  progress.lastAccessedAt = new Date();
  await progress.save();
  res.json({ success: true, data: { course: courseView(course, enrollment, progress) } });
}));

router.post('/:courseId/lessons/:lessonId/quiz', asyncRoute(async (req, res) => {
  const course = await findPublishedCourse(req.params.courseId);
  const { enrollment, progress } = await findLearnerProgress(req.session.userId, course._id);
  const location = getLesson(course, req.params.lessonId);
  if (!location) throw httpError(404, 'LESSON_NOT_FOUND', 'Lesson not found.');
  if (!lessonIsAvailable(course, req.params.lessonId, progress)) {
    throw httpError(409, 'PREVIOUS_MODULE_REQUIRED', 'Complete the previous module checkpoint before continuing.');
  }

  const answers = req.body?.answers;
  const questions = location.lesson.quiz.questions;
  if (
    !Array.isArray(answers)
    || answers.length !== questions.length
    || answers.some((answer) => !answer || typeof answer.questionId !== 'string' || typeof answer.optionId !== 'string')
    || new Set(answers.map((answer) => answer.questionId)).size !== questions.length
  ) {
    throw httpError(400, 'VALIDATION_ERROR', 'Answer every quiz question before submitting.');
  }

  const answerByQuestion = new Map(answers.map((answer) => [answer.questionId, answer.optionId]));
  if (questions.some((item) => (
    !answerByQuestion.has(item.questionId)
    || !item.options.some((option) => option.optionId === answerByQuestion.get(item.questionId))
  ))) {
    throw httpError(400, 'VALIDATION_ERROR', 'The quiz contains an unknown question or answer.');
  }

  const results = questions.map((item) => {
    const selectedOptionId = answerByQuestion.get(item.questionId);
    const isCorrect = selectedOptionId === item.correctOptionId;
    return {
      questionId: item.questionId,
      selectedOptionId,
      isCorrect,
      correctOptionId: item.correctOptionId,
      feedback: isCorrect ? item.correctFeedback : item.incorrectFeedback,
    };
  });
  const correctCount = results.filter((result) => result.isCorrect).length;
  const scorePercent = Math.round(correctCount / questions.length * 100);
  const passed = scorePercent >= location.lesson.quiz.passPercent;
  const savedResult = {
    lessonId: req.params.lessonId,
    scorePercent,
    passed,
    answers: results.map(({ questionId, selectedOptionId, isCorrect, correctOptionId, feedback }) => ({
      questionId,
      selectedOptionId,
      isCorrect,
      correctOptionId,
      feedback,
    })),
    completedAt: new Date(),
  };

  const existingIndex = progress.quizResults.findIndex((result) => result.lessonId === req.params.lessonId);
  if (existingIndex >= 0) {
    progress.quizResults[existingIndex] = savedResult;
  } else {
    progress.quizResults.push(savedResult);
  }
  progress.currentLessonId = req.params.lessonId;
  progress.lastAccessedAt = new Date();
  await progress.save();

  res.json({
    success: true,
    data: {
      course: courseView(course, enrollment, progress),
      result: { scorePercent, passed, passPercent: location.lesson.quiz.passPercent, answers: results },
    },
  });
}));

router.post('/:courseId/lessons/:lessonId/complete', asyncRoute(async (req, res) => {
  const course = await findPublishedCourse(req.params.courseId);
  const { enrollment, progress } = await findLearnerProgress(req.session.userId, course._id);
  const location = getLesson(course, req.params.lessonId);
  if (!location) throw httpError(404, 'LESSON_NOT_FOUND', 'Lesson not found.');
  if (!lessonIsAvailable(course, req.params.lessonId, progress)) {
    throw httpError(409, 'PREVIOUS_MODULE_REQUIRED', 'Complete the previous module checkpoint before continuing.');
  }
  const quizResult = progress.quizResults.find((result) => result.lessonId === req.params.lessonId);
  if (location.lesson.quiz.questions.length && !quizResult?.passed) {
    throw httpError(409, 'QUIZ_PASS_REQUIRED', 'Pass this lesson quiz before marking the lesson complete.');
  }

  if (!progress.completedLessonIds.includes(req.params.lessonId)) {
    progress.completedLessonIds.push(req.params.lessonId);
  }
  progress.lastAccessedAt = new Date();
  const activity = getCourseActivity(course, progress);
  progress.currentLessonId = activity.current?.type === 'lesson' ? activity.current.id : null;
  progress.percentComplete = activity.percentComplete;
  await progress.save();

  const allComplete = activity.activities.every((item) => item.completed);
  if (allComplete && enrollment.status !== 'completed') {
    enrollment.status = 'completed';
    enrollment.completedAt = new Date();
    await enrollment.save();
  }
  res.json({ success: true, data: { course: courseView(course, enrollment, progress) } });
}));

router.post('/:courseId/checkpoints/:checkpointId/complete', asyncRoute(async (req, res) => {
  const course = await findPublishedCourse(req.params.courseId);
  const { enrollment, progress } = await findLearnerProgress(req.session.userId, course._id);
  const module = course.modules.find((item) => item.checkpoint.checkpointId === req.params.checkpointId);
  if (!module) throw httpError(404, 'CHECKPOINT_NOT_FOUND', 'Checkpoint not found.');
  if (!module.lessons.every((lesson) => progress.completedLessonIds.includes(lesson.lessonId))) {
    throw httpError(409, 'LESSONS_REQUIRED', 'Complete every lesson in this module before submitting its checkpoint.');
  }

  const response = typeof req.body?.response === 'string' ? req.body.response.trim() : '';
  if (response.length < 20 || response.length > 2000) {
    throw httpError(400, 'VALIDATION_ERROR', 'Checkpoint reflections must contain 20 to 2,000 characters.');
  }
  if (!progress.completedCheckpointIds.includes(req.params.checkpointId)) {
    progress.completedCheckpointIds.push(req.params.checkpointId);
  }
  const existingIndex = progress.checkpointResponses.findIndex((item) => item.checkpointId === req.params.checkpointId);
  const checkpointResponse = { checkpointId: req.params.checkpointId, response, completedAt: new Date() };
  if (existingIndex >= 0) {
    progress.checkpointResponses[existingIndex] = checkpointResponse;
  } else {
    progress.checkpointResponses.push(checkpointResponse);
  }
  progress.lastAccessedAt = new Date();
  const activity = getCourseActivity(course, progress);
  progress.percentComplete = activity.percentComplete;
  progress.currentLessonId = activity.current?.type === 'lesson' ? activity.current.id : null;
  await progress.save();

  if (activity.activities.every((item) => item.completed) && enrollment.status !== 'completed') {
    enrollment.status = 'completed';
    enrollment.completedAt = new Date();
    await enrollment.save();
  }
  res.json({ success: true, data: { course: courseView(course, enrollment, progress) } });
}));

router.patch('/:courseId/progress', asyncRoute(async (req, res) => {
  const course = await findPublishedCourse(req.params.courseId);
  const { enrollment, progress } = await findLearnerProgress(req.session.userId, course._id);
  const { completedSteps, completedWeeklyTasks } = req.body ?? {};
  if (!Array.isArray(completedSteps) || !Array.isArray(completedWeeklyTasks)
    || completedSteps.some((id) => typeof id !== 'string' || !course.steps.some((step) => step.stepId === id))
    || completedWeeklyTasks.some((id) => typeof id !== 'string' || !course.weeklyTasks.some((task) => task.taskId === id))) {
    throw httpError(400, 'VALIDATION_ERROR', 'Progress contains unknown course steps or weekly tasks.');
  }
  progress.completedSteps = [...new Set(completedSteps)];
  progress.completedWeeklyTasks = [...new Set(completedWeeklyTasks)];
  if (!course.modules.length) {
    progress.percentComplete = course.steps.length
      ? Math.round(progress.completedSteps.length / course.steps.length * 100)
      : 0;
  }
  progress.lastAccessedAt = new Date();
  await progress.save();
  res.json({ success: true, data: { course: courseView(course, enrollment, progress) } });
}));

router.get('/:courseId', asyncRoute(async (req, res) => {
  const course = await findPublishedCourse(req.params.courseId);
  const [enrollment, progress] = await Promise.all([
    Enrollment.findOne({ userId: req.session.userId, courseId: course._id, status: { $ne: 'dropped' } }),
    Progress.findOne({ userId: req.session.userId, courseId: course._id }),
  ]);
  res.json({ success: true, data: { course: courseView(course, enrollment, progress) } });
}));

async function findPublishedCourse(id) {
  const condition = mongoose.isValidObjectId(id) ? { _id: id } : { slug: id };
  const course = await Course.findOne({ ...condition, status: 'published' });
  if (!course) throw httpError(404, 'COURSE_NOT_FOUND', 'Course not found.');
  return course;
}

async function findLearnerProgress(userId, courseId) {
  const enrollment = await Enrollment.findOne({
    userId,
    courseId,
    status: { $in: ['active', 'completed'] },
  });
  if (!enrollment) throw httpError(409, 'ENROLLMENT_REQUIRED', 'Enroll in this course before updating progress.');
  let progress = await Progress.findOne({ userId, courseId });
  if (!progress) progress = new Progress({ userId, courseId });
  return { enrollment, progress };
}

export default router;
