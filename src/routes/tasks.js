import express from "express";

const taskRoute = express.Router();

const route = " tasks";

taskRoute.get("/", async (req, res, next) => {
  console.log("GET", route);
});
taskRoute.put("/", async (req, res, next) => {
  console.log("PUT", route);
});
taskRoute.post("/", async (req, res, next) => {
  console.log("POST", route);
});
taskRoute.delete("/", async (req, res, next) => {
  console.log("DELETE", route);
});

export default taskRoute;