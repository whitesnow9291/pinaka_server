var express = require('express');
var router = express.Router();
var errorcode = require('../constants/errorcode');
var Contact = require('../models/contact');
var Reservation = require('../models/reservation');
var mongoose = require('mongoose');
var stripe  = require('stripe-api')("sk_test_ve3CtLMbyeZWis0UROEhrF0V");
var Credit = require('../models/credit');
var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'pinaka.digital@gmail.com',
    pass: 'spvwxrwupmaqhsgw'
  }
});
var moment = require('moment');

router.get('/', function (req, res) {
    var token = req.query.token;
    var status = req.query.status; // if type is true, active, or if false,  history
    if (token == null) {
        res.status(401).json({ code: errorcode.common.EMPTYTOKEN });
    } else if (status == null && status != 0 && status != 1) {
        res.status(401).json({ code: errorcode.reservation.INVALIDSTATUS });
    } else {
        Contact.findOne({ token: token }, function (err, user) {
            if (!user) {
                res.status(401).json({ code: errorcode.common.INVALIDTOKEN });
            } else {
                Reservation.find({ contact_id: mongoose.Types.ObjectId(user._id), status: status }).populate('feed_id').exec(function(err, reservations){
                    res.status(200).json(reservations);
                });
            }
        });
    }
});

router.get('/all', function (req, res) {
    var token = req.query.token;
    if (token == null) {
        res.status(401).json({ code: errorcode.common.EMPTYTOKEN });
    } else {
        Contact.findOne({ token: token }, function (err, user) {
            if (!user) {
                res.status(401).json({ code: errorcode.common.INVALIDTOKEN });
            } else {
                Reservation.find({}, function (err, reservations) { 
                    res.status(200).json(reservations);
                });
            }
        });
    }
});

