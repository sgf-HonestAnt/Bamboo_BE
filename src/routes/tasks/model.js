import mongoose from "mongoose";
import TaskListSchema, { TaskSchema } from "./schema.js";

const TaskListModel = mongoose.model("TaskList", TaskListSchema);

export const TaskModel = mongoose.model("Task", TaskSchema)

export default TaskListModel;
