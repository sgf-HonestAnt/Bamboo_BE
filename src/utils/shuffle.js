import UserModel from "../routes/users/model.js";

const shuffle = async (ID, _id, user, addToList, removeFromList = null) => {
  let { followedUsers } = user;
  console.log("🔸add ID To List", addToList);
  // add to list
  if (addToList) {
    addToList === "response_awaited"
      ? await followedUsers.response_awaited.push(ID.toString())
      : addToList === "requested"
      ? await followedUsers.requested.push(ID.toString())
      : addToList === "accepted"
      ? await followedUsers.accepted.push(ID)
      : // if all else fails, followedUsers must be "rejected"
        await followedUsers.rejected.push(ID.toString());
  }
  // optionally, remove from second list
  if (removeFromList) {
    console.log("🔸remove ID From List", removeFromList);
    let list;
    removeFromList === "response_awaited"
      ? (list = await followedUsers.response_awaited.filter(
          (el) => el.toString() !== ID.toString()
        ))
      : removeFromList === "requested"
      ? (list = await followedUsers.requested.filter(
          (el) => el !== ID.toString()
        ))
      : removeFromList === "accepted"
      ? (list = await followedUsers.accepted.filter((el) => el !== ID))
      : // if all else fails, followedUsers must be "rejected"
        (list = await followedUsers.rejected.filter(
          (el) => el !== ID.toString()
        ));
    followedUsers = { ...followedUsers, [removeFromList]: list };
  }
  const update = {
    followedUsers,
  };
  const filter = { _id };
  const updatedUser = await UserModel.findOneAndUpdate(filter, update, {
    returnOriginal: false,
  });
  await updatedUser.save();
  return updatedUser;
};

export default shuffle;
