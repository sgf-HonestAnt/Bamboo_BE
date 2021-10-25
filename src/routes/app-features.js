import express from "express";

const featureRoute = express.Router();

const route = " app-features";

featureRoute.get("/", async (req, res, next) => {
  console.log("GET", route);
});
featureRoute.put("/", async (req, res, next) => {
  console.log("PUT", route);
});
featureRoute.post("/", async (req, res, next) => {
  console.log("POST", route);
});
featureRoute.delete("/", async (req, res, next) => {
  console.log("DELETE", route);
});

export default featureRoute;