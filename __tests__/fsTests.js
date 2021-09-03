require("dotenv").config();
jest.mock("fs");
const fs = require("fs");
const axiosMockAdapter = require("axios-mock-adapter");
const axios = require("axios");
const apiKeys = process.env.API_KEYS.toString().split("_");
const writeTickers = require("../utils/writeTickers");
const writeTickersData = require("../utils/writeTickersData");

//checking if the mocked out file system module works
test("file read write test", () => {
  fs.writeFileSync("tickersMockFilePath", "test data");
  const result = fs.readFileSync("tickersMockFilePath");

  expect(result).toBe("test data");
});

//checking if the writeTickers module is working correctly
test("writeTickers unit test", async () => {
  //given axios http request to the API (http://api.marketstack.com/v1/tickers... url)
  //is mocked out and the mock gives back the 2 element array of
  //[{symbol: "SYM01"}, {symbol: "SYM02"}]

  //and the nodejs fs modul(file system module) is also mocked out
  //and the mock stores data
  //when we give it "tickersMockFilePath" as file path
  const mocked = new axiosMockAdapter(axios);
  let tickersFileGlobal = {};

  mocked
    .onGet(
      `http://api.marketstack.com/v1/tickers?access_key=${apiKeys[0]}&limit=1000`
    )
    .reply(200, {
      data: [
        {
          symbol: "SYM01",
        },
        {
          symbol: "SYM02",
        },
      ],
    });

  //when we call writeTickers module with an object and the mock file path string
  await writeTickers(tickersFileGlobal, "tickersMockFilePath");

  //then the mock file should store the data that was given back by the mock API call(axios http call)
  //and the golbal object should contain the same
  const result = fs.readFileSync("tickersMockFilePath");

  expect(Array.isArray(JSON.parse(result).tickers)).toBe(true);
  expect(JSON.parse(result).tickers.length).toBe(2);
  expect(Array.isArray(tickersFileGlobal.tickers)).toBe(true);
  expect(tickersFileGlobal.tickers.length).toBe(2);
});

//checking if the writeTickersData module is working correctly
test("write tickers data unit test", async () => {
  //given axios http requests to the API (http://api.marketstack.com/v1/eod?access_key=... url)
  //is mocked out and the mock gives back the 3 element array of
  //[1, 2, 3]

  //and the nodejs fs modul(file system module) is also mocked out
  //and the mock stores data
  //when we give it "tickersMockFilePath" or "tickersDataMockFilePath" as file path

  const mocked = new axiosMockAdapter(axios);
  let tickersDataFileGlobal = {};

  mocked
    .onGet(/^http:\/\/api.marketstack.com\/v1\/eod\?access_key=/)
    .reply(200, {
      data: [1, 2, 3],
    });

  //////////////////////////////////////////////////////////////////////
  const arr = [];

  for (let index = 0; index < 32; index++) {
    arr.push({ symbol: `SYM` });
  }

  const tickersFileContent = {
    tickers: arr,
  };

  //and given ticksersMockFile contains a 32 element array of {symbol: `SYM`}
  fs.writeFileSync("tickersMockFilePath", JSON.stringify(tickersFileContent));

  const index = { value: 0 };

  //when we call writeTickersData with an object and index and the two mock file path
  await writeTickersData(
    tickersDataFileGlobal,
    index,
    "tickersMockFilePath",
    "tickersDataMockFilePath"
  );

  //then tickersDataMockFile should contain an array of [1, 2, 3] which was given back by the mocked API call
  //and the golbal object should contain the same
  const result = fs.readFileSync("tickersDataMockFilePath");

  expect(Array.isArray(JSON.parse(result).tickersData)).toBe(true);
  expect(JSON.parse(result).tickersData.length).toBe(3);
  expect(Array.isArray(tickersDataFileGlobal.tickersData)).toBe(true);
  expect(tickersDataFileGlobal.tickersData.length).toBe(3);
});
