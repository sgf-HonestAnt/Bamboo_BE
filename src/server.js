import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import listEndpoints from "express-list-endpoints";
import achievementRoute from "./routes/achievements.js";
import featureRoute from "./routes/app-features.js";
import challengeRoute from "./routes/challenges.js";
import taskRoute from "./routes/tasks.js";
import userRoute from "./routes/users.js";

const server = express();

const { PORT, MONGO_CONNECTION } = process.env;

// passport.use("google", GoogleStrategy)

server.use(cors());

server.use(express.json());

// server.use(passport.initialize())

// server.get("/test", (req, res) => {
//   res.status(200).send({ message: "Test success" });
// });

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

mongoose.connect(MONGO_CONNECTION)

mongoose.connection.on("connected", () => { 
    console.table(listEndpoints(server))
    console.log("🔸 Mongo Connected!")
    server.listen(PORT, () => {
        console.log(`🔹 Server running @ port ${PORT}`)
    })
    server.on("error", (error) =>
      console.log("❌ Server not running due to :", error)
    );
}) 


