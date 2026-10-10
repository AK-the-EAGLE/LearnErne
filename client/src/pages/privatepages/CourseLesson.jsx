import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import apiClient from '../../lib/api';
import { getActivityPath } from '../../learning/courseLinks';
import NotFound from '../publicpages/NotFound';

export default function CourseLesson() {
  const { courseSlug, lessonId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [result, setResult] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);

  const loadLesson = useCallback(async () => {
    setLoading(true);
    setError('');
    setNotFound(false);
    setAnswers({});
    setResult(null);
    setCourse(null);
    try {
      const response = await apiClient(`/courses/${encodeURIComponent(courseSlug)}`);
      const loadedCourse = response.data.course;
      const lesson = loadedCourse.modules.flatMap((module) => module.lessons).find((item) => item.id === lessonId);
      if (!lesson) {
        setNotFound(true);
        return;
      }
      if (!loadedCourse.enrollment) {
        navigate(`/courses/${encodeURIComponent(courseSlug)}`, { replace: true });
        return;
      }
      const opened = await apiClient(`/courses/${encodeURIComponent(courseSlug)}/lessons/${encodeURIComponent(lessonId)}/open`, { method: 'POST' });
      setCourse(opened.data.course);
      const priorResult = opened.data.course.progress.quizResults.find((item) => item.lessonId === lessonId);
      if (priorResult) {
        setResult({
          scorePercent: priorResult.scorePercent,
          passed: priorResult.passed,
          passPercent: lesson.quiz.passPercent,
          answers: priorResult.answers,
        });
      }
    } catch (requestError) {
      setNotFound(requestError.status === 404);
      setError(requestError.message || 'This lesson could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [courseSlug, lessonId, navigate]);

  useEffect(() => {
    const timer = window.setTimeout(loadLesson, 0);
    return () => window.clearTimeout(timer);
  }, [loadLesson]);

  const lessonData = useMemo(
    () => course?.modules.flatMap((module) => module.lessons).find((item) => item.id === lessonId),
    [course, lessonId],
  );
  const completed = Boolean(course?.progress.completedLessonIds.includes(lessonId));

  function setAnswer(questionId, optionId) {
    setAnswers((current) => ({ ...current, [questionId]: optionId }));
    setResult(null);
  }

  async function submitQuiz(event) {
    event.preventDefault();
    if (!lessonData || lessonData.quiz.questions.some((question) => !answers[question.id])) {
      setError('Answer each question before checking your understanding.');
      return;
    }
    setWorking(true);
    setError('');
    try {
      const response = await apiClient(`/courses/${encodeURIComponent(courseSlug)}/lessons/${encodeURIComponent(lessonId)}/quiz`, {
        method: 'POST',
        body: JSON.stringify({ answers: Object.entries(answers).map(([questionId, optionId]) => ({ questionId, optionId })) }),
      });
      setCourse(response.data.course);
      setResult(response.data.result);
    } catch (requestError) {
      setError(requestError.message || 'Quiz results could not be saved.');
    } finally {
      setWorking(false);
    }
  }

  async function completeLesson() {
    setWorking(true);
    setError('');
    try {
      const response = await apiClient(`/courses/${encodeURIComponent(courseSlug)}/lessons/${encodeURIComponent(lessonId)}/complete`, { method: 'POST' });
      const updatedCourse = response.data.course;
      setCourse(updatedCourse);
      if (updatedCourse.progress.nextActivity) {
        navigate(getActivityPath(updatedCourse, updatedCourse.progress.nextActivity));
      } else {
        navigate(`/courses/${encodeURIComponent(updatedCourse.slug)}`);
      }
    } catch (requestError) {
      setError(requestError.message || 'Lesson completion could not be saved.');
    } finally {
      setWorking(false);
    }
  }

  if (loading) return <main className="page-container lesson-page"><p role="status">Loading lesson…</p></main>;
  if (notFound) return <NotFound />;
  if (!lessonData || !course) {
    return (
      <main className="page-container lesson-page">
        <p className="page-status-message" role="alert">{error || 'This lesson is unavailable.'}</p>
        <button className="button button-secondary" type="button" onClick={loadLesson}>Try again</button>
      </main>
    );
  }

  return (
    <main className="page-container lesson-page">
      <nav className="course-breadcrumbs" aria-label="Breadcrumb">
        <Link to="/courses">Learning library</Link><span aria-hidden="true">/</span>
        <Link to={`/courses/${encodeURIComponent(course.slug)}`}>{course.title}</Link><span aria-hidden="true">/</span>
        <span>{lessonData.title}</span>
      </nav>
      <header className="lesson-header">
        <p className="eyebrow">Lesson</p>
        <h1>{lessonData.title}</h1>
        <p>{lessonData.introduction}</p>
      </header>
      {error && <p className="page-status-message" role="alert">{error}</p>}
      <article className="lesson-content-card">
        <section aria-labelledby="lesson-explanation-title">
          <h2 id="lesson-explanation-title">The idea</h2>
          <p>{lessonData.explanation}</p>
        </section>
        <section className="lesson-example" aria-labelledby="lesson-example-title">
          <h2 id="lesson-example-title">Example</h2>
          <p>{lessonData.example}</p>
        </section>
        <section className="lesson-activity" aria-labelledby="lesson-activity-title">
          <p className="eyebrow">Try it yourself</p>
          <h2 id="lesson-activity-title">{lessonData.activity.title}</h2>
          <p>{lessonData.activity.instructions}</p>
          <p className="lesson-deliverable"><strong>Make:</strong> {lessonData.activity.deliverable}</p>
        </section>
        <form className="lesson-quiz" onSubmit={submitQuiz}>
          <div>
            <p className="eyebrow">Knowledge check</p>
            <h2>Check your understanding</h2>
            <p>Answer each question. You need {lessonData.quiz.passPercent}% to pass; you can retry.</p>
          </div>
          {lessonData.quiz.questions.map((question, index) => (
            <fieldset className="lesson-question" key={question.id}>
              <legend>{index + 1}. {question.prompt}</legend>
              {question.options.map((option) => (
                <label className="lesson-answer-option" key={option.id}>
                  <input
                    type="radio"
                    name={question.id}
                    value={option.id}
                    checked={answers[question.id] === option.id}
                    onChange={() => setAnswer(question.id, option.id)}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </fieldset>
          ))}
          <button className="button button-secondary" type="submit" disabled={working}>
            {working ? 'Checking answers…' : 'Check answers'}
          </button>
        </form>
        {result && (
          <section className={result.passed ? 'quiz-result is-passed' : 'quiz-result'} aria-live="polite" aria-label="Quiz feedback">
            <h2>{result.passed ? 'Quiz passed' : 'Keep practicing'}</h2>
            <p>You scored {result.scorePercent}%; {result.passed ? 'you can mark this lesson complete.' : `you need ${result.passPercent}% to pass. Review the explanations and try again.`}</p>
            <ul>
              {result.answers.map((answer) => {
                const question = lessonData.quiz.questions.find((item) => item.id === answer.questionId);
                return (
                  <li key={answer.questionId}>
                    <strong>{question?.prompt}</strong>
                    <span>{answer.feedback}</span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
        <div className="lesson-actions">
          <Link className="button button-secondary" to={`/courses/${encodeURIComponent(course.slug)}`}>Course outline</Link>
          {completed ? (
            <span className="lesson-completed-label" role="status">Lesson complete</span>
          ) : (
            <button className="button button-primary" type="button" onClick={completeLesson} disabled={working || !result?.passed}>
              {working ? 'Saving lesson…' : 'Mark lesson complete'}
            </button>
          )}
        </div>
      </article>
    </main>
  );
}
