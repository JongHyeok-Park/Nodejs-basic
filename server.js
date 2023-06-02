const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mykey = require('./mykey.js');
const { list } = require('mongodb/lib/gridfs/grid_store.js');
app.use(bodyParser.urlencoded({ extended: true }));
const MongoClient = require('mongodb').MongoClient;
app.set('view engine', 'ejs');

let db;
MongoClient.connect(`mongodb+srv://admin:${mykey.dbkey}@cluster0.oawj1is.mongodb.net/?retryWrites=true&w=majority`, function (error, client) {
    if (error) return console.log(error);

    db = client.db('todoapp');

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
    res.sendFile(__dirname + '/pages/writeDone.html');
    const title = req.body.title;
    const date = req.body.date;
    db.collection('counter').findOne({ name: '게시물 갯수' }, function (error, result) {
        console.log(result.totalPost);
        let total = result.totalPost;
        db.collection('post').insertOne({ _id: total, title: title, date: date }, function (error, result) {
            console.log('저장완료');
            db.collection('counter').updateOne({ name: '게시물 갯수' }, { $inc: { totalPost: 1 } }, function (error, result) {
                if (error) return console.log(error);
            });
        });
    });
})

app.get('/list', function (req, res) {
    db.collection('post').find().toArray(function (error, result) {
        res.render('list.ejs', { posts: result });
    });
})

app.delete('/delete', function (req, res) {
    console.log(req.body);
})