import express from "express";
import { TaskModel } from "../tasks/model.js";
import TaskListModel from "../tasks/model.js";
import { JWT_MIDDLEWARE } from "../../auth/jwt.js";
import { editTaskCategoryBulk } from "../../utils/route-funcs/tasks.js";

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
      res.status(409).send({ message: `CATEGORY ALREADY EXISTS` });
    } else if (!categories.includes(category)) {
      const filter = { user: _id };
      const update = { $push: { categories: category } };
      const categoryAdded = await TaskListModel.findOneAndUpdate(
        filter,
        update, 
        {
          returnOriginal: false,
        }
      );
      if (categoryAdded) {
        console.log("💠 NEW CATEGORY SUCCESSFULLY ADDED [ME]");
        res.send({ category });
      } else {
        console.log("💀SOMETHING WENT WRONG...");
      }
    } else {
      console.log("💀SOMETHING WENT WRONG...");
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
      // put "/me" must change all tasks belonging to user with that category
      // see put /tasks/ me when category changed
      // it must push category to all sharedWith user's "tasklist.categories" (no duplications)
      const { _id } = req.user;
      const { originalCategory, updatedCategory } = req.body;
      const { categories } = await TaskListModel.findOne({ user: _id });
      if (!originalCategory) {
        res
          .status(400)
          .send({ message: `REQUEST MUST INCLUDE CATEGORY TO UPDATE` });
      } else if (!updatedCategory) {
        res
          .status(400)
          .send({ message: `REQUEST MUST INCLUDE UPDATED CATEGORY` });
      } else {
        const index = categories.indexOf(originalCategory);
        //console.log("index",index);
        const updatedCategoryExists = categories.some(
          (category) => category === updatedCategory
        );
        //console.log("updated category exists",updatedCategoryExists);
        if (index === -1) {
          res
            .status(400)
            .send({ message: `ORIGINAL CATEGORY NOT FOUND TO REPLACE` });
        } else {
          if (updatedCategoryExists) {
            // Changing category a to b where b already exists in array: delete a and edit all categ 'a' tasks to categ 'b'
            //console.log("delete and edit");
            categories.splice(index, 1);
          } else {
            // Changing category a to b where b does not already exist in array: change a to b and edit all categ 'a' tasks to categ 'b'
            //console.log("update and edit");
            categories[index] = updatedCategory;
          }
          const filter = { user: _id };
          const update = { categories };
          const categoryUpdated = await TaskListModel.findOneAndUpdate(
            filter,
            update,
            {
              returnOriginal: false,
            }
          );
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
              updatedCategory
            );
            if (allTaskCategoriesEdited) {
              res.send({ category: updatedCategory });
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
      // delete "/me" must remove category from logged in user's "tasklist.categories"
      // all of the user's tasks with that category must revert to {category: none}
      // the category is NOT removed from other user's tasklists
      const { _id } = req.user;
      const { deletedCategory } = req.body;
      const { categories } = await TaskListModel.findOne({ user: _id });
      if (!deletedCategory) {
        res
          .status(400)
          .send({ message: `REQUEST MUST INCLUDE CATEGORY TO DELETE` });
      } else {
        console.log(categories);
        const deletedCategoryExists = categories.some(
          (category) => category === deletedCategory
        );
        if (!deletedCategoryExists) {
          res
            .status(400)
            .send({ message: `CATEGORY MUST EXIST TO BE DELETED` });
        } else {
          const filter = { user: _id };
          const update = { $pull: { categories: deletedCategory } };
          const categoryDeleted = await TaskListModel.findOneAndUpdate(
            filter,
            update,
            {
              returnOriginal: false,
            }
          );
          if (categoryDeleted) {
            console.log("💠 CATEGORY SUCCESSFULLY DELETED [ME]");
            const my_tasks = await TaskListModel.findOne({
              user: req.user._id,
            }).populate("completed awaited in_progress");
            const { completed, awaited, in_progress } = my_tasks;
            const allTasks = completed.concat(awaited, in_progress);
            const allTaskCategoriesEdited = await editTaskCategoryBulk(
              allTasks,
              deletedCategory,
              "delete"
            );
            if (allTaskCategoriesEdited) {
              res.send();
            }
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
