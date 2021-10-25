import express from "express";
import createHttpError from "http-errors";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import UserModel from "../schemas/users.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: { folder: "capstone_users" },
});

const findAltUsername = async (username) => {
  const users = await UserModel.find({});
  const usernames = users.map((u) => u.username);
  const numbers = [...Array(1000).keys()];
  const usernameNum = numbers.map((n) => `username${n}`);
  // repeat until three suggestions, checking each suggestion does not already exist in usernames
  // let array = []
  // for(let....)
  // if unique push array
  // return array
  const randomNumber = Math.floor(Math.random() * 1000);
  const altUsername = usernameNum[randomNumber];
  const nameUnique = usernames.findIndex((u) => u === altUsername) === -1;
  if (nameUnique) {
    console.log(altUsername)
    return altUsername;
  }
  // repeat until three suggestions, checking each suggestion does not already exist in usernames
};

const userRoute = express.Router();

const route = "users";

userRoute.post("/", async (req, res, next) => {
  console.log("POST", route);
  try {
    const { email, username } = req.body;
    const emailDuplicate = await UserModel.findOne({ email });
    const usernameDuplicate = await UserModel.findOne({ username });
    if (emailDuplicate) {
      res.status(409).send({ error: `Email Exists` });
    } else if (usernameDuplicate) {
      const available = await findAltUsername(username);
      res.status(409).send({ error: `Username Exists`, available });
    } else {
      const newUser = new UserModel(req.body);
      const { _id } = await newUser.save();
      res.status(201).send({ _id });
    }
  } catch (e) {
    next(e);
  }
});
userRoute.get("/", async (req, res, next) => {
  console.log("GET", route);
  try {
    const users = await UserModel.find({});
    res.send(users);
  } catch (e) {
    next(e);
  }
});
userRoute.get("/:u_id", async (req, res, next) => {
  console.log("GET SINGLE", route);
  try {
    const { u_id } = req.params;
    const users = await UserModel.find({ _id: u_id });
    res.send(users);
  } catch (e) {
    next(e);
  }
});
userRoute.put("/:u_id", async (req, res, next) => {
  console.log("PUT", route);
  try {
    const { u_id } = req.params;
    const editedUser = await UserModel.findByIdAndUpdate(u_id, req.body, {
      new: true,
    });
    if (editedUser) {
      res.send(editedUser);
    } else {
      next(createHttpError(404, `💀USER ID_${u_id} NOT FOUND`));
    }
  } catch (e) {
    next(e);
  }
});
userRoute.delete("/:u_id", async (req, res, next) => {
  console.log("DELETE", route);
  try {
    const { u_id } = req.params;
    const deletedUser = await UserModel.findByIdAndDelete(u_id);
    if (deletedUser) {
      res.status(204).send();
    } else {
      next(createHttpError(404, `💀USER ID_${u_id} NOT FOUND`));
    }
  } catch (e) {
    next(e);
  }
});

export default userRoute;
