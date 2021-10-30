import express from "express";
import mongoose from "mongoose";
import UserModel from "./model.js";
import TaskListModel from "../tasks/model.js";
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
    const { _id } = req.user;
    const updatedTasks = await TaskListModel.findOneAndUpdate(
      { user: _id },
      { $push: { awaited: req.body } },
      { new: true, runValidators: true }
    );
    if (updatedTasks) {
      const newTask = updatedTasks.awaited[updatedTasks.awaited.length - 1];
      res.send(newTask);
    } else {
      res.status(404).send(`Tasklist belonging to user ${_id} not found`);
    }
  } catch (e) {
    next(e);
  }
}).get("/me", JWT_MIDDLEWARE, async (req, res, next) => {
  console.log("💠 GET", route);
  try {
    const tasks = await TaskListModel.findOne({ user: req.user._id });
    if (tasks) {
      res.send(tasks);
    } else {
      res.status(404).send(`Tasklist belonging to user ${_id} not found`);
    }
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
