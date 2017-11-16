var express = require('express');
var router = express.Router();
var errorCode = require('../constants/errorcode');
var Contact = require('../models/contact');
var md5 = require('md5');
var Twilio = require('twilio');
var twilioConfig = require('../constants/twilio');
var twilio = Twilio(twilioConfig.acccountSId, twilioConfig.authToken);
var Sms = require('../models/sms');
var ContactInterest = require('../models/contactinterest');
var Credit = require('../models/credit');
var mongoose = require('mongoose');
var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'pinaka.digital@gmail.com',
    pass: 'spvwxrwupmaqhsgw'
  }
});

router.get('/profile', function (req, res) {
    var token = req.query.token;

    if (token == null) {
        res.status(401).json({ code: errorCode.common.EMPTYTOKEN });
    } else {
        Contact.findOne({token: token}).populate('interests.id').exec(function(err, user){
            if (!user) {
                res.status(401).json({ code: errorCode.common.INVALIDTOKEN });
            } else {
                                
                Credit.find({ contact_id: mongoose.Types.ObjectId(user._id) }, function (err, credits) {
                   var ret = JSON.parse(JSON.stringify(user));
                    ret["creditcards"] = credits;
                    res.status(200).json(ret);
                });                               
            }
        });
    }
});

router.post('/login', function (req, res) {
    var email = req.body.email;
    var password = req.body.password;
    console.log("login=email,password====>",email+":"+password)
    if (email == null || email == "") {
        res.status(401).json({ code: errorCode.login.EMPTYEMAIL });
    } else if (password == null || password == "") {
        res.status(401).json({ code: errorCode.login.EMPTYPASSWORD });
    } else {
        Contact.findOne({ email: email, password: md5(password) }).populate('interests.id').exec( function (err, user) {
            if (!user) {
                res.status(402).json({ code: errorCode.login.NOTMATCH });
            } else {
                Credit.find({contact_id: mongoose.Types.ObjectId(user._id)}, function(err, credits){
                    var ret = JSON.parse(JSON.stringify(user));
                        ret['creditcards'] = credits;
                        res.status(200).json(ret);
                });
            }
        });
    }
});

