import express from "express";
import mongoose from "mongoose";
// import AchievementModel from "./model.js";
import q2m from "query-to-mongo";
import createHttpError from "http-errors";
import multer from "multer";
// import generator from "../../utils/generator.js";
// import shuffle from "../../utils/shuffle.js";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { JWT_MIDDLEWARE, ADMIN_MIDDLEWARE } from "../../auth/jwt.js";

const AchievementRoute = express.Router();

const route = " achievements";

AchievementRoute.get("/", async (req, res, next) => {
  console.log("GET", route);
});
AchievementRoute.put("/", async (req, res, next) => {
  console.log("PUT", route);
});
AchievementRoute.post("/", async (req, res, next) => {
  console.log("POST", route);
});
AchievementRoute.delete("/", async (req, res, next) => {
  console.log("DELETE", route);
});

export default AchievementRoute;
