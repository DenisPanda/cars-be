import { Schema, model } from "mongoose";
import mPaginate from 'mongoose-paginate-v2';

mPaginate.paginate.options = {
  limit: 10,
  customLabels: {
    totalDocs: "count",
    docs: "data",
  },
};

const vehicleSchema = new Schema({
  make: String,
  year: Number,
  model: String,
});

vehicleSchema.index({ make: 1, year: 1, model: 1 }, { unique: true });

vehicleSchema.plugin(mPaginate);


// @TODO: quick typefix, find a better way
const v = model("vehicles", vehicleSchema);
const Vehicle: typeof v & {paginate: any} = v as any;

export default Vehicle;
