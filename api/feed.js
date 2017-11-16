var express = require('express');
var router = express.Router();
var errorcode = require('../constants/errorcode');
var Feed = require('../models/feed');
var Contact = require('../models/contact');
var mongoose = require('mongoose');
var Saved = require('../models/saved');

router.post('/', function (req, res) {
    var token = req.body.token;
    var heading = req.body.heading;
    var description = req.body.description;
    var type = req.body.type;
    var original_cost = req.body.original_cost;
    var discounted_cost = req.body.discounted_cost;
    var discounted_percentage = req.body.discounted_percentage;
    var expired_date = req.body.expired_date;
    var ranking_level = req.body.ranking_level;
    var interests = req.body.interests;
    
    if (token == null) {
        res.status(401).json({ code: errorcode.common.EMPTYTOKEN });
    }else if (heading == null || heading == '') {
        res.status(401).json({ code: errorcode.feed.EMPTYHEADING });
    } else if (description == null || description == '') {
        res.status(401).json({ code: errorcode.feed.EMPTYDESCRIPTION });
    } else if (type == null) {
        res.status(401).json({ code: errorcode.feed.EMPTYTYPE });
    } else if (original_cost == null) {
        res.status(401).json({ code: errorcode.feed.EMPTYORIGINALCOST });
    } else if (discounted_cost == null) {
        res.status(401).json({ code: errorcode.feed.EMPTYDISCOUNTCOST });
    } else if (discounted_percentage == null) {
        res.status(401).json({ code: errorcode.feed.EMPTYDISCOUNTPERCENTAGE });
    } else if (expired_date == null) { 
        res.status(401).json({ code: errorcode.feed.EMPTYEXPIREDDATE });
    } else if (ranking_level == null) {
        res.status(401).json({ code: errorcode.feed.EMPTYRANKINGLEVEL });
    } else if (interests == null) {
        res.status(401).json({ code: errorcode.feed.EMPTYINTERESTS });
    } else if (req.files == null) {
        res.status(401).json({ code: errorcode.feed.EMPTYIMAGE });
    } else if (type != 0 && type != 1) {
        res.status(401).json({ code: errorcode.feed.INVALIDTYPE });
    } else if (isNaN(original_cost)) {
        res.status(401).json({ code: errorcode.feed.INVALIDORIGINALCOST });
    } else if (isNaN(discounted_cost)) {
        res.status(401).json({ code: errorcode.feed.INVALIDDISCOUNTCOST });
    } else if (isNaN(discounted_percentage) || discounted_percentage < 0 || discounted_cost > 100) {
        res.status(401).json({ code: errorcode.feed.INVALIDDISCOUNTPERCENTAGE });
    } else if (isNaN((new Date(expired_date)).getTime())) {
        res.status(401).json({ code: errorcode.feed.INVALIDEXPIREDDATE });
    } else if (isNaN(ranking_level) || ranking_level < 0 || ranking_level > 5) {
        res.status(401).json({ code: errorcode.feed.INVALIDRANKINGLEVEL });
    } else if(req.files.image.mimetype != 'image/png' && req.files.image.mimetype != 'image/jpeg'){
        res.status(401).json({ code: errorcode.feed.INVALIDIMAGE });
    } else {
        Contact.findOne({ token: token }, function (err, user) {
            if (!user) {
                res.status(401).json({ code: errorcode.common.INVALIDTOKEN });
            } else {
                var filename = (new Date()).getTime() + "_" + req.files.image.name;
                req.files.image.mv('public/images/' + filename, function (err) {
                    if (err) {
                        console.log("moving file error", err);
                    } else {
                        //validate interests
                        interests = interests.split(",");
                        //create feed
                        var feed = new Feed;
                        feed.heading = heading;
                        feed.description = description;
                        feed.type = type;
                        feed.original_cost = original_cost;
                        feed.discounted_cost = discounted_cost;
                        feed.discount_percentage = discounted_percentage;
                        feed.expired_date = expired_date;
                        feed.ranking_level = ranking_level;
                        feed.image = "images/" + filename;
                        feed.interests = interests;
                        feed.created_at = new Date();
                        feed.updated_at = new Date();
                        feed.save(function (err) {
                            if (err) {
                                res.status(402).json({});
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

router.get('/', function (req, res) {
    var token = req.query.token;
    var id = req.query.id;
    if (token == null) {
        res.status(401).json({ code: errorcode.common.EMPTYTOKEN });
    } else if (id == null) {
        res.status(401).json({ code: errorcode.feed.INVALIDID });
    } else {
        Contact.findOne({ token: token }, function (err, user) {
            if (!user) {
                res.status(401).json({ code: errorcode.common.INVALIDTOKEN });
            } else {
                Feed.findOne({ _id: mongoose.Types.ObjectId(id)}).populate('interests').exec(function (err, feed) {
                    if (!feed) {
                        res.status(401).json({ code: errorcode.feed.INVALIDID });
                    } else {
                        res.status(200).json(feed);
                    }
                });
            }
        });
    }
});

router.get('/list', function (req, res) {
    var token = req.query.token;
    var type = req.query.type;
    var page = req.query.page;
    var perpage = Number(req.query.perpage);
    var tag = req.query.tag;
    console.log("token=======>", token)
    if (token==null) {
        console.log("list==========>", token)
        res.status(401).json({ code: errorcode.common.EMPTYTOKEN });
    } else if (type==null) {
        res.status(401).json({ code: errorcode.feed.EMPTYTYPE });
    } else if (type != 0 && type != 1) {
        res.status(401).json({ code: errorcode.feed.INVALIDTYPE });
    } else if (page==null) { 
        res.status(401).json({ code: errorcode.common.INVALIDPAGE });
    } else if (isNaN(page)) { 
        res.status(401).json({ code: errorcode.common.INVALIDPAGE });
    } else if (perpage==null) {
        res.status(401).json({ code: errorcode.common.INVALIDPERPAGE });
    } else if (isNaN(perpage)) { 
        res.status(401).json({ code: errorcode.common.INVALIDPERPAGE });
    } else if(tag==null){
        res.status(401).json({code: 200});
    }else{
        Contact.findOne({ token: token }, function (err, user) {
            console.log("feed contack find result ======>", user)
            if (!user) {
                res.status(401).json({ code: errorcode.common.INVALIDTOKEN });
            } else {
                Feed.find({ $and: [{type: type }, { $or: [{heading: new RegExp(tag, "i")}, {description: new RegExp(tag, "i")}] }]}, {}, { skip : perpage * page, limit: perpage }, function (err, feeds) {
                    console.log("feed find result ======>", feeds)
                    Saved.find({contact_id: mongoose.Types.ObjectId(user._id)}, function(err, savedItem){
                        console.log("Saved find result ======>", savedItem)
                        var newFeeds = [];
                        if (feeds) {
                           for(var j = 0; j < feeds.length; j++){
                            var temp = JSON.parse(JSON.stringify(feeds[j]));
                            temp.isSaved = null;
                            for(var i = 0; i < savedItem.length; i++){
                                if(savedItem[i].feed_id == temp._id){
                                    temp.isSaved = savedItem[i]._id;
                                    break;
                                }
                            }
                            newFeeds.push(temp);
                            } 
                        }
                        
                        res.status(200).json(newFeeds);     

                    });
                });
            }
        });
    }
});

router.put('/', function (req, res) {
    var token = req.body.token;
    var heading = req.body.heading;
    var description = req.body.description;
    var type = req.body.type;
    var original_cost = req.body.original_cost;
    var discounted_cost = req.body.discounted_cost;
    var discounted_percentage = req.body.discounted_percentage;
    var expired_date = req.body.expired_date;
    var ranking_level = req.body.ranking_level;
    var interests = req.body.interests;
    var id = req.body.id;

    if (token == null) {
        res.status(401).json({ code: errorcode.common.EMPTYTOKEN });
    } else if (id == null) {
        res.status(401).json({ code: errorcode.feed.INVALIDID });
    }else if (type && type != 0 && type != 1) {
        res.status(401).json({ code: errorcode.feed.INVALIDTYPE });
    } else if (original_cost && isNaN(original_cost)) {
        res.status(401).json({ code: errorcode.feed.INVALIDORIGINALCOST });
    } else if (discounted_cost && isNaN(discounted_cost)) {
        res.status(401).json({ code: errorcode.feed.INVALIDDISCOUNTCOST });
    } else if (discounted_percentage && isNaN(discounted_percentage)) {
        res.status(401).json({ code: errorcode.feed.INVALIDDISCOUNTPERCENTAGE });
    } else if (expired_date && isNaN((new Date()).getTime())) {
        res.status(401).json({ code: errorcode.feed.INVALIDEXPIREDDATE });
    } else if (ranking_level && ranking_level < 0 && ranking_level > 5) {
        res.status(401).json({ code: errorcode.feed.INVALIDRANKINGLEVEL });
    } else {
        Contact.findOne({ token: token }, function (err, user) {
            if (!user) {
                res.status(401).json({ code: errorcode.common.INVALIDTOKEN });
            } else {
                Feed.findById(id, function (err, feed) {
                    if (!feed) {
                        res.status(401).json({ code: errorcode.feed.INVALIDID });
                    } else {
                        if (heading) {
                            feed.heading = heading;
                        }
                        if (description) {
                            feed.description = description;
                        }
                        if (type) {
                            feed.type = type;
                        }
                        if (original_cost) {
                            feed.original_cost = original_cost;
                        }
                        if (discounted_cost) {
                            feed.discounted_cost = discounted_cost;
                        }
                        if (discounted_percentage) {
                            feed.discount_percentage = discounted_percentage;
                        }
                        if (expired_date) {
                            feed.expired_date = expired_date;
                        }
                        if (ranking_level) {
                            feed.ranking_level = ranking_level;
                        }
                        if (interests) {
                            feed.interests = interests.split(",");
                        }
                        
                        feed.updated_at = new Date();
                        
                        if (req.files) {
                            
                            if (req.files.image.mimetype != 'image/png' && req.files.image.mimetype != 'image/jpeg') {
                                res.status(401).json({ code: errorcode.feed.INVALIDID });
                            } else {
                                feed.image = "images/" + (new Date()).getTime() + "_" + req.files.image.name;
                                
                                req.files.image.mv("public/" + feed.image, function (err) {
                                    if (err) {
                                        res.status(403).json({});
                                    } else {
                                        feed.save(function (err) {
                                            if (err) {
                                                res.status(403).json({});
                                            } else {
                                                res.status(200).json({});
                                            }
                                        });
                                    }
                                });
                            }                            
                        } else {
                            feed.save(function (err) {
                                if (err) {
                                    res.status(403).json({});
                                } else {
                                    res.status(200).json({});
                                }
                            });
                        }
                        
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
        res.status(401).json({ code: errorcode.common.EMPTYTOKEN });
    } else if (id == null) {
        res.status(401).json({ code: errorcode.feed.INVALIDID });
    } else {
        Contact.findOne({ token: token }, function (err, user) {
            if (!user) {
                res.status(401).json({ code: errorcode.common.INVALIDTOKEN });
            } else {
                Feed.findById(id, function (err, feed) {
                    if (!feed) {
                        res.status(401).json({ code: errorcode.feed.INVALIDID });
                    } else {
                        feed.remove();
                        res.status(200).json({});
                    }
                });
            }
        });
    }
});

module.exports = router;