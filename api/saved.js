var express = require('express');
var router = express.Router();
var errorCode = require('../constants/errorcode');
var Contact = require('../models/contact');
var Saved = require('../models/saved');
var mongoose = require('mongoose');

router.get('/', function (req, res) {
    var token = req.query.token;

    if (token == null) {
        res.status(401).json({ code: errorCode.common.EMPTYTOKEN });
    } else {
        Contact.findOne({ token: token }, function (err, user) {
            if (!user) {
                res.status(401).json({ code: errorCode.common.INVALIDTOKEN });
            } else {
                Saved.find({ contact_id: mongoose.Types.ObjectId(user._id)}).populate('feed_id').exec(function (err, saved) {
                    res.status(200).json(saved);
                });
            }
        });
    }
});

router.post('/', function (req, res) {
    var token = req.body.token;
    var feed_id = req.body.feed_id;

    if (token == null) {
        res.status(401).json({ code: errorCode.common.EMPTYTOKEN });
    } else if (feed_id == null) {
        res.status(401).json({ code: errorCode.saved.EMPTYFEEDID });
    } else {
        Contact.findOne({ token: token }, function (err, user) {
            if (!user) {
                res.status(401).json({ code: errorCode.common.INVALIDTOKEN });
            } else {
                var saved = new Saved;
                saved.contact_id = user._id;
                saved.feed_id = feed_id;
                saved.save(function (err) {
                    if (err) {
                        res.status(401).json({ code: errorCode.saved.INVALIDFEEDID });
                    } else {
                        res.status(200).json({id : saved._id});
                    }
                });
            }
        });
    }
});


router.delete('/', function (req, res) {
    var token = req.body.token;
    var id = req.body.id;

    if (token == null) {
        res.status(401).json({ code: errorCode.common.EMPTYTOKEN });
    } else if (id == null) {
        res.status(401).json({ code: errorCode.saved.INVALIDSAVEDID });
    } else {
        Contact.findOne({ token: token }, function (err, user) {
            if (!user) {
                res.status(401).json({ code: errorCode.common.INVALIDTOKEN });
            }else {
                Saved.findById(id, function (err, saved) {
                    if (!saved) {
                        res.status(401).json({ code: errorCode.saved.INVALIDSAVEDID });
                    } else {
                        saved.remove(function (err) {
                            if (err) {
                                res.status(403).json({});
                            } else {
                                res.status(200).json({});
                            }
                        });
                    }
                });
            }
        });
    }
});

module.exports = router;