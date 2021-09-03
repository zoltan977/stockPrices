require("dotenv").config();

const express = require("express");
const app = express();
const fs = require("fs");
const cors = require("cors");
const httpClient = require("axios");

const PORT = process.env.PORT || 8000;

app.use(cors());
app.use("/", express.static(__dirname + "/public"));
app.use(express.json({ extended: false }));

const tickersFilePath = __dirname + "/data/" + "tickers.json";
const tickersDataFilePath = __dirname + "/data/" + "tickersData.json";

//Indicates the state of the updating process
let index = 0;
//Indicates if there is an updating in progress
let updating = false;

//Reads the API keys from the env file
const apiKeys = process.env.API_KEYS.toString().split("_");

//Gives back the json data from the given file
const readFile = (filePath) => {
  let jsonData = null;

  try {
    const file = fs.readFileSync(filePath);
    jsonData = JSON.parse(file);
  } catch (err) {
    console.error(err);
    jsonData = null;
  } finally {
    return jsonData;
  }
};

//Stores the pre-read data in these variables
let tickersFileGlobal = readFile(tickersFilePath);
let tickersDataFileGlobal = readFile(tickersDataFilePath);

//updates the data files if they are outdated or not existent
const init = async () => {
  //query the tickers data from the API and writes it in a data file
  const writeTickers = async () => {
    let tickers;
    try {
      const response = await httpClient.get(
        `http://api.marketstack.com/v1/tickers?access_key=${apiKeys[0]}&limit=1000`
      );
      tickers = response.data;
    } catch (error) {
      console.error("error getting tickers data: ", error);
      return false;
    }

    try {
      fs.writeFileSync(
        tickersFilePath,
        JSON.stringify({ tickers: tickers.data })
      );

      //updates the global variable
      tickersFileGlobal = { tickers: tickers.data };
    } catch (err) {
      console.error("error writing tickers data: ", err);
      return false;
    }

    return true;
  };

  //query the data of the saved tickers(symbols) from the API
  const writeTickersData = async () => {
    const date = new Date();
    const aYearAgo = new Date(new Date().setFullYear(date.getFullYear() - 1));

    const tickersFile = readFile(tickersFilePath);
    if (!tickersFile) return false;

    //symbols of the stored tickers
    const symbolsArray = [];
    for (const t of tickersFile.tickers) {
      symbolsArray.push(t.symbol);
    }

    const chunkArray = (inputArray, chunk_size) => {
      const outputArray = [];

      while (inputArray.length) {
        outputArray.push(inputArray.splice(0, chunk_size));
      }

      return outputArray;
    };

    //stores the 1000 ticker sybols in arrays of 32 elements
    const chunkedSymbolsArray = chunkArray(symbolsArray, 32);

    const tickersData = [];
    //queries the API in a for loop
    //retrives the data(of the last one year) of 32 items(symbols) in every loop
    for (const chunk of chunkedSymbolsArray) {
      let response;
      try {
        const resp = await httpClient.get(
          `http://api.marketstack.com/v1/eod?access_key=${
            apiKeys[index + 1]
          }&symbols=${chunk.join(",")}&limit=10000&date_from=${aYearAgo
            .toISOString()
            .slice(0, 10)}&date_to=${date.toISOString().slice(0, 10)}`
        );

        response = resp.data;
      } catch (error) {
        console.error("error getting tickers data: ", error);

        return false;
      }

      //indicates the state of the updating process
      index++;

      console.log("pagination: ", response.pagination);

      tickersData.push(...response.data);
    }

    //writing the data of the tickers in a file
    try {
      fs.writeFileSync(
        tickersDataFilePath,
        JSON.stringify({
          date: date.toISOString().slice(0, 10),
          tickersData: tickersData,
        })
      );

      //updates the global variable
      tickersDataFileGlobal = {
        date: date.toISOString().slice(0, 10),
        tickersData: tickersData,
      };
    } catch (err) {
      console.error("error writing tickers data: ", err);
      return false;
    }

    return true;
  };

  //starts the updating process if it is necessary
  let respOfWriteTickers = true;
  let respOfWriteTickersData = true;
  updating = true;
  const tickersData = readFile(tickersDataFilePath);
  if (
    !tickersData ||
    !tickersData.date ||
    tickersData.date !== new Date().toISOString().slice(0, 10)
  ) {
    respOfWriteTickers = await writeTickers();
    respOfWriteTickersData = await writeTickersData();
  }
  updating = false;
  index = 0;

  if (!respOfWriteTickers || !respOfWriteTickersData) return false;

  return true;
};

//initiates an updating process
app.get("/api/refresh", async (req, res) => {
  if (updating) return;

  const respOfInit = await init();

  if (respOfInit) return res.json({ msg: "Database has been updated" });
  else return res.status(500).json({ msg: "Error updating database" });
});

//gives back the current state of the updating process
app.get("/api/index", async (req, res) => {
  return res.json({ index });
});

//gives back the ticker symbols
app.get("/api/tickers", (req, res) => {
  if (!tickersFileGlobal || !tickersFileGlobal.tickers)
    return res.status(500).json({ err: "Server Error (file reading error)" });

  return res.json({ data: tickersFileGlobal.tickers });
});

//gives back the data of the ticker the symbol of which has been posted
app.post("/api/tickersData", (req, res) => {
  if (!tickersDataFileGlobal || !tickersDataFileGlobal.tickersData)
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
