import mongoose from "mongoose";
import { AWAITED, NONE, SOLO, TASK_IMG, TASK_STATUS_TYPES, TASK_TYPES } from "../../utils/constants.js";

const { Schema } = mongoose;

export const TaskSchema = new mongoose.Schema(
  {
    category: { type: String, required: true },
    title: { type: String, required: true },
    image: { type: String, default: TASK_IMG },
    desc: { type: String, required: true },
    type: {
      type: String,
      default: SOLO,
      enum: TASK_TYPES,
    },
    value: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    sharedWith: {
      default: [],
      type: [{ type: Schema.Types.ObjectId, ref: "User" }],
    },
    status: { type: String, default: AWAITED, enum: TASK_STATUS_TYPES },
    deadline: { type: String, default: NONE },
  },
  {
    timestamps: false,
  }
);

// TaskSchema.methods.toJSON = function () {
//   const userDoc = this;
//   const userObj = userDoc.toObject();
//   delete userObj.__v;
//   return userObj;
// };

const TaskListSchema = new mongoose.Schema({
  user: { type: Schema.Types.ObjectId, ref: "User" },
  completed: { default: [], type: [{ type: Schema.Types.ObjectId, ref: "Task" }] },
  awaited: { default: [], type: [{ type: Schema.Types.ObjectId, ref: "Task" }] },
  in_progress: { default: [], type: [{ type: Schema.Types.ObjectId, ref: "Task" }] },
});

TaskListSchema.methods.toJSON = function () {
  const userDoc = this;
  const userObj = userDoc.toObject();
  delete userObj.user;
  delete userObj.__v;
  return userObj;
}; 

export default TaskListSchema;
