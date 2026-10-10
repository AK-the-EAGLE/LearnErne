import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import apiClient from '../../lib/api'
import { getActivityPath } from '../../learning/courseLinks'

export default function Dashboard() {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingKey, setSavingKey] = useState('')

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await apiClient('/dashboard')
      setDashboard(response.data)
    } catch (requestError) {
      setError(requestError.message || 'Your dashboard could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    apiClient('/dashboard')
      .then((response) => { if (active) setDashboard(response.data) })
      .catch((requestError) => { if (active) setError(requestError.message || 'Your dashboard could not be loaded.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  async function toggleProgress(course, field, itemId) {
    const current = course.progress[field]
    const next = current.includes(itemId)
      ? current.filter((id) => id !== itemId)
      : [...current, itemId]
    const completedSteps = field === 'completedSteps' ? next : course.progress.completedSteps
    const completedWeeklyTasks = field === 'completedWeeklyTasks' ? next : course.progress.completedWeeklyTasks
    const key = `${course.id}:${field}:${itemId}`
    setSavingKey(key)
    setError('')
    try {
      const response = await apiClient(`/courses/${encodeURIComponent(course.id)}/progress`, {
        method: 'PATCH',
        body: JSON.stringify({ completedSteps, completedWeeklyTasks }),
      })
      const updatedCourse = response.data.course
      setDashboard((currentDashboard) => ({
        ...currentDashboard,
        enrollments: currentDashboard.enrollments.map((item) => item.id === course.id ? {
          ...item,
          enrollment: updatedCourse.enrollment,
          progress: updatedCourse.progress,
        } : item),
      }))
    } catch (requestError) {
      setError(requestError.message || 'Progress could not be saved.')
    } finally {
      setSavingKey('')
    }
  }

  return (
    <main className="page-container dashboard-page">
      <section className="dashboard-hero" aria-labelledby="dashboard-title">
        <div className="dashboard-hero-copy">
          <p className="eyebrow">Learning dashboard</p>
          <h1 id="dashboard-title">
            {dashboard?.user.displayName ? `Your learning overview, ${dashboard.user.displayName}` : 'Your learning overview'}
          </h1>
          <p>Your enrolled courses, progress, and next steps in one place.</p>
        </div>
        <Link className="button button-primary" to="/courses">Browse courses</Link>
      </section>

      {error && (
        <p className="page-status-message" role="alert">
          {error} <button className="text-button" type="button" onClick={loadDashboard}>Reload dashboard</button>
        </p>
      )}
      {loading ? <p role="status">Loading your learning overview…</p> : dashboard?.enrollments.length ? (
        <div className="dashboard-enrollments">
          {dashboard.enrollments.map((course) => {
            const progress = course.progress.percentComplete
            const nextActivity = course.progress.nextActivity
            const completedLessonIds = course.progress.completedLessonIds
            const completedCheckpointIds = course.progress.completedCheckpointIds
            const resumePath = nextActivity ? getActivityPath(course, nextActivity) : `/courses/${encodeURIComponent(course.slug)}`
            return (
              <section className="dashboard-focus-panel" key={course.id} aria-labelledby={`course-${course.id}-title`}>
                <div className="dashboard-focus-heading">
                  <div>
                    <p className="eyebrow">Enrolled course</p>
                    <h2 id={`course-${course.id}-title`}>{course.title}</h2>
                    <p>{course.description}</p>
                  </div>
                  <Link className="dashboard-text-link" to="/courses">Browse courses</Link>
                </div>

                <div className="dashboard-progress">
                  <div className="dashboard-progress-heading">
                    <h3>Course progress</h3>
                    <span className="dashboard-status" role="status">{progress}% complete</span>
                  </div>
                  <progress className="dashboard-progress-bar" max="100" value={progress} aria-label={`${course.title}: ${progress}% complete`} />
                  <p>
                    {completedLessonIds.length} of {course.summary.lessonCount} lessons and {completedCheckpointIds.length} of {course.summary.checkpointCount} checkpoints complete
                  </p>
                </div>

                <div className="dashboard-next-action" aria-live="polite">
                  <p className="dashboard-next-label">Next action</p>
                  <h3>{nextActivity?.title || 'Course complete'}</h3>
                  <p>{nextActivity ? `Continue with ${nextActivity.type === 'checkpoint' ? 'a reflection checkpoint' : 'the next lesson'}.` : 'You can review the course or explore another learning path.'}</p>
                  <Link className="button button-primary dashboard-resume-link" to={resumePath}>
                    {nextActivity ? 'Resume course' : 'Review course'}
                  </Link>
                </div>

                <div className="dashboard-two-column">
                  <section className="dashboard-panel" aria-labelledby={`steps-${course.id}`}>
                    <div className="dashboard-panel-heading">
                      <div><p className="eyebrow">Learning plan</p><h3 id={`steps-${course.id}`}>Lessons and checkpoints</h3></div>
                    </div>
                    <ul className="dashboard-task-list">
                      {course.modules.map((module, moduleIndex) => {
                        const locked = moduleIndex > 0 && !completedCheckpointIds.includes(course.modules[moduleIndex - 1].checkpoint.id)
                        return (
                          <li className="dashboard-module-item" key={module.id}>
                            <h4>{module.title}</h4>
                            {module.lessons.map((lesson) => {
                              const complete = completedLessonIds.includes(lesson.id)
                              return (
                                <div className="dashboard-learning-row" key={lesson.id}>
                                  <span className={complete ? 'dashboard-step-number is-complete' : 'dashboard-step-number'} aria-hidden="true">{complete ? '✓' : '•'}</span>
                                  <span>{lesson.title}</span>
                                  {locked ? <span className="dashboard-task-state">Locked</span> : (
                                    <Link to={`/courses/${encodeURIComponent(course.slug)}/lessons/${encodeURIComponent(lesson.id)}`}>
                                      {complete ? 'Review' : 'Open'}
                                    </Link>
                                  )}
                                </div>
                              )
                            })}
                            <div className="dashboard-learning-row checkpoint">
                              <span className={completedCheckpointIds.includes(module.checkpoint.id) ? 'dashboard-step-number is-complete' : 'dashboard-step-number'} aria-hidden="true">
                                {completedCheckpointIds.includes(module.checkpoint.id) ? '✓' : '↳'}
                              </span>
                              <span>{module.checkpoint.title}</span>
                              {locked || !module.lessons.every((lesson) => completedLessonIds.includes(lesson.id))
                                ? <span className="dashboard-task-state">Complete module lessons first</span>
                                : <Link to={`/courses/${encodeURIComponent(course.slug)}/checkpoints/${encodeURIComponent(module.checkpoint.id)}`}>Open</Link>}
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  </section>

                  <section className="dashboard-panel" aria-labelledby={`tasks-${course.id}`}>
                    <div className="dashboard-panel-heading">
                      <div><p className="eyebrow">Practice ideas</p><h3 id={`tasks-${course.id}`}>Suggested tasks</h3></div>
                      <span className="dashboard-status dashboard-status-soft">Optional</span>
                    </div>
                    <p className="dashboard-panel-description">Optional prompts to support your own plan.</p>
                    <ul className="dashboard-task-list dashboard-weekly-list">
                      {course.weeklyTasks.map((task) => {
                        const checked = course.progress.completedWeeklyTasks.includes(task.id)
                        const key = `${course.id}:completedWeeklyTasks:${task.id}`
                        return (
                          <li className="dashboard-weekly-task" key={task.id}>
                            <label className="dashboard-task-label">
                              <input
                                type="checkbox"
                                checked={checked}
                                disabled={Boolean(savingKey)}
                                onChange={() => toggleProgress(course, 'completedWeeklyTasks', task.id)}
                                aria-label={`${checked ? 'Mark incomplete' : 'Mark complete'}: ${task.title}`}
                              />
                              <span className="dashboard-weekly-copy">
                                <span>{task.title}</span>
                                <span className="dashboard-task-state">{savingKey === key ? 'Saving…' : checked ? 'Complete' : 'Not complete'}</span>
                              </span>
                            </label>
                          </li>
                        )
                      })}
                    </ul>
                  </section>
                </div>
              </section>
            )
          })}
        </div>
      ) : (
        <section className="dashboard-empty-state" aria-labelledby="dashboard-empty-title">
          <p className="eyebrow">A fresh start</p>
          <h2 id="dashboard-empty-title">Choose a learning focus to begin</h2>
          <p>Your enrolled courses and progress will appear here as you explore the learning library.</p>
          <Link className="button button-primary" to="/courses">Explore courses</Link>
        </section>
      )}

      <nav className="dashboard-account-links" aria-label="Learner account">
        <Link to="/profile">View profile</Link>
        <Link to="/settings">Learning settings</Link>
      </nav>
    </main>
  )
}
