import express from "express";
import FeatureModel from "./model.js";
import q2m from "query-to-mongo";
import multer from "multer";
import { ADMIN_MIDDLEWARE } from "../../auth/jwt.js";
import { storage } from "../../utils/constants.js";
import { getFeatureFilePath } from "../../utils/route-funcs/features.js";

const FeatureRoute = express.Router();

FeatureRoute.post(
  "/",
  ADMIN_MIDDLEWARE,
  multer({ storage }).single("image"),
  async (req, res, next) => {
    try {
      const newFeature = new FeatureModel(req.body);
      if (req.file) {
        const filePath = await getFeatureFilePath(req.file.path);
        newFeature.image = filePath;
      }
      const { _id } = await newFeature.save();
      console.log("NEW FEATURE SUCCESSFULLY CREATED");
      res.status(201).send({ _id });
    } catch (e) {
      next(e);
    }
  }
)
  .get("/", async (req, res, next) => {
    try {
      const query = q2m(req.query);
      const { total, features } = await FeatureModel.findFeatures(query);
      console.log("FETCHED FEATURES");
      res.send({
        links: query.links("/features", total),
        total,
        features,
        pageTotal: Math.ceil(total / query.options.limit),
      });
    } catch (e) {
      next(e);
    }
  })
  .put(
    "/:f_id",
    ADMIN_MIDDLEWARE,
    multer({ storage }).single("image"),
    async (req, res, next) => {
      try {
        const _id = req.params.f_id;
        const update = { ...req.body };
        if (req.file) {
          const filePath = await getFeatureFilePath(req.file.path);
          update.image = filePath;
        }
        const filter = { _id };
        const updatedFeature = await FeatureModel.findOneAndUpdate(
          filter,
          update,
          {
            returnOriginal: false,
          }
        );
        await updatedFeature.save();
        if (updatedFeature) {
          console.log(`FEATURE ${_id} SUCCESSFULLY UPDATED`);
          res.status(200).send(updatedFeature);
        } else {
          res.status(404).send({ message: `FEATURE ${_id} NOT FOUND` });
        }
      } catch (e) {
        next(e);
      }
    }
  )
  .delete("/:f_id", ADMIN_MIDDLEWARE, async (req, res, next) => {
    try {
      const _id = req.params.f_id;
      const deleteFeature = await FeatureModel.findByIdAndDelete(_id);
      if (deleteFeature) {
        console.log(`FEATURE ${_id} SUCCESSFULLY DELETED`);
        res.status(204).send();
      } else {
        res.status(404).send({ message: `FEATURE ${_id} NOT FOUND` });
      }
    } catch (e) {
      next(e);
    }
  });

export default FeatureRoute;
