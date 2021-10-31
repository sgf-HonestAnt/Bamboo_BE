import mongoose from "mongoose";

// const { Schema } = mongoose;

const FeatureSchema = new mongoose.Schema(
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

FeatureSchema.static("findFeatures", async function (query) {
  const total = await this.countDocuments(query.criteria);
  const features = await this.find(query.criteria, query.options.fields)
    .limit(query.options.limit)
    .skip(query.options.skip)
    .sort(query.options.sort);
  return { total, features };
});

FeatureSchema.methods.toJSON = function () {
  const featureDoc = this;
  const featureObj = featureDoc.toObject();
  delete featureObj.__v;
  return featureObj;
};

export default FeatureSchema;
