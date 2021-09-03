const fs = require("fs");

//Gives back the json data from the given file
const readFile = (filePath) => {
  let jsonData = {};

  try {
    const file = fs.readFileSync(filePath);
    jsonData = JSON.parse(file);
  } catch (err) {
    console.error(err);
    jsonData = {};
  } finally {
    return jsonData;
  }
};

module.exports = readFile;
