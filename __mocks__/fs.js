const fs = jest.createMockFromModule("fs");

const mockFileData = {
  tickersMockFilePath: JSON.stringify({}),
  tickersDataMockFilePath: JSON.stringify({}),
};

fs.readFileSync = (filePath) => {
  if (mockFileData[filePath]) return mockFileData[filePath];
  else throw { msg: "The file not exists" };
};

fs.writeFileSync = (filePath, dataString) => {
  if (mockFileData[filePath]) mockFileData[filePath] = dataString;
  else throw { msg: "The file not exists" };
};

module.exports = fs;
