const searchTasks = (ID, awaited, completed, in_progress) => {
  // i am going to need to search through all tasks - completed, awaited and in_progress and see if there is a match
  const check1 = {
    found_task: awaited.filter((t) => t._id.toString() === ID),
    list_type: "awaited",
    index: awaited.findIndex((t) => t._id.toString() === ID)
  };
  const check2 = {
    found_task: completed.filter((t) => t._id.toString() === ID),
    list_type: "completed",
    index: completed.findIndex((t) => t._id.toString() === ID)
  };
  const check3 = {
    found_task: in_progress.filter((t) => t._id.toString() === ID),
    list_type: "in_progress",
    index: in_progress.findIndex((t) => t._id.toString() === ID)
  };
  return check1.found_task.length > 0
    ? check1
    : check2.found_task.length > 0
    ? check2
    : check3.found_task.length > 0
    ? check3
    : null;
};

export default searchTasks;
