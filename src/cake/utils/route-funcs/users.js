import UserModel from "../../routes/users/model.js";
import { USER_CROP_IMG } from "../constants.js";
import { ADJECTIVES, NOUNS } from "../wordsArray.js";
////////////////////////////////////////////////////////////////////
export const generator = async () => {
  // generate username from random nouns and adjectives
  const nounsArray = NOUNS;
  const adjectivesArray = ADJECTIVES;
  const noun = nounsArray[Math.floor(Math.random() * nounsArray.length)];
  const adjective =
    adjectivesArray[Math.floor(Math.random() * adjectivesArray.length)];
  const number = Math.floor(Math.random() * 100);
  const adjNounNum = adjective + noun + number;
  const username = adjNounNum.replace(" ", "");
  return username;
};
////////////////////////////////////////////////////////////////////
// generate a unique username using generator
export const nameGenerator = async (username) => {
  let altNames = [];
  for (let i = 0; i < 5; i++) {
    const generatedName = await generator();
    const nameDoesNotExist =
      (await UserModel.findOne({ username: generatedName })) === null;
    if (nameDoesNotExist) {
      altNames.push(generatedName);
    }
  }
  return altNames;
};
////////////////////////////////////////////////////////////////////
// move user _id between awaited, accepted and rejected
export const shuffle = async (
  ID,
  _id,
  user,
  addToList,
  removeFromList = null
) => {
  let { followedUsers } = user;
  // add to list
  if (addToList) {
    addToList === "response_awaited"
      ? await followedUsers.response_awaited.push(ID.toString())
      : addToList === "requested"
      ? await followedUsers.requested.push(ID.toString())
      : addToList === "accepted"
      ? await followedUsers.accepted.push(ID)
      : await followedUsers.rejected.push(ID.toString());
  }
  if (removeFromList) {
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
      : (list = await followedUsers.rejected.filter(
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
////////////////////////////////////////////////////////////////////
// return a list of users without private information (admin and own user can still access private info)
export const getPublicUsers = async (users, array) => {
  for (let i = 0; i < users.length; i++) {
    const user = await UserModel.findById(users[i]._id).populate(
      "achievements tasks"
    );
    array.push({
      _id: user._id,
      username: user.username,
      avatar: user.avatar,
      bio: user.bio,
      level: user.level,
      xp: user.xp,
      total_xp: user.total_xp,
      total_completed: user.total_completed,
      total_awaited: user.tasks.awaited.length,
      total_in_progress: user.tasks.in_progress.length,
      achievements: user.achievements.list,
    });
  }
  return array;
};
////////////////////////////////////////////////////////////////////
export const getUserFilePath = (path) => {
  // return scaled, sharpened, gravity-based file path from cloudinary
  let filePath = path;
  const filePathSplit = filePath.split("/upload/", 2);
  filePath = `${USER_CROP_IMG}/${filePathSplit[1]}`;
  return filePath;
};
////////////////////////////////////////////////////////////////////
export const pushNotification = async (id, notification) => {
  // push notification to user _id
  console.log("➡️pushNotification");
  const update = { $push: { notification: notification } };
  await UserModel.findByIdAndUpdate(id, update, {
    returnOriginal: false,
  });
  return;
};
