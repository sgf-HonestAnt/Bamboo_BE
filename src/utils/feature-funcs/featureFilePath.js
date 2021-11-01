import { FEATURE_RESIZE_IMG } from "../constants.js";

export const getResizedFilePath = (path) => {
  let filePath = path;
  const filePathSplit = filePath.split("/upload/", 2);
  filePath = `${FEATURE_RESIZE_IMG}/${filePathSplit[1]}`;
  return filePath;
};