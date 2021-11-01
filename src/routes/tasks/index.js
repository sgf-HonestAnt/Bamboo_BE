import express from "express";
import mongoose from "mongoose";
import { TaskModel } from "./model.js";
import TaskListModel from "../tasks/model.js";
import q2m from "query-to-mongo";
import multer from "multer";
import { JWT_MIDDLEWARE } from "../../auth/jwt.js";
import { storage } from "../../utils/constants.js";
import {
  getTaskFilePath,
  createSharedArray,
  removeFromTaskList,
  updateTaskList,
  updateTaskListWithStatus,
} from "../../utils/route-funcs/tasks.js";

const TaskRoute = express.Router();

TaskRoute.post(
  "/me",
  JWT_MIDDLEWARE,
  multer({ storage }).single("image"),
  async (req, res, next) => {
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
          console.log("NEW TASK SUCCESSFULLY CREATED");
          res.send({ _id });
        } else {
          console.log("💀SOMETHING WENT WRONG...");
        }
      }
    } catch (e) {
      next(e);
    }
  }
)
  .get("/me", JWT_MIDDLEWARE, async (req, res, next) => {
    try {
      const my_tasks = await TaskListModel.findOne({
        user: req.user._id,
      }).populate("completed awaited in_progress");
      if (my_tasks) {
        console.log("FETCHED TASKS");
        res.send(my_tasks);
      } else {
        res.status(404).send({ message: `USER ${_id} TASKLIST NOT FOUND` });
      }
    } catch (e) {
      next(e);
    }
  })
  .get("/me/:t_id", JWT_MIDDLEWARE, async (req, res, next) => {
    try {
      const { t_id } = req.params;
      const task = await TaskModel.findById(t_id);
      if (!task) {
        res.status(404).send({ message: `TASK ${t_id} NOT FOUND` });
      } else {
        console.log("FETCHED TASK BY ID");
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
      try {
        const { t_id } = req.params;
        const { status } = req.body;
        const foundTask = await TaskModel.findById(t_id);
        if (!foundTask) {
          res.status(404).send(`Task with id ${t_id} not found`);
        } else {
          const changeOfStatus = status ? status !== foundTask.status : false;
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
          if (!updatedTask) {
            console.log("💀SOMETHING WENT WRONG...");
          } else if (!changeOfStatus) {
            console.log("UPDATED TASK BY ID");
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
              console.log("UPDATED TASK BY ID");
              res.send(updatedTask);
            } else {
              console.log("💀SOMETHING WENT WRONG...");
            }
          }
        }
      } catch (e) {
        next(e);
      }
    }
  )
  .delete("/me/:t_id", JWT_MIDDLEWARE, async (req, res, next) => {
    try {
      const { t_id } = req.params;
      const foundTask = await TaskModel.findById(t_id);
      if (!foundTask || !mongoose.Types.ObjectId.isValid(t_id)) {
        res.status(404).send({ message: `TASK ${t_id} NOT FOUND` });
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
          console.log("DELETED TASK BY ID");
          res.status(204).send(`TASK ${t_id} SUCCESSFULLY DELETED`);
        } else {
          console.log("💀SOMETHING WENT WRONG...");
        }
      }
    } catch (e) {
      next(e);
    }
  });

export default TaskRoute;
