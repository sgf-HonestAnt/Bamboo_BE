import express from "express";
import mongoose from "mongoose";
import AchievementModel from "./model.js";
import q2m from "query-to-mongo";
// import generator from "../../utils/generator.js";
// import shuffle from "../../utils/shuffle.js";
import { JWT_MIDDLEWARE } from "../../auth/jwt.js";

const AchievementRoute = express.Router();

const route = "achievements";

AchievementRoute.post("/", JWT_MIDDLEWARE, async (req, res, next) => {
  console.log("POST", route);
  try {
    const newAchievement = new AchievementModel(req.body);
    const { _id } = await newAchievement.save();
    res.status(201).send({ _id });
  } catch (e) {
    next(e);
  }
})
  .get("/", async (req, res, next) => {
    console.log("GET", route);
    try {
    } catch (e) {
      next(e);
    }
  })
  .put("/", async (req, res, next) => {
    console.log("PUT", route);
    try {
    } catch (e) {
      next(e);
    }
  })
  .delete("/", async (req, res, next) => {
    console.log("DELETE", route);
    try {
    } catch (e) {
      next(e);
    }
  });

export default AchievementRoute;
