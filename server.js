require('dotenv').config();
const express = require('express');
const bodyParser = require("body-parser")
const mongoose = require("mongoose")
const urlparser = require("url")
const cors = require('cors');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const schema = new mongoose.Schema({
  original_url:  { type: 'string', required: true },
  short_url: Number
  });

let Url = mongoose.model('Url', schema);

mongoose.set('useFindAndModify', false)

//app.use(bodyParser.urlencoded({extended: false}))
app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});


// Your first API endpoint
app.post('/api/shorturl', bodyParser.urlencoded({extended: false}), (req, res) => {
  let inputUrl = req.body['url'];

  let urlRegex = new RegExp(/http?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/)

  if(!inputUrl.match(urlRegex)) {
    res.json({error: "Invalid URL"});
    return;
  }
  
  
  Url.findOne({original_url: inputUrl}, (error, result) => {
    if (!error && result != undefined) {
      res.json({ original_url : result.original_url, short_url : result.short_url});
    } else {
        Url.findOne({}).sort({short_url: 'desc'}).exec((error, urlResult) => {
          if (!error) {
            if (urlResult == null) {
              let short_url = 1
                  Url.findOneAndUpdate({original_url: inputUrl}, 
                  {original_url: inputUrl, short_url: short_url }, 
                  {new: true, upsert: true },
                  (err, savedUrl) => {
                  if(!err) {
                    res.json({ original_url : urlResult.inputUrl, short_url : short_url});
                  }
                }
              )
            } else {
              console.log(urlResult)
              let newShort = urlResult.short_url + 1;
    
              Url.findOneAndUpdate({original_url: inputUrl}, 
              {original_url: inputUrl, short_url: newShort }, 
              {new: true, upsert: true },
              (err, savedUrl) => {
                if(!err) {
                  res.json({ original_url : inputUrl, short_url : newShort});
                }
              }
            )
          }
      }
    })
  }
  })

})


app.get('/api/shorturl/:input', (req, res) => {
  let input = req.params.input

  Url.findOne({short_url: input}, (err, result) => {
    if(!err && result != undefined) {
      res.redirect(result.original_url);
    } else {
      res.json('URL not found');
    }
  })
})


app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
