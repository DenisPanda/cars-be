import { Schema, model, PipelineStage } from "mongoose";
import mPaginate from "mongoose-paginate-v2";

mPaginate.paginate.options = {
  limit: 10,
  customLabels: {
    totalDocs: "count",
    docs: "data",
  },
};

const vehicleSchema = new Schema({
  make: { type: String, required: true, index: true },
  year: { type: Number, required: true, index: true },
  model: { type: String, required: true, index: true },
});

vehicleSchema.index({ make: 1, year: 1, model: 1 }, { unique: true });

// fuzzy search
vehicleSchema.static("searchFuzzy", function (qs: string | number, limit = 10, skip: 0) {
  const keys = ["make", "year", "model"];

  const sQ = typeof qs === 'string' ? qs.trim() : qs

  // if query is a valid string or num
  if (sQ || sQ === 0) {
    let searchParams = {} as PipelineStage;

    if (typeof sQ === 'string') {
      // fuzzy search
      searchParams = {
        $search: {
          index: 'Fuzzy Autocomplete',
          compound: {
            should: keys.map((path) => ({
              autocomplete: {
                query: sQ,
                path,
                fuzzy: {
                  maxEdits: 2,
                  prefixLength: 3,
                },
              },
            })),
          },
        },
      };
    } else {
      // number search, only year is num
      searchParams = {
        $match: {
          year: {
            $eq: sQ
          }
        }
      }
    }

    return this.aggregate([
      searchParams,
      {
        $limit: limit,
      },
      {
        $skip: skip
      },
    ]);
  } else {
    // if string is empty (or value false) simple find will do
    return this.find().sort({ $natural: -1 }).skip(skip).limit(limit);
  }
});

vehicleSchema.plugin(mPaginate);

// @TODO: quick typefix, find a better way
const v = model("vehicles", vehicleSchema);
const Vehicle: typeof v & {
  paginate: any;
  searchFuzzy: (qs: string | number, limit?: number) => any;
} = v as any;

export default Vehicle;
