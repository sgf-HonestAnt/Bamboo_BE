import express from "express";
import mongoose from "mongoose";
import TaskListModel from "../tasks/model.js";
import { TaskModel } from "./model.js";
import q2m from "query-to-mongo";
import multer from "multer";
import { JWT_MIDDLEWARE } from "../../auth/jwt.js";
import {
  DAILY,
  WEEKLY,
  MONTHLY,
  storage,
  NEVER,
  TEAM,
  SOLO,
} from "../../utils/constants.js";
import {
  createSharedWithArray,
  getTaskFilePath,
  updateTasklist,
  updateListsAfterDelete,
  updateTaskStatus,
  pushCategory,
  addXP,
  removeOwnId,
  repeatTaskSave,
  removeTaskFromTaskList,
  addTotal,
  getDateAsString,
  getShortDateAsString,
} from "../../utils/route-funcs/tasks.js";
import { pushNotification, shuffle } from "../../utils/route-funcs/users.js";

const TaskRoute = express.Router();

// export const TaskSchema = new mongoose.Schema(
//   {
//     category: { type: String, default: NONE, required: true },
//     title: { type: String, required: true },
//     image: { type: String, default: DEFAULT_TASK_IMG },
//     desc: { type: String, required: true },
//     repeats: { type: String, required: true },
//     type: {
//       type: String,
//       default: SOLO,
//       enum: TASK_TYPES,
//     },
//     value: { type: Number, default: 0 },
//     createdBy: { type: Schema.Types.ObjectId, ref: "User" },
//     sharedWith: {
//       default: [],
//       type: [{ type: Schema.Types.ObjectId, ref: "User" }],
//     },
//     status: { type: String, default: AWAITED, enum: TASK_STATUS_TYPES },
//     deadline: { type: Date },
//   },
//   {
//     timestamps: false,
//   }
// );

