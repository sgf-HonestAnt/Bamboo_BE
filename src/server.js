import express from "express";
import cors from "cors";
import achievementRoute from "./routes/achievements.js";
import featureRoute from "./routes/app-features.js";
import challengeRoute from "./routes/challenges.js";
import taskRoute from "./routes/tasks.js";
import userRoute from "./routes/users.js";

const server = express();

//passport.use("google", GoogleStrategy)

server.use(cors());

server.use(express.json());

// server.use(passport.initialize())

server.get("/test", (req, res) => {
  res.status(200).send({ message: "Test success" });
}); 

server.use("/achievements", achievementRoute);

server.use("/features", featureRoute);

server.use("/challenges", challengeRoute);

server.use("/tasks", taskRoute);

server.use("/users", userRoute);

// server.use(err400)

// server.use(err401)

// server.use(err403)

// server.use(err404)

// server.use(err500)

export default server;
