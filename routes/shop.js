const router = require('express').Router();

function loginCheck(req, res, next) {
    if (req.user) {
        next();
    } else {
        res.redirect('/login');
    }
}

router.use(loginCheck);

router.get('/shirts', function (req, res) {
    res.send('셔츠 파는 페이지');
});

router.get('/pants', function (req, res) {
    res.send('바지 파는 페이지');
});

module.exports = router;