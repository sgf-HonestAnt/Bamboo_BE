import express from "express";

const achievementRoute = express.Router();

const route = " achievements";

achievementRoute.get("/", async (req, res, next) => {
  console.log("GET", route);
});
achievementRoute.put("/", async (req, res, next) => {
  console.log("PUT", route);
});
achievementRoute.post("/", async (req, res, next) => {
  console.log("POST", route);
});
achievementRoute.delete("/", async (req, res, next) => {
  console.log("DELETE", route);
});

export default achievementRoute;