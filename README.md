## Stock Prices

Stock Prices is a mobile-friendly single-page data visualisation website. It was created with vanilla javascript and the D3js library and uses NodeJs as a backend. It displays the stock prices of 1000 companies for the last one year on a line-chart and it can show the daily changes for a selected day on a bar-chart.

## Features

- From the drop-down list, you can select the company whose stock prices you want to view
- On the line chart a single day can be selected with a click
- When that happens the daily development of stock prices is displayed in a pop-up window
- The pop-up window can be closed by a click on it
- There is a data-update button on the bottom of the page
- If the data-update button is pressed and the stored data is older than one day then the datafiles will be updated on the backend

## Demo

Application can be tested on this [demo](https://polar-lowlands-28295.herokuapp.com) page

## Tech-stack:

- [D3js](https://d3js.org/) - JavaScript library for datavisualization
- [node.js](https://nodejs.org/en/) - Stores the API provided data in files
- [Express](https://expressjs.com/) - Communicates with the frontend
- Vanilla Javascript - Event handling on the frontend, communication with the backend, and data visualisation with the help of D3js

## Installation

Stock Prices requires [Node.js](https://nodejs.org/) v14+ to run.

Install the dependencies and devDependencies and start the server.
Open your favorite Terminal and run these commands.

```sh
npm i
node server.js
```

You should see the running application by navigating to

```sh
127.0.0.1:8000
```

in your preferred browser

## Unit Tests

With the command
```sh
npm run test
```
backend unit tests can be run

## License

MIT
