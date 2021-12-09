import express from "express";
import AchievementModel from "./model.js";
import { JWT_MIDDLEWARE } from "../../auth/jwt.js";

const AchievementRoute = express.Router();

AchievementRoute.post("/me", JWT_MIDDLEWARE, async (req, res, next) => {
  try {
    console.log("💠 POST ACHIEVEMENT [ME]");
    const { username } = req.user;
    const { _id } = await AchievementModel.findOne({
      user: req.user._id,
    });
    if (_id) {
      const createdAt = new Date();
      const item = { username, item: req.body.item, category: req.body.category, createdAt };
      console.log(item);
      const updateAchievements = await AchievementModel.findByIdAndUpdate(
        _id,
        {
          $push: { list: item },
        },
        { new: true, runValidators: true }
      );
      await updateAchievements.save();
      console.log("NEW ACHIEVEMENT SUCCESSFULLY CREATED");
      res.status(201).send(item);
    }
  } catch (e) {
    next(e);
  }
})
  .get("/me", JWT_MIDDLEWARE, async (req, res, next) => {
    try {
      console.log("💠 GET ACHIEVEMENTS");
      const achievements = await AchievementModel.findOne({
        user: req.user._id,
      });
      console.log("FETCHED ACHIEVEMENTS [ME]");
      res.status(200).send(achievements);
    } catch (e) {
      next(e);
    }
  })
  .get("/:a_id", JWT_MIDDLEWARE, async (req, res, next) => {
    try {
      console.log("💠 GET ACHIEVEMENT BY ID [ME]");
      const { a_id } = req.params;
      const { list } = await AchievementModel.findOne({
        user: req.user._id,
      });
      const achievement = list.find((ach) => ach._id.toString() === a_id);
      if (!achievement) {
        res.status(404).send(`Achievement with id ${a_id} not found`);
      } else {
        console.log(`FETCHED ACHIEVEMENT BY ID`);
        res.status(200).send(achievement);
      }
    } catch (e) {
      next(e);
    }
  });

export default AchievementRoute;
