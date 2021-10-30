import express from "express";
import mongoose from "mongoose";
import FeatureModel from "./model.js";
import q2m from "query-to-mongo";
import createHttpError from "http-errors";
import multer from "multer";
// import generator from "../../utils/generator.js";
// import shuffle from "../../utils/shuffle.js";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { JWT_MIDDLEWARE, ADMIN_MIDDLEWARE } from "../../auth/jwt.js";

const FeatureRoute = express.Router();

const route = " app-features";

FeatureRoute.post("/", ADMIN_MIDDLEWARE, async (req, res, next) => {
  console.log("◻️POST", route);
  try {
    const newFeature = new FeatureModel(req.body);
    const { _id } = await newFeature.save();
    res.status(201).send({ _id });
  } catch (e) {
    next(e);
  }
});

FeatureRoute.get("/", async (req, res, next) => {
  console.log("◻️GET", route);
  try {
    const query = q2m(req.query);
    const { total, features } = await FeatureModel.findFeatures(query);
    res.send({
      links: query.links("/features", total),
      total,
      features,
      pageTotal: Math.ceil(total / query.options.limit),
    });
  } catch (e) {
    next(e);
  }
});
FeatureRoute.put("/:_id", ADMIN_MIDDLEWARE, async (req, res, next) => {
  console.log("◻️PUT", route);
  try {
    const { _id } = req.params;
    const update = { ...req.body };
    const filter = { _id };
    const updatedFeature = await FeatureModel.findOneAndUpdate(filter, update, {
      returnOriginal: false,
    });
    await updatedFeature.save();
    if (updatedFeature) {
      res.status(200).send(updatedFeature);
    } else {
      next(createHttpError(404, `💀FEATURE ID_${_id} NOT FOUND`));
    }
  } catch (e) {
    next(e);
  }
});
FeatureRoute.delete("/:_id", ADMIN_MIDDLEWARE, async (req, res, next) => {
  console.log("◻️DELETE", route);
  try {
    const { _id } = req.params;
    const deletedFeature = await FeatureModel.findByIdAndDelete(_id);
    if (deletedFeature) {
      res.status(204).send();
    } else {
      next(createHttpError(404, `💀FEATURE ID_${_id} NOT FOUND`));
    }
  } catch (e) {
    next(e);
  }
});

export default FeatureRoute;
