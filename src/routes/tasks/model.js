import TaskSchema from "./schema.js";
import mongoose from "mongoose";

const TaskModel = mongoose.model("Task", TaskSchema);

export default TaskModel;
