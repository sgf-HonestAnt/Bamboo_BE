import express from "express";
import q2m from "query-to-mongo";
import createHttpError from "http-errors";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import UserModel from "../schemas/users.js";
import generator from "../utils/generator.js";
import shuffle from "../utils/shuffle.js";
import { generateTokens, refreshTokens } from "../auth/tools.js";
import { JWT_MIDDLEWARE, ADMIN_MIDDLEWARE } from "../auth/jwt.js";

// ❗ remove "pending" as is not in use

const storage = new CloudinaryStorage({
  cloudinary,
  params: { folder: "capstone_users" },
});

const generateNames = async (username) => {
  let altNames = [];
  for (let i = 0; i < 5; i++) {
    const generatedName = await generator();
    const nameDoesNotExist =
      (await UserModel.findOne({ username: generatedName })) === null;
    if (nameDoesNotExist) {
      altNames.push(generatedName);
    }
  }
  return altNames;
};

const userRoute = express.Router();

const route = "USER";

userRoute
  // ✅
  .post("/register", async (req, res, next) => {
    console.log("🔸REGISTER", route);
    try {
      const { email, username } = req.body;
      const emailDuplicate = await UserModel.findOne({ email });
      const usernameDuplicate = await UserModel.findOne({ username });
      if (emailDuplicate) {
        res.status(409).send({ error: `Email Exists` });
      } else if (usernameDuplicate) {
        const available = await generateNames(username);
        res.status(409).send({ error: `Username Exists`, available });
      } else {
        const newUser = new UserModel(req.body);
        const { _id } = await newUser.save();
        if (newUser) {
          const { accessToken, refreshToken } = await generateTokens(newUser);
          res.status(201).send({ _id, accessToken, refreshToken });
        } else {
          console.log({ message: "💀USER NOT SAVED", user: req.body });
        }
      }
    } catch (e) {
      next(e);
    }
  })
  // ✅
  .post("/session", async (req, res, next) => {
    console.log("🔸LOGIN", route);
    try {
      const { email, password } = req.body;
      const user = await UserModel.checkCredentials(email, password);
      if (user !== null) {
        const { accessToken, refreshToken } = await generateTokens(user);
        const { admin } = user;
        res.status(200).send({ accessToken, refreshToken, admin });
      } else {
        res.status(401).send({ error: `Credentials not accepted` });
      }
    } catch (e) {
      next(e);
    }
  })
  //*********************************************************************
  .post("/session/refresh")
  //*********************************************************************

  // ✅
  .post("/", ADMIN_MIDDLEWARE, async (req, res, next) => {
    console.log("🔸POST", route);
    try {
      console.log(req.user);
      const { email, username } = req.body;
      const emailDuplicate = await UserModel.findOne({ email });
      const usernameDuplicate = await UserModel.findOne({ username });
      if (emailDuplicate) {
        res.status(409).send({ error: `Email Exists` });
      } else if (usernameDuplicate) {
        const available = await generateNames(username);
        res.status(409).send({ error: `Username Exists`, available });
      } else {
        const newUser = new UserModel(req.body);
        const { _id } = await newUser.save();
        if (_id) {
          res.status(201).send({ _id });
        } else {
          console.log({ message: "💀USER NOT SAVED", user: req.body });
        }
      }
    } catch (e) {
      next(e);
    }
  })
  .post("/request/:u_id", JWT_MIDDLEWARE, async (req, res, next) => {
    console.log("🔸REQUEST TO FOLLOW", route);
    // the sender wants to send a 'follow' request to sendee
    // they can only do this if sendee's id is not in their rejected list
    // in sender's list, sendee's id will be added to "requested"
    // in sendee's list, sender's id will be added to "response_awaited"
    try {
      const sender = req.user;
      const sendee = await UserModel.findOne({ _id: req.params.u_id });
      const idsMatch = req.user._id.toString() === req.params.u_id;
      // if (!sender) {
      //   res.status(401).send({ error: `Credentials not accepted` });
      // } else
      if (!sendee) {
        // ❗ error here. Investigate...
        console.log("no sendee found");
        res.status(404).send({ error: `User id ${req.params.u_id} not found` });
      } else if (idsMatch) {
        res.status(409).send({ error: `User IDs cannot be a match!` });
      } else if (sender.followedUsers.requested.includes(sendee._id)) {
        res.status(409).send({ error: `Duplicated requests are forbidden!` });
      } else if (sender.followedUsers.accepted.includes(sendee._id)) {
        res.status(409).send({ error: `User already accepted!` });
      } else if (sender.followedUsers.rejected.includes(sendee._id)) {
        res.status(409).send({ error: `Rejected users can't request again!` });
      } else {
        const shuffleSenderList = await shuffle(
          sendee._id,
          sender._id,
          sender,
          "requested"
        );
        const shuffleSendeeList = await shuffle(
          sender._id,
          sendee._id,
          sendee,
          "response_awaited"
        );
        if (shuffleSenderList && shuffleSendeeList) {
          res.status(201).send(shuffleSenderList.followedUsers);
        } else {
          console.log("something went wrong...");
        }
      }
    } catch (e) {
      next(e);
    }
  })
  .post("/accept/:u_id", JWT_MIDDLEWARE, async (req, res, next) => {
    console.log("🔸ACCEPT FOLLOW BY", route);
    try {
      const sender = await UserModel.findOne({ _id: req.params.u_id });
      const sendee = req.user;
      const idsAreDifferent = req.user._id.toString() !== req.params.u_id;
      const idExistsInAwaited = sendee.followedUsers.response_awaited.includes(
        req.params.u_id
      );
      // the sendee wants to accept sender's request to follow each other
      if (sender) {
        // else 404
        if (sendee) {
          // else 401
          if (idsAreDifferent) {
            // else 409
            if (idExistsInAwaited) {
              // else 409
              // in sendee's list, sender's id will be moved from "response_awaited" to "accepted"
              const moveIDFromSendeeAwaitedToAccepted = await shuffle(
                sender._id,
                sendee._id,
                sendee,
                "accepted",
                "response_awaited"
              );
              // in sender's list, sendee's id will be moved from "requested" to "accepted"
              const moveIDFromSenderRequestedToAccepted = await shuffle(
                sendee._id,
                sender._id,
                sender,
                "accepted",
                "requested"
              );
              const complete =
                moveIDFromSendeeAwaitedToAccepted &&
                moveIDFromSenderRequestedToAccepted;
              if (complete) {
                res
                  .status(201)
                  .send(moveIDFromSendeeAwaitedToAccepted.followedUsers);
              } else {
                console.log("something went wrong...");
              }
            } else {
              res.status(409).send({ error: `User ID must exist in Awaited` });
            }
          } else {
            res.status(409).send({ error: `User IDs cannot be a match` });
          }
        } else {
          res.status(401).send({ error: `Credentials not accepted` });
        }
      } else {
        res.status(404).send({ error: `User id ${req.params.u_id} not found` });
      }
    } catch (e) {
      next(e);
    }
  })
  .post("/reject/:u_id", JWT_MIDDLEWARE, async (req, res, next) => {
    console.log("🔸REJECT FOLLOW BY", route);
    try {
      const sender = await UserModel.findOne({ _id: req.params.u_id });
      const sendee = req.user;
      const idsAreDifferent = req.user._id.toString() !== req.params.u_id;
      const idExistsInAwaited = sendee.followedUsers.response_awaited.includes(
        req.params.u_id
      );
      if (sender) {
        // else 404
        if (sendee) {
          // else 401
          if (idsAreDifferent) {
            // else 409
            if (idExistsInAwaited) {
              // else 409
              // in sendee's list, sender's id will be simply removed from "response_awaited": "to" list is null
              const removeIDFromSendeeResponseAwaited = await shuffle(
                sender._id,
                sendee._id,
                sendee,
                null,
                "response_awaited"
              );
              // in sender's list, sendee's id will be moved from "requested" to "rejected"
              const moveIDFromSenderRequestedToRejected = await shuffle(
                sendee._id,
                sender._id,
                sender,
                "rejected",
                "requested"
              );
              const complete =
                removeIDFromSendeeResponseAwaited &&
                moveIDFromSenderRequestedToRejected;
              if (complete) {
                res
                  .status(201)
                  .send(removeIDFromSendeeResponseAwaited.followedUsers);
              } else {
                console.log("something went wrong...");
              }
            } else {
              res.status(409).send({ error: `User ID must exist in Awaited` });
            }
          } else {
            res.status(409).send({ error: `User IDs cannot be a match` });
          }
        } else {
          res.status(401).send({ error: `Credentials not accepted` });
        }
      } else {
        res.status(404).send({ error: `User id ${req.params.u_id} not found` });
      }
    } catch (e) {
      next(e);
    }
  })
  // ✅
  .get("/me", JWT_MIDDLEWARE, async (req, res, next) => {
    console.log("🔸GET ME");
    try {
      res.send(req.user);
    } catch (e) {
      next(e);
    }
  })
  // ✅
  .get("/", async (req, res, next) => {
    console.log("🔸GET", `${route}S`);
    try {
      const query = q2m(req.query);
      const { total, users } = await UserModel.findUsers(query);
      res.send({
        links: query.links("/users", total),
        total,
        users,
        pageTotal: Math.ceil(total / query.options.limit),
      });
    } catch (e) {
      next(e);
    }
  })
  // ✅
  .get("/:u_id", ADMIN_MIDDLEWARE, async (req, res, next) => {
    console.log("🔸GET", route);
    try {
      const { u_id } = req.params;
      const users = await UserModel.find({ _id: u_id });
      res.send(users);
    } catch (e) {
      next(e);
    }
  })
  // ✅
  .put("/me", JWT_MIDDLEWARE, async (req, res, next) => {
    console.log("🔸PUT ME");
    try {
      const { _id } = req.user;
      const { email, username } = req.body;
      const emailDuplicate = await UserModel.find({ email });
      const usernameDuplicate = await UserModel.find({ username });
      if (
        emailDuplicate.length > 0 &&
        emailDuplicate[0]._id.toString() !== _id.toString()
      ) {
        res.status(409).send({ error: `Email Exists` });
      } else if (
        usernameDuplicate.length > 0 &&
        usernameDuplicate[0]._id.toString() !== _id.toString()
      ) {
        const available = await generateNames(username);
        res.status(409).send({ error: `Username Exists`, available });
      } else {
        const update = { ...req.body };
        const filter = { _id: req.user._id };
        const updatedUser = await UserModel.findOneAndUpdate(filter, update, {
          returnOriginal: false,
        });
        await updatedUser.save();
        res.send(updatedUser);
      }
    } catch (e) {
      next(e);
    }
  })
  // ✅
  .put(
    "/me/avatar",
    JWT_MIDDLEWARE,
    multer({ storage }).single("avatar"),
    async (req, res, next) => {
      console.log("🔸PUT MY AVATAR");
      try {
        const filter = { _id: req.user._id };
        const update = { ...req.body, avatar: req.file.path };
        const editedUser = await UserModel.findOneAndUpdate(filter, update, {
          returnOriginal: false,
        });
        await editedUser.save();
        res.send(editedUser);
      } catch (e) {
        next(e);
      }
    }
  )
  // ✅
  .put(
    "/:u_id/avatar",
    ADMIN_MIDDLEWARE,
    multer({ storage }).single("avatar"),
    async (req, res, next) => {
      console.log("🔸PUT", `${route} AVATAR`);
      try {
        const filter = { _id: req.params.u_id };
        const update = { ...req.body, avatar: req.file.path };
        const editedUser = await UserModel.findOneAndUpdate(filter, update, {
          returnOriginal: false,
        });
        await editedUser.save();
        res.send(editedUser);
      } catch (e) {
        next(e);
      }
    }
  )
  // ✅
  .put("/:u_id", ADMIN_MIDDLEWARE, async (req, res, next) => {
    console.log("🔸PUT", route);
    try {
      const _id = req.params.u_id;
      const { email, username } = req.body;
      const emailDuplicate = await UserModel.find({ email });
      const usernameDuplicate = await UserModel.find({ username });
      if (
        emailDuplicate.length > 0 &&
        emailDuplicate[0]._id.toString() !== _id
      ) {
        res.status(409).send({ error: `Email Exists` });
      } else if (
        usernameDuplicate.length > 0 &&
        usernameDuplicate[0]._id.toString() !== _id
      ) {
        const available = await generateNames(username);
        res.status(409).send({ error: `Username Exists`, available });
      } else {
        const update = { ...req.body };
        const filter = { _id };
        const updatedUser = await UserModel.findOneAndUpdate(filter, update, {
          returnOriginal: false,
        });
        await updatedUser.save();
        if (updatedUser) {
          res.send(updatedUser);
        } else {
          next(createHttpError(404, `💀USER ID_${u_id} NOT FOUND`));
        }
      }
    } catch (e) {
      next(e);
    }
  })
  // ✅
  .delete("/session", JWT_MIDDLEWARE, async (req, res, next) => {
    console.log("🔸LOGOUT", route);
    try {
      req.user.refreshToken = null;
      await req.user.save();
      res.send();
    } catch (e) {
      next(e);
    }
  })
  // ✅
  .delete("/me", JWT_MIDDLEWARE, async (req, res, next) => {
    console.log("🔸DELETE ME");
    try {
      const iAmDeleted = await UserModel.findByIdAndDelete(req.user._id);
      if (iAmDeleted) {
        res.status(204).send();
      }
    } catch (e) {
      next(e);
    }
  })
  // ✅
  .delete("/:u_id", ADMIN_MIDDLEWARE, async (req, res, next) => {
    console.log("🔸DELETE", route);
    try {
      const { u_id } = req.params;
      const deletedUser = await UserModel.findByIdAndDelete(u_id);
      if (deletedUser) {
        res.status(204).send();
      } else {
        next(createHttpError(404, `💀USER ID_${u_id} NOT FOUND`));
      }
    } catch (e) {
      next(e);
    }
  });

export default userRoute;
