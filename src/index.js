import server from "./server.js";
import mongoose from "mongoose";
import listEndpoints from "express-list-endpoints";

const port = process.env.PORT || 3333;
const mongoConnection = process.env.MONGO_CONNECTION;

mongoose
  .connect(mongoConnection, {
    useNewUrlParser: true,
  })
  .then(() => {
    console.table(listEndpoints(server));
    console.log("🔸 Mongo Connected!");
    server.listen(port, () => {
      console.log(`🔹 Server running @ port ${port}`);
    });
    server.on("error", (error) =>
      console.log("❌ Server not running due to :", error)
    );
  });