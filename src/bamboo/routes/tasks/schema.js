import mongoose from "mongoose";
import {
  AWAITED,
  NONE,
  SOLO,
  DEFAULT_TASK_IMG,
  TASK_STATUS_TYPES,
  TASK_TYPES,
  DEFAULT_CATEGORIES,
  DEFAULT_CATEGORIES_COLORS,
} from "../../utils/constants.js";

const { Schema } = mongoose;

export const TaskSchema = new mongoose.Schema(
  {
    category: { type: String, default: NONE, required: true },
    title: { type: String, required: true },
    image: { type: String, default: DEFAULT_TASK_IMG },
    desc: { type: String, required: true },
    repeats: { type: String, required: true },
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
    deadline: { type: Date },
  },
  {
    timestamps: false,
  }
);

const TaskListSchema = new mongoose.Schema({
  user: { type: Schema.Types.ObjectId, ref: "User" },
  categories: {
    required: true,
    default: DEFAULT_CATEGORIES,
    type: [{ type: String }],
  },
  categoriesColors: {
    required: true,
    default: DEFAULT_CATEGORIES_COLORS,
    type: [{ type: String }],
  },
  completed: {
    default: [],
    type: [{ type: Schema.Types.ObjectId, ref: "Task" }],
  },
  awaited: {
    default: [],
    type: [{ type: Schema.Types.ObjectId, ref: "Task" }],
  },
  in_progress: {
    default: [],
    type: [{ type: Schema.Types.ObjectId, ref: "Task" }],
  },
});

TaskSchema.static("findTasks", async function (query) {
  const { criteria } = query;
  console.log(criteria);
  // var thename = "Andrew";
  // db.collection.find({ name: /^thename$/i });
  const total = await this.countDocuments(criteria);
  const tasks = await this.find(criteria, query.options.fields) // problem here I think
    .limit(query.options.limit)
    .skip(query.options.skip)
    .sort(query.options.sort);
  return { total, tasks };
});

TaskListSchema.methods.toJSON = function () {
  const taskListDoc = this;
  const taskListObj = taskListDoc.toObject();
  delete taskListObj.user;
  delete taskListObj.__v;
  return taskListObj;
};

export default TaskListSchema;
