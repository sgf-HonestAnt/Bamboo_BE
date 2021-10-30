import mongoose from "mongoose";
import { SOLO, TASK_IMG, TASK_TYPES } from "../../utils/const.js";

const { Schema } = mongoose;

export const TaskSchema = new mongoose.Schema(
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
    belongsTo: { type: Schema.Types.ObjectId, ref: "User" },
    sharedWith: {
      default: [],
      type: [{ type: Schema.Types.ObjectId, ref: "User" }],
      required: true,
    },
    deadline: { type: String, required: false },
  },
  { timestamps: true }
);

// export const TaskListSchema = new Schema(
//   {
//     user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
//     tasklist: {
//       completed: { default: [], type: [TaskSchema], required: true },
//       awaited: { default: [], type: [TaskSchema], required: true },
//       progress: { default: [], type: [TaskSchema], required: true },
//     },
//   },
//   { timestamps: false }
// );

// TaskListSchema.methods.toJSON = function () {
//   const userDoc = this;
//   const userObj = userDoc.toObject();
//   delete userObj.createdAt;
//   delete userObj.updatedAt;
//   delete userObj.__v;
//   return userObj;
// };

export default TaskSchema;
