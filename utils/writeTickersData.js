const httpClient = require("axios");
const fs = require("fs");
const readFile = require("./readFile");

//Reads the API keys from the env file
const apiKeys = process.env.API_KEYS.toString().split("_");

//query the data of the saved tickers(symbols) from the API
const writeTickersData = async (
  tickersDataFileGlobal,
  index,
  tickersFilePath,
  tickersDataFilePath
) => {
  const date = new Date();
  const aYearAgo = new Date(new Date().setFullYear(date.getFullYear() - 1));

  const tickersFile = readFile(tickersFilePath);
  if (!tickersFile.tickers) return false;

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
          apiKeys[index.value + 1]
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
    index.value++;

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
    tickersDataFileGlobal.date = date.toISOString().slice(0, 10);
    tickersDataFileGlobal.tickersData = tickersData;
  } catch (err) {
    console.error("error writing tickers data: ", err);
    return false;
  }

  return true;
};

module.exports = writeTickersData;
