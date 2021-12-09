import express from "express";
import cors from "cors";
import UserRoute from "./cake/routes/users/index.js";
import FeatureRoute from "./cake/routes/app-features/index.js";
import TaskRoute from "./cake/routes/tasks/index.js";
import CategoriesRoute from "./cake/routes/categories/index.js";
import AchievementRoute from "./cake/routes/achievements/index.js";
import ChallengeRoute from "./cake/routes/challenges/index.js";
import TokenRoute from "./cake/routes/tokens/index.js";
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
server.use("/cake/users", UserRoute);
server.use("/cake/features", FeatureRoute);
server.use("/cake/tasks", TaskRoute);
server.use("/cake/categories", CategoriesRoute);
server.use("/cake/achievements", AchievementRoute);
server.use("/cake/challenges", ChallengeRoute);
server.use("/cake/guard", TokenRoute);

// OTHER APP ROUTES

// UNIVERSAL ERROR HANDLERS
server.use(err400);
server.use(err401);
server.use(err403);
server.use(err404);
server.use(err500);

export default server;
