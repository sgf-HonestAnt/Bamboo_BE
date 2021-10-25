import mongoose from "mongoose";

const { Schema, model } = mongoose;

const taskSchema = new Schema(
  {
    category: { type: String, required: true },
    title: { type: String, required: true },
    image: { type: String, required: true },
    desc: { type: String, required: true },
    type: { type: String, required: true },
    value: { type: Number, required: true },
    sharedWith: {
      default: [],
      type: [{ type: Schema.Types.ObjectId, ref: "User" }],
      required: true,
    },
    deadline: { type: String, required: false },
  },
  { timestamps: true }
);

const taskListSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User" },
    tasklist: {
      completed: { default: [], type: [taskSchema] },
      awaited: { default: [], type: [taskSchema] },
      progress: { default: [], type: [taskSchema] },
    },
  },

  { timestamps: false }
);

export default model("TaskList", taskListSchema);
