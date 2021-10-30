import TaskListSchema, { TaskSchema } from "./schema.js";
import mongoose from "mongoose";

const TaskListModel = mongoose.model("TaskList", TaskListSchema);

export const TaskModel = mongoose.model("Task", TaskSchema);

export default TaskListModel;
