import express from "express";
import cors from "cors";
import AchievementRoute from "./routes/achievements/index.js";
import FeatureRoute from "./routes/app-features/index.js";
import ChallengeRoute from "./routes/challenges/index.js";
import TaskRoute from "./routes/tasks/index.js";
import CategoriesRoute from "./routes/categories/index.js";
import UserRoute from "./routes/users/index.js";
import {
  err400,
  err401,
  err403,
  err404,
  err500,
} from "./middlewares/errorHandlers.js";

const server = express();

//passport.use("google", GoogleStrategy)

server.use(cors());

server.use(express.json());

// server.use(passport.initialize())

server.get("/test", (req, res) => {
  res.status(200).send({ message: "Test success" });
});

server.use("/users", UserRoute);

server.use("/features", FeatureRoute);

server.use("/tasks", TaskRoute);

server.use("/categories", CategoriesRoute);

server.use("/achievements", AchievementRoute);

server.use("/challenges", ChallengeRoute);

server.use(err400);

server.use(err401);

server.use(err403);

server.use(err404);

server.use(err500);

export default server;
