import mongoose from "mongoose";

const { Schema } = mongoose;

const SingleAchievementSchema = new mongoose.Schema(
  {
    item: { type: String },
  },
  { timestamps: true }
);

const AchievementSchema = new mongoose.Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    list: { default: [], type: [SingleAchievementSchema] },
  },
  {
    timestamps: false,
  }
);

AchievementSchema.methods.toJSON = function () {
  const achievementDoc = this;
  const achievementObj = achievementDoc.toObject();
  delete achievementObj._v;
  return achievementObj;
};

export default AchievementSchema;
