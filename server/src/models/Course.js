import mongoose from 'mongoose';

const courseStepSchema = new mongoose.Schema(
  {
    stepId: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    detail: {
      type: String,
      trim: true,
      default: '',
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const weeklyTaskSchema = new mongoose.Schema(
  {
    taskId: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const quizOptionSchema = new mongoose.Schema(
  {
    optionId: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const quizQuestionSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true, trim: true },
    prompt: { type: String, required: true, trim: true },
    options: { type: [quizOptionSchema], required: true, default: [] },
    correctOptionId: { type: String, required: true, trim: true },
    correctFeedback: { type: String, required: true, trim: true },
    incorrectFeedback: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const lessonActivitySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    instructions: { type: String, required: true, trim: true },
    deliverable: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const lessonSchema = new mongoose.Schema(
  {
    lessonId: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    introduction: { type: String, required: true, trim: true },
    explanation: { type: String, required: true, trim: true },
    example: { type: String, required: true, trim: true },
    activity: { type: lessonActivitySchema, required: true },
    quiz: {
      passPercent: { type: Number, min: 0, max: 100, required: true },
      questions: { type: [quizQuestionSchema], required: true, default: [] },
    },
  },
  { _id: false }
);

const courseModuleSchema = new mongoose.Schema(
  {
    moduleId: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    lessons: { type: [lessonSchema], required: true, default: [] },
    checkpoint: {
      checkpointId: { type: String, required: true, trim: true },
      title: { type: String, required: true, trim: true },
      prompt: { type: String, required: true, trim: true },
      instructions: { type: String, required: true, trim: true },
    },
  },
  { _id: false }
);

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      trim: true,
      lowercase: true,
      index: { unique: true, name: 'slug_unique_idx' },
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    category: {
      type: String,
      required: true,
      trim: true,
      default: 'General',
    },
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'All levels'],
      default: 'All levels',
    },
    contentVersion: {
      type: Number,
      min: 1,
      default: 1,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'published',
      index: true,
    },
    steps: {
      type: [courseStepSchema],
      default: [],
    },
    weeklyTasks: {
      type: [weeklyTaskSchema],
      default: [],
    },
    modules: {
      type: [courseModuleSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const Course = mongoose.model('Course', courseSchema);
export default Course;
