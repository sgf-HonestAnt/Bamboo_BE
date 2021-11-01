import express from "express";
import mongoose from "mongoose";
import AchievementModel from "./model.js";
import { JWT_MIDDLEWARE } from "../../auth/jwt.js";

const AchievementRoute = express.Router();

const route = "achievements";

AchievementRoute.post("/me", JWT_MIDDLEWARE, async (req, res, next) => {
  console.log(`🔹POST ${route} (single achievement)`);
  try {
    const { _id } = await AchievementModel.findOne({ user: req.user._id });
    if (_id) {
      const dateTime = new Date();
      const item = { item: req.body.item, createdAt: dateTime };
      const updateAchievements = await AchievementModel.findByIdAndUpdate(
        _id,
        {
          $push: { list: item },
        },
        { new: true, runValidators: true }
      );
      await updateAchievements.save();
      res.status(201).send(item);
    }
  } catch (e) {
    next(e);
  }
})
  .get("/me", JWT_MIDDLEWARE, async (req, res, next) => {
    console.log(`🔹GET ${route} (all achievements)`);
    try {
      const achievements = await AchievementModel.findOne({
        user: req.user._id,
      }); //.populate("user"); // ❗ CHANGE TO POPULATE ONLY USERNAME
      res.status(200).send(achievements);
    } catch (e) {
      next(e);
    }
  })
  .get("/:a_id", JWT_MIDDLEWARE, async (req, res, next) => {
    console.log(`🔹GET ${route} (single achievement)`);
    try {
      const { a_id } = req.params;
      const { list } = await AchievementModel.findOne({
        user: req.user._id,
      });
      const achievement = list.find((ach) => ach._id.toString() === a_id);
      if (!achievement) {
        res.status(404).send(`Achievement with id ${a_id} not found`);
      } else {
        res.status(200).send(achievement);
      }
    } catch (e) {
      next(e);
    }
  })
// ARE THERE ANY CIRCUMSTANCES WHERE THESE WILL BE NECESSARY?
// .put("/", async (req, res, next) => {
//   console.log("PUT", route);
//   try {
//   } catch (e) {
//     next(e);
//   }
// })
// .delete("/", async (req, res, next) => {
//   console.log("DELETE", route);
//   try {
//   } catch (e) {
//     next(e);
//   }
// });

export default AchievementRoute;
