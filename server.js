const express = require('express');
const app = express();
const fs = require('fs');
const cors = require('cors');
const fetch = require('node-fetch');

const PORT = process.env.PORT || 8000;




const tickersFilePath = __dirname + '/data/' + 'tickers.json';
const tickersDataFilePath = __dirname + '/data/' + 'tickersData.json';

let jsonData = null;

const readTickers = () => {
    try {
        let data = fs.readFileSync(tickersFilePath);
        jsonData = JSON.parse(data);
    } catch (err) {
        console.error(err);
    }
}

const writeTickers = async () => {
    
    const tickers = await fetch("http://api.marketstack.com/v1/tickers?access_key=7df8a4a764f434b90f370ddf777fd110&limit=1000")
    .then(r => r.json());

    try {
        fs.writeFileSync(tickersFilePath, JSON.stringify({tickers: tickers.data}));
    } catch (err) {
        console.error(err);
    }

}

readTickers()
if (!jsonData || !jsonData.tickers || !jsonData.tickers.length) {
    writeTickers()
}


const readTickersData = () => {

    try {
        let data = fs.readFileSync(tickersDataFilePath);
        jsonData = JSON.parse(data);
    } catch (err) {
        console.error(err);
    }
}

const writeTickersData = async () => {

    const date = new Date()
    const aYearAgo = new Date((new Date()).setFullYear(date.getFullYear() - 1));

    readTickers()

    let tickersData = {}
    for (const ticker of jsonData.tickers) {
        
        const tickerData = await fetch(`http://api.marketstack.com/v1/eod?access_key=7df8a4a764f434b90f370ddf777fd110&symbols=${ticker.symbol}&limit=1000&date_from=${aYearAgo.toISOString().slice(0, 10)}&date_to=${date.toISOString().slice(0, 10)}`)
        .then(r => r.json());

        tickersData[ticker.symbol] = tickerData.data
    }

    try {
        fs.writeFileSync(tickersDataFilePath, JSON.stringify({date: date.toISOString().slice(0, 10), tickersData: tickersData}));
    } catch (err) {
        console.error(err);
    }

}

readTickersData()
if (!jsonData || !jsonData.date || (jsonData.date !== new Date().toISOString().slice(0, 10))) {
    writeTickersData()
}



app.use(cors())
app.use('/', express.static(__dirname + '/public'))
app.use(express.json({ extended: false }))

app.get(
    '/api/tickers',
    (req, res) => {
        
        readTickers()

        res.json({data: jsonData.tickers})
})

app.get(
    '/api/tickersData/:ticker',
    (req, res) => {
           
        readTickersData()

        const ticker = req.params.ticker

        res.json({data: jsonData.tickersData[ticker]})
})


app.listen(PORT, function() {
    console.log('Express server listening on port ', PORT);
});