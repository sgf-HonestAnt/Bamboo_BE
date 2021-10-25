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

const userRoute = express.Router();

const route = " users";

userRoute.post("/", async (req, res, next) => {
  console.log("POST", route);
  try {
    const newUser = new UserModel(req.body);
    const { _id } = await newUser.save();
    res.status(201).send({ _id });
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
