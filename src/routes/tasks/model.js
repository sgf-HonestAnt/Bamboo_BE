import TaskListSchema from "./schema.js";
import mongoose from "mongoose";

const TaskListModel = mongoose.model("TaskList", TaskListSchema);

export default TaskListModel;
