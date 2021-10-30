import express from "express";
import mongoose from "mongoose";
import UserModel from "./model.js";
import TaskListModel, { TaskModel } from "../tasks/model.js";
import q2m from "query-to-mongo";
import createHttpError from "http-errors";
import multer from "multer";
// import generator from "../../utils/generator.js";
// import shuffle from "../../utils/shuffle.js";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { JWT_MIDDLEWARE, ADMIN_MIDDLEWARE } from "../../auth/jwt.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: { folder: "capstone_users" },
});

const TaskRoute = express.Router();

const route = "tasks";

TaskRoute.post("/me", JWT_MIDDLEWARE, async (req, res, next) => {
  console.log("💠 POST", route);
  try {
    const user_id = req.user._id;
    const newTask = await new TaskModel(req.body);
    console.log(newTask);
    // const addToTasklist = await TaskListModel.findOneAndUpdate(
    //   { user_id },
    //   { $push: { awaited: req.body } },
    //   { new: true }
    // );
    // console.log(req.body);
    // console.log(addToTasklist);
    // if (addToTaskList) { // ReferenceError: addToTaskList is not defined
    //   res.send(addToTaskList);
    // }
  } catch (e) {
    next(e);
  }
});
// blogsRouter.post("/:id", async(req,res,next) => {
//   try {
//     const updatedBlog = await BlogModel.findByIdAndUpdate(
//       req.params.id,
//       { $push: { comments: req.body } },
//       { new : true,
//         runValidators: true
//       }
//     ).populate("author") // can be path: "comments.user", select: "name" <== what if more than 1 select?
//     if (updatedBlog) {
//       res.send(updatedBlog)
//     } else {
//       next(createError(404, `Blog Post with id ${req.params.id} not found`))
//     }
//   } catch (error) {
//     next(error)
//   }
// })
TaskRoute.get("/me", JWT_MIDDLEWARE, async (req, res, next) => {
  console.log("💠 GET", route);
  try {
  } catch (e) {
    next(e);
  }
});
TaskRoute.get("/me/:t_id", JWT_MIDDLEWARE, async (req, res, next) => {
  console.log("💠GET", route);
  try {
  } catch (e) {
    next(e);
  }
});
TaskRoute.put("/me/:t_id", JWT_MIDDLEWARE, async (req, res, next) => {
  console.log("💠 PUT", route);
  try {
  } catch (e) {
    next(e);
  }
});
TaskRoute.delete("/me/:t_id", JWT_MIDDLEWARE, async (req, res, next) => {
  console.log("💠 DELETE", route);
  try {
  } catch (e) {
    next(e);
  }
});

export default TaskRoute;
