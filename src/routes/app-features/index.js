import express from "express";
import FeatureModel from "./model.js";
import q2m from "query-to-mongo";
import createHttpError from "http-errors";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { ADMIN_MIDDLEWARE } from "../../auth/jwt.js";
import { MY_FOLDER } from "../../utils/constants.js";
import { getResizedFilePath } from "../../utils/feature-funcs/featureFilePath.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: { folder: MY_FOLDER },
});

const FeatureRoute = express.Router();

const route = "APP-FEATURES";

FeatureRoute.post("/", ADMIN_MIDDLEWARE, multer({ storage }).single("image"), async (req, res, next) => {
  console.log(`◻️ POST ${route} (single feature)`);
  try {
    const newFeature = new FeatureModel(req.body);
    if (req.file) {
      const filePath = await getResizedFilePath(req.file.path)
      newFeature.image = filePath;
    }
    const { _id } = await newFeature.save();
    res.status(201).send({ _id });
  } catch (e) {
    next(e);
  }
})
  .get("/", async (req, res, next) => {
    console.log(`🔴 GET ${route} (all features)`);
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
  })
  .put("/:f_id", ADMIN_MIDDLEWARE, multer({ storage }).single("image"), async (req, res, next) => {
    console.log(`🔴 PUT ${route} (single feature)`);
    try {
      const _id = req.params.f_id;
      const update = { ...req.body };
      if (req.file) {
        const filePath = await getResizedFilePath(req.file.path)
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
        res.status(200).send(updatedFeature);
      } else {
        next(createHttpError(404, `💀FEATURE ID_${_id} NOT FOUND`));
      }
    } catch (e) {
      next(e);
    }
  })
  .delete("/:f_id", ADMIN_MIDDLEWARE, async (req, res, next) => {
    console.log(`🔴 DELETE ${route} (single feature)`);
    try {
      const _id = req.params.f_id;
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