TaskRoute.post(
  "/me",
  JWT_MIDDLEWARE,
  multer({ storage }).single("image"),
  async (req, res, next) => {
    try {
      console.log("💠 POST TASK");
      console.log("RECEIVED=>", req.body);
      const { newCategory, repeated, repeatsOther, repetitions } = req.body; // total repeats (repeatTaskSave)
      // from front-end implementation
      delete req.body.newCategory;
      delete req.body.repeated;
      delete req.body.repeatsOther;
      delete req.body.repetitions;
      const sharedWith = createSharedWithArray(
        // create sharedWith id array
        req.body.sharedWith,
        req.user._id
      );
      const { body } = req;
      body.category =
        newCategory.length > 0
          ? newCategory.toLowerCase()
          : req.body.category.toLowerCase();
      body.sharedWith = sharedWith;
      const { category, title, desc, repeats, value, deadline } = body;
      const repeatsIsANumber = repeatsOther !== 0;
      if (repeats !== NEVER && deadline) {
        console.log("REPEATS NOT NEVER, DEADLINE EXISTS")
        body.deadline = new Date(deadline);
      } else if (repeats !== NEVER) {
        body.deadline = new Date();
      } else {
        body.deadline = deadline
      }
      if (repeatsIsANumber) {
        // set repeats script
        body.repeats = `every ${repeatsOther} days, ${repetitions} times, starting on ${getShortDateAsString(
          body.deadline
        )}`;
      }
      body.type = body.sharedWith.length > 1 ? TEAM : SOLO;
      const newTask = new TaskModel({
        createdBy: req.user._id,
        ...body,
        sharedWith,
      });
      // if (req.hasOwnProperty("file")) {
      //   // if image sent, rewrite to file path
      //   const filePath = await getTaskFilePath(req.file.path);
      //   newTask.image = filePath;
      // }
      const { _id } = await newTask.save();
      if (!_id) {
        console.log({
          message: "💀TASK NOT SAVED",
          task: newTask,
        });
      } else {
        await pushCategory(req.user._id, category); // if new category, push to list in lowercase
        if (repeats !== NEVER) {
          // if repeats, save multiple times
          await repeatTaskSave(body, req.user._id, sharedWith, repetitions);
        }
        const updateAllLists = sharedWith.map((user_id) => {
          updateTasklist(user_id, newTask.status, newTask, newTask.category);
        });
        if (sharedWith.length > 1) {
          const notification = `${req.user.username}:::included you in a shared task:::${newTask._id}:::${newTask.title}:::${req.user.avatar}`;
          await removeOwnId(sharedWith, req.user._id);
          sharedWith.map((user_id) => {
            pushNotification(user_id, notification);
          });
        }
        if (updateAllLists) {
          // Front end must not allow shared tasks that repeat - it could spam followers too much.
          console.log("💠 NEW TASK SUCCESSFULLY CREATED", newTask);
          res.send(newTask);
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
      // get "/me" endpoint returns all tasks belong to user ✔️
      // categories and all three status arrays are returned ✔️
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
  .get("/query", async (req, res, next) => {
    try {
      console.log("💠 GET TASKS QUERY");
      const query = q2m(req.query);
      const { total, tasks } = await TaskModel.findTasks(query);
      console.log("💠 FETCHED TASKS BY QUERY [ME]");
      res.send({
        links: query.links("/tasks", total),
        total,
        tasks,
        pageTotal: Math.ceil(total / query.options.limit),
      });
    } catch (e) {
      next(e);
    }
  })
  .get("/me/null", JWT_MIDDLEWARE, async (req, res, next) => {
    try {
      console.log("💠 GET TASK NULL DEADLINE");
      const { _id } = req.user;
      const task = await TaskModel.find({
        createdBy: _id,
        deadline: { $exists: false },
      });
      console.log("💠 FETCHED TASK BY ID");
      res.send(task);
    } catch (e) {
      next(e);
    }
  })
  .get("/me/:t_id", JWT_MIDDLEWARE, async (req, res, next) => {
    try {
      // get "/me/ID" endpoint returns single task by id if it belongs to user ✔️
      // 401 if task does not belong to user ✔️
      console.log("💠 GET TASK");
      const { t_id } = req.params;
      const { _id } = req.user;
      const task = await TaskModel.findById(t_id);
      if (!task) {
        res.status(404).send({ message: `TASK ${t_id} NOT FOUND` });
      } else if (!task.sharedWith.includes(_id)) {
        res.status(401).send({ message: `TASK DOES NOT BELONG TO USER` });
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
        // NOTE. WE WILL NOT ALLOW REPEATS TO BE CHANGED IN THE FRONT END - IT IS TOO TRICKY! JUST TITLE, CATEGORY AND DESCRIPTION CAN BE CHANGED.
        // put "/me/ID" endpoint updates a task ✔️
        // in all users sharing it, updated status moves task to relevant status ✔️
        // in all users sharing it, if new category provided, category added to "tasklist.categories" ✔️
        // in status change to completed, if task shared, other users receive notification ✔️
        // if req.file, file path points to updated cloudinary url ✔️
        // if status "completed", XP to value of the task is added to the user who completed it ✔️
        // 401 if task does not belong to user ✔️
        console.log("💠 PUT TASK");
        const { t_id } = req.params;
        const { status, category } = req.body;
        const task = await TaskModel.findById(t_id);
        if (!task) {
          res.status(404).send(`Task with id ${t_id} not found`);
        } else if (!task.sharedWith.includes(req.user._id)) {
          res.status(401).send({ message: `TASK DOES NOT BELONG TO USER` });
        } else {
          const { sharedWith } = task;
          const changeOfStatus = status ? status !== task.status : false;
          const filter = { _id: t_id };
          delete req.body.newCategory;
          delete req.body.repeated;
          delete req.body.repeatsOther;
          delete req.body.repetitions;
          const update = { ...req.body };
          // if (req.hasOwnProperty("file")) {
          //   const filePath = await getTaskFilePath(req.file.path);
          //   update.image = filePath;
          // }
          if (category) {
            for (let i = 0; i < sharedWith.length; i++) {
              await pushCategory(sharedWith[i], category);
            }
          }
          const updatedTask = await TaskModel.findOneAndUpdate(filter, update, {
            returnOriginal: false,
          });
          if (!updatedTask) {
            console.log("💀SOMETHING WENT WRONG...");
          } else if (!changeOfStatus) {
            console.log("💠 UPDATED TASK BY ID");
            res.send(updatedTask);
          } else {
            const statusChange = await updatedTask.sharedWith.map((user_id) => {
              const updated = updateTaskStatus(
                user_id,
                t_id,
                task.status,
                updatedTask.status,
                updatedTask
              );
              return updated;
            });
            if (statusChange) {
              if (updatedTask.status === "completed") {
                await addXP(req.user._id, task.value);
                const sharedWithOthers = await removeOwnId(
                  sharedWith,
                  req.user._id
                );
                await addTotal(req.user._id);
                for (let i = 0; i < sharedWithOthers.length; i++) {
                  await pushNotification(
                    sharedWithOthers[i],
                    `${req.user.username} completed your shared task: ${task.title}`
                  );
                }
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
      // delete "/me/ID" endpoint removes a task ✔️
      // in all users sharing it, task removed from status ✔️
      console.log("💠 DELETE TASK");
      const { t_id } = req.params;
      const foundTask = await TaskModel.findById(t_id);
      if (!foundTask || !mongoose.Types.ObjectId.isValid(t_id)) {
        res.status(404).send({ message: `TASK ${t_id} NOT FOUND` });
      } else {
        const { status, sharedWith } = foundTask;
        const deletedTask = await TaskModel.findByIdAndDelete(t_id);
        if (deletedTask) {
          await updateListsAfterDelete(sharedWith, status, t_id);
          console.log("💠 DELETED TASK BY ID");
          res.status(204).send();
        } else {
          console.log("💀SOMETHING WENT WRONG...");
        }
      }
    } catch (e) {
      next(e);
    }
  })
  .delete("/remove/:t_id", JWT_MIDDLEWARE, async (req, res, next) => {
    try {
      console.log("💠 DELETE SELF FROM TASK");
      const { t_id } = req.params;
      const { _id, username, tasks } = req.user;
      const foundTask = await TaskModel.findById(t_id);
      if (!foundTask || !mongoose.Types.ObjectId.isValid(t_id)) {
        res.status(404).send({ message: `TASK ${t_id} NOT FOUND` });
      } else if (
        foundTask.sharedWith.length < 2 ||
        foundTask.createdBy === _id.toString()
      ) {
        res
          .status(409)
          .send({ message: `CAN'T REMOVE SELF FROM OWN OR UNSHARED TASK` });
      } else {
        const { title, status, sharedWith, createdBy } = foundTask;
        const newSharedWith = await removeOwnId(sharedWith, _id);
        const updatedTask = await TaskModel.findOneAndUpdate(
          { _id: t_id },
          {
            sharedWith: newSharedWith,
          },
          {
            returnOriginal: false,
          }
        );
        if (updatedTask) {
          await removeTaskFromTaskList(t_id, tasks, status);
          const notification = `${username} removed themselves from your task: "${title}".`;
          await pushNotification(createdBy, notification);
          console.log("💠 DELETED SELF FROM TASK");
          res.status(204).send();
        } else {
          console.log("💀SOMETHING WENT WRONG...");
        }
      }
    } catch (e) {
      next(e);
    }
  });

export default TaskRoute;
