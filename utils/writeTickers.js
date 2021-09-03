const httpClient = require("axios");
const fs = require("fs");

//Reads the API keys from the env file
const apiKeys = process.env.API_KEYS.toString().split("_");

//query the tickers data from the API and writes it in a data file
const writeTickers = async (tickersFileGlobal, tickersFilePath) => {
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
    tickersFileGlobal.tickers = tickers.data;
  } catch (err) {
    console.error("error writing tickers data: ", err);
    return false;
  }

  return true;
};

module.exports = writeTickers;
