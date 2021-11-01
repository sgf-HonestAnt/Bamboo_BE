import UserModel from "../../routes/users/model.js";
import { USER_CROP_IMG } from "../constants.js";
import { ADJECTIVES, NOUNS } from "../wordsArray.js";

export const generator = async () => {
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

export const shuffle = async (ID, _id, user, addToList, removeFromList = null) => {
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
      : await followedUsers.rejected.push(ID.toString());
  }
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

export const getPublicUsers = async (users, array) => {
  for (let i = 0; i < users.length; i++) {
    const user = await UserModel.findById(users[i]._id).populate(
      "achievements"
    );
    array.push({
      _id: user._id,
      username: user.username,
      avatar: user.avatar,
      bio: user.bio,
      level: user.level,
      xp: user.xp,
      achievements: user.achievements.list,
    });
    return;
  }
};

export const getUserFilePath = (path) => {
  let filePath = path;
  const filePathSplit = filePath.split("/upload/", 2);
  filePath = `${USER_CROP_IMG}/${filePathSplit[1]}`;
  return filePath;
};