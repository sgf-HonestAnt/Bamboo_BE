import mongoose from "mongoose";
import UserSchema from "./schema.js";

const UserModel = mongoose.model("User", UserSchema);

export default UserModel;
