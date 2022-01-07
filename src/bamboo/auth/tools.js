import jwt from "jsonwebtoken";
import createHttpError from "http-errors";
import UserModel from "../routes/users/model.js";
import TokenModel from "../routes/tokens/model.js";

export const generateTokens = async (user) => {
  const accessToken = await generateJWT({ _id: user._id });
  const refreshToken = await generateRefreshJWT({ _id: user._id });
  user.refreshToken = refreshToken;
  await user.save();
  return { accessToken, refreshToken };
};
const generateJWT = (payload) =>
  new Promise((resolve, reject) =>
    jwt.sign(
      payload,
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: "1 week" },
      (err, token) => {
        if (err) reject(err);
        resolve(token);
      }
    )
  );
export const verifyJWT = (token) =>
  new Promise((resolve, reject) =>
    jwt.verify(token, process.env.JWT_ACCESS_SECRET, (err, decodedToken) => {
      if (err) reject(err);
      resolve(decodedToken);
    })
  );
const generateRefreshJWT = (payload) =>
  new Promise((resolve, reject) =>
    jwt.sign(
      payload,
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "1 week" },
      (err, token) => {
        if (err) reject(err);
        resolve(token);
      }
    )
  );
export const verifyRefreshJWT = (token) =>
  new Promise((resolve, reject) =>
    jwt.verify(token, process.env.JWT_REFRESH_SECRET, (err, decodedToken) => {
      if (err) reject(err);
      resolve(decodedToken);
    })
  );
export const refreshTokens = async (actualRefreshToken) => {
  const decodedRefreshToken = await verifyRefreshJWT(actualRefreshToken);
  const user = await UserModel.findById(decodedRefreshToken._id);
  if (!user) throw new Error("user not found!");
  if (user.refreshToken === actualRefreshToken) {
    const { accessToken, refreshToken } = await generateTokens(user);
    return { accessToken, refreshToken };
  } else {
    throw createHttpError(401, "Refresh Token not valid!");
  }
};
export const detectReuse = async (token) => {
  const foundToken = await TokenModel.findOne({ token });
  if (foundToken) {
    throw createHttpError(403, "Token detected!");
  } else {
    // add token to the list so it cannot be used again.
    console.log("💠 ADDED TOKEN TO DATABASE");
    const newToken = new TokenModel({ token });
    await newToken.save();
  }
};
