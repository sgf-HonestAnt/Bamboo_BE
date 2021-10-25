import express from "express";

const challengeRoute = express.Router();

const route = " challenges";

challengeRoute.get("/", async (req, res, next) => {
  console.log("GET", route);
});
challengeRoute.put("/", async (req, res, next) => {
  console.log("PUT", route);
});
challengeRoute.post("/", async (req, res, next) => {
  console.log("POST", route);
});
challengeRoute.delete("/", async (req, res, next) => {
  console.log("DELETE", route);
});

export default challengeRoute;