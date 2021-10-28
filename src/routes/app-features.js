import express from "express";
import q2m from "query-to-mongo";
import FeatureModel from "../schemas/app-features.js";
import { ADMIN_MIDDLEWARE } from "../auth/jwt.js";

const featureRoute = express.Router();

const route = " app-features";

featureRoute.get("/", async (req, res, next) => {
  console.log("🔸GET", route);
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
featureRoute.put("/:_id", ADMIN_MIDDLEWARE, async (req, res, next) => {
  console.log("🔸PUT", route);
  try {
    if (req.user) {
      // else 401
      const { _id } = req.params;
      const update = { ...req.body };
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
        // else 404
        res.send(updatedFeature);
      } else {
        next(createHttpError(404, `💀FEATURE ID_${_id} NOT FOUND`));
      }
    } else {
      res.status(401).send({ error: `Credentials not accepted` });
    }
  } catch (e) {
    next(e);
  }
});
featureRoute.post("/", ADMIN_MIDDLEWARE, async (req, res, next) => {
  console.log("🔸POST", route);
  try {
    if (req.user) {
      // else 401
      const newFeature = new FeatureModel(req.body);
      const { _id } = await newFeature.save();
      if (_id) {
        res.status(201).send({ _id });
      } else console.log("something went wrong...");
    } else {
      res.status(401).send({ error: `Credentials not accepted` });
    }
  } catch (e) {
    next(e);
  }
});
featureRoute.delete("/:_id", ADMIN_MIDDLEWARE, async (req, res, next) => {
  console.log("🔸DELETE", route);
  try {
    if (req.user) {
      // else 401
      const { _id } = req.params;
      const deletedFeature = await FeatureModel.findByIdAndDelete(_id);
      if (deletedFeature) {
        // else 404
        res.status(204).send();
      } else {
        next(createHttpError(404, `💀FEATURE ID_${_id} NOT FOUND`));
      }
    } else {
      // next(createHttpError(401, `Credentials not accepted`));
      res.status(401).send({ error: `Credentials not accepted` });
    }
  } catch (e) {
    next(e);
  }
});

export default featureRoute;
