import express from "express";
import { TaskModel } from "../tasks/model.js";
import TaskListModel from "../tasks/model.js";
import { JWT_MIDDLEWARE } from "../../auth/jwt.js";

const CategoriesRoute = express.Router();

CategoriesRoute.post("/me", JWT_MIDDLEWARE, async (req, res, next) => {
  try {
    console.log("💠 POST CATEGORY [ME]");
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
        console.log("NEW CATEGORY SUCCESSFULLY ADDED");
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
      const { _id } = req.user;
      const { categories } = await TaskListModel.findOne({ user: _id });
      res.status(200).send({ categories });
    } catch (e) {
      next(e);
    }
  })
  .put("/me", JWT_MIDDLEWARE, async (req, res, next) => {
    // 👁️‍🗨️NEXT!!
    // WHEN CHANGING CATEGORY, I ALSO WANT TO ADD THAT CATEGORY TO THE OTHER SHARED USER TASKLIST (IF IT DOES NOT EXIST ALREADY).
    // IN THE RARE INSTANCE THAT THEY HAVE THAT CATEGORY IN EXISTENCE, WITH TASKS ALREADY SET TO THAT CATEGORY, I WILL ONLY ADD MY CATEGORY AND CHANGE
    // SHARED TASKS. I.E. THEY MAY HAVE EXTRA TASK CATEGORIES WITHOUT TASKS IN THEIR LIST...
    // I ALSO WANT TO MOVE THE EDIT TASK CATEGORY FUNCTION TO UTILS.
    try {
      console.log("💠 PUT CATEGORY [ME]");
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
        const updatedCategoryExists = categories.some(
          (category) => category === updatedCategory
        );
        if (index === -1) {
          res
            .status(400)
            .send({ message: `ORIGINAL CATEGORY NOT FOUND TO REPLACE` });
        } else {
          if (updatedCategoryExists) {
            // Delete original category and edit the tasks
            categories.splice(index, 1);
          } else {
            // Replace original category with updated category and edit the tasks
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
            console.log("CATEGORY SUCCESSFULLY UPDATED");
            const my_tasks = await TaskListModel.findOne({
              user: req.user._id,
            }).populate("completed awaited in_progress");
            const { completed, awaited, in_progress } = my_tasks;
            let array = [];
            const editTaskCategory = async (tasks) => {
              tasks.map(
                (t, i) => t.category === originalCategory && array.push(t._id)
              );
            };
            await editTaskCategory(completed);
            await editTaskCategory(awaited);
            await editTaskCategory(in_progress);
            console.log(array);
            for (let i = 0; i < array.length; i++) {
              const id = array[i];
              const update = { category: updatedCategory };
              await TaskModel.findByIdAndUpdate(id, update, {
                returnOriginal: false,
              });
            }
            res.send({ category: updatedCategory });
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
