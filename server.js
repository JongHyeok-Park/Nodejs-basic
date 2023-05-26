const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mykey = require('./mykey.js');
app.use(bodyParser.urlencoded({ extended: true }));
const MongoClient = require('mongodb').MongoClient;


MongoClient.connect(`mongodb+srv://admin:${mykey.dbkey}@cluster0.oawj1is.mongodb.net/?retryWrites=true&w=majority`, function (error, client) {
    if (error) return console.log(error);

    app.listen(8080, function () {
        console.log('listening on 8080')
    })
})

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/pages/index.html');
});

app.get('/write', function (req, res) {
    res.sendFile(__dirname + '/pages/write.html');
});


app.post('/add', function (req, res) {
    res.send('전송완료');
    console.log(req.body.title);
    console.log(req.body.date);
})