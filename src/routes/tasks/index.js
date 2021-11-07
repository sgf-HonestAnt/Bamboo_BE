import express from "express";
import mongoose from "mongoose";
import TaskListModel from "../tasks/model.js";
import { TaskModel } from "./model.js";
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
  addXP,
  pushCategory,
} from "../../utils/route-funcs/tasks.js";

const TaskRoute = express.Router();

TaskRoute.post(
  "/me",
  JWT_MIDDLEWARE,
  multer({ storage }).single("image"),
  async (req, res, next) => {
    try {
      console.log("💠 POST TASK");
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
      const { _id, category } = await newTask.save();
      if (!_id) {
        console.log({
          message: "💀TASK NOT SAVED",
          task: newTask,
        });
      } else {
        // add category to array if it doesn't already exist
        const { categories } = await TaskListModel.findOne({
          user: req.user._id,
        });
        if (!categories.includes(category)) {
          const filter = { user: req.user._id };
          const update = {
            $push: { categories: category },
          };
          await TaskListModel.findOneAndUpdate(filter, update, {
            returnOriginal: false,
          });
        }
        // update all lists
        const updateAllLists = await newTask.sharedWith.map((user_id) => {
          const updated = updateTaskList(
            user_id,
            newTask.status,
            newTask,
            category
          );
          return updated;
        });
        if (updateAllLists) {
          console.log("💠 NEW TASK SUCCESSFULLY CREATED");
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
      console.log("💠 GET TASKS");
      const my_tasks = await TaskListModel.findOne({
        user: req.user._id,
      }).populate("completed awaited in_progress");
      if (my_tasks) {
        console.log("💠 FETCHED TASKS");
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
      console.log("💠 GET TASK");
      const { t_id } = req.params;
      const task = await TaskModel.findById(t_id);
      if (!task) {
        res.status(404).send({ message: `TASK ${t_id} NOT FOUND` });
      } else {
        console.log("💠 FETCHED TASK BY ID");
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
        console.log("💠 PUT TASK");
        const { t_id } = req.params;
        const { status, category } = req.body;
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
          if (category) {
            await pushCategory(_id, category)
            // const secondFilter = { user: _id };
            // const secondUpdate = { $push: { categories: category } };
            // const { categories } = await TaskListModel.findOne(secondFilter);
            // if (!categories.includes(category)) {
            //   await TaskListModel.findOneAndUpdate(
            //     secondFilter,
            //     secondUpdate,
            //     {
            //       returnOriginal: false,
            //     }
            //   );
            // }
            // and this needs to be done for EVERY ONE INCLUDED ON THE TASK!!!
          }
          const updatedTask = await TaskModel.findOneAndUpdate(filter, update, {
            returnOriginal: false,
          });
          //await updatedTask.save();
          console.log(updatedTask);
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
              if (updatedTask.status === "completed") {
                await addXP(req.user._id, foundTask.value);
              }
              console.log("💠 UPDATED TASK BY ID");
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
      console.log("💠 DELETE TASK");
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
          console.log("💠 DELETED TASK BY ID");
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
