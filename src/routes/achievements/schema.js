import mongoose from "mongoose";

const { Schema } = mongoose;

const AchievementSchema = new mongoose.Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    list: { default: [], type: [{ type: String }] },
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
