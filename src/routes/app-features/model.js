import FeatureSchema from "./schema.js";
import mongoose from "mongoose";

const FeatureModel = mongoose.model("Feature", FeatureSchema);

export default FeatureModel;
