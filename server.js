const express = require("express");
// require('dotenv').config({ path: './config/.env' })
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");

const { exec } = require("child_process");
const solanaWeb3 = require("@solana/web3.js");
const splToken = require("@solana/spl-token");

const axios = require("axios");

var aws = require("aws-sdk");
var s3 = new aws.S3({
  accessKeyId: "",
  secretAccessKey: "",
  region: "ap-south-1",
});
const LooserNft = require("./model/looserNft.model");
//initializing the port
const PORT = process.env.PORT || 3002;

//creating the server
const app = express();
app.use(cors());

mongoose
  .connect("mongodb://localhost:27017/rumble", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("DB connection successful!"))
  .catch((err) => {
    console.log(err);
    console.log("Error connecting DB!");
  });

//parse the data from the request
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/home", (req, res) => {
  res.send("welcome");
});

app.post("/updateNFT", async (req, res) => {
  try {
    // const { nftToken, walletAddress } = req.body;

    const { roundNumber } = req.body;

    const getLooserNfts = await LooserNft.findOne({ roundNumber: roundNumber });
    var nftDatas = getLooserNfts.nftData;

    for (const singleNft of nftDatas) {
      const upgradeScript = `metaboss update uri \
        --keypair ~/.config/solana/sov1-9.json \
        --account ${singleNft.mint_account} \
        --new-uri https://sovereign-nftt.s3.ap-south-1.amazonaws.com/${singleNft.nftNumber}.json`;

      console.log(upgradeScript);
      exec(upgradeScript, (error, stdout, stderr) => {
        console.log(stdout);
        console.log(error);
        if (stdout !== "done" && error !== null) {
          return res.status(200).send({
            status: false,
            code: 400,
            message: "Unable to upgrade NFT.",
            data: { error, stderr },
          });
        }
      });
    }

    return res.status(200).send({
      status: true,
      code: 200,
      message: "NFT upgrade.",
      data: {},
    });
  } catch (e) {
    console.log(e);
    return res.status(200).send({
      status: false,
      code: 500,
      message: "Something went wrong!",
      data: {},
    });
  }
});

app.post("/storeTnxSignature", async (req, res) => {
  try {
    const { destination } = req.body;
    var allTransaction = [];
    // https://little-long-glade.solana-devnet.discover.quiknode.pro/c5d0746570dc7408f03da6989612e4b618dfa22c/

    const endpoint =
      "https://magical-neat-sound.solana-devnet.discover.quiknode.pro/2973528e9f79d9e372a733ec87d9176ad475b402/";
    const solanaConnection = new solanaWeb3.Connection(endpoint);

    const getTransactions = async (address) => {
      const pubKey = new solanaWeb3.PublicKey(address);
      let transactionList = await solanaConnection.getSignaturesForAddress(
        pubKey
        // {
        //   // limit: 2,
        // },
      );

      for (const transaction of transactionList) {
        console.log(transaction.signature);

        const data = await solanaConnection.getConfirmedTransaction(
          transaction.signature
        );

        allTransaction.push(data);
      }

      return res
        .status(200)
        .send({ data: { transactionList, allTransaction } });
    };

    getTransactions(destination);
  } catch (e) {
    console.log(e);
    return res.status(200).send({
      status: false,
      code: 500,
      message: "Something went wrong!",
      data: {},
    });
  }
});

//default route
app.all("*", (req, res) => {
  return res.status(200).send("URL not found");
});

//listening the server
app.listen(PORT, () => {
  console.log("server is running on port " + PORT);
});