router.post('/', function (req, res) {
    var token = req.body.token;
    var feed_id = req.body.feed_id;
    var people_count = req.body.people_count;
    var lane_count = req.body.lane_count;
    var booking_time = req.body.booking_time;
    var purchase_amount = req.body.purchase_amount;
    var number = req.body.number;
    var cvv = req.body.cvv;
    var expired_m = req.body.expired_m;
    var expired_y = req.body.expired_y;

    console.log(booking_time);

    if (token == null) {
        res.status(401).json({ code: errorcode.common.EMPTYTOKEN });
    } else if (feed_id == null) {
        res.status(401).json({ code: errorcode.reservation.EMPTYFEEDID });
    } else if (people_count == null) {
        res.status(401).json({ code: errorcode.reservation.EMPTYPEOPLECOUNT });
    } else if (lane_count == null) {
        res.status(401).json({ code: errorcode.reservation.EMPTYLANECOUNT });
    } else if (booking_time == null) {
        res.status(401).json({ code: errorcode.reservation.EMPTYBOOKINGTIME });
    } else if (purchase_amount == null) {
        res.status(401).json({ code: errorcode.reservation.EMPTYPURCHASEAMOUNT });
    } else if(isNaN(people_count) || people_count.trim() == ''){
        res.status(401).json({ code: errorcode.reservation.INVALIDPEOPLECOUNT });
    } else if (isNaN(lane_count) || lane_count.trim() == '') {
        res.status(401).json({ code: errorcode.reservation.INVALIDLANECOUNT });
    } else if (isNaN((new Date(booking_time)).getTime())) {
        res.status(401).json({ code: errorcode.reservation.INVALIDBOOKINGTIME });
    } else if (isNaN(purchase_amount) || purchase_amount.trim() == '') {
        res.status(401).json({ code: errorcode.reservation.INVALIDPEOPLECOUNT });
    } else if(number == null){
        res.status(401).json({ code: errorcode.reservation.EMPTYNUMBER});
    }else if(cvv == null){
        res.status(401).json({ code: errorcode.reservation.EMPTYCVV});
    }else if(expired_m == null){
        res.status(401).json({ code: errorcode.reservation.EMPTYEXPIREDM });
    }else if(expired_y == null){
        res.status(401).json({ code: errorcode.reservation.EMPTYEXPIREDY });
    }else {
        Contact.findOne({ token: token }, function (err, user) {
            if (!user) {
                res.status(401).json({ code: errorcode.common.INVALIDTOKEN });
            } else {
                var reservation = new Reservation();
                reservation.created_at = new Date();
                reservation.contact_id = user._id;
                reservation.feed_id = feed_id;
                reservation.people_count = people_count;
                reservation.lane_count = lane_count;
                reservation.booking_time = booking_time;
                reservation.purchase_amount = purchase_amount;
                reservation.status = 0;
                //pay stripe
                stripe.charges.create({
                    amount: parseFloat(reservation.purchase_amount)*100,
                    currency: 'usd',
                    card: {
                        number: number,
                        exp_month: expired_m,
                        exp_year: expired_y
                    },
                    description: 'test payment for reservation',
                    capture: true
                }, function(err, res1) {
                    console.log(err);
                    console.log(res1);     
                    

                    if(!err){
                        reservation.confirmation_id = res1.id;

                        //send mail
                        var html = "<h2 style='background-color: rgb(16,28,90); color: #fff; padding-top: 10px; padding-bottom: 10px;text-align:center; margin-bottom: 0px; font-weight: normal;'>PINAKA</h2>";
                            html += "<div style='background-color: #f3f3f3; padding: 10px;'><h5 style='margin-top: 0px;font-size: 25px; text-align: center; font-weight: normal;'>$"+ reservation.purchase_amount.toFixed(2) + " Paid</h3>";
                            html += "<p style='margin-top: 30px; margin-bottom: 30px; font-size: 25px; text-align:center; font-weight: normal;'>Thanks for using Pinaka.</p>";
                            html +="<p style='font-size: 18px; text-align:left; font-weight: normal;'>" + user.name +"</p>";
                            html +="<p style='font-size: 18px; text-align:left; font-weight: normal;'> Invoice #" + res1.id + "</p>";
                            html +="<p style='font-size: 18px; text-align:left; font-weight: normal;'>" + moment().format("MMMM D YYYY") + "</p>";
                            html +="<p style='font-size: 18px; text-align:left; font-weight: normal;'>Total: $" + reservation.purchase_amount.toFixed(2) + "</p>";

                            html +="<p style='text-align: center; font-weight: normal; margin-top: 30px; font-size: 18px;'><a href='http://pinaka.com'>View in browser</a></p>";
                            html +="<p style='text-align:center; font-weight: normal; font-size: 18px'>Pinaka Inc. 123 Van Ness, San Fransisco " + user.zipcode + "</p></div>";

                        var mailOptions = {
                            from: 'pinaka.digital@gmail.com',
                            to: user.email,
                            subject: 'Payment',
                            html: html
                        };

                        transporter.sendMail(mailOptions, function(error, info){
                            if (error) {
                                console.log(error);
                            } else {
                                console.log('Email sent: ' + info.response);
                            }
                        });
                        
                        reservation.save(function (err) {
                            if (err) {
                                res.status(403).json({ code: errorcode.reservation.UNKNOWN });
                            } else {
                                res.status(200).json(reservation);
                            }
                        });
                    } else {
                        res.status(402).json({ code: errorcode.reservation.INVALIDCARDINFO });
                    }
                });                
            }
        });
    }
});

router.put('/', function (req, res) {
    var token = req.body.token;
    var reservation_id = req.body.reservation_id;
    var people_count = req.body.people_count;
    var lane_count = req.body.lane_count;
    var booking_time = req.body.booking_time;
    var purchase_amount = req.body.purchase_amount;
    var feed_id = req.body.feed_id;
    

    if (token == null) {
        res.status(401).json({ code: errorcode.common.EMPTYTOKEN });
    } else if (reservation_id == null) {
        res.status(401).json({ code: errorcode.reservation.INVALIDRESERVATIONID });
    } else if (people_count && isNaN(people_count) || people_count.trim() == '') {
        res.status(401).json({ code: errorcode.reservation.INVALIDPEOPLECOUNT });
    } else if (lane_count && isNaN(lane_count) || lane_count.trim() == '') {
        res.status(401).json({ code: errorcode.reservation.INVALIDLANECOUNT });
    } else if (booking_time && isNaN((new Date(booking_time)).getTime())) {
        res.status(401).json({ code: errorcode.reservation.INVALIDBOOKINGTIME });
    } else if (purchase_amount && isNaN(purchase_amount) || purchase_amount.trim() == '') {
        res.status(401).json({ code: errorcode.reservation.INVALIDPEOPLECOUNT });
    }else{
        Contact.findOne({ token: token }, function (err, user) {
            if (!user) {
                res.status(401).json({ code: errorcode.common.INVALIDTOKEN });
            } else {
                Reservation.findById(reservation_id, function (err, reservation) {
                    if (!reservation) {
                        res.status(401).json({ code: errorcode.reservation.INVALIDRESERVATIONID });
                    } else {
                        if (feed_id) {
                            reservation.feed_id = feed_id;
                        }
                        if (people_count) {
                            reservation.people_count = people_count;
                        }
                        if (lane_count) {
                            reservation.lane_count = lane_count;
                        }
                        if (booking_time) {
                            reservation.booking_time = booking_time;
                        }
                        if (purchase_amount) {
                            reservation.purchase_amount = purchase_amount;
                        }

                        reservation.updated_at = new Date();                        
                        reservation.save(function (err) {
                            if (err) {
                                res.status(403).json({ code: errorcode.reservation.UNKNOWN });
                            } else {
                                res.status(200).json(reservation);
                            }
                        });                                               
                    }
                });
            }
        });
    }
});

