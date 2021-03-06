import mongoose from "mongoose";
import bcrypt from "bcrypt";
import {
  DEFAULT_REWARDS,
  DEFAULT_USER_IMG,
  LIGHT_MODE,
  NEW_BIO,
  THEMES,
} from "../../utils/constants.js";

const { Schema } = mongoose;

const SingleRewardSchema = new mongoose.Schema(
  {
    belongsTo: { type: Schema.Types.ObjectId, ref: "User" },
    reward: String,
    value: Number,
    available: Number || null,
  },
  { timestamps: false }
);

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
    avatar: { type: String, default: DEFAULT_USER_IMG, required: true },
    bio: { type: String, default: NEW_BIO, required: true },
    level: { type: Number, default: 0, required: true },
    xp: { type: Number, default: 0, required: true },
    rewards: {
      default: DEFAULT_REWARDS,
      type: [SingleRewardSchema],
      required: true,
    },
    total_xp: { type: Number, default: 0, required: true }, // total cumulative xp
    total_completed: { type: Number, default: 0, required: true }, // total cumulative completed tasks
    tasks_to_hide: {
      default: [],
      type: [{ type: Schema.Types.ObjectId, ref: "Task" }],
      required: true,
    },
    password: { type: String, required: true },
    admin: { type: Boolean, required: false },
    settings: {
      selectedTheme: {
        type: String,
        default: LIGHT_MODE,
        enum: THEMES,
        required: true,
      },
    },
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
    achievements: { type: Schema.Types.ObjectId, ref: "Achievement" },
    notification: { default: [], type: [{ type: String }], required: true },
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

SingleRewardSchema.methods.toJSON = function () {
  const singleAchievementDoc = this;
  const singleAchievementObj = singleAchievementDoc.toObject();
  delete singleAchievementObj.updatedAt;
  return singleAchievementObj;
};

UserSchema.methods.toJSON = function () {
  const userDoc = this;
  const userObj = userDoc.toObject();
  delete userObj.tasks;
  delete userObj.achievements;
  delete userObj.settings;
  delete userObj.password;
  delete userObj.__v;
  return userObj;
};

UserSchema.statics.checkCredentials = async function (username, plainPW) {
  const user = await this.findOne({ username });
  if (user) {
    const isMatch = await bcrypt.compare(plainPW, user.password);
    if (isMatch) return user;
    else return null;
  } else {
    return null;
  }
};

export default UserSchema;
