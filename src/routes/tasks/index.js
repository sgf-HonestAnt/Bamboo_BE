import express from "express";
import mongoose from "mongoose";
import UserModel, { TaskModel } from "./model.js";
import TaskListModel from "../tasks/model.js";
import q2m from "query-to-mongo";
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

TaskRoute.post(
  "/me",
  JWT_MIDDLEWARE,
  multer({ storage }).single("image"),
  async (req, res, next) => {
    console.log("💠 POST", route);
    try {
      // first create the task
      const newTask = new TaskModel({
        createdBy: req.user._id,
        ...req.body,
      });
      if (req.file) {
        newTask.image = req.file.path
      } 
      const { _id } = await newTask.save();
      if (!_id) {
        console.log({
          message: "💀TASK NOT SAVED",
          task: newTask,
        });
      // then add it to the user's tasklist
      } else {
        const updatedTaskList = await TaskListModel.findOneAndUpdate(
          { user: req.user._id },
          { $push: { [newTask.status]: newTask } },
          { new: true, runValidators: true }
        );
        await updatedTaskList.save();
        if (!updatedTaskList) {
          res
            .status(404)
            .send(`Tasklist belonging to user ${req.user._id} not found`);
        } else {
          res.send(newTask);
        }
      }
    } catch (e) {
      next(e);
    }
  }
)
  .get("/me", JWT_MIDDLEWARE, async (req, res, next) => {
    console.log("💠 GET", route);
    try {
      const tasks = await TaskListModel.findOne({
        user: req.user._id,
      }).populate("completed awaited in_progress");
      if (tasks) {
        res.send(tasks);
      } else {
        res.status(404).send(`Tasklist belonging to user ${_id} not found`);
      }
    } catch (e) {
      next(e);
    }
  })
  .get("/me/:t_id", JWT_MIDDLEWARE, async (req, res, next) => {
    console.log("💠GET", route);
    try {
      const { t_id } = req.params;
      const task = await TaskModel.findById(t_id);
      if (!task) {
        res.status(404).send(`Task with id ${t_id} not found`);
      } else {
        res.send(task);
      }
    } catch (e) {
      next(e);
    }
  })
  .put("/me/:t_id", JWT_MIDDLEWARE, async (req, res, next) => {
    console.log("💠 PUT", route);
    try {
      const { t_id } = req.params;
      const { status } = req.body;
      const foundTask = await TaskModel.findById(t_id);
      console.log("task found...");
      if (!foundTask) {
        res.status(404).send(`Task with id ${t_id} not found`);
      } else {
        // check the status
        const changeOfStatus = status ? status !== previousTask.status : false;
        console.log("status changed:", changeOfStatus);
        // update and save the task
        const filter = { _id: t_id };
        const update = { ...req.body };
        const updatedTask = await TaskModel.findOneAndUpdate(filter, update, {
          returnOriginal: false,
        });
        await updatedTask.save();
        console.log("task updated...");
        if (!updatedTask) {
          console.log({ error: `Task with id ${t_id} was not updated` });
        } else if (changeOfStatus) {
          // I need to pull the task out of its current status and push it back into the new status
          const updatedList = await TaskListModel.findOneAndUpdate(
            { user: req.user._id },
            {
              $push: { [updatedTask.status]: updatedTask },
              $pull: { [previousTask.status]: t_id },
            },
            { new: true, runValidators: true }
          );
          await updatedList.save();
          console.log("task list updated...");
          if (!updatedList) {
            res
              .status(404)
              .send(`Tasklist belonging to user ${req.user._id} not updated`);
          } else {
            res.send(updatedTask);
          }
        } else {
          res.send(updatedTask);
        }
      }
    } catch (e) {
      next(e);
    }
  })
  .delete("/me/:t_id", JWT_MIDDLEWARE, async (req, res, next) => {
    console.log("💠 DELETE", route);
    try {
      const { t_id } = req.params;
      // const { _id } = req.body;
      const foundTask = await TaskModel.findById(t_id);
      if (!foundTask) {
        res.status(404).send(`Task with id ${t_id} not found`);
      } else {
        const deletedTask = await TaskModel.findByIdAndDelete(t_id);
        if (deletedTask) {
          res.status(204).send();
        } else {
          res.status(404).send(`💀TASK ID_${t_id} NOT FOUND`);
        }
      }
    } catch (e) {
      next(e);
    }
  });

export default TaskRoute;
