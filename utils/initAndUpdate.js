const readFile = require("./readFile");
const writeTickers = require("./writeTickers");
const writeTickersData = require("./writeTickersData");

//updates the data files if they are outdated or not existent
const init = async (
  index,
  updating,
  tickersFilePath,
  tickersDataFilePath,
  tickersFileGlobal,
  tickersDataFileGlobal
) => {
  let respOfWriteTickers = true;
  let respOfWriteTickersData = true;
  updating.value = true;
  const tickersData = readFile(tickersDataFilePath);
  //starts the updating process if it is necessary
  if (
    !tickersData.date ||
    tickersData.date.toString().slice(0, 7) !==
      new Date().toISOString().slice(0, 7)
  ) {
    respOfWriteTickers = await writeTickers(tickersFileGlobal, tickersFilePath);
    respOfWriteTickersData = await writeTickersData(
      tickersDataFileGlobal,
      index,
      tickersFilePath,
      tickersDataFilePath
    );
  }
  updating.value = false;
  index.value = 0;

  if (!respOfWriteTickers || !respOfWriteTickersData) return false;

  return true;
};

module.exports = init;
