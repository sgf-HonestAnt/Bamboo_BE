import mongoose from "mongoose";
import bcrypt from "bcrypt";
// import { TaskSchema } from "../tasks/schema.js";
import { LIGHT_MODE, NEW_BIO, THEMES, USER_AVATAR } from "../../utils/const.js";

const { Schema } = mongoose;

const UserSchema = new mongoose.Schema(
  {
    first_name: {
      type: String,
      required: true,
    },
    last_name: { type: String, required: true },
    username: { type: String, unique: true, required: true },
    email: {
      type: String,
      unique: true,
      required: true,
    },
    avatar: { type: String, default: USER_AVATAR, required: true },
    bio: { type: String, default: NEW_BIO, required: true },
    level: { type: Number, default: 0, required: true },
    xp: { type: Number, default: 0, required: true },
    password: { type: String, required: true },
    admin: { type: Boolean, required: false },
    settings: {
      // difficulty: { type: Number },
      selectedTheme: {
        type: String,
        default: LIGHT_MODE,
        enum: THEMES,
        required: true,
      },
    },
    // achievements
    followedUsers: {
      response_awaited: {
        default: [],
        type: [{ type: String }],
        required: true,
      },
      requested: {
        default: [],
        type: [{ type: String }],
        required: true,
      },
      accepted: {
        default: [],
        type: [{ type: Schema.Types.ObjectId, ref: "User" }],
        required: true,
      },
      rejected: {
        default: [],
        type: [{ type: String }],
        required: true,
      },
    },
    tasks: { type: Schema.Types.ObjectId, ref: "TaskList" },
    // tasklist: {
    //   completed: { default: [], type: [TaskSchema], required: true },
    //   awaited: { default: [], type: [TaskSchema], required: true },
    //   in_progress: { default: [], type: [TaskSchema], required: true },
    // },
    // collection
    // tasklist
    // challenges: {
    //   default: [],
    //   type: [{ type: Schema.Types.ObjectId, ref: "Challenge" }],
    //   required: true,
    // },
    refreshToken: { type: String },
  },
  { timestamps: true }
);

UserSchema.static("findUsers", async function (query) {
  const total = await this.countDocuments(query.criteria);
  const users = await this.find(query.criteria, query.options.fields)
    .limit(query.options.limit)
    .skip(query.options.skip)
    .sort(query.options.sort);
  return { total, users };
});

UserSchema.pre("save", async function (next) {
  const newUser = this;
  const plainPW = newUser.password;
  if (newUser.isModified("password")) {
    newUser.password = await bcrypt.hash(plainPW, 11);
    next();
  }
});

UserSchema.methods.toJSON = function () {
  const userDoc = this;
  const userObj = userDoc.toObject();
  delete userObj.tasks;
  delete userObj.settings;
  delete userObj.password;
  delete userObj.refreshToken;
  delete userObj.__v;
  return userObj;
};

UserSchema.statics.checkCredentials = async function (email, plainPW) {
  const user = await this.findOne({ email });
  if (user) {
    const isMatch = await bcrypt.compare(plainPW, user.password);
    if (isMatch) return user;
    else return null;
  } else {
    return null;
  }
};

export default UserSchema;
