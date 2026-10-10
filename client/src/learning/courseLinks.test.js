import { describe, expect, it } from 'vitest';
import { getActivityPath, getNextCourseActivity } from './courseLinks';

const course = {
  slug: 'research-basics',
  modules: [
    {
      id: 'ask-and-search',
      lessons: [{ id: 'shape-a-question', title: 'Shape a question' }],
      checkpoint: { id: 'question-checkpoint', title: 'Question checkpoint' },
    },
    {
      id: 'compare-and-summarize',
      lessons: [{ id: 'compare-evidence', title: 'Compare evidence' }],
      checkpoint: { id: 'evidence-checkpoint', title: 'Evidence checkpoint' },
    },
  ],
};

describe('course activity navigation', () => {
  it('builds canonical, encoded lesson and checkpoint paths', () => {
    expect(getActivityPath(course, { type: 'lesson', id: 'shape-a-question' }))
      .toBe('/courses/research-basics/lessons/shape-a-question');
    expect(getActivityPath(course, { type: 'checkpoint', id: 'question-checkpoint' }))
      .toBe('/courses/research-basics/checkpoints/question-checkpoint');
  });

  it('resumes at the first unfinished lesson or checkpoint', () => {
    expect(getNextCourseActivity(course)).toMatchObject({ type: 'lesson', id: 'shape-a-question' });

    const afterLessons = {
      ...course,
      progress: { completedLessonIds: ['shape-a-question'], completedCheckpointIds: [] },
    };
    expect(getNextCourseActivity(afterLessons)).toMatchObject({ type: 'checkpoint', id: 'question-checkpoint' });

    const afterCheckpoint = {
      ...course,
      progress: { completedLessonIds: ['shape-a-question'], completedCheckpointIds: ['question-checkpoint'] },
    };
    expect(getNextCourseActivity(afterCheckpoint)).toMatchObject({ type: 'lesson', id: 'compare-evidence' });
  });
});
