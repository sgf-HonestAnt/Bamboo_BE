import express from "express";
import mongoose from "mongoose";
import { TaskModel } from "./model.js";
import TaskListModel from "../tasks/model.js";
import q2m from "query-to-mongo";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { JWT_MIDDLEWARE } from "../../auth/jwt.js";
import { MY_FOLDER } from "../../utils/constants.js";
import {
  getTaskFilePath,
  createSharedArray,
  removeFromTaskList,
  updateTaskList,
  updateTaskListWithStatus,
} from "../../utils/route-funcs/tasks.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: { folder: MY_FOLDER },
});

const TaskRoute = express.Router();

const route = "TASKS";

TaskRoute.post(
  "/me",
  JWT_MIDDLEWARE,
  multer({ storage }).single("image"),
  async (req, res, next) => {
    console.log(`💠 POST ${route} (single task)`);
    try {
      const sharedWith = createSharedArray(req.body.sharedWith, req.user._id);
      const newTask = new TaskModel({
        createdBy: req.user._id,
        ...req.body,
        sharedWith,
      });
      if (req.file) {
        const filePath = await getTaskFilePath(req.file.path);
        newTask.image = filePath;
      }
      const { _id } = await newTask.save();
      if (!_id) {
        console.log({
          message: "💀TASK NOT SAVED",
          task: newTask,
        });
      } else {
        const updateAllLists = await newTask.sharedWith.map((user_id) => {
          const updated = updateTaskList(user_id, newTask.status, newTask);
          return updated;
        });
        if (updateAllLists) {
          res.send({ _id });
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
    console.log(`💠 GET ${route} (all tasks)`);
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
    console.log(`💠GET ${route} (single task)`);
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
      console.log(`💠 PUT ${route} (single task)`);
      try {
        const { t_id } = req.params;
        const { status } = req.body;
        const foundTask = await TaskModel.findById(t_id);
        console.log("task found...");
        if (!foundTask) {
          res.status(404).send(`Task with id ${t_id} not found`);
        } else {
          const changeOfStatus = status ? status !== foundTask.status : false;
          console.log("status changed:", changeOfStatus);
          const filter = { _id: t_id };
          const update = { ...req.body };
          if (req.file) {
            const filePath = await getTaskFilePath(req.file.path);
            update.image = filePath;
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
    console.log(`💠 DELETE ${route} (single task)`);
    try {
      const { t_id } = req.params;
      const foundTask = await TaskModel.findById(t_id);
      if (!foundTask || !mongoose.Types.ObjectId.isValid(t_id)) {
        res.status(404).send({ error: `Task ID ${t_id} not found!` });
      } else {
        const { status, sharedWith } = foundTask;
        const deletedTask = await TaskModel.findByIdAndDelete(t_id);
        if (deletedTask) {
          const updateAllLists = async (list) => {
            for (let i = 0; i < list.length; i++) {
              await removeFromTaskList(list, status, t_id);
              return;
            }
          };
          await updateAllLists(sharedWith);
          res.status(204).send();
        } else {
          console.log("Something went wrong...");
        }
      }
    } catch (e) {
      next(e);
    }
  });

export default TaskRoute;
