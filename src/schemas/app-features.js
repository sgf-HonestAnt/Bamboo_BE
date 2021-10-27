import mongoose from "mongoose";

const { Schema, model } = mongoose;

const featureSchema = new Schema(
  {
    month: {
      type: String,
      required: true,
    },
    descrip: { type: String, required: true },
    level: { type: Number, default: 0, required: true },
    value: { type: Number, default: 0, required: true },
  },
  { timestamps: true }
);

featureSchema.static("findFeatures", async function (query) {
    const total = await this.countDocuments(query.criteria);
    const features = await this.find(query.criteria, query.options.fields)
      .limit(query.options.limit)
      .skip(query.options.skip)
      .sort(query.options.sort);
    return { total, features };
  });

featureSchema.methods.toJSON = function () {
  const userDoc = this;
  const userObj = userDoc.toObject();
  delete userObj.__v;
  return userObj;
};

export default model("Feature", featureSchema);
