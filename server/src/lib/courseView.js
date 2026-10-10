export function getCourseActivity(course, progress = {}) {
  const completedLessons = new Set(progress.completedLessonIds || []);
  const completedCheckpoints = new Set(progress.completedCheckpointIds || []);
  const activities = course.modules.flatMap((module) => [
    ...module.lessons.map((lesson) => ({
      type: 'lesson',
      id: lesson.lessonId,
      moduleId: module.moduleId,
      moduleTitle: module.title,
      title: lesson.title,
      completed: completedLessons.has(lesson.lessonId),
    })),
    {
      type: 'checkpoint',
      id: module.checkpoint.checkpointId,
      moduleId: module.moduleId,
      moduleTitle: module.title,
      title: module.checkpoint.title,
      completed: completedCheckpoints.has(module.checkpoint.checkpointId),
    },
  ]);
  const totalActivities = activities.length;
  const completedActivities = activities.filter((activity) => activity.completed).length;
  const current = activities.find((activity) => !activity.completed) || null;

  return {
    activities,
    current,
    lessonCount: course.modules.reduce((count, module) => count + module.lessons.length, 0),
    checkpointCount: course.modules.length,
    percentComplete: totalActivities
      ? Math.round(completedActivities / totalActivities * 100)
      : progress?.percentComplete || 0,
  };
}

export function courseView(course, enrollment = null, progress = null) {
  const activity = getCourseActivity(course, progress || {});
  const currentLesson = activity.activities.find((item) => (
    item.type === 'lesson'
    && item.id === progress?.currentLessonId
    && !item.completed
  ));
  const quizResults = (progress?.quizResults || []).map((result) => ({
    lessonId: result.lessonId,
    scorePercent: result.scorePercent,
    passed: result.passed,
    answers: result.answers.map((answer) => ({
      questionId: answer.questionId,
      selectedOptionId: answer.selectedOptionId,
      isCorrect: answer.isCorrect,
      correctOptionId: answer.correctOptionId,
      feedback: answer.feedback,
    })),
    completedAt: result.completedAt,
  }));
  const checkpointResponses = (progress?.checkpointResponses || []).map((item) => ({
    checkpointId: item.checkpointId,
    response: item.response,
    completedAt: item.completedAt,
  }));

  return {
    id: String(course._id),
    slug: course.slug,
    title: course.title,
    category: course.category,
    level: course.level,
    description: course.description,
    contentVersion: course.contentVersion,
    steps: course.steps.map((step) => ({ id: step.stepId, title: step.title, detail: step.detail })),
    weeklyTasks: course.weeklyTasks.map((task) => ({ id: task.taskId, title: task.title })),
    modules: course.modules.map((module) => ({
      id: module.moduleId,
      title: module.title,
      lessons: module.lessons.map((lesson) => ({
        id: lesson.lessonId,
        title: lesson.title,
        introduction: lesson.introduction,
        explanation: lesson.explanation,
        example: lesson.example,
        activity: {
          title: lesson.activity.title,
          instructions: lesson.activity.instructions,
          deliverable: lesson.activity.deliverable,
        },
        quiz: {
          passPercent: lesson.quiz.passPercent,
          questions: lesson.quiz.questions.map((item) => ({
            id: item.questionId,
            prompt: item.prompt,
            options: item.options.map((option) => ({ id: option.optionId, label: option.label })),
          })),
        },
      })),
      checkpoint: {
        id: module.checkpoint.checkpointId,
        title: module.checkpoint.title,
        prompt: module.checkpoint.prompt,
        instructions: module.checkpoint.instructions,
        completed: (progress?.completedCheckpointIds || []).includes(module.checkpoint.checkpointId),
        response: checkpointResponses.find((item) => item.checkpointId === module.checkpoint.checkpointId)?.response || '',
      },
    })),
    enrollment: enrollment ? {
      id: String(enrollment._id),
      status: enrollment.status,
      enrolledAt: enrollment.enrolledAt,
    } : null,
    progress: {
      completedSteps: progress?.completedSteps || [],
      completedWeeklyTasks: progress?.completedWeeklyTasks || [],
      completedLessonIds: progress?.completedLessonIds || [],
      completedCheckpointIds: progress?.completedCheckpointIds || [],
      quizResults,
      checkpointResponses,
      currentLessonId: progress?.currentLessonId || null,
      nextActivity: currentLesson || activity.current,
      percentComplete: activity.percentComplete,
      lastAccessedAt: progress?.lastAccessedAt || null,
    },
    summary: {
      lessonCount: activity.lessonCount,
      checkpointCount: activity.checkpointCount,
    },
  };
}

export function getLesson(course, lessonId) {
  for (const module of course.modules) {
    const lesson = module.lessons.find((item) => item.lessonId === lessonId);
    if (lesson) return { module, lesson };
  }
  return null;
}

export function lessonIsAvailable(course, lessonId, progress = {}) {
  const location = getLesson(course, lessonId);
  if (!location) return false;
  const moduleIndex = course.modules.findIndex((module) => module.moduleId === location.module.moduleId);
  const completedCheckpoints = new Set(progress.completedCheckpointIds || []);
  return course.modules.slice(0, moduleIndex)
    .every((module) => completedCheckpoints.has(module.checkpoint.checkpointId));
}
