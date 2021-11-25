import mongoose from "mongoose";

const { Schema } = mongoose;

const SingleAchievementSchema = new mongoose.Schema(
  {
    username: { type: String },
    item: { type: String },
    category: {type: String},
    createdAt: { type: Date },
  },
  { timestamps: false }
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

SingleAchievementSchema.methods.toJSON = function () {
  const singleAchievementDoc = this;
  const singleAchievementObj = singleAchievementDoc.toObject();
  delete singleAchievementObj.updatedAt;
  return singleAchievementObj;
};

AchievementSchema.methods.toJSON = function () {
  const achievementDoc = this;
  const achievementObj = achievementDoc.toObject();
  delete achievementObj.createdAt;
  delete achievementObj.updatedAt;
  delete achievementObj._v;
  delete achievementObj.__v;
  return achievementObj;
};

export default AchievementSchema;