router.post('/cancel', function (req, res) {
    var token = req.body.token;
    var reservation_id = req.body.reservation_id;

    if (token == null) {
        res.status(401).json({ code: errorcode.common.EMPTYTOKEN });
    } else if (reservation_id == null) {
        res.status(401).json({ code: errorcode.reservation.INVALIDRESERVATIONID});
    } else {
        Contact.findOne({ token: token }, function (err, user) {
            if (!user) {
                res.status(401).json({ code: errorcode.common.INVALIDTOKEN });
            } else {
                Reservation.findById(reservation_id, function (err, reservation) {
                    if (!reservation) {
                        res.status(401).json({ code: errorcode.reservation.INVALIDRESERVATIONID });
                    } else {
                        reservation.status = 2;
                        reservation.updated_at = new Date();
                        
                        //refunds
                        stripe.charges.refund(
                           reservation.confirmation_id
                        , function(err, refund) {
                            console.log(err);
                            console.log(refund);
                            if(err){
                                res.status(403).json({code: errorcode.reservation.UNKNOWN});
                            }else{
                                reservation.confirmation_id = null;
                                reservation.save(function(err){
                                    if (err) {
                                        res.status(403).json({code : errorcode.reservation.UNKNOWN});
                                    } else {
                                        res.status(200).json(reservation);
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    }
});

router.post('/pay', function(req, res){
    var token = req.body.token;
    var reservation_id = req.body.reservation_id;
    var credit_id = req.body.credit_id;    

    if(token == null){
        res.status(401).json({ code: errorcode.common.EMPTYTOKEN });
    } else if(reservation_id == null){
        res.status(401).json({ code: errorcode.reservation.INVALIDRESERVATIONID });
    } else {
        Contact.findOne({ token: token }, function(err, user){
            if(!user){
                res.status(401).json({ code: errorcode.common.INVALIDTOKEN });
            } else {
                Reservation.findById(reservation_id, function(err, reservation){
                    if(!reservation){
                        res.status(401).json({ code: errorcode.reservation.INVALIDRESERVATIONID });
                    } else {
                        Credit.findOne({ contact_id: mongoose.Types.ObjectId(user._id), _id: mongoose.Types.ObjectId(credit_id) }, function(err, credit){
                            if(!credit){
                                res.status(401).json({ code: errorcode.credit.INVALIDID });
                            } else {
                                stripe.charges.create({
                                    amount: reservation.purchase_amount,
                                    currency: 'usd',
                                    card: {
                                        number: credit.number,
                                        exp_month: credit.expired_m,
                                        exp_year: credit.expired_y
                                    },
                                    description: 'test payment for reservation',
                                    capture: false
                                }, function(err, res) {
                                    if(!err){
                                        
                                    } else {
                                        res.status(402).json({ code: errorcode.credit.INVALIDNUMBER });
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    }
});

router.delete('/', function (req, res) {
    var token = req.body.token;
    var reservation_id = req.body.reservation_id;
    
    if (token == null) {
        res.status(401).json({ code: errorcode.common.EMPTYTOKEN });
    } else if (reservation_id == null) {
        res.status(401).json({ code: errorcode.reservation.INVALIDRESERVATIONID });
    } else {
        Contact.findOne({ token: token }, function (err, user) {
            if (!user) {
                res.status(401).json({ code: errorcode.common.INVALIDTOKEN });
            } else {
                Reservation.findById(reservation_id, function (err, reservation) {
                    if (!reservation) {
                        res.status(401).json({ code: errorcode.reservation.INVALIDRESERVATIONID });
                    } else {
                        reservation.remove(function (err) {
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