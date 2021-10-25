import express from "express";
import q2m from "query-to-mongo";
import createHttpError from "http-errors";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import UserModel from "../schemas/users.js";
import generator from "../utils/generator.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: { folder: "capstone_users" },
});

const ADMIN_MIDDLEWARE = (req, res, next) => {
  console.log("We will run admin middleware");
  next();
};

const JWT_MIDDLEWARE = (req, res, next) => {
  console.log("We will run JWT middleware");
  next();
};

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
  .post("/register", async (req, res, next) => {
    console.log("🔸REGISTER", route);
    try {
      console.log("Hey");
    } catch (e) {
      next(e);
    }
  })
  .post("/session", async (req, res, next) => {
    console.log("🔸LOGIN", route);
    try {
      console.log("Hey");
    } catch (e) {
      next(e);
    }
  })
  .post("/", ADMIN_MIDDLEWARE, async (req, res, next) => {
    console.log("🔸POST", route);
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
        res.status(201).send({ _id });
      }
    } catch (e) {
      next(e);
    }
  })
  .post("/request/:u_id", JWT_MIDDLEWARE, async (req, res, next) => {
    console.log("🔸REQUEST TO FOLLOW", route);
    try {
      console.log("Hey");
    } catch (e) {
      next(e);
    }
  })
  .post("/accept/:u_id", JWT_MIDDLEWARE, async (req, res, next) => {
    console.log("🔸ACCEPT FOLLOW BY", route);
    try {
      console.log("Hey");
    } catch (e) {
      next(e);
    }
  })
  .post("/reject/:u_id", JWT_MIDDLEWARE, async (req, res, next) => {
    console.log("🔸REJECT FOLLOW BY", route);
    try {
      console.log("Hey");
    } catch (e) {
      next(e);
    }
  })
  .get("/me", JWT_MIDDLEWARE, async (req, res, next) => {
    console.log("🔸GET ME");
    try {
      console.log("Yo");
    } catch (e) {
      next(e);
    }
  })
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
  .put("/me", JWT_MIDDLEWARE, async (req, res, next) => {
    console.log("🔸PUT ME");
    try {
      console.log("Yo");
    } catch (e) {
      next(e);
    }
  })
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
  .put("/:u_id", ADMIN_MIDDLEWARE, async (req, res, next) => {
    console.log("🔸PUT", route);
    try {
      const { u_id } = req.params;
      const editedUser = await UserModel.findByIdAndUpdate(u_id, req.body, {
        new: true,
      });
      if (editedUser) {
        res.send(editedUser);
      } else {
        next(createHttpError(404, `💀USER ID_${u_id} NOT FOUND`));
      }
    } catch (e) {
      next(e);
    }
  })
  .delete("/session", JWT_MIDDLEWARE, async (req, res, next) => {
    console.log("🔸LOG OUT", route);
    try {
      console.log("Hey");
    } catch (e) {
      next(e);
    }
  })
  .delete("/me", JWT_MIDDLEWARE, async (req, res, next) => {
    console.log("🔸DELETE ME");
    try {
      console.log("Yo");
    } catch (e) {
      next(e);
    }
  })
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
