import express from "express";
import mongoose from "mongoose";
import AchievementModel from "./model.js";
import q2m from "query-to-mongo";
// import generator from "../../utils/generator.js";
// import shuffle from "../../utils/shuffle.js";
import { JWT_MIDDLEWARE } from "../../auth/jwt.js";

const AchievementRoute = express.Router();

const route = "achievements";

AchievementRoute.post("/me", JWT_MIDDLEWARE, async (req, res, next) => {
  console.log("POST", route);
  try {
    const { _id } = await AchievementModel.findOne({ user: req.user._id });
    if (_id) {
      const item = { item: req.body.item };
      const updateAchievements = await AchievementModel.findByIdAndUpdate(
        _id,
        {
          $push: { list: item },
        },
        { new: true, runValidators: true }
      );
      await updateAchievements.save();
      res.status(201).send(updateAchievements);
    } 
  } catch (e) {
    next(e);
  }
})
  .get("/me", JWT_MIDDLEWARE, async (req, res, next) => {
    console.log("GET", route);
    try {
      const achievements = await AchievementModel.findOne({
        user: req.user._id,
      }).populate("user"); // CHANGE TO POPULATE ONLY USERNAME
      res.status(200).send(achievements);
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
