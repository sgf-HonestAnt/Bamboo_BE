import mongoose from "mongoose";
import AchievementSchema from "./schema.js";

const AchievementModel = mongoose.model("Achievement", AchievementSchema);

export default AchievementModel;
