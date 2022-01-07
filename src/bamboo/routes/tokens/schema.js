import mongoose from "mongoose";

const TokenSchema = new mongoose.Schema(
  {
    token: { type: String },
  },
  {
    timestamps: false,
  }
);

TokenSchema.methods.toJSON = function () {
  const userDoc = this;
  const userObj = userDoc.toObject();
  delete userObj.__v;
  return userObj;
};

export default TokenSchema;
