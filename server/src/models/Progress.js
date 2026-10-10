import mongoose from 'mongoose';

const quizAnswerSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true },
    selectedOptionId: { type: String, required: true },
    isCorrect: { type: Boolean, required: true },
    correctOptionId: { type: String, required: true },
    feedback: { type: String, required: true },
  },
  { _id: false }
);

const quizResultSchema = new mongoose.Schema(
  {
    lessonId: { type: String, required: true },
    scorePercent: { type: Number, min: 0, max: 100, required: true },
    passed: { type: Boolean, required: true },
    answers: { type: [quizAnswerSchema], default: [] },
    completedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const checkpointResponseSchema = new mongoose.Schema(
  {
    checkpointId: { type: String, required: true },
    response: { type: String, required: true, maxlength: 2000 },
    completedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const progressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course ID is required'],
      index: true,
    },
    completedSteps: {
      type: [String],
      default: [],
    },
    completedWeeklyTasks: {
      type: [String],
      default: [],
    },
    completedLessonIds: {
      type: [String],
      default: [],
    },
    completedCheckpointIds: {
      type: [String],
      default: [],
    },
    quizResults: {
      type: [quizResultSchema],
      default: [],
    },
    checkpointResponses: {
      type: [checkpointResponseSchema],
      default: [],
    },
    currentLessonId: {
      type: String,
      default: null,
    },
    percentComplete: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    lastAccessedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// One progress document per user per course
progressSchema.index({ userId: 1, courseId: 1 }, { unique: true, name: 'user_course_progress_unique_idx' });

export const Progress = mongoose.model('Progress', progressSchema);
export default Progress;
