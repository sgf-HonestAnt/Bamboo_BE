import mongoose from "mongoose";
import TokenSchema from "./schema.js";

const TokenModel = mongoose.model("Guard", TokenSchema);

export default TokenModel;