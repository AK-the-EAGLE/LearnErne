import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import apiClient from '../../lib/api';
import { getActivityPath } from '../../learning/courseLinks';
import NotFound from '../publicpages/NotFound';

export default function CourseCheckpoint() {
  const { courseSlug, checkpointId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const loadCourse = useCallback(async () => {
    setLoading(true);
    setError('');
    setNotFound(false);
    try {
      const response = await apiClient(`/courses/${encodeURIComponent(courseSlug)}`);
      const loadedCourse = response.data.course;
      const module = loadedCourse.modules.find((item) => item.checkpoint.id === checkpointId);
      if (!module) {
        setNotFound(true);
        return;
      }
      if (!loadedCourse.enrollment) {
        navigate(`/courses/${encodeURIComponent(courseSlug)}`, { replace: true });
        return;
      }
      if (!module.lessons.every((lesson) => loadedCourse.progress.completedLessonIds.includes(lesson.id))) {
        navigate(getActivityPath(loadedCourse, loadedCourse.progress.nextActivity), { replace: true });
        return;
      }
      setResponseText(module.checkpoint.response || '');
      setCourse(loadedCourse);
    } catch (requestError) {
      setNotFound(requestError.status === 404);
      setError(requestError.message || 'This checkpoint could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [checkpointId, courseSlug, navigate]);

  useEffect(() => {
    const timer = window.setTimeout(loadCourse, 0);
    return () => window.clearTimeout(timer);
  }, [loadCourse]);

  const module = course?.modules.find((item) => item.checkpoint.id === checkpointId);

  async function saveCheckpoint(event) {
    event.preventDefault();
    if (responseText.trim().length < 20 || responseText.trim().length > 2000) {
      setError('Write a reflection between 20 and 2,000 characters.');
      return;
    }
    setWorking(true);
    setError('');
    setSaved(false);
    try {
      const response = await apiClient(`/courses/${encodeURIComponent(courseSlug)}/checkpoints/${encodeURIComponent(checkpointId)}/complete`, {
        method: 'POST',
        body: JSON.stringify({ response: responseText }),
      });
      const updatedCourse = response.data.course;
      setCourse(updatedCourse);
      setSaved(true);
      if (updatedCourse.progress.nextActivity) {
        navigate(getActivityPath(updatedCourse, updatedCourse.progress.nextActivity));
      }
    } catch (requestError) {
      setError(requestError.message || 'Your checkpoint could not be saved.');
    } finally {
      setWorking(false);
    }
  }

  if (loading) return <main className="page-container checkpoint-page"><p role="status">Loading checkpoint…</p></main>;
  if (notFound) return <NotFound />;
  if (!module || !course) {
    return (
      <main className="page-container checkpoint-page">
        <p className="page-status-message" role="alert">{error || 'This checkpoint is unavailable.'}</p>
        <button className="button button-secondary" type="button" onClick={loadCourse}>Try again</button>
      </main>
    );
  }

  return (
    <main className="page-container checkpoint-page">
      <nav className="course-breadcrumbs" aria-label="Breadcrumb">
        <Link to="/courses">Learning library</Link><span aria-hidden="true">/</span>
        <Link to={`/courses/${encodeURIComponent(course.slug)}`}>{course.title}</Link><span aria-hidden="true">/</span>
        <span>{module.checkpoint.title}</span>
      </nav>
      <article className="checkpoint-card">
        <p className="eyebrow">{module.title} · Reflection checkpoint</p>
        <h1>{module.checkpoint.title}</h1>
        <p className="checkpoint-prompt">{module.checkpoint.prompt}</p>
        <p>{module.checkpoint.instructions}</p>
        <form onSubmit={saveCheckpoint}>
          <label htmlFor="checkpoint-response">Your reflection</label>
          <textarea
            id="checkpoint-response"
            name="response"
            value={responseText}
            onChange={(event) => setResponseText(event.target.value)}
            rows="7"
            maxLength="2000"
            aria-describedby="checkpoint-help checkpoint-count"
            required
          />
          <small id="checkpoint-help">Your response is saved to your account and can be updated later.</small>
          <small id="checkpoint-count">{responseText.trim().length} / 2,000 characters (at least 20 required)</small>
          {error && <p className="page-status-message" role="alert">{error}</p>}
          {saved && <p className="settings-status" role="status">Checkpoint saved to your learning progress.</p>}
          <div className="lesson-actions">
            <Link className="button button-secondary" to={`/courses/${encodeURIComponent(course.slug)}`}>Course outline</Link>
            <button className="button button-primary" type="submit" disabled={working || responseText.trim().length < 20}>
              {working ? 'Saving checkpoint…' : module.checkpoint.completed ? 'Update checkpoint' : 'Save checkpoint'}
            </button>
          </div>
        </form>
      </article>
    </main>
  );
}
