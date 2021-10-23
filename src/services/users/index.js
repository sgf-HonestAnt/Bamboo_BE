import express from "express";

const userRoute = express.Router();

const route = "achievements";

userRoute.get("/", async (req, res, next) => {
  console.log("GET", route);
});
userRoute.put("/", async (req, res, next) => {
  console.log("PUT", route);
});
userRoute.post("/", async (req, res, next) => {
  console.log("POST", route);
});
userRoute.delete("/", async (req, res, next) => {
  console.log("DELETE", route);
});

export default userRoute;
