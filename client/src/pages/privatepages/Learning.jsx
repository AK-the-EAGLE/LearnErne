import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import apiClient from '../../lib/api'
import { getActivityPath } from '../../learning/courseLinks'

export default function Learning() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadCourses = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await apiClient('/courses')
      setCourses(response.data.courses)
    } catch (requestError) {
      setError(requestError.message || 'Courses could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCourses()
  }, [loadCourses])

  return (
    <main className="page-container learning-page">
      <header className="page-header learning-header" aria-labelledby="learning-title">
        <p className="eyebrow">Learning library</p>
        <h1 id="learning-title">Find the next learning path that fits your goals.</h1>
        <p>Explore published learning paths and keep your progress with your account.</p>
      </header>
      <p className="learning-demo-notice" role="note">
        The initial catalog contains sample LernErne learning content. Enrollments and progress are stored with your account.
      </p>

      {error && (
        <p className="page-status-message" role="alert">
          {error} <button className="text-button" type="button" onClick={loadCourses}>Try again</button>
        </p>
      )}
      {loading ? <p role="status">Loading courses…</p> : courses.length === 0 ? (
        <section className="learning-empty-state" aria-labelledby="learning-empty-title">
          <p className="eyebrow">Nothing to explore yet</p>
          <h2 id="learning-empty-title">No published learning paths are available</h2>
          <p>Check back after a course has been published.</p>
        </section>
      ) : (
        <section className="course-grid" aria-label="Published learning paths">
          {courses.map((course) => {
            const progress = course.progress.percentComplete
            const nextActivity = course.progress.nextActivity
            const enrolled = Boolean(course.enrollment)
            const status = course.enrollment?.status === 'completed'
              ? 'Completed'
              : enrolled ? 'In progress' : 'Not enrolled'

            return (
              <article key={course.id} className="course-card">
                <div className="course-topline">
                  <span className="course-tag">{course.category}</span>
                  <span className="course-meta">{course.level}</span>
                </div>
                <h2>{course.title}</h2>
                <p>{course.description}</p>
                <div className="course-progress">
                  <div className="course-progress-heading">
                    <span className="course-status" role="status">{status}</span>
                    <span className="course-progress-value">{progress}% complete</span>
                  </div>
                  <progress className="course-progress-bar" max="100" value={progress} aria-label={`${course.title}: ${progress}% complete`} />
                  <p className="course-step-count">
                    {course.progress.completedLessonIds.length} of {course.summary.lessonCount} lessons complete
                    {' · '}{course.progress.completedCheckpointIds.length} of {course.summary.checkpointCount} checkpoints
                  </p>
                </div>
                {enrolled && (
                  <div className="course-next-step">
                    <span className="course-next-label">Resume point</span>
                    <p>{nextActivity?.title || 'All lessons and checkpoints complete'}</p>
                  </div>
                )}
                <div className="course-actions">
                  {enrolled ? (
                    <Link
                      className="button button-primary course-button"
                      to={nextActivity ? getActivityPath(course, nextActivity) : `/courses/${encodeURIComponent(course.slug)}`}
                    >
                      {nextActivity ? 'Continue learning' : 'Review course'}
                    </Link>
                  ) : (
                    <Link className="button button-primary course-button" to={`/courses/${encodeURIComponent(course.slug)}`}>
                      View course
                    </Link>
                  )}
                  <Link className="course-details-link" to={`/courses/${encodeURIComponent(course.slug)}`}>Course outline</Link>
                </div>
              </article>
            )
          })}
        </section>
      )}
    </main>
  )
}
