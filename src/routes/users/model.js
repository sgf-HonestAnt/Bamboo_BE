import UserSchema from "./schema.js";
import mongoose from "mongoose";

const UserModel = mongoose.model("User", UserSchema);

export default UserModel;
