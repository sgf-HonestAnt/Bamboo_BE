// import mongoose from "mongoose";
import TaskListModel from "../routes/tasks/model.js";

export const createSharedArray = (array, _id) => {
  let sharedWith;
  sharedWith = array ? array : [_id];
  sharedWith.push(_id);
  const noDuplicateIds = [...new Set(sharedWith)];
  sharedWith = noDuplicateIds;
  return sharedWith;
};

export const updateTaskList = async (_id, status, task) => {
  const updatedList = await TaskListModel.findOneAndUpdate(
    { user: _id },
    { $push: { [status]: task } },
    { new: true, runValidators: true }
  );
  await updatedList.save();
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
  await updatedList.save();
  return updatedList;
};
