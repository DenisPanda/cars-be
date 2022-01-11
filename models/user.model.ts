import { Schema, model } from "mongoose";
import mPaginate from 'mongoose-paginate-v2';

// should be kept DRY, oh well...
mPaginate.paginate.options = {
  limit: 10,
  customLabels: {
    totalDocs: "count",
    docs: "data",
  },
};

const userSchema = new Schema(
  {
    email: { type: String, unique: true },
    digest: String,
  },
  { timestamps: true }
);

userSchema.plugin(mPaginate);


const v = model("user", userSchema);
const User: typeof v & {paginate: any} = v as any;

export default User;
