import mongoose from "mongoose";
import { SOLO, TASK_IMG, TASK_TYPES } from "../utils/const.js";

const { Schema, model } = mongoose;

export const taskSchema = new Schema(
  {
    category: { type: String, required: true },
    title: { type: String, required: true },
    image: { type: String, default: TASK_IMG, required: true },
    desc: { type: String, required: true },
    type: {
      type: String,
      default: SOLO,
      enum: TASK_TYPES,
      required: true,
    },
    value: { type: Number, default: 0, required: true },
    sharedWith: {
      default: [],
      type: [{ type: Schema.Types.ObjectId, ref: "User" }],
      required: true,
    },
    deadline: { type: String, required: false },
  },
  { timestamps: true }
);

export const taskListSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tasklist: {
      completed: { default: [], type: [taskSchema], required: true },
      awaited: { default: [], type: [taskSchema], required: true },
      progress: { default: [], type: [taskSchema], required: true },
    },
  },
  { timestamps: false }
);

taskListSchema.methods.toJSON = function () {
  const userDoc = this;
  const userObj = userDoc.toObject();
  delete userObj.createdAt;
  delete userObj.updatedAt;
  delete userObj.__v;
  return userObj;
};

export default model("TaskList", taskListSchema);
