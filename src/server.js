import express from "express";
import cors from "cors";
import UserRoute from "./bamboo/routes/users/index.js";
import FeatureRoute from "./bamboo/routes/app-features/index.js";
import TaskRoute from "./bamboo/routes/tasks/index.js";
import CategoriesRoute from "./bamboo/routes/categories/index.js";
import AchievementRoute from "./bamboo/routes/achievements/index.js";
import ChallengeRoute from "./bamboo/routes/challenges/index.js";
import TokenRoute from "./bamboo/routes/tokens/index.js";
import {
  err400,
  err401,
  err403,
  err404,
  err500,
} from "./universal/errorHandlers.js";

const server = express();

//passport.use("google", GoogleStrategy)

// cors whitelist will go here

server.use(cors());

server.use(express.json());

// server.use(passport.initialize())

// TESTS
server.get("/test", (req, res) => {
  res.status(200).send({ message: "Test success" });
});

// CAKE TASK APP ROUTES
server.use("/bamboo/users", UserRoute);
server.use("/bamboo/features", FeatureRoute);
server.use("/bamboo/tasks", TaskRoute);
server.use("/bamboo/categories", CategoriesRoute);
server.use("/bamboo/achievements", AchievementRoute);
server.use("/bamboo/challenges", ChallengeRoute);
server.use("/bamboo/guard", TokenRoute);

// OTHER APP ROUTES

// UNIVERSAL ERROR HANDLERS
server.use(err400);
server.use(err401);
server.use(err403);
server.use(err404);
server.use(err500);

export default server;
