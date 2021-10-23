import express from "express";
import cors from "cors";
import listEndpoints from "express-list-endpoints/index.js";
import achievementRoute from "./services/achievements/index.js";
import featureRoute from "./services/app-features/index.js";
import challengeRoute from "./services/challenges/index.js";
import taskRoute from "./services/tasks/index.js";
import userRoute from "./services/users/index.js";

const { PORT } = process.env;

server.use(express);

server.use(cors());

server.use(express.json());

server.use("/achievements", achievementRoute);
server.use("/features", featureRoute);
server.use("/challenges", challengeRoute);
server.use("/tasks", taskRoute);
server.use("/users", userRoute);

server.listen(PORT, () => {
  console.table(listEndpoints(server));
  console.log("✅ Server is running on port  : ", PORT);
});

server.on("error", (error) =>
  console.log("❌ Server is not running due to :", error)
);
