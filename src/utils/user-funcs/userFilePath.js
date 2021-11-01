import { USER_CROP_IMG } from "../constants.js";

export const getCroppedFilePath = (path) => {
  let filePath = path;
  const filePathSplit = filePath.split("/upload/", 2);
  filePath = `${USER_CROP_IMG}/${filePathSplit[1]}`;
  return filePath;
};
