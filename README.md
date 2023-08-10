# CryptoTweet

> :warning: Do not use in the real world! I'm not responsible for any trading that happens with this code. Needs more testing and error handling.

A tool that uses Twitter's filtered stream API to look for keywords in the tweets of specific persons and uses them to init trades on the crypto broker Binance. As the market behaviour is too unpredictable, the tool sells after a specific time (best to set by looking at the history).


## Setup

Install Node and required packages
```
npm install
```

Replace trigger words/twitter account source and set crypto configurations in 'index.js'
```
triggerWords = ['doge', 'dogecoin', 'wow', 'moon'];
accountName = 'tweetingPerson';
```

Put your Binance credentials in an .env file
```
BINANCE_API_KEY=XXXXXXXXXX
BINANCE_API_SECRET=XXXXXXXXXX
```


Run 
```
node index.js
```

