import express from "express";
import { TaskModel } from "../tasks/model.js";
import TaskListModel from "../tasks/model.js";
import { JWT_MIDDLEWARE } from "../../auth/jwt.js";
import {
  editTaskCategoryBulk,
  pullCategory,
  pushCategory,
  updateCategory,
  updateTasklistCategory,
} from "../../utils/route-funcs/tasks.js";

const CategoriesRoute = express.Router();

CategoriesRoute.post("/me", JWT_MIDDLEWARE, async (req, res, next) => {
  try {
    console.log("💠 POST CATEGORY [ME]");
    // post "/me" endpoint must push category to user's "tasklist.categories" (no duplications) ✔️
    const { _id } = req.user;
    const { category } = req.body;
    const { categories } = await TaskListModel.findOne({ user: _id });
    if (!category) {
      res.status(400).send({ message: `REQUEST MUST INCLUDE CATEGORY` });
    } else if (categories.includes(category)) {
      res.status(409).send({ message: "CATEGORY ALREADY EXISTS" });
    } else {
      await pushCategory(_id, category);
      console.log("💠 NEW CATEGORY SUCCESSFULLY ADDED [ME]");
      res.send({ category: category.toLowerCase() });
    }
  } catch (e) {
    next(e);
  }
})
  .get("/me", JWT_MIDDLEWARE, async (req, res, next) => {
    try {
      console.log("💠 GET CATEGORIES [ME]");
      // get "/me" endpoint must return "tasklist.categories" ✔️
      const { _id } = req.user;
      const { categories } = await TaskListModel.findOne({ user: _id });
      console.log("💠 FETCHED CATEGORIES [ME]");
      res.status(200).send({ categories });
    } catch (e) {
      next(e);
    }
  })
  .put("/me", JWT_MIDDLEWARE, async (req, res, next) => {
    try {
      console.log("💠 PUT CATEGORY [ME]");
      // put "/me" must change all tasks belonging to user with that category ✔️
      // it must push category to all sharedWith user's "tasklist.categories" (no duplications) ✔️
      const { _id } = req.user;
      const { originalCategory, updatedCategory } = req.body;
      const { categories } = await TaskListModel.findOne({ user: _id });
      if (!originalCategory) {
        res
          .status(400)
          .send({ message: `REQUEST MUST INCLUDE ORIGINAL CATEGORY` });
      } else if (!updatedCategory) {
        res
          .status(400)
          .send({ message: `REQUEST MUST INCLUDE UPDATED CATEGORY` });
      } else {
        const index = categories.indexOf(originalCategory);
        const updatedAlreadyExists = categories.some(
          (category) => category === updatedCategory.toLowerCase()
        );
        if (index === -1) {
          res
            .status(400)
            .send({ message: `ORIGINAL CATEGORY NOT FOUND TO REPLACE` });
        } else {
          if (updatedAlreadyExists) {
            categories.splice(index, 1); // remove original category
          } else {
            categories[index] = updatedCategory.toLowerCase(); // change original category to updated category
          }
          const categoryUpdated = await updateTasklistCategory(_id, categories)
          if (categoryUpdated) {
            console.log("💠 CATEGORY SUCCESSFULLY UPDATED [ME]");
            const my_tasks = await TaskListModel.findOne({
              user: req.user._id,
            }).populate("completed awaited in_progress");
            const { completed, awaited, in_progress } = my_tasks;
            const allTasks = completed.concat(awaited, in_progress);
            const allTaskCategoriesEdited = await editTaskCategoryBulk(
              allTasks,
              originalCategory,
              "update",
              req.user._id,
              updatedCategory.toLowerCase()
            );
            if (allTaskCategoriesEdited) {
              res.send({ category: updatedCategory.toLowerCase() });
            }
          } else {
            console.log("💀SOMETHING WENT WRONG...");
          }
        }
      }
    } catch (e) {
      next(e);
    }
  })
  .delete("/me", JWT_MIDDLEWARE, async (req, res, next) => {
    try {
      console.log("💠 DELETE CATEGORY [ME]");
      // delete "/me" must remove category from logged in user's "tasklist.categories" ✔️
      // all of the user's tasks with that category must revert to {category: none}
      // returns 400 if category does not exist or no category included ✔️
      // the category is NOT removed from other user's tasklists ✔️
      const { _id } = req.user;
      const { deletedCategory } = req.body;
      const { categories } = await TaskListModel.findOne({ user: _id });
      if (!deletedCategory) {
        res
          .status(400)
          .send({ message: `REQUEST MUST INCLUDE CATEGORY TO DELETE` });
      } else {
        const categoryExistent = categories.some(
          (category) => category === deletedCategory
        );
        if (!categoryExistent) {
          res
            .status(400)
            .send({ message: `CATEGORY MUST EXIST TO BE DELETED` });
        } else {
          const categoryPulled = await pullCategory(_id, deletedCategory);
          if (categoryPulled) {
            console.log("💠 CATEGORY SUCCESSFULLY DELETED [ME]");
            const my_tasks = await TaskListModel.findOne({
              user: req.user._id,
            }).populate("completed awaited in_progress");
            const { completed, awaited, in_progress } = my_tasks;
            const allTasks = completed.concat(awaited, in_progress);
            await editTaskCategoryBulk(allTasks, deletedCategory, "delete", req.user._id, deletedCategory);
            res.send();
          } else {
            console.log("💀SOMETHING WENT WRONG...");
          }
        }
      }
    } catch (e) {
      next(e);
    }
  });

export default CategoriesRoute;
