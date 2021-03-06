import express from "express";
import mongoose from "mongoose";
import UserModel from "./model.js";
import TaskListModel from "../tasks/model.js";
import AchievementModel from "../achievements/model.js";
import q2m from "query-to-mongo";
import multer from "multer";
import { confirmEdit, sendGoodbye, sendWelcome } from "../../utils/sendgrid.js";
import { JWT_MIDDLEWARE, ADMIN_MIDDLEWARE } from "../../auth/jwt.js";
import { storage } from "../../utils/constants.js";
import {
  nameGenerator,
  shuffle,
  getUserFilePath,
  getPublicUsers,
  pushNotification,
  giftXP,
} from "../../utils/route-funcs/users.js";
import {
  detectReuse,
  generateTokens,
  refreshTokens,
} from "../../auth/tools.js";
// import { createTasksUponRegister } from "../../utils/route-funcs/tasks.js";
import { generateEditsPDFAsync } from "../../utils/pdf.js";

const UserRoute = express.Router();

UserRoute.post("/register", async (req, res, next) => {
  try {
    console.log("💠 REGISTER USER");
    const { body } = req;
    const username = body.username.toLowerCase();
    const email = body.email.toLowerCase();
    const emailIsDuplicate = await UserModel.findOne({ email });
    const usernameIsDuplicate = await UserModel.findOne({ username });
    if (emailIsDuplicate) {
      res.status(409).send({ message: `EMAIL NOT AVAILABLE` });
    } else if (usernameIsDuplicate) {
      const available = await nameGenerator(username);
      res.status(409).send({ message: `USERNAME NOT AVAILABLE`, available });
    } else {
      const newUser = new UserModel(req.body);
      newUser.username = username;
      newUser.email = email;
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
          const welcomeNotification = "Welcome to Bamboo!";
          updatedUser.notification.push(welcomeNotification);
          await updatedUser.save();
          // now create default Tasks!
          // await createTasksUponRegister(_id); // still works, but I've taken it off for now.
          console.log("💠 NEW USER REGISTERED WITH 5 DEFAULT TASKS [ME]");
          await sendWelcome(email);
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
      console.log("💠 LOG IN");
      const { body } = req;
      const username = body.username.toLowerCase();
      const { password } = body;
      const user = await UserModel.checkCredentials(username, password);
      if (user !== null) {
        const { accessToken, refreshToken } = await generateTokens(user);
        const { admin, _id } = user;
        console.log("💠 LOGGED IN");
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
      console.log("💠 REFRESH SESSION");
      const { actualRefreshToken } = req.body;
      await detectReuse(actualRefreshToken); // if used throw 403 Forbidden
      if (res.status !== 403) {
        const { accessToken, refreshToken } = await refreshTokens(
          actualRefreshToken
        );
        console.log("💠 REFRESHED TOKENS");
        res.send({ accessToken, refreshToken });
      }
    } catch (e) {
      next(e);
    }
  })
  .post("/", ADMIN_MIDDLEWARE, async (req, res, next) => {
    try {
      console.log("💠 POST USER [ADMIN]");
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
            console.log("💠 NEW USER SUCCESSFULLY CREATED [ADMIN]");
            res.status(201).send({ _id });
          }
        }
      }
    } catch (e) {
      next(e);
    }
  })
  .post("/gift/:u_id", JWT_MIDDLEWARE, async (req, res, next) => {
    try {
      console.log("💠 SEND GIFT");
      const sender = req.user;
      const { u_id } = req.params;
      const { xp } = req.body;
      if (!mongoose.Types.ObjectId.isValid(u_id)) {
        res.status(404).send({ message: `USER ${u_id} NOT FOUND` });
      } else {
        const sendee = await UserModel.findById(u_id);
        const idsMatch = req.user._id.toString() === u_id;
        if (idsMatch) {
          res.status(409).send({ message: `USERS IDS CANNOT MATCH` });
        } else if (xp > sender.xp) {
          res
            .status(409)
            .send({ message: `SENDER NEEDS MORE XP TO SEND GIFT` });
        } else {
          const updatedSendee = await giftXP(sendee._id, xp, false);
          const updatedSender = await giftXP(sender._id, xp, true);
          if (updatedSendee && updatedSender) {
            const notification = `${sender.username} just sent you a gift!:::${xp}`;
            await pushNotification(sendee._id, notification);
            res.status(201).send({
              message: `${sender._id} SENT ${xp}XP TO ${sendee._id}`,
            });
          }
        }
      }
    } catch (e) {
      next(e);
    }
  })
  .post("/request/:u_id", JWT_MIDDLEWARE, async (req, res, next) => {
    try {
      console.log("💠 REQUEST FOLLOW");
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
        } else if (sendee.followedUsers.requested.includes(sender._id)) {
          res.status(409).send({ message: `USER ALREADY AWAITING RESPONSE` });
        } else if (sender.followedUsers.accepted.includes(sendee._id)) {
          res.status(409).send({ message: `USER ALREADY ACCEPTED` });
        } else if (sender.followedUsers.rejected.includes(sendee._id)) {
          res
            .status(409)
            .send({ message: `REJECTED USERS CANNOT MAKE REQUEST` });
        } else {
          // 🌈 BEFORE FINAL DEPLOYMENT
          // if sendee id is BigBear, allow for automatic acceptance
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
            const notification = `${sender.username} has sent you a request`;
            await pushNotification(sendee._id, notification);
            console.log(`💠 ${sender._id} REQUESTED ${sendee._id}`);
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
      console.log("💠 ACCEPT FOLLOW");
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
          const notification = `${sendee.username} accepted your request`;
          await pushNotification(sender._id, notification);
          console.log(`💠 ${sendee._id} ACCEPTED ${sender._id}`);
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
      console.log("💠 REJECT FOLLOW");
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
          console.log(`💠 ${sendee._id} REJECTED ${sender._id}`);
          res.status(201).send(removeIDFromSendeeResponseAwaited.followedUsers);
        } else {
          console.log("💀SOMETHING WENT WRONG...");
        }
      }
    } catch (e) {
      next(e);
    }
  })
  .post("/notification", JWT_MIDDLEWARE, async (req, res, next) => {
    try {
      console.log("💠 SEND FOLLOWED USERS A NOTIFICATION");
      const { notification } = req.body;
      const { followedUsers } = req.user;
      const acceptedUsers = followedUsers.accepted;
      if (acceptedUsers.length < 1) {
        res.status(409).send({ message: `NO ACCEPTED USERS` });
      } else {
        for (let i = 0; i < acceptedUsers.length; i++) {
          const { username } = await UserModel.findOneAndUpdate(
            { _id: acceptedUsers[i]._id },
            {
              $push: { notification },
            },
            {
              returnOriginal: false,
            }
          );
          console.log(`💠 NOTIFIED ${username}`);
        }
        res.status(200).send({ message: `NOTIFICATIONS SENT` });
      }
    } catch (e) {
      next(e);
    }
  })
  .post("/me/rewards", JWT_MIDDLEWARE, async (req, res, next) => {
    try {
      console.log("💠 PUT USER REWARDS [ME]");
      const { _id, rewards } = req.user;
      const newReward = req.body;
      const update = { rewards: [...rewards, req.body] };
      const updated = await UserModel.findByIdAndUpdate(_id, update, {
        returnOriginal: false,
      });
      console.log("💠 UPDATED USER REWARDS [ME]");
      res.send(updated.rewards);
    } catch (e) {
      next(e);
    }
  })
  .get("/test", JWT_MIDDLEWARE, async (req, res, next) => {
    try {
      console.log("💠 TEST TOKEN");
      const username = req.user.username;
      console.log("💠 TESTED", { username });
      res.send({ username });
    } catch (e) {
      next(e);
    }
  })
  .get("/me", JWT_MIDDLEWARE, async (req, res, next) => {
    try {
      console.log("💠 GET USER [ME]");
      const user_id = req.user._id;
      const my_user = await UserModel.findById(user_id).populate(
        "followedUsers.accepted"
      );
      const acceptedUsers = my_user.followedUsers.accepted;
      let arrayOfPublicUsers = [];
      const array = await getPublicUsers(acceptedUsers, arrayOfPublicUsers);
      my_user.followedUsers = undefined;
      const self = { my_user, followedUsers: array };
      console.log("💠 FETCHED USER [ME]");
      res.send(self);
    } catch (e) {
      next(e);
    }
  })
  .get("/me/rewards", JWT_MIDDLEWARE, async (req, res, next) => {
    try {
      console.log("💠 GET USER REWARDS [ME]");
      const { rewards } = await UserModel.findById(req.user._id);
      console.log("💠 FETCHED REWARDS [ME]");
      res.send(rewards);
    } catch (e) {
      next(e);
    }
  })
  .get("/me/rewards/:r_id", JWT_MIDDLEWARE, async (req, res, next) => {
    try {
      console.log("💠 GET USER REWARDS [ME]");
      const { rewards } = await UserModel.findById(req.user._id);
      console.log(rewards);
      const reward = rewards.find(
        (reward) => reward._id.toString() === req.params.r_id
      );
      console.log("💠 FETCHED REWARDS [ME]");
      res.send(reward);
    } catch (e) {
      next(e);
    }
  })
  .get("/me/settings", JWT_MIDDLEWARE, async (req, res, next) => {
    try {
      console.log("💠 GET USER SETTINGS [ME]");
      const user_id = req.user._id;
      const my_user = await UserModel.findById(user_id);
      const settings = my_user.settings;
      console.log("💠 FETCHED SETTINGS [ME]");
      res.send(settings);
    } catch (e) {
      next(e);
    }
  })
  .get("/admin", ADMIN_MIDDLEWARE, async (req, res, next) => {
    try {
      console.log("💠 GET USERS [ADMIN]");
      const users = await UserModel.find();
      console.log("💠 FETCHED USERS [ADMIN]");
      res.send(users);
    } catch (e) {
      next(e);
    }
  })
  .get("/", async (req, res, next) => {
    try {
      console.log("💠 GET USERS QUERY");
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
      console.log("💠 FETCHED ALL USERS / BY QUERY");
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
      console.log("💠 GET USER [ADMIN]");
      const { u_id } = req.params;
      const user = await UserModel.findById(u_id);
      if (!user) {
        res.status(404).send({ message: `USER ${u_id} NOT FOUND` });
      } else {
        user.followedUsers = undefined;
        console.log("💠 FETCHED USER [ADMIN]");
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
        console.log("💠 PUT USER [ME]");
        const { user, body } = req;
        const { _id, first_name, last_name, password } = user;
        const originalEmail = user.email;
        const originalUsername = user.username;
        const email = body.email ? body.email.toLowerCase() : "";
        const username = body.username ? body.username.toLowerCase() : "";
        const emailDuplicate = await UserModel.find({ email });
        const usernameDuplicate = await UserModel.find({ username });
        if (
          !body.notification &&
          emailDuplicate.length > 0 &&
          emailDuplicate[0]._id.toString() !== _id.toString()
        ) {
          res.status(409).send({ error: `Email Exists` });
        } else if (
          !body.notification &&
          usernameDuplicate.length > 0 &&
          usernameDuplicate[0]._id.toString() !== _id.toString()
        ) {
          const available = await nameGenerator(username);
          res.status(409).send({ message: `Username Exists`, available });
        } else {
          const update = { ...body };
          if (body.email) {
            update.email = req.body.email.toLowerCase();
          }
          if (body.username) {
            update.username = req.body.username.toLowerCase();
          }
          console.log(update);
          if (req.file) {
            console.log("=>", req.file);
            const filePath = await getUserFilePath(req.file.path);
            update.avatar = filePath;
          }
          const filter = { _id: req.user._id };
          const updated = await UserModel.findOneAndUpdate(filter, update, {
            returnOriginal: false,
          });
          console.log("💠 UPDATED USER [ME]");
          await updated.save();
          res.send(updated);
        }
      } catch (e) {
        next(e);
      }
    }
  )
  .put("/me/rewards/:r_id", JWT_MIDDLEWARE, async (req, res, next) => {
    try {
      console.log("💠 PUT USER REWARD [ME]");
      const { _id, rewards, xp } = req.user;
      const { reward, value, available } = req.body;
      const { r_id } = req.params;
      const filtered = rewards.filter((item) => item._id.toString() !== r_id);
      const found = rewards.find((item) => item._id.toString() === r_id);
      let updatedReward = found;
      if (reward) {
        updatedReward.reward = reward;
      }
      if (value) {
        updatedReward.value = value;
      }
      if (available === 0) {
        updatedReward.available = null;
      }
      console.log(available, xp, value);
      // don't forget to change xp on user!
      const remainingXp = xp - value;
      const updatedRewards = [...filtered, updatedReward];
      const update = { rewards: updatedRewards, xp: remainingXp };
      // Would be nice to return it to same place. Maybe later?
      await UserModel.findByIdAndUpdate(_id, update, {
        returnOriginal: false,
      });
      console.log("💠 UPDATED USER REWARD [ME]");
      res.send(updatedReward);
    } catch (e) {
      next(e);
    }
  })
  .put("/me/settings", JWT_MIDDLEWARE, async (req, res, next) => {
    try {
      console.log("💠 PUT USER SETTINGS [ME]");
      const { _id } = req.user;
      const update = { settings: req.body };
      const { settings } = await UserModel.findByIdAndUpdate(_id, update, {
        returnOriginal: false,
      });
      console.log("💠 UPDATED USER SETTINGS [ME]");
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
        console.log("💠 PUT USER [ADMIN]");
        const { body, params } = req;
        const { u_id } = params;
        const email = body.email.toLowerCase();
        const username = body.username.toLowerCase();
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
            console.log("💠 UPDATED USER [ADMIN]");
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
      console.log("💠 LOG OUT");
      req.user.refreshToken = null;
      await req.user.save();
      console.log("💠 LOGGED OUT");
      res.send();
    } catch (e) {
      next(e);
    }
  })
  .delete("/me", JWT_MIDDLEWARE, async (req, res, next) => {
    try {
      console.log("💠 DELETE USER [ME]");
      const { _id, email } = req.user;
      const userDeleted = await UserModel.findByIdAndDelete(_id);
      if (userDeleted) {
        await TaskListModel.findOneAndDelete({ user: _id });
        await AchievementModel.findOneAndDelete({ user: _id });
        console.log("💠 DELETED USER [ME]");
        await sendGoodbye(email);
        res.status(204).send();
      }
    } catch (e) {
      next(e);
    }
  })
  .delete("/me/rewards/:r_id", JWT_MIDDLEWARE, async (req, res, next) => {
    try {
      console.log("💠 DELETE USER REWARD [ME]");
      const { _id, rewards } = req.user;
      const filtered = rewards.filter(
        (reward) => reward._id.toString() !== req.params.r_id
      );
      const updatedRewards = [...filtered];
      const update = { rewards: updatedRewards }; // Would be nice to return it to same place. Maybe later?
      const updated = await UserModel.findByIdAndUpdate(_id, update, {
        returnOriginal: false,
      });
      console.log("💠 DELETE USER REWARD [ME]");
      res.send(updated.rewards);
    } catch (e) {
      next(e);
    }
  })
  .delete("/:u_id", ADMIN_MIDDLEWARE, async (req, res, next) => {
    try {
      console.log("💠 DELETE USER [ADMIN]");
      const { u_id } = req.params;
      const deleteUser = await UserModel.findByIdAndDelete(u_id);
      if (deleteUser) {
        await TaskListModel.findOneAndDelete({ user: u_id });
        await AchievementModel.findOneAndDelete({ user: u_id });
        console.log("💠 DELETED USER [ADMIN]");
        res.status(204).send();
      } else {
        res.status(404).send({ message: `USER ${u_id} NOT FOUND` });
      }
    } catch (e) {
      next(e);
    }
  });

export default UserRoute;
