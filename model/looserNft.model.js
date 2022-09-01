const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const looserNftSchema = new Schema(
  {
    roundNumber: {
      type: Number,
      required: true,
    },
    nftList: {
      type: Array,
      default: [],
    },
    nftData: [
      {
        nftNumber: {
          type: Number,
          required: true,
        },
        mint_account: {
          type: String,
          required: true,
        },
      },
    ],
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("LooserNft", looserNftSchema);
