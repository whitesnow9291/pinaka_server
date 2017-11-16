var express = require('express');
var router = express.Router();
var errorCode = require('../constants/errorcode');
var Interest = require('../models/interest');
var Contact = require('../models/contact');
var ContactInterest = require('../models/contactinterest');

router.post('/insert', function (req, res) {
    var token = req.body.token;
    var payload = req.body.payload;

    if (token == null) {
        res.status(401).json({ code: errorCode.common.EMPTYTOKEN });
    } else if (payload == null || payload == '') {
        res.status(401).json({ code: errorCode.common.EMPTYPAYLOAD });
    } else {
        var interests = payload.split(":");
        console.log(interests.length);
        if (payload == '' || interests.length == 0) {
            res.status(401).json({ code: errorCode.common.EMPTYPAYLOAD });
        } else {
            Contact.findOne({ token: token }, function (err, user) {
                if (!user) {
                    res.status(401).json({ code: errorCode.common.INVALIDTOKEN });
                } else {
                    ContactInterest.remove({ contact_id: user._id }, function (err) {
                        interests.map(function (item, index) {
                            var itemArr = item.split(",");
                            if (itemArr.length == 2) {
                                Interest.findOne({ name : itemArr[0] }, function (err, interest) {
                                    if (interest) {
                                        var contactinterest = new ContactInterest();
                                        contactinterest.contact_id = user._id;
                                        contactinterest.interest_id = interest.id;
                                        contactinterest.interest_level = itemArr[1];
                                        contactinterest.save();
                                    }
                                });
                            }
                        });
                    });                    
                    res.status(200).json({});
                }
            });
        }
    }
});

router.get('/', function(req, res){
    
    Interest.find({}, function(err, interests){
        console.log("interest=========>",interests)
        res.status(200).json(interests);
    });
});

module.exports = router;