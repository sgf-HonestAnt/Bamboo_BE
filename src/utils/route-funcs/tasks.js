import TaskListModel, { TaskModel } from "../../routes/tasks/model.js";
import UserModel from "../../routes/users/model.js";
import { DELETE, NONE, TASK_RESIZE_IMG, UPDATE } from "../constants.js";
////////////////////////////////////////////////////////////////////
export const getTaskFilePath = (path) => {
  // return scaled, sharpened, gravity-based file path from cloudinary
  console.log("➡️getTaskFilePath")
  let filePath = path;
  const filePathSplit = filePath.split("/upload/", 2);
  filePath = `${TASK_RESIZE_IMG}/${filePathSplit[1]}`;
  return filePath;
};
////////////////////////////////////////////////////////////////////
export const createSharedWithArray = (array, id) => {
  // returns a non-duplicating array of user ids sharing single task
  console.log("➡️createSharedWithArray")
  let sharedWith;
  sharedWith = array?.length > 0 ? [...array, id] : [id];
  // sharedWith.push(_id);
  const noDuplicates = [...new Set(sharedWith)];
  // sharedWith = noDuplicateIds;
  return noDuplicates;
};
////////////////////////////////////////////////////////////////////
export const pushToStatus = async (id, status, taskId) => {
  // push task id to tasklist status upon update status
  console.log("➡️pushToStatus")
  const updatedList = await TaskListModel.findOneAndUpdate(
    { user: id },
    { $push: { [status]: taskId } },
    { returnOriginal: false }
    // { new: true, runValidators: true }
  );
  // await updatedList.save();
  return updatedList;
};
////////////////////////////////////////////////////////////////////
export const pullFromStatus = async (id, status, taskId) => {
  // pull task id from task list status upon delete task
  console.log("➡️pullFromStatus")
  const updatedList = await TaskListModel.findOneAndUpdate(
    { user: id },
    { $pull: { [status]: taskId } },
    { returnOriginal: false }
    // { new: true, runValidators: true }
  );
  // await updatedList.save();
  return updatedList;
};
////////////////////////////////////////////////////////////////////
export const updateTasklist = async (id, status, task, category) => {
  // push task category and id to relevant status upon create task
  console.log("➡️updateTasklist")
  const { categories } = await TaskListModel.findOne({
    user: id,
  });
  if (!categories.includes(category)) {
    const updatedList = await TaskListModel.findOneAndUpdate(
      { user: id },
      {
        $push: { [status]: task },
        $push: { categories: category },
      },
      { returnOriginal: false }
      // { new: true, runValidators: true }
    );
    return updatedList;
  } else {
    const updatedList = await pushToStatus(id, status, task._id) //// ??????????????????
    // const updatedList = await TaskListModel.findOneAndUpdate(
    //   { user: _id },
    //   { $push: { [status]: task } },
    //   { new: true, runValidators: true }
    // );
    return updatedList;
  }
};
////////////////////////////////////////////////////////////////////
export const updateTaskStatus = async (
  id,
  taskId,
  prevStatus,
  currStatus,
  task
) => {
  // move task from one status to another upon update status
  console.log("➡️updateTaskStatus")
  const updatedList = await TaskListModel.findOneAndUpdate(
    { user: id },
    {
      $push: { [currStatus]: task },
      $pull: { [prevStatus]: taskId },
    },
    // { new: true, runValidators: true }
    { returnOriginal: false }
  );
  // await updatedList.save();
  return updatedList;
};
////////////////////////////////////////////////////////////////////
export const updateListsAfterDelete = async (list, status, id) => {
  // remove from task list after delete
  console.log("➡️updateListsAfterDelete")
  for (let i = 0; i < list.length; i++) {
    await pullFromStatus(list, status, id);
  }
  return
};
////////////////////////////////////////////////////////////////////
export const addXP = async (id, value) => {
  // accumulate xp to user _id
  console.log("➡️addXP")
  const user = await UserModel.findById(id);
  const xp = user.xp + value;
  const updatedUser = await UserModel.findByIdAndUpdate(
    id,
    { xp },
    { returnOriginal: false }
    // { new: true, runValidators: true }
  );
  return updatedUser;
};
////////////////////////////////////////////////////////////////////
export const findTasksByCategory = async (tasks, category) => {
  // return array of task ids with selected category
  console.log("➡️findTasksByCategory")
  let array = [];
  tasks.map((t) => t.category === category && array.push(t._id));
  return array;
};
////////////////////////////////////////////////////////////////////
export const findSharedUsers = async (id) => {
  // return all users who share a task (excl. creator)
  console.log("➡️findSharedUsers")
  const { createdBy, sharedWith } = await TaskModel.findById(id);
  const index = sharedWith.indexOf(createdBy);
  sharedWith.splice(index, 1);
  return sharedWith;
};
////////////////////////////////////////////////////////////////////
export const findTasklist = async (id) => {
  // return tasklist belonging to user _id
  console.log("➡️findTasklist")
  const tasklist = await TaskListModel.findOne({ user: id });
  return tasklist;
};
////////////////////////////////////////////////////////////////////
export const pushCategory = async (id, category) => {
  // push new category to tasklist belonging to user _id
  console.log("➡️pushCategory")
  const filter = { user: id };
  const update = { $push: { categories: category } };
  const { categories } = await TaskListModel.findOne(filter);
  const categoryIncluded = categories.includes(category);
  if (!categoryIncluded) {
    await TaskListModel.findOneAndUpdate(filter, update, {
      returnOriginal: false,
    });
  }
  return
};
////////////////////////////////////////////////////////////////////
export const pullCategory = async (id, category) => {
  // pull category from tasklist belonging to user _id
  console.log("➡️pullCategory")
  const filter = { user: id };
  const update = { $pull: { categories: category } };
  const { categories } = await TaskListModel.findOne(filter);
  const categoryIncluded = categories.includes(category);
  if (categoryIncluded) {
    await TaskListModel.findOneAndUpdate(secondFilter, update, {
      returnOriginal: false,
    });
  }
  return
};
////////////////////////////////////////////////////////////////////
export const updateCategory = async (array, method, category) => {
  // change category on all tasks in an array && add category to all shared users' tasklists if not already present
  console.log("➡️updateCategory")
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
  return
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
  await updateCategory(array, method, updatedCategory);
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
  // const taskIsShared = sharedWith.length > 1;
  //console.log("shared", taskIsShared);
  // if (taskIsShared) {
  //   // In shared users categories, add updatedCategory to list. (NOTE: leave originalCategory alone!)
  //   // First remove own user id
  //   const index = sharedWith.indexOf(createdBy);
  //   sharedWith.splice(index, 1);
  //   // Then, if category does not already exist on the users' list, push updatedCategory to the list.
  //   for (let i = 0; i < sharedWith.length; i++) {
  //     const filter = { user: sharedWith[i] };
  //     const userTaskList = await TaskListModel.findOne(filter);
  //     const { categories } = userTaskList;
  //     if (!categories.includes(updatedCategory)) {
  //       const update = { $push: { categories: updatedCategory } };
  //       await TaskListModel.findOneAndUpdate(filter, update, {
  //         returnOriginal: false,
  //       });
  //     }
  //   }
  // }
  return
};
// return true;
