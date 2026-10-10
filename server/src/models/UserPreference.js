import mongoose from 'mongoose';

const userPreferenceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: { unique: true, name: 'user_preference_userId_unique_idx' },
    },
    darkMode: {
      type: Boolean,
      default: false,
    },
    courseReminders: {
      type: Boolean,
      default: true,
    },
    weeklyDigest: {
      type: Boolean,
      default: true,
    },
    progressHighlights: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const UserPreference = mongoose.model('UserPreference', userPreferenceSchema);
export default UserPreference;
