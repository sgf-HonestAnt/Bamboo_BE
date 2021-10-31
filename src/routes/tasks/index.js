import express from "express";
import mongoose from "mongoose";
import { TaskModel } from "./model.js";
import TaskListModel from "../tasks/model.js";
import q2m from "query-to-mongo";
import multer from "multer";
import { createSharedArray, updateTaskList, updateTaskListWithStatus } from "../../utils/taskUtils.js"
// import generator from "../../utils/generator.js";
// import shuffle from "../../utils/shuffle.js";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { JWT_MIDDLEWARE } from "../../auth/jwt.js";

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
      // first, let's deal with the sharedWith array
      const sharedWith = createSharedArray(req.body.sharedWith, req.user._id);
      // next, create the task
      const newTask = new TaskModel({
        createdBy: req.user._id,
        ...req.body,
        sharedWith,
      });
      // add file path if image was included
      if (req.file) {
        newTask.image = req.file.path;
      }
      // check the task we created
      console.log("TASK=>", newTask);
      const { _id } = await newTask.save();
      if (!_id) {
        console.log({
          message: "💀TASK NOT SAVED",
          task: newTask,
        });
        // then add it to ALL the users' tasklists
      } else {
        const updateAllLists = await newTask.sharedWith.map((user_id) => {
          const updated = updateTaskList(user_id, newTask.status, newTask);
          return updated;
        });
        if (updateAllLists) {
          res.send(newTask);
        } else {
          console.log("Something went wrong...", updateAllLists);
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
  .put(
    "/me/:t_id",
    JWT_MIDDLEWARE,
    multer({ storage }).single("image"),
    async (req, res, next) => {
      console.log("💠 PUT", route);
      try {
        const { t_id } = req.params;
        const { status } = req.body;
        const foundTask = await TaskModel.findById(t_id);
        console.log("task found...");
        if (!foundTask) {
          res.status(404).send(`Task with id ${t_id} not found`);
        } else {
          // check if the status has changed
          const changeOfStatus = status ? status !== foundTask.status : false;
          console.log("status changed:", changeOfStatus);
          // update and save the task
          const filter = { _id: t_id };
          const update = { ...req.body };
          if (req.file) {
            update.image = req.file.path;
          }
          const updatedTask = await TaskModel.findOneAndUpdate(filter, update, {
            returnOriginal: false,
          });
          await updatedTask.save();
          console.log("task updated...");
          if (!updatedTask) {
            console.log({ error: `Task with id ${t_id} was not updated` });
          } else if (!changeOfStatus) {
            res.send(updatedTask);
          } else {
            const updateAllListsWithStatus = await updatedTask.sharedWith.map(
              (user_id) => {
                const updated = updateTaskListWithStatus(
                  user_id,
                  t_id,
                  foundTask.status,
                  updatedTask.status,
                  updatedTask
                );
                return updated;
              }
            );
            if (updateAllListsWithStatus) {
              res.send(updatedTask);
            } else {
              console.log("Something went wrong...", updateAllListsWithStatus);
            }
          }
        }
      } catch (e) {
        next(e);
      }
    }
  )
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
          // need to delete it from all tasklists too!!!
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
