export function getActivityPath(course, activity) {
  if (!course?.slug || !activity?.id) return `/courses/${encodeURIComponent(course?.slug || '')}`;
  const slug = encodeURIComponent(course.slug);
  const activityId = encodeURIComponent(activity.id);
  return activity.type === 'checkpoint'
    ? `/courses/${slug}/checkpoints/${activityId}`
    : `/courses/${slug}/lessons/${activityId}`;
}

export function getNextCourseActivity(course) {
  if (!course?.modules) return null;
  const completedLessons = new Set(course.progress?.completedLessonIds || []);
  const completedCheckpoints = new Set(course.progress?.completedCheckpointIds || []);
  for (const module of course.modules) {
    const lesson = module.lessons.find((item) => !completedLessons.has(item.id));
    if (lesson) {
      return { type: 'lesson', id: lesson.id, title: lesson.title };
    }
    if (!completedCheckpoints.has(module.checkpoint.id)) {
      return { type: 'checkpoint', id: module.checkpoint.id, title: module.checkpoint.title };
    }
  }
  return null;
}
