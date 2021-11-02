import express from "express";
import mongoose from "mongoose";
import UserModel from "./model.js";
import TaskListModel from "../tasks/model.js";
import AchievementModel from "../achievements/model.js";
import q2m from "query-to-mongo";
import multer from "multer";
import { JWT_MIDDLEWARE, ADMIN_MIDDLEWARE } from "../../auth/jwt.js";
import { storage } from "../../utils/constants.js";
import {
  nameGenerator,
  shuffle,
  getUserFilePath,
  getPublicUsers,
} from "../../utils/route-funcs/users.js";
import { generateTokens, refreshTokens } from "../../auth/tools.js";

const UserRoute = express.Router();

UserRoute.post("/register", async (req, res, next) => {
  try {
    const { email, username } = req.body;
    const emailIsDuplicate = await UserModel.findOne({ email });
    const usernameIsDuplicate = await UserModel.findOne({ username });
    if (emailIsDuplicate) {
      res.status(409).send({ message: `EMAIL NOT AVAILABLE` });
    } else if (usernameIsDuplicate) {
      const available = await nameGenerator(username);
      res.status(409).send({ message: `USERNAME NOT AVAILABLE`, available });
    } else {
      const newUser = new UserModel(req.body);
      const { _id, admin } = await newUser.save();
      if (!newUser) {
        console.log({ message: "USER NOT SAVED", user: req.body });
      } else {
        const { accessToken, refreshToken } = await generateTokens(newUser);
        const newTaskList = await new TaskListModel({ user: _id }).save();
        const newAchievements = await new AchievementModel({
          user: _id,
        }).save();
        if (!newTaskList._id) {
          console.log({
            message: "TASKLIST NOT SAVED",
            user: _id,
          });
        } else if (!newAchievements._id) {
          console.log({
            message: "ACHIEVEMENTS NOT SAVED",
            user: _id,
          });
        } else {
          const update = {
            tasks: newTaskList._id,
            achievements: newAchievements._id,
          };
          const filter = { _id };
          const updatedUser = await UserModel.findOneAndUpdate(filter, update, {
            returnOriginal: false,
          });
          await updatedUser.save();
          console.log("NEW USER SUCCESSFULLY CREATED");
          res.status(201).send({ _id, accessToken, refreshToken, admin });
        }
      }
    }
  } catch (e) {
    next(e);
  }
})
  .post("/session", async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const user = await UserModel.checkCredentials(email, password);
      if (user !== null) {
        const { accessToken, refreshToken } = await generateTokens(user);
        const { admin, _id } = user;
        console.log("LOGGED IN");
        res.status(200).send({ _id, accessToken, refreshToken, admin });
      } else {
        res.status(401).send({ message: `CREDENTIALS NOT ACCEPTED` });
      }
    } catch (e) {
      next(e);
    }
  })
  .post("/session/refresh", async (req, res, next) => {
    try {
      const { actualRefreshToken } = req.body;
      const { accessToken, refreshToken } = await refreshTokens(
        actualRefreshToken
      );
      console.log("REFRESHED TOKENS");
      res.send({ accessToken, refreshToken });
    } catch (e) {
      next(e);
    }
  })
  .post("/", ADMIN_MIDDLEWARE, async (req, res, next) => {
    try {
      const { email, username } = req.body;
      const emailIsDuplicate = await UserModel.findOne({ email });
      const usernameIsDuplicate = await UserModel.findOne({ username });
      if (emailIsDuplicate) {
        res.status(409).send({ message: `EMAIL NOT AVAILABLE` });
      } else if (usernameIsDuplicate) {
        const available = await nameGenerator(username);
        res.status(409).send({ message: `USERNAME NOT AVAILABLE`, available });
      } else {
        const newUser = new UserModel(req.body);
        const { _id } = await newUser.save();
        if (!_id) {
          console.log({ message: "USER NOT SAVED", user: req.body });
        } else {
          const newTaskList = new TaskListModel({ user: _id });
          const newAchievements = new AchievementModel({ user: _id });
          if (!newTaskList._id) {
            console.log({
              message: "User Tasklist Not Saved",
              user: _id,
            });
          } else if (!newAchievements._id) {
            console.log({
              message: "User Achievements Not Saved",
              user: _id,
            });
          } else {
            const update = {
              tasks: newTaskList._id,
              achievements: newAchievements._id,
            };
            const filter = { _id };
            const updatedUser = await UserModel.findOneAndUpdate(
              filter,
              update,
              {
                returnOriginal: false,
              }
            );
            await updatedUser.save();
            console.log("NEW USER SUCCESSFULLY CREATED");
            res.status(201).send({ _id });
          }
        }
      }
    } catch (e) {
      next(e);
    }
  })
  .post("/request/:u_id", JWT_MIDDLEWARE, async (req, res, next) => {
    try {
      const sender = req.user;
      const { u_id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(u_id)) {
        res.status(404).send({ message: `USER ${u_id} NOT FOUND` });
      } else {
        const sendee = await UserModel.findById(u_id);
        const idsMatch = req.user._id.toString() === u_id;
        if (idsMatch) {
          res.status(409).send({ message: `USERS IDS CANNOT MATCH` });
        } else if (sender.followedUsers.requested.includes(sendee._id)) {
          res
            .status(409)
            .send({ message: `DUPLICATE REQUESTS ARE NOT ALLOWED` });
        } else if (sender.followedUsers.accepted.includes(sendee._id)) {
          res.status(409).send({ message: `USER ALREADY ACCEPTED` });
        } else if (sender.followedUsers.rejected.includes(sendee._id)) {
          res
            .status(409)
            .send({ message: `REJECTED USERS CANNOT MAKE REQUEST` });
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
            console.log(`${sender._id} REQUESTED ${sendee._id}`);
            res.status(201).send(shuffleSenderList.followedUsers);
          } else {
            console.log("💀SOMETHING WENT WRONG...");
          }
        }
      }
    } catch (e) {
      next(e);
    }
  })
  .post("/accept/:u_id", JWT_MIDDLEWARE, async (req, res, next) => {
    try {
      const sendee = req.user;
      const { u_id } = req.params;
      const idsMatch = req.user._id.toString() === u_id;
      const idExistsInAwaited =
        sendee.followedUsers.response_awaited.includes(u_id);
      if (!mongoose.Types.ObjectId.isValid(u_id)) {
        res.status(404).send({ message: `USER ${u_id} NOT FOUND` });
      } else if (idsMatch) {
        res.status(409).send({ message: `USERS IDS CANNOT MATCH` });
      } else if (!idExistsInAwaited) {
        res.status(409).send({ message: `USER ID MUST EXIST IN AWAITED` });
      } else {
        const sender = await UserModel.findById(u_id);
        const moveIDFromSendeeAwaitedToAccepted = await shuffle(
          sender._id,
          sendee._id,
          sendee,
          "accepted",
          "response_awaited"
        );
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
          console.log(`${sendee._id} ACCEPTED ${sender._id}`);
          res.status(201).send(moveIDFromSendeeAwaitedToAccepted.followedUsers);
        } else {
          console.log("💀SOMETHING WENT WRONG...");
        }
      }
    } catch (e) {
      next(e);
    }
  })
  .post("/reject/:u_id", JWT_MIDDLEWARE, async (req, res, next) => {
    try {
      const { u_id } = req.params;
      const idsMatch = req.user._id.toString() === u_id;
      const sendee = req.user;
      const sender = await UserModel.findById(u_id);
      const idExistsInAwaited =
        sendee.followedUsers.response_awaited.includes(u_id);
      if (!mongoose.Types.ObjectId.isValid(u_id)) {
        res.status(404).send({ message: `USER ${u_id} NOT FOUND` });
      } else if (idsMatch) {
        res.status(409).send({ message: `USERS IDS CANNOT MATCH` });
      } else if (!idExistsInAwaited) {
        res.status(409).send({ message: `USER ID MUST BE AWAITED` });
      } else {
        const removeIDFromSendeeResponseAwaited = await shuffle(
          sender._id,
          sendee._id,
          sendee,
          null,
          "response_awaited"
        );
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
          console.log(`${sendee._id} REJECTED ${sender._id}`);
          res.status(201).send(removeIDFromSendeeResponseAwaited.followedUsers);
        } else {
          console.log("💀SOMETHING WENT WRONG...");
        }
      }
    } catch (e) {
      next(e);
    }
  })
  .get("/me", JWT_MIDDLEWARE, async (req, res, next) => {
    try {
      const user_id = req.user._id;
      const my_user = await UserModel.findById(user_id).populate(
        "followedUsers.accepted"
      );
      const acceptedUsers = my_user.followedUsers.accepted;
      let arrayOfPublicUsers = [];
      await getPublicUsers(acceptedUsers, arrayOfPublicUsers);
      my_user.followedUsers = undefined;
      const self = { my_user, followedUsers: arrayOfPublicUsers };
      console.log("FETCHED USER");
      res.send(self);
    } catch (e) {
      next(e);
    }
  })
  .get("/me/settings", JWT_MIDDLEWARE, async (req, res, next) => {
    try {
      const user_id = req.user._id;
      const my_user = await UserModel.findById(user_id);
      const settings = my_user.settings;
      console.log("FETCHED USER SETTINGS");
      res.send(settings);
    } catch (e) {
      next(e);
    }
  })
  .get("/", async (req, res, next) => {
    try {
      const query = q2m(req.query);
      const { total, users } = await UserModel.findUsers(query);
      const publicUsers = await users.map((u) => ({
        _id: u._id,
        username: u.username,
        avatar: u.avatar,
        bio: u.bio,
        level: u.level,
        xp: u.xp,
        joined: u.createdAt,
      }));
      console.log("FETCHED ALL USERS / BY QUERY");
      res.send({
        links: query.links("/users", total),
        total,
        publicUsers,
        pageTotal: Math.ceil(total / query.options.limit),
      });
    } catch (e) {
      next(e);
    }
  })
  .get("/:u_id", ADMIN_MIDDLEWARE, async (req, res, next) => {
    try {
      const { u_id } = req.params;
      const user = await UserModel.findById(u_id);
      if (!user) {
        res.status(404).send({ message: `USER ${u_id} NOT FOUND` });
      } else {
        user.followedUsers = undefined;
        console.log("FETCHED USER BY ID");
        res.send(user);
      }
    } catch (e) {
      next(e);
    }
  })
  .put(
    "/me",
    JWT_MIDDLEWARE,
    multer({ storage }).single("avatar"),
    async (req, res, next) => {
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
          const available = await nameGenerator(username);
          res.status(409).send({ message: `Username Exists`, available });
        } else {
          const update = { ...req.body };
          if (req.file) {
            const filePath = await getUserFilePath(req.file.path);
            update.avatar = filePath;
          }
          const filter = { _id: req.user._id };
          const updatedUser = await UserModel.findOneAndUpdate(filter, update, {
            returnOriginal: false,
          });
          console.log("UPDATED USER");
          await updatedUser.save();
          res.send(updatedUser);
        }
      } catch (e) {
        next(e);
      }
    }
  )
  .put("/me/settings", JWT_MIDDLEWARE, async (req, res, next) => {
    try {
      const { _id } = req.user;
      const update = { settings: req.body };
      const { settings } = await UserModel.findByIdAndUpdate(_id, update, {
        returnOriginal: false,
      });
      console.log("UPDATED USER SETTINGS");
      res.send(settings);
    } catch (e) {
      next(e);
    }
  })
  .put(
    "/:u_id",
    ADMIN_MIDDLEWARE,
    multer({ storage }).single("avatar"),
    async (req, res, next) => {
      try {
        const { u_id } = req.params;
        const { email, username } = req.body;
        const emailDuplicate = await UserModel.find({ email });
        const usernameDuplicate = await UserModel.find({ username });
        if (!mongoose.Types.ObjectId.isValid(u_id)) {
          res.status(404).send({ error: `User ID ${u_id} not found!` });
        } else if (
          emailDuplicate.length > 0 &&
          emailDuplicate[0]._id.toString() !== u_id
        ) {
          res.status(409).send({ error: `Email Exists` });
        } else if (
          usernameDuplicate.length > 0 &&
          usernameDuplicate[0]._id.toString() !== u_id
        ) {
          const available = await nameGenerator(username);
          res.status(409).send({ message: `Username Exists`, available });
        } else {
          const update = { ...req.body };
          if (req.file) {
            const filePath = await getUserFilePath(req.file.path);
            update.avatar = filePath;
          }
          const filter = { _id: u_id };
          const updatedUser = await UserModel.findOneAndUpdate(filter, update, {
            returnOriginal: false,
          });
          await updatedUser.save();
          if (updatedUser) {
            console.log("UPDATED USER BY ID");
            res.send(updatedUser);
          } else {
            res.status(404).send({ message: `USER ${u_id} NOT FOUND` });
          }
        }
      } catch (e) {
        next(e);
      }
    }
  )
  .delete("/session", JWT_MIDDLEWARE, async (req, res, next) => {
    try {
      req.user.refreshToken = null;
      await req.user.save();
      console.log("LOGGED OUT");
      res.send();
    } catch (e) {
      next(e);
    }
  })
  .delete("/me", JWT_MIDDLEWARE, async (req, res, next) => {
    try {
      const userDeleted = await UserModel.findByIdAndDelete(req.user._id);
      if (userDeleted) {
        console.log("DELETED USER");
        res.status(204).send();
      }
    } catch (e) {
      next(e);
    }
  })
  .delete("/:u_id", ADMIN_MIDDLEWARE, async (req, res, next) => {
    try {
      const { u_id } = req.params;
      const deleteUser = await UserModel.findByIdAndDelete(u_id);
      if (deleteUser) {
        await TaskListModel.findOneAndDelete({ user: u_id });
        await AchievementModel.findOneAndDelete({ user: u_id });
        console.log("DELETED USER BY ID");
        res.status(204).send();
      } else {
        res.status(404).send({ message: `USER ${u_id} NOT FOUND` });
      }
    } catch (e) {
      next(e);
    }
  });

export default UserRoute;
