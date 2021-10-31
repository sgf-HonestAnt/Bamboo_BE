import mongoose from "mongoose";
import AchievementSchema from "./schema.js";

const AchievementModel = mongoose.model("Achievementlist", AchievementSchema);

export default AchievementModel;
