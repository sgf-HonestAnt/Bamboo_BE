import TaskListModel, { TaskModel } from "../../routes/tasks/model.js";
import UserModel from "../../routes/users/model.js";
import {
  DAILY,
  DELETE,
  MONTHLY,
  NEVER,
  NONE,
  SHOPPING,
  TASK_RESIZE_IMG,
  UPDATE,
  URGENT,
  WEEKLY,
  WELLBEING,
} from "../constants.js";
////////////////////////////////////////////////////////////////////
export const getDateAsString = (datePar) => {
  const year = datePar.getFullYear();
  const month = datePar.getMonth() + 1;
  const date = datePar.getDate();
  const shortMonth = month.toString().length < 2;
  const shortDate = date.toString().length < 2;
  let dateAsString;
  if (shortMonth && shortDate) {
    dateAsString = `${year}-0${month}-0${date}`;
  } else if (shortMonth) {
    dateAsString = `${year}-0${month}-${date}`;
  } else if (shortDate) {
    dateAsString = `${year}-${month}-0${date}`;
  } else {
    dateAsString = `${year}-${month}-${date}`;
  }
  return dateAsString;
};
////////////////////////////////////////////////////////////////////
export const createTasksUponRegister = async (userId) => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const todayDateAsString = getDateAsString(today);
  // const tomorrowDateAsString = getDateAsString(tomorrow);
  // const yesterdayDateAsString = getDateAsString(yesterday);
  const status = "awaited";
  const urgentTask = new TaskModel({
    createdBy: userId,
    category: URGENT,
    title: "Solve World Hunger",
    desc: "Put food before trade, find balance with nature's systems",
    repeats: "never",
    status,
    deadline: todayDateAsString,
    value: 0,
    sharedWith: [userId],
  });
  const householdTask = new TaskModel({
    createdBy: userId,
    category: WELLBEING,
    title: "Brush Your Teeth",
    desc: "Don't forget to floss!",
    repeats: "never",
    status,
    deadline: todayDateAsString,
    value: 0,
    sharedWith: [userId],
  });
  const shoppingTask = new TaskModel({
    createdBy: userId,
    category: SHOPPING,
    title: "Buy Groceries",
    desc: "Got milk?",
    repeats: "never",
    status,
    deadline: null,
    value: 0,
    sharedWith: [userId], // 🌈 add ADMIN ID to this one and also FOLLOWED (tasks won't show up to AdminPanda)
  });
  const defaultTasks = [urgentTask, householdTask, shoppingTask];
  for (let i = 0; i < defaultTasks.length; i++) {
    const { _id, category } = await defaultTasks[i].save();
    await updateTasklist(userId, status, _id, category);
  }
  return;
};
////////////////////////////////////////////////////////////////////
export const getTaskFilePath = (path) => {
  // return scaled, sharpened, gravity-based file path from cloudinary
  console.log("➡️getTaskFilePath");
  let filePath = path;
  const filePathSplit = filePath.split("/upload/", 2);
  filePath = `${TASK_RESIZE_IMG}/${filePathSplit[1]}`;
  return filePath;
};
////////////////////////////////////////////////////////////////////
export const createSharedWithArray = (array, id) => {
  // returns a non-duplicating array of user ids sharing single task
  console.log("➡️createSharedWithArray");
  let sharedWith;
  sharedWith = array?.length > 0 ? [...array, id] : [id];
  const noDuplicates = [...new Set(sharedWith)];
  return noDuplicates;
};
////////////////////////////////////////////////////////////////////
export const removeOwnId = async (array, id) => {
  // returns array of user ids with specified id removed
  const index = array.indexOf(id);
  array.splice(index, 1);
  return array;
};
////////////////////////////////////////////////////////////////////
export const pushToStatus = async (id, status, taskId) => {
  // push task id to tasklist status upon update status
  console.log("➡️pushToStatus");
  const updatedList = await TaskListModel.findOneAndUpdate(
    { user: id },
    { $push: { [status]: taskId } },
    { returnOriginal: false }
  );
  return updatedList;
};
////////////////////////////////////////////////////////////////////
export const pullFromStatus = async (id, status, taskId) => {
  // pull task id from task list status upon delete task
  console.log("➡️pullFromStatus");
  console.log(id, status, taskId);
  const updatedList = await TaskListModel.findOneAndUpdate(
    { user: id },
    { $pull: { [status]: taskId } },
    { returnOriginal: false }
  );
  return updatedList;
};
////////////////////////////////////////////////////////////////////
export const repeatTaskSave = async (body, user, sharedWith, repetitions) => {
  const { repeats, deadline } = body;
  // return x number of repeated tasks for a total of y repetitions
  console.log("➡️repeatTaskSave");
  const startDate = deadline ? new Date(deadline) : new Date();
  const s = 1000;
  const m = 60;
  const h = 60;
  const d = 24;
  let newDate;
  let newDateAsDate;
  console.log("REPEATS AT TASKSAVE", repeats);
  if (repeats === DAILY) {
    for (let i = 0; i < 365; i++) {
      newDate = (await startDate.getTime()) + i * d * h * m * s;
      newDateAsDate = new Date(newDate);
      const newTask = new TaskModel({
        createdBy: user,
        ...body,
        sharedWith,
      });
      newTask.deadline = newDateAsDate;
      const { _id } = await newTask.save();
      await pushToStatus(user, "awaited", _id);
      console.log(_id);
    }
  } else if (repeats === WEEKLY) {
    for (let i = 0; i < 52; i++) {
      newDate = (await startDate.getTime()) + i * 7 * d * h * m * s;
      newDateAsDate = new Date(newDate);
      const newTask = new TaskModel({
        createdBy: user,
        ...body,
        sharedWith,
      });
      newTask.deadline = newDateAsDate;
      const { _id } = await newTask.save();
      await pushToStatus(user, "awaited", _id);
      console.log(_id);
    }
  } else if (repeats === MONTHLY) {
    for (let i = 0; i < 12; i++) {
      newDate = (await startDate.getTime()) + i * 28 * d * h * m * s;
      newDateAsDate = new Date(newDate);
      const newTask = new TaskModel({
        createdBy: user,
        ...body,
        sharedWith,
      });
      newTask.deadline = newDateAsDate;
      const { _id } = await newTask.save();
      await pushToStatus(user, "awaited", _id);
      console.log(_id);
    }
  } else {
    for (let i = 0; i < repetitions; i++) {
      const number = Number(repeats.split(" ")[1]);
      newDate = (await startDate.getTime()) + i * number * d * h * m * s;
      newDateAsDate = new Date(newDate);
      console.log(newDate, newDateAsDate, number);
      const newTask = new TaskModel({
        createdBy: user,
        ...body,
        sharedWith,
      });
      newTask.deadline = newDateAsDate;
      const { _id } = await newTask.save();
      await pushToStatus(user, "awaited", _id);
      console.log(_id);
    }
  }
  return;
};
////////////////////////////////////////////////////////////////////
export const updateTaskStatus = async (
  id,
  taskId,
  prevStatus,
  currStatus,
  task
) => {
  // move task from previous to current status
  console.log("➡️updateTaskStatus");
  const updatedList = await TaskListModel.findOneAndUpdate(
    { user: id },
    {
      $push: { [currStatus]: task },
      $pull: { [prevStatus]: taskId },
    },
    { returnOriginal: false }
  );
  return updatedList;
};
////////////////////////////////////////////////////////////////////
export const updateListsAfterDelete = async (list, status, id) => {
  // remove from task list after delete
  console.log("➡️updateListsAfterDelete");
  for (let i = 0; i < list.length; i++) {
    await pullFromStatus(list[i], status, id);
  }
  return;
};
////////////////////////////////////////////////////////////////////
export const addXP = async (id, value) => {
  console.log("➡️addXP");
  const user = await UserModel.findById(id);
  const xp = user.xp + value;
  const total_xp = user.total_xp + value; // accumulate xp to user _id
  const updatedUser = await UserModel.findByIdAndUpdate(
    id,
    { xp, total_xp },
    { returnOriginal: false }
  );
  return updatedUser;
};
////////////////////////////////////////////////////////////////////
export const findTasksByCategory = async (tasks, category, user) => {
  // return array of task ids with selected category
  console.log("➡️findTasksByCategory");
  let array = [];
  tasks.map(
    (t) =>
      t.sharedWith.includes(user) &&
      t.category === category &&
      array.push(t._id)
  );
  return array;
};
////////////////////////////////////////////////////////////////////
export const findSharedUsers = async (id) => {
  // return all users who share a task (excl. creator)
  console.log("➡️findSharedUsers");
  const { createdBy, sharedWith } = await TaskModel.findById(id);
  const index = sharedWith.indexOf(createdBy);
  sharedWith.splice(index, 1);
  return sharedWith;
};
////////////////////////////////////////////////////////////////////
export const findTasklist = async (id) => {
  // return tasklist belonging to user _id
  console.log("➡️findTasklist");
  const tasklist = await TaskListModel.findOne({ user: id });
  return tasklist;
};
////////////////////////////////////////////////////////////////////
export const pushCategory = async (id, category) => {
  // push new category to tasklist belonging to user _id
  console.log("➡️pushCategory");
  const filter = { user: id };
  const update = { $push: { categories: category.toLowerCase() } };
  const { categories } = await TaskListModel.findOne(filter);
  const categoryIncluded = categories.includes(category);
  if (!categoryIncluded) {
    await TaskListModel.findOneAndUpdate(filter, update, {
      returnOriginal: false,
    });
  }
  return { category };
};
////////////////////////////////////////////////////////////////////
export const pullCategory = async (id, category) => {
  // pull category from tasklist belonging to user _id
  console.log("➡️pullCategory");
  const filter = { user: id };
  const update = { $pull: { categories: category } };
  const { categories } = await TaskListModel.findOne(filter);
  const categoryIncluded = categories.includes(category);
  if (categoryIncluded) {
    const categoryPulled = await TaskListModel.findOneAndUpdate(
      filter,
      update,
      {
        returnOriginal: false,
      }
    );
    return categoryPulled;
  } else {
    return null;
  }
};
////////////////////////////////////////////////////////////////////
export const updateTasklist = async (id, status, task, category) => {
  // push task category and id to relevant status upon create task
  console.log("➡️updateTasklist");
  await pushCategory(id, category);
  const updatedList = await pushToStatus(id, status, task._id);
  return updatedList;
};
////////////////////////////////////////////////////////////////////
export const updateTasklistCategory = async (id, categories) => {
  // change category in "tasklist.categories" prior to bulk edit (single user)
  console.log("➡️updateTasklistCategory");
  const filter = { user: id };
  const update = { categories };
  const categoryUpdated = await TaskListModel.findOneAndUpdate(filter, update, {
    returnOriginal: false,
  });
  return categoryUpdated;
};
////////////////////////////////////////////////////////////////////
export const updateCategory = async (array, method, category) => {
  // change category on all tasks in an array && add category to all shared users' tasklists if not already present
  console.log("➡️updateCategory");
  for (let i = 0; i < array.length; i++) {
    const id = array[i];
    const update =
      method === UPDATE
        ? { category: category.toLowerCase() }
        : method === DELETE
        ? { category: NONE }
        : {};
    await TaskModel.findByIdAndUpdate(id, update, {
      returnOriginal: false,
    });
    const sharedUsers = await findSharedUsers(id);
    if (sharedUsers.length > 0) {
      for (let i = 0; i < sharedUsers.length; i++) {
        const { categories } = await findTasklist(sharedUsers[i]);
        if (!categories.includes(category)) {
          await pushCategory(sharedUsers[i], category);
        }
      }
    }
  }
  return;
};
////////////////////////////////////////////////////////////////////
export const editTaskCategoryBulk = async (
  tasks,
  originalCategory,
  method,
  id,
  updatedCategory
) => {
  // finds array of tasks matched to category and user, and changes category to all shared users' tasklists
  console.log("➡️editTaskCategoryBulk");
  const array = await findTasksByCategory(tasks, originalCategory, id);
  console.log(array);
  await updateCategory(array, method, updatedCategory);
  return array;
};
export const removeTaskFromTaskList = async (taskId, taskListId, status) => {
  const updatedList = await TaskListModel.findOneAndUpdate(
    { _id: taskListId },
    { $pull: { [status]: taskId } },
    { returnOriginal: false }
  );
  return updatedList;
};
