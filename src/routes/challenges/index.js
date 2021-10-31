import express from "express";
import mongoose from "mongoose";
// import ChallengeModel from "./model.js";
import q2m from "query-to-mongo";
import createHttpError from "http-errors";
import multer from "multer";
// import generator from "../../utils/generator.js";
// import shuffle from "../../utils/shuffle.js";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { JWT_MIDDLEWARE, ADMIN_MIDDLEWARE } from "../../auth/jwt.js";

const ChallengeRoute = express.Router();

const route = " challenges";

ChallengeRoute.get("/", async (req, res, next) => {
  console.log("GET", route);
});
ChallengeRoute.put("/", async (req, res, next) => {
  console.log("PUT", route);
});
ChallengeRoute.post("/", async (req, res, next) => {
  console.log("POST", route);
});
ChallengeRoute.delete("/", async (req, res, next) => {
  console.log("DELETE", route);
});

export default ChallengeRoute;
