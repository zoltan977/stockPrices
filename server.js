require("dotenv").config();

const express = require("express");
const app = express();
const cors = require("cors");
const readFile = require("./utils/readFile");
const init = require("./utils/initAndUpdate");

const PORT = process.env.PORT || 8000;

app.use(cors());
app.use("/", express.static(__dirname + "/public"));
app.use(express.json({ extended: false }));

//Indicates the state of the updating process
let index = { value: 0 };
//Indicates if there is an updating in progress
let updating = { value: false };

const tickersFilePath = __dirname + "/data/" + "tickers.json";
const tickersDataFilePath = __dirname + "/data/" + "tickersData.json";
//Stores the pre-read data in these variables
let tickersFileGlobal = readFile(tickersFilePath);
let tickersDataFileGlobal = readFile(tickersDataFilePath);

//initiates an updating process
app.get("/api/refresh", async (req, res) => {
  if (updating.value) return;

  const respOfInit = await init(
    index,
    updating,
    tickersFilePath,
    tickersDataFilePath,
    tickersFileGlobal,
    tickersDataFileGlobal
  );

  if (respOfInit) return res.json({ msg: "Database has been updated" });
  else return res.status(500).json({ msg: "Error updating database" });
});

//gives back the current state of the updating process
app.get("/api/index", async (req, res) => {
  return res.json({ index: index.value });
});

//gives back the ticker symbols
app.get("/api/tickers", (req, res) => {
  if (!tickersFileGlobal.tickers)
    return res.status(500).json({ err: "Server Error (file reading error)" });

  return res.json({ data: tickersFileGlobal.tickers });
});

//gives back the data of the ticker the symbol of which has been posted
app.post("/api/tickersData", (req, res) => {
  if (!tickersDataFileGlobal.tickersData)
    return res.status(500).json({ err: "Server Error (file reading error)" });

  const ticker = req.body.ticker;
  return res.json({
    data: tickersDataFileGlobal.tickersData.filter(
      (td) => td.symbol === ticker
    ),
  });
});

app.listen(PORT, function () {
  console.log("Express server listening on port ", PORT);
});
