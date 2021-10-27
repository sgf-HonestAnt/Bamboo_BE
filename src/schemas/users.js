import mongoose from "mongoose";
import bcrypt from "bcrypt";

const { Schema, model } = mongoose;

const avatar =
  "https://thumbs.dreamstime.com/b/default-avatar-profile-vector-user-profile-default-avatar-profile-vector-user-profile-profile-179376714.jpg";

const bio = "Newbie";

const userSchema = new Schema(
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
    avatar: { type: String, default: avatar, required: true },
    bio: { type: String, default: bio, required: true },
    level: { type: Number, default: 0, required: true },
    xp: { type: Number, default: 0, required: true },
    password: { type: String, required: true },
    admin: { type: Boolean, required: false },
    settings: {
      // difficulty: { type: Number },
      selectedTheme: {
        type: String,
        default: "light-mode",
        enum: ["light-mode", "dark-mode"],
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
      pending: {
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
    //collection
    // tasks: {
    //   default:
    //   type: Schema.Types.ObjectId,
    //   ref: "TaskList",
    //   required: true,
    // },
    // challenges: {
    //   default: [],
    //   type: [{ type: Schema.Types.ObjectId, ref: "Challenge" }],
    //   required: true,
    // },
    refreshToken: { type: String },
  },
  { timestamps: true }
);

userSchema.static("findUsers", async function (query) {
  const total = await this.countDocuments(query.criteria);
  const users = await this.find(query.criteria, query.options.fields)
    .limit(query.options.limit)
    .skip(query.options.skip)
    .sort(query.options.sort);
  return { total, users };
});

userSchema.pre("save", async function (next) {
  const newUser = this;
  const plainPW = newUser.password;
  if (newUser.isModified("password")) {
    newUser.password = await bcrypt.hash(plainPW, 11);
    next();
  }
});

userSchema.methods.toJSON = function () {
  const userDoc = this;
  const userObj = userDoc.toObject();
  delete userObj.settings;
  delete userObj.password;
  delete userObj.refreshToken;
  delete userObj.__v;
  return userObj;
};

userSchema.statics.checkCredentials = async function (email, plainPW) {
  const user = await this.findOne({ email });
  if (user) {
    const isMatch = await bcrypt.compare(plainPW, user.password);
    if (isMatch) return user;
    else return null;
  } else {
    return null;
  }
};

export default model("User", userSchema);
