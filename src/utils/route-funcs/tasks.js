import TaskListModel, { TaskModel } from "../../routes/tasks/model.js";
import UserModel from "../../routes/users/model.js";
import { DELETE, NONE, TASK_RESIZE_IMG, UPDATE } from "../constants.js";

export const updateTaskList = async (_id, status, task, category) => {
  const { categories } = await TaskListModel.findOne({
    user: _id,
  });
  if (!categories.includes(category)) {
    const updatedList = await TaskListModel.findOneAndUpdate(
      { user: _id },
      {
        $push: { [status]: task },
        $push: { categories: category },
      },
      { new: true, runValidators: true }
    );
    return updatedList;
  } else {
    const updatedList = await TaskListModel.findOneAndUpdate(
      { user: _id },
      { $push: { [status]: task } },
      { new: true, runValidators: true }
    );
    return updatedList;
  }
};

export const removeFromTaskList = async (_id, status, task_id) => {
  const updatedList = await TaskListModel.findOneAndUpdate(
    { user: _id },
    { $pull: { [status]: task_id } },
    { new: true, runValidators: true }
  );
  // await updatedList.save();
  return updatedList;
};

export const updateTaskListWithStatus = async (
  _id,
  task_id,
  prevStatus,
  currStatus,
  task
) => {
  const updatedList = await TaskListModel.findOneAndUpdate(
    { user: _id },
    {
      $push: { [currStatus]: task },
      $pull: { [prevStatus]: task_id },
    },
    { new: true, runValidators: true }
  );
  // await updatedList.save();
  return updatedList;
};




////////////////////////////////////////////////////////////////////
export const getTaskFilePath = (path) => {
  // return scaled, sharpened, gravity-based file path from cloudinary
  let filePath = path;
  const filePathSplit = filePath.split("/upload/", 2);
  filePath = `${TASK_RESIZE_IMG}/${filePathSplit[1]}`;
  return filePath;
};
////////////////////////////////////////////////////////////////////
export const createSharedArray = (array, _id) => {
  // returns a non-duplicating array of user _ids sharing single task
  let sharedWith;
  sharedWith = array?.length > 0 ? [...array, _id] : [_id];
  // sharedWith.push(_id);
  const sharedWithNoDuplicates = [...new Set(sharedWith)];
  // sharedWith = noDuplicateIds;
  return sharedWithNoDuplicates;
};
////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////
export const addXP = async (_id, value) => {
  // accumulate xp to user _id
  const user = await UserModel.findById(_id);
  const xp = user.xp + value;
  const updatedUser = await UserModel.findByIdAndUpdate(
    _id,
    { xp },
    { returnOriginal: false }
    // { new: true, runValidators: true }
  );
  return updatedUser;
};
////////////////////////////////////////////////////////////////////
export const findSharedUsers = async (_id) => {
  // return all users who share a task (excl. creator)
  const { createdBy, sharedWith } = await TaskModel.findById(_id);
  const index = sharedWith.indexOf(createdBy);
  sharedWith.splice(index, 1);
  return sharedWith;
};
////////////////////////////////////////////////////////////////////
export const findTasklist = async (_id) => {
  // return tasklist belonging to user _id
  const tasklist = await TaskListModel.findOne({ user: _id });
  return tasklist;
};
////////////////////////////////////////////////////////////////////
export const findTasksByCategory = async (tasks, category) => {
  // return array of task ids with selected category
  let array = [];
  tasks.map((t, i) => t.category === category && array.push(t._id));
  return array;
};
////////////////////////////////////////////////////////////////////
export const pushCategory = async (_id, category) => {
  // push new category to tasklist belonging to user _id
  const filter = { user: _id };
  const update = { $push: { categories: category } };
  const { categories } = await TaskListModel.findOne(filter);
  const categoryIncluded = categories.includes(category);
  if (!categoryIncluded) {
    await TaskListModel.findOneAndUpdate(secondFilter, update, {
      returnOriginal: false,
    });
  }
};
////////////////////////////////////////////////////////////////////
export const pullCategory = async (_id, category) => {
  // pull category from tasklist belonging to user _id
  const filter = { user: _id };
  const update = { $pull: { categories: category } };
  const { categories } = await TaskListModel.findOne(filter);
  const categoryIncluded = categories.includes(category);
  if (categoryIncluded) {
    await TaskListModel.findOneAndUpdate(secondFilter, update, {
      returnOriginal: false,
    });
  }
};
////////////////////////////////////////////////////////////////////
export const editCategory = async (array, method, category) => {
  // change category on all tasks in an array && add category to all shared users' tasklists if not already present
  for (let i = 0; i < array.length; i++) {
    const id = array[i];
    const update =
      method === UPDATE
        ? { category }
        : method === DELETE
        ? { category: NONE }
        : {};
    await TaskModel.findByIdAndUpdate(id, update, {
      returnOriginal: false,
    });
    const sharedUsers = await findSharedUsers(id);
    if (sharedUsers.length > 0) {
      for (let i = 0; i < sharedUsers.length; i++) {
        const { categories } = await findTaskList(sharedUsers[i]);
        if (!categories.includes(category)) {
          await pushCategory(sharedUsers[i], category);
        }
      }
    }
  }
};
////////////////////////////////////////////////////////////////////

export const editTaskCategoryBulk = async (
  tasks,
  originalCategory,
  method,
  updatedCategory = null
) => {
  // edit category in tasklist of multiple users
  // let array = [];
  // const editTaskCategory = async (tasks) => {
  //   tasks.map((t, i) => t.category === originalCategory && array.push(t._id));
  // };
  // await editTaskCategory(tasks);
  const array = await findTasksByCategory(tasks, originalCategory);
  await editCategory(array, method, updatedCategory);
  // for (let i = 0; i < array.length; i++) {
  //   const id = array[i];
  //   // REPLACE WITH EDIT CATEGORY (SEE ABOVE)
  //   const update =
  //     method === "update" ? { category: updatedCategory } : { category: NONE };
  //   const { sharedWith, createdBy } = await TaskModel.findByIdAndUpdate(
  //     id,
  //     update,
  //     {
  //       returnOriginal: false,
  //     }
  //   );
  //console.log(sharedWith, createdBy);
  const taskIsShared = sharedWith.length > 1;
  //console.log("shared", taskIsShared);
  if (taskIsShared) {
    // In shared users categories, add updatedCategory to list. (NOTE: leave originalCategory alone!)
    // First remove own user id
    const index = sharedWith.indexOf(createdBy);
    sharedWith.splice(index, 1);
    // Then, if category does not already exist on the users' list, push updatedCategory to the list.
    for (let i = 0; i < sharedWith.length; i++) {
      const filter = { user: sharedWith[i] };
      const userTaskList = await TaskListModel.findOne(filter);
      const { categories } = userTaskList;
      if (!categories.includes(updatedCategory)) {
        const update = { $push: { categories: updatedCategory } };
        await TaskListModel.findOneAndUpdate(filter, update, {
          returnOriginal: false,
        });
      }
    }
  }
};
// return true;
