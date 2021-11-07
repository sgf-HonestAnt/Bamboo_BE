import TaskListModel from "../../routes/tasks/model.js";
import UserModel from "../../routes/users/model.js";
import { TASK_RESIZE_IMG } from "../constants.js";

export const getTaskFilePath = (path) => {
  let filePath = path;
  const filePathSplit = filePath.split("/upload/", 2);
  filePath = `${TASK_RESIZE_IMG}/${filePathSplit[1]}`;
  return filePath;
};

export const createSharedArray = (array, _id) => {
  let sharedWith;
  sharedWith = array ? array : [_id];
  sharedWith.push(_id);
  const noDuplicateIds = [...new Set(sharedWith)];
  sharedWith = noDuplicateIds;
  return sharedWith;
};

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

export const addXP = async (_id, taskValue) => {
  const user = await UserModel.findById(_id);
  const xp = user.xp + taskValue;
  const updatedUser = await UserModel.findByIdAndUpdate(
    _id,
    { xp },
    { new: true, runValidators: true }
  );
  return updatedUser;
};
