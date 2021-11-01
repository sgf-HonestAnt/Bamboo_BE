import mongoose from "mongoose";
import FeatureSchema from "./schema.js";

const FeatureModel = mongoose.model("Feature", FeatureSchema);

export default FeatureModel;
