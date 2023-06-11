const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mykey = require('./mykey.js');
const { list } = require('mongodb/lib/gridfs/grid_store.js');
app.use(bodyParser.urlencoded({ extended: true }));
const MongoClient = require('mongodb').MongoClient;
const methodOverride = require('method-override');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
require('dotenv').config();   // 환경변수 라이브러리
app.use(methodOverride('_method'));
app.set('view engine', 'ejs');
app.use('/public', express.static('public'));
app.use(session({ secret: '비밀코드아무거나', resave: true, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

let db;
MongoClient.connect(process.env.DB_URL, function (error, client) {
    if (error) return console.log(error);

    db = client.db('todoapp');

    app.listen(process.env.PORT, function () {
        console.log('listening on', process.env.PORT);
    })
});

app.get('/', function (req, res) {
    res.render('index.ejs');
});

app.get('/write', function (req, res) {
    res.render('write.ejs');
});


app.post('/add', function (req, res) {
    res.render('writeDone.ejs');
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
});

app.get('/list', function (req, res) {
    db.collection('post').find().toArray(function (error, result) {
        res.render('list.ejs', { posts: result });
    });
});

app.get('/search', (req, res) => {
    // db.collection('post').find({ $text: { $search: req.query.value } }).toArray((error, result) => {
    //     res.render('list.ejs', { posts: result })  // text index 한글에 불친화적
    // })
    const searchOption = [
        {
            $search: {
                index: 'titleSearch',
                text: {
                    query: req.query.value,
                    path: 'title'  // title, date 둘 다 찾으려면 ['title', 'date]
                }
            }
        },
        { // 정렬 옵션
            $sort: { _id: 1 } // 오름차순 1, 내림차순 -1
        },
        { // 가져는는 개수 제한
            $limit: 10
        },
        // { // search score (많이 검색되는지)
        //     $project: { title: 1, _id: 0, score: { $meta: "searchScore" } } // _id에 0 넣으면 _id는 안 가져옴
        // }
    ]
    db.collection('post').aggregate(searchOption).toArray((error, result) => {
        console.log(result);
        res.render('list.ejs', { posts: result })
    })
})

app.delete('/delete', function (req, res) {
    console.log(req.body);
    req.body._id = parseInt(req.body._id);
    db.collection('post').deleteOne(req.body, function (error, result) {
        console.log('Success Delete');
        res.status(200).send({ message: 'Success' });
    });
});

app.get('/detail/:id', function (req, res) {
    db.collection('post').findOne({ _id: parseInt(req.params.id) }, function (error, result) {
        console.log(result);
        res.render('detail.ejs', { data: result });
    });
});

app.get('/edit/:id', function (req, res) {
    db.collection('post').findOne({ _id: parseInt(req.params.id) }, function (error, result) {
        res.render('edit.ejs', { post: result });
    });
});

app.put('/edit', function (req, res) {
    db.collection('post').updateOne({ _id: parseInt(req.body.id) }, { $set: { title: req.body.title, date: req.body.date } }, function (error, result) {
        console.log('수정완료');
        res.redirect('/list');
    });
});

app.get('/login', function (req, res) {
    res.render('login.ejs');
});

app.post('/login', passport.authenticate('local', {
    failureRedirect: '/fail'
}), function (req, res) {
    res.redirect('/');
});

app.get('/mypage', loginCheck, function (req, res) {
    console.log(req.user);
    res.render('mypage.ejs', { user: req.user });
});

function loginCheck(req, res, next) {
    if (req.user) {
        next();
    } else {
        res.redirect('/login');
    }
}

passport.use(new LocalStrategy({
    usernameField: 'id',
    passwordField: 'pw',
    session: true,
    passReqToCallback: false
}, function (inputId, inputPw, done) {
    console.log(inputId, inputPw);
    db.collection('login').findOne({ id: inputId }, function (error, result) {
        if (error) return done(error)
        if (!result) return done(null, false, { message: 'Invalid User Id' })
        if (inputPw == result.pw) { // 나중에 암호화 해서 비교해야 보안이 됨
            return done(null, result)
        } else {
            return done(null, false, { message: 'Invalid Password' })
        }
    });
}));

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    db.collection('login').findOne({ id: id }, function (error, result) {
        done(null, result);
    })
});