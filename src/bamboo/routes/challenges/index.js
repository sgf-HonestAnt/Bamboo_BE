import express from "express";
// import ChallengeModel from "./model.js";
import q2m from "query-to-mongo";
import createHttpError from "http-errors";
import multer from "multer";
import { JWT_MIDDLEWARE, ADMIN_MIDDLEWARE } from "../../auth/jwt.js";
import { storage } from "../../utils/constants.js";

const ChallengeRoute = express.Router();

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
