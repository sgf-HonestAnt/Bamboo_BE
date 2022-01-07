import express from "express";
import TokenModel from "./model.js";

const TokenRoute = express.Router();

TokenRoute.get("/:token", async (req, res, next) => {
  console.log("💠 GET TOKEN");
  const token = req.params.token;
  const foundToken = await TokenModel.findOne({ token });
  res.send({ TOKEN_USED: foundToken ? true : false }); // tokenIsUsed: boolean
});
TokenRoute.post("/:token", async (req, res, next) => {
  console.log("💠 POST TOKEN");
  const token = req.params.token;
  const newToken = new TokenModel({ token });
  await newToken.save();
  res.send(newToken);
});

export default TokenRoute;
