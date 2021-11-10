import createHttpError from "http-errors";
import { verifyJWT } from "./tools.js";
import UserModel from "../routes/users/model.js";

export const JWT_MIDDLEWARE = async (req, res, next) => {
  if (!req.headers.authorization) {
    next(createHttpError(401, "CREDENTIALS REQUIRED!"));
  } else {
    try {
      const token = req.headers.authorization.split(" ")[1];
      const decodedToken = await verifyJWT(token);
      const user = await UserModel.findById(decodedToken._id);
      if (user) {
        req.user = user;
        next();
      } else {
        res.status(404).send({ error: `User not found` });
      }
    } catch (err) {
      const token = req.headers.authorization.split(" ")[1];
      console.log("☠️ACCESS TOKEN HAS EXPIRED=>", token);
      console.log("attempt refresh token. If successful, send user with new tokens. At frontend, set new tokens at that moment. Otherwise, 401, scrub tokens and push to login. QUESTION: how find user at refresh session if access token not saved in db?(since this is all we have)? Answer: include ID in headers. Or include refresh token. ??")
      res.status(401).send({ error: `Credentials not accepted` });
    }
  }
};

export const JWT_MIDDLEWARE_WITH_REFRESH = async (req, res, next) => {
  if (!req.headers.authorization) {
    next(createHttpError(401, "CREDENTIALS REQUIRED!"));
  } else {
    try {
      const token = req.headers.authorization.split(" ")[1];
      const _id = req.headers.authorization.split(" ")[2];
      const decodedToken = await verifyJWT(token);
      const user = await UserModel.findById(decodedToken._id);
      if (res.status === 401) {
        console.log("HERE I WANT TO USE REFRESHSESSION FUNCTION");
        console.log(_id);
        const refreshToken = await REFRESH(req, res, next, _id);
        next();
      } else if (user) {
        req.user = user;
        next();
      } else {
        res.status(404).send({ error: `User not found` });
      }
    } catch (err) {
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