router.post('/signup', function (req, res) {
    console.log("signup info========>",req.body);
    var name = req.body.name;
    var email = req.body.email;
    var birthday = req.body.birthday;
    var zipcode = req.body.zipcode;
    var gender = req.body.gender;
    var marital = req.body.marital;
    var kids = req.body.kids;
    var password = req.body.password;
    var phone = req.body.phone;
    var interests = req.body.interests;
    var source = req.body.source;
    var type = req.body.type;

    //null validate
    if (name == null || name == '') {
        res.status(401).json({ code: errorCode.signup.EMPTYNAME });
    } else if (email == null) {
        res.status(401).json({ code: errorCode.signup.EMPTYEMAIL });
    } else if (birthday == null) {
        res.status(401).json({ code: errorCode.signup.EMPTYBIRTHDAY });
    } else if (zipcode == null) {
        res.status(401).json({ code: errorCode.signup.EMPTYZIPCODE });
    } else if (gender == null) {
        res.status(401).json({ code: errorCode.signup.EMPTYGENDER });
    } else if (marital == null) {
        res.status(401).json({ code: errorCode.signup.EMPTYMARITAL });
    } else if (kids == null) {
        res.status(401).json({ code: errorCode.signup.EMPTYKIDS });
    } else if (password == null) {
        res.status(401).json({ code: errorCode.signup.EMPTYPASS });
    } else if (source == null) {
        res.status(401).json({ code: errorCode.signup.EMPTYSOURCE });
    } else if (type  == null) { 
        res.status(401).json({ code: errorCode.signup.EMPTYTYPE });
    } else if(interests == null){
        res.status(401).json({ code: errorCode.signup.EMPTYINTEREST });
    } else{
        //remove trim
        name = name.trim();
        email = email.trim();
        birthday = birthday.trim();
        zipcode = zipcode.trim();
        if (phone) {
            phone = phone.trim();
        }
        
        //email, birthday, phone number, zipcode, gender, kids, marital, interest, type validate
        var reg = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        var regZip = /^[0-9]{1,5}$/;
        var regPhone = /^(?:(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})(?:\s*(?:#|x\.?|ext\.?|extension)\s*(\d+))?$/;

        if (!reg.test(email)) {
            res.status(401).json({ code: errorCode.signup.INVALIDEMAIL });
        } else if(isNaN((new Date(birthday)).getTime())) {
            res.status(401).json({ code: errorCode.signup.INVALIDBIRTHDAY });
        } else if (!regZip.test(zipcode)) {
            res.status(401).json({ code: errorCode.signup.INVALIDZIPCODE });
        } else if (gender != '0' && gender != '1') { 
            res.status(401).json({ code: errorCode.signup.INVALIDGENDER });
        } else if (marital != '0' && marital != '1') { 
            res.status(401).json({ code: errorCode.signup.INVALIDMARITAL });
        } else if (kids != '0' && kids != '1') {
            res.status(401).json({ code: errorCode.signup.INVALIDKIDS });
        } else if (source != '0' && source != '1' && source != '2' && source != '3') { 
            res.status(401).json({ code: errorCode.signup.INVALIDSOURCE });
        } else if (type != '0' && type != '1') { 
            res.status(401).json({ code: errorCode.signup.INVALIDTYPE });
        } else {
            //existing email or phone validate
            var contact = new Contact;
            Contact.findOne({ $or: [{email: email}, {phone: phone}] }, function (err, user) {
                if (user && user.email == email && email) {
                    res.status(402).json({ code: errorCode.signup.DUPLICATEEMAIL });
                } else if (user && user.phone == phone && phone) { 
                    res.status(402).json({ code: errorCode.signup.DUPLICATEPHONE });
                }
                else{
                    contact.name = name;
                    contact.email = email;
                    contact.birthday = birthday;
                    contact.zipcode = zipcode;
                    contact.gender = gender;
                    contact.marital = marital;
                    contact.kids = kids;
                    contact.password = md5(password);
                    contact.created_at = new Date();
                    contact.updated_at = new Date();
                    contact.contact_source = source;
                    contact.type = type;
                    if (phone) {
                        contact.phone = phone;
                    }
                    if (interests != '') {
                        var interestDATA = [];
                        var interestsItems = interests.split(":");
                        for(var i = 0; i < interestsItems.length; i++){
                            var temp = interestsItems[i].split(",");
                            interestDATA.push({
                                id: temp[0],
                                level: temp[1]
                            });
                        }
                        contact.interests = interestDATA;
                    }
                    contact.token = md5((contact.email | contact.phone) + contact.created_at);
                    contact.save(function(err){
                         //sned email
                        var html = "<h2 style='background-color: rgb(16,28,90); color: #fff; padding-top: 10px; padding-bottom: 10px;text-align:center; margin-bottom: 0px;'>PINAKA</h2>";
                        html += "<div style='background-color: #f3f3f3; padding: 10px;'><h3 style='margin-bottom: 0; margin-top: 0'>Welcome to Pinaka - just one more step!</h3>";
                        html += "<p>Welcome to Pinaka!</p></br>";
                        html += "<p>We're on a mission to make your working life simpler, more pleasant and more productive. This should be easy.</p></br>";
                        html += "<p>To get started, we need to confirm your email address, so please click this link to finish creating your account:</p></br>";
                        html +="<p>Confirm your email address</p></br>";
                        html +="<p>We welcome your feedback, ideas and suggestions. We really want to make your life easier, so if we're falling short or should be doing something different, we want to hear about it. Send us an email at <a style='color: #f2c047'>pinaka.digital@gmail.com</a>.</p></br>";
                        html +="<p>Thanks!</p></br>";
                        html +="<p>- The Team at Pinaka</p></div>";

                        var mailOptions = {
                        from: 'pinaka.digital@gmail.com',
                        to: contact.email,
                        subject: 'Welcome to Pinaka',
                        html: html
                        };

                        transporter.sendMail(mailOptions, function(error, info){
                        if (error) {
                            console.log("email error========>",error);
                        } else {
                            console.log('Email sent: ' + info.response);
                        }
                        });
                        
                        console.log('sigunup success========>', contact)
                        res.status(200).json(contact);
                    });                   
                }
            });            
        }    
    }   
});

router.post('/sendcode', function (req, res) {
    var phone = req.body.phone;
    
    var regPhone = /^(?:(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})(?:\s*(?:#|x\.?|ext\.?|extension)\s*(\d+))?$/;
    
    var code = Math.floor(Math.random() * 899999) + 100000;

    if (phone == null) {
        res.status(401).json({ code: errorCode.sendcode.EMPTYPHONE });
    } 
    
    /*
    else if (!regPhone.test(phone)) {
        res.status(402).json({ code: errorCode.sendcode.INVALIDPHONE });
    }*/    
    else {
        twilio.messages.create({
            from: twilioConfig.from,
            to: phone,
            body: 'Here is verify code. ' + code
        }, function (err, result) {
            if (err) {
                res.status(402).json({ code: errorCode.sendcode.INVALIDPHONE });
            } else {
                //create code for sms verification
                var sms = new Sms();
                sms.phone = phone;
                sms.code = code;
                sms.created_at = new Date();
                sms.token = md5(sms.created_at);
                sms.save();
                res.status(200).json({ token: sms.token });
            }
        });
    }    
});

router.post('/logincode', function(req, res) {
    var token = req.body.token;
    var code = req.body.code;

    console.log("login code token,code info========>",token+":"+code);

    if (token == null) {
        res.status(401).json({ code: errorCode.common.EMPTYTOKEN });
    } else if (code == null) {
        res.status(401).json({ code: errorCode.verifycode.EMPTYCODE });
    } else {
        Sms.findOne({ token: token, code: code }, function (err, item) {
            if (!item) {
                res.status(402).json({ code: errorCode.verifycode.INVALIDCODE });
            } else {
                Contact.findOne({phone: item.phone}, function(err, user){
                    if(!user){
                        res.status(402).json({ code: errorCode.verifycode.INVALIDCODE });
                    }else{
                        Credit.find({contact_id: mongoose.Types.ObjectId(user._id)}, function(err, credits){
                            if(user.interests){
                                ContactInterest.find({contact_id: user._id}).populate('interest_id').exec(function(err, interests){
                                    var ret = JSON.parse(JSON.stringify(user));
                                    ret['interests'] = interests;
                                    ret['creditcards'] = credits;
                                    res.status(200).json(ret);
                                });
                            }else{
                                var ret = JSON.parse(JSON.stringify(user));
                                ret['creditcards'] = credits;
                                res.status(200).json(ret);
                            }
                        });
                    }
                });
            }
        });
    }
});

router.post('/verifycode', function (req, res) {
    var token = req.body.token;
    var code = req.body.code;
    console.log("veryfycode==========>", token+":"+code)
    if (token == null) {
        res.status(401).json({ code: errorCode.common.EMPTYTOKEN });
    } else if (code == null) {
        res.status(401).json({ code: errorCode.verifycode.EMPTYCODE });
    } else {
        Sms.findOne({ token: token, code: code }, function (err, item) {
            if (!item) {
                res.status(402).json({ code: errorCode.verifycode.INVALIDCODE });
            } else {
                Contact.findOne({phone:item.phone},function(err,user){
                    if (err) {
                        res.status(402).json({ code: errorCode.SERVERERRPR });
                    } else if (!user) {
                        res.status(402).json({ code: errorCode.contact.NOTFOUND });
                    } else {
                        res.status(200).json(user);
                    }
                })
                
            }
        });
    }
});

router.put('/update', function (req, res) {
    var token = req.body.token;
    var name = req.body.name;
    var email = req.body.email;
    var birthday = req.body.birthday;
    var zipcode = req.body.zipcode;
    var gender = req.body.gender;
    var marital = req.body.marital;
    var kids = req.body.kids;
    var phone = req.body.phone;
    var interests = req.body.interests;
    var password = req.body.password;
    
    //validate
    var reg = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    var regZip = /^[0-9]{1,5}$/;
    var regPhone = /^(?:(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})(?:\s*(?:#|x\.?|ext\.?|extension)\s*(\d+))?$/;
    
    if (token == null) {
        res.status(401).json({ code: errorCode.common.EMPTYTOKEN });
    } else if (name && name == '') {
        res.status(401).json({ code: errorCode.signup.EMPTYNAME });
    }else if (email && !reg.test(email)) {
        res.status(401).json({ code: errorCode.signup.INVALIDEMAIL });
    } else if (birthday && isNaN((new Date(birthday)).getTime())){
        res.status(401).json({ code: errorCode.signup.INVALIDBIRTHDAY });
    } else if (zipcode && !regZip.test(zipcode)) {
        res.status(401).json({ code: errorCode.signup.INVALIDZIPCODE });
    } else if (gender && gender != '0' && gender != '1') {
        res.status(401).json({ code: errorCode.signup.INVALIDGENDER });
    } else if (marital && marital != '0' && marital != '1') {
        res.status(401).json({ code: errorCode.signup.INVALIDMARITAL });
    } else if (kids && kids != '0' && kids != '1') {
        res.status(401).json({ code: errorCode.signup.INVALIDKIDS });
    } else {
        Contact.findOne({ token: token }, function (err, user) {
            if (!user) {
                res.status(401).json({ code: errorCode.common.INVALIDTOKEN });
            } else {
                //update data
                if (name) {
                    user.name = name;
                }
                if (email) {
                    user.email = email;
                }
                if (birthday) {
                    user.birthday = birthday;
                }
                if (zipcode) {
                    user.zipcode = zipcode;
                }
                if (gender) {
                    user.gender = gender;
                }
                if (marital) {
                    user.marital = marital;
                }
                if (kids) {
                    user.kids = kids;
                }
                if (interests && interests != '') {
                    var interestDATA = [];
                    var interestsItems = interests.split(":");
                    for(var i = 0; i < interestsItems.length; i++){
                        var temp = interestsItems[i].split(",");
                        interestDATA.push({
                            id: temp[0],
                            level: temp[1]
                        });
                    }
                    user.interests = interestDATA;
                }
                if (phone) {
                    user.phone = phone;
                }
                
                if (password) {
                    user.password = md5(password);
                }
                
                user.updated_at = new Date();
                user.save(function(){
                    if(password){
                        var html = "<h2 style='background-color: rgb(16,28,90); color: #fff; padding-top: 10px; padding-bottom: 10px;text-align:center; margin-bottom: 0px;'>PINAKA</h2>";
                        html += "<div style='background-color: #f3f3f3; padding: 10px;'><h3 style='margin-top: 0px;'>Hi <font color='#465e82'>@" + user.name + "</font>,</h3>";
                        html += "<p>We got a request to change your pinaka password.</p>";
                        html +="<p>If you didn't changed a password, <a href='http://pinaka.com' style='color: rgb(16,28,90)'>let us know</a></p></div>";

                        //send email
                        var mailOptions = {
                        from: 'pinaka.digital@gmail.com',
                        to: user.email,
                        subject: 'Change password',
                        html: html
                        };

                        transporter.sendMail(mailOptions, function(error, info){
                        if (error) {
                            console.log("Email err========>",error);
                        } else {
                            console.log('Email sent: ' + info.response);
                        }
                        });                                                
                    }
                    Contact.findOne({token: token}).populate('interests.id').exec(function(err, user1){
                        Credit.find({contact_id: mongoose.Types.ObjectId(user1._id)}, function(err, credits){                        
                            var ret = JSON.parse(JSON.stringify(user1));
                            ret['creditcards'] = credits;
                            res.status(200).json(ret);
                        });
                    });                    
                });
            }
        });
    }
});

router.post('/forgot', function(req, res) {
    var email = req.body.email;
    var reg = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if(email == null){
        res.status(401).json({code: errorCode.signup.EMPTYEMAIL});
    }else if(!reg.test(email)){
        res.status(401).json({code: errorCode.signup.INVALIDEMAIL});
    }else{
        Contact.findOne({email: email}, function(err, user){
            if(!user){
                res.status(200).json({});
            }else{
                //send email
                var html = "<h2 style='background-color: rgb(16,28,90); color: #fff; padding-top: 10px; padding-bottom: 10px;text-align:center; margin-bottom: 0px;'>PINAKA</h2>";
                        html += "<div style='background-color: #f3f3f3; padding: 10px;'><h3 style='margin-top: 0px;'>Hi <font color='#465e82'>@" + user.name + "</font>,</h3>";
                        html += "<p>We got a request to reset your pinaka password.</p>";
                        html +="<p style='text-align: center'><button style='background-color: #fff; border-radius: 5px; padding-top: 10px; padding-bottom: 10px; padding-left: 20px; padding-right: 20px; border-color: rgb(16,28,90)'>Reset Password</button></p>";
                        html +="<p>If you ignore this message, your password won't be changed.</p>";
                        html +="<p>If you didn't request a password reset, <a href='http://pinaka.com' style='color: rgb(16,28,90)'>let us know</a></p></div>";

                var mailOptions = {
                from: 'pinaka.digital@gmail.com',
                to: email,
                subject: 'Forgot password',
                html: html
                };

                transporter.sendMail(mailOptions, function(error, info){
                if (error) {
                    console.log("Email err========>",error);
                } else {
                    console.log('Email sent: ' + info.response);
                }
                });
                res.status(200).json({});
            }
        });
    }
});

module.exports = router;