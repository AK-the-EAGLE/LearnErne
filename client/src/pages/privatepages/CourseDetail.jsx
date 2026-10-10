import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import apiClient from '../../lib/api';
import { getActivityPath } from '../../learning/courseLinks';
import NotFound from '../publicpages/NotFound';

export default function CourseDetail() {
  const { courseSlug } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);

  const loadCourse = useCallback(async () => {
    setLoading(true);
    setError('');
    setNotFound(false);
    try {
      const response = await apiClient(`/courses/${encodeURIComponent(courseSlug)}`);
      setCourse(response.data.course);
    } catch (requestError) {
      setNotFound(requestError.status === 404);
      setError(requestError.message || 'This course could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [courseSlug]);

  useEffect(() => {
    const timer = window.setTimeout(loadCourse, 0);
    return () => window.clearTimeout(timer);
  }, [loadCourse]);

  async function enroll() {
    setWorking(true);
    setError('');
    try {
      const response = await apiClient(`/courses/${encodeURIComponent(courseSlug)}/enroll`, { method: 'POST' });
      const enrolledCourse = response.data.course;
      setCourse(enrolledCourse);
      if (enrolledCourse.progress.nextActivity) {
        navigate(getActivityPath(enrolledCourse, enrolledCourse.progress.nextActivity));
      }
    } catch (requestError) {
      setError(requestError.message || 'Enrollment could not be saved.');
    } finally {
      setWorking(false);
    }
  }

  if (loading) return <main className="page-container course-detail-page"><p role="status">Loading course…</p></main>;
  if (notFound) return <NotFound />;
  if (error && !course) {
    return (
      <main className="page-container course-detail-page">
        <p className="page-status-message" role="alert">{error}</p>
        <button className="button button-secondary" type="button" onClick={loadCourse}>Try again</button>
      </main>
    );
  }
  if (!course) return null;

  const nextActivity = course.progress.nextActivity;
  const completedLessons = course.progress.completedLessonIds;
  const completedCheckpoints = course.progress.completedCheckpointIds;
  const totalLessons = course.summary.lessonCount;
  const resumePath = nextActivity ? getActivityPath(course, nextActivity) : `/courses/${encodeURIComponent(course.slug)}`;

  return (
    <main className="page-container course-detail-page">
      <nav className="course-breadcrumbs" aria-label="Breadcrumb">
        <Link to="/courses">Learning library</Link><span aria-hidden="true">/</span><span>{course.title}</span>
      </nav>
      <header className="course-detail-header">
        <div>
          <p className="eyebrow">{course.category} · {course.level}</p>
          <h1>{course.title}</h1>
          <p>{course.description}</p>
        </div>
        <div className="course-detail-progress">
          <strong>{course.progress.percentComplete}%</strong>
          <span>course progress</span>
          <progress max="100" value={course.progress.percentComplete} aria-label={`${course.title}: ${course.progress.percentComplete}% complete`} />
          <small>{completedLessons.length} of {totalLessons} lessons complete</small>
          {course.enrollment ? (
            <Link className="button button-primary" to={resumePath}>
              {nextActivity ? 'Resume learning' : 'Review course'}
            </Link>
          ) : (
            <button className="button button-primary" type="button" onClick={enroll} disabled={working}>
              {working ? 'Saving enrollment…' : 'Enroll and start'}
            </button>
          )}
        </div>
      </header>
      {error && <p className="page-status-message" role="alert">{error}</p>}

      <section className="course-curriculum" aria-labelledby="course-curriculum-title">
        <div className="course-section-heading">
          <div><p className="eyebrow">Course outline</p><h2 id="course-curriculum-title">Modules, lessons, and checkpoints</h2></div>
          <span>{totalLessons} lessons · {course.summary.checkpointCount} checkpoints</span>
        </div>
        {course.modules.map((module, moduleIndex) => {
          const locked = moduleIndex > 0 && !completedCheckpoints.includes(course.modules[moduleIndex - 1].checkpoint.id);
          return (
            <section className={`course-module-card${locked ? ' is-locked' : ''}`} key={module.id} aria-labelledby={`module-${module.id}`}>
              <div className="course-module-heading">
                <span className="course-module-number">Module {moduleIndex + 1}</span>
                <h3 id={`module-${module.id}`}>{module.title}</h3>
                {locked && <span className="course-module-lock">Complete the previous checkpoint to unlock</span>}
              </div>
              <ol className="course-lesson-list">
                {module.lessons.map((lesson, lessonIndex) => {
                  const completed = completedLessons.includes(lesson.id);
                  return (
                    <li key={lesson.id}>
                      <span className={completed ? 'course-lesson-marker is-complete' : 'course-lesson-marker'} aria-hidden="true">
                        {completed ? '✓' : `${lessonIndex + 1}`}
                      </span>
                      <div className="course-lesson-copy">
                        <strong>{lesson.title}</strong>
                        <span>{lesson.quiz.questions.length} knowledge-check questions · practical activity</span>
                      </div>
                      {course.enrollment && !locked ? (
                        <Link className="course-outline-link" to={`/courses/${encodeURIComponent(course.slug)}/lessons/${encodeURIComponent(lesson.id)}`}>
                          {completed ? 'Review lesson' : 'Open lesson'}
                        </Link>
                      ) : <span className="course-outline-state">{completed ? 'Complete' : locked ? 'Locked' : 'Enroll to start'}</span>}
                    </li>
                  );
                })}
              </ol>
              <div className="course-checkpoint-row">
                <div>
                  <span className="course-module-number">Checkpoint</span>
                  <strong>{module.checkpoint.title}</strong>
                  <p>{module.checkpoint.prompt}</p>
                </div>
                {course.enrollment && !locked && module.lessons.every((lesson) => completedLessons.includes(lesson.id)) ? (
                  <Link className="course-outline-link" to={`/courses/${encodeURIComponent(course.slug)}/checkpoints/${encodeURIComponent(module.checkpoint.id)}`}>
                    {completedCheckpoints.includes(module.checkpoint.id) ? 'Review checkpoint' : 'Complete checkpoint'}
                  </Link>
                ) : <span className="course-outline-state">{completedCheckpoints.includes(module.checkpoint.id) ? 'Complete' : 'Complete lessons first'}</span>}
              </div>
            </section>
          );
        })}
      </section>
    </main>
  );
}
