import createHttpError from "http-errors";
import { verifyJWT } from "./tools.js";
import UserModel from "../routes/users/model.js";

export const JWT_MIDDLEWARE = async (req, res, next) => {
  if (!req.headers.authorization) {
    next(createHttpError(401, "CREDENTIALS REQUIRED!"));
  } else {
    const token = req.headers.authorization.split(" ")[1];
    try {
      const decodedToken = await verifyJWT(token);
      const user = await UserModel.findById(decodedToken._id);
      if (user) {
        req.user = user;
        next();
      } else {
        res.status(404).send({ error: `User not found` });
      }
    } catch (err) {
      console.log("☠️ACCESS TOKEN HAS EXPIRED");
      res.status(401).send({ error: `Credentials not accepted` });
    }
  }
};

export const ADMIN_MIDDLEWARE = async (req, res, next) => {
  if (!req.headers.authorization) {
    next(createHttpError(401, "CREDENTIALS REQUIRED!"));
  } else {
    try {
      const token = req.headers.authorization.split(" ")[1];
      const decodedToken = await verifyJWT(token);
      const user = await UserModel.findById(decodedToken._id);
      if (user.admin) {
        if (user) {
          req.user = user;
          next();
        } else {
          next(createHttpError(404, "☠️ USER NOT FOUND!"));
        }
      } else {
        next(createHttpError(401, "ADMINS ONLY!"));
      }
    } catch (err) {
      next(createHttpError(401, "☠️ INVALID TOKEN"));
    }
  }
};
