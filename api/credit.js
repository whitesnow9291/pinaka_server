var express = require('express');
var router = express.Router();
var errorcode = require('../constants/errorcode');
var Contact = require('../models/contact');
var CreditCard = require('credit-card');
var Credit = require('../models/credit');

router.post('/validate', function (req, res) {
    var token = req.body.token;
    var number = req.body.number;
    var expired_m = req.body.expired_m;
    var expired_y = req.body.expired_y;
    var cvv = req.body.cvv;

    if (token == null) {
        res.status(401).json({ code: errorcode.common.EMPTYTOKEN });
    } else if (number == null || number == '') {
        res.status(401).json({ code: errorcode.credit.EMPTYNUMBER });
    } else if (expired_y == null || expired_y == '') {
        res.status(401).json({ code: errorcode.credit.EMPTYEXPIREDYEAR });
    } else if (expired_m == null || expired_m == '') {
        res.status(401).json({ code: errorcode.credit.EMPTYEXPIREDYEAR });
    } else if (cvv == null || cvv == '') {
        res.status(401).json({ code: errorcode.credit.EMPTYCVV });
    } else {
        Contact.findOne({ token: token }, function (err, user) {
            if (!user) {
                res.status(401).json({ code: errorcode.common.INVALIDTOKEN });
            } else {
                var type = CreditCard.determineCardType(number, { allowPartial : true });
                var card = {
                    cardType: type,
                    number: number,
                    expiryMonth: expired_m,
                    expiryYear: expired_y,
                    cvv: cvv
                };

                var validation = CreditCard.validate(card);

                if (!validation.validCardNumber) {
                    res.status(401).json({ code: errorcode.credit.INVALIDNUMBER });
                } else if (!validation.validExpiryYear) {
                    res.status(401).json({ code: errorcode.credit.INVALIDEXPIREDYEAR });
                } else if (!validation.validExpiryMonth) {
                    res.status(401).json({ code: errorcode.credit.INVALIDEXPIREDMONTH });
                } else if (!validation.validCvv) {
                    res.status(401).json({ code: errorcode.credit.INVALIDCVV });
                } else if(validation.isExpired){
                    res.status(402).json({ code: errorcode.credit.EXPIRED});
                } else {
                    res.status(200).json(validation.card);
                }
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
                Credit.find({}, function (err, credits) {
                    res.status(200).json(credits);
                });
            }
        });
    }
});

router.post('/', function (req, res) {
    var token = req.body.token;
    var number = req.body.number;
    var expired_m = req.body.expired_m;
    var expired_y = req.body.expired_y;
    var cvv = req.body.cvv;
    
    if (token == null) {
        res.status(401).json({ code: errorcode.common.EMPTYTOKEN });
    } else if (number == null || number == '') {
        res.status(401).json({ code: errorcode.credit.EMPTYNUMBER });
    } else if (expired_y == null || expired_y == '') {
        res.status(401).json({ code: errorcode.credit.EMPTYEXPIREDYEAR });
    } else if (expired_m == null || expired_m == '') {
        res.status(401).json({ code: errorcode.credit.EMPTYEXPIREDYEAR });
    } else if (cvv == null || cvv == '') {
        res.status(401).json({ code: errorcode.credit.EMPTYCVV });
    } else {
        Contact.findOne({ token: token }, function (err, user) {
            if (!user) {
                res.status(401).json({ code: errorcode.common.INVALIDTOKEN });
            } else {
                var type = CreditCard.determineCardType(number, { allowPartial : true });
                var card = {
                    cardType: type,
                    number: number,
                    expiryMonth: expired_m,
                    expiryYear: expired_y,
                    cvv: cvv
                };
                
                var validation = CreditCard.validate(card);
                
                if (!validation.validCardNumber) {
                    res.status(401).json({ code: errorcode.credit.INVALIDNUMBER });
                } else if (!validation.validExpiryYear) {
                    res.status(401).json({ code: errorcode.credit.INVALIDEXPIREDYEAR });
                } else if (!validation.validExpiryMonth) {
                    res.status(401).json({ code: errorcode.credit.INVALIDEXPIREDMONTH });
                } else if (!validation.validCvv) {
                    res.status(401).json({ code: errorcode.credit.INVALIDCVV });
                } else if (validation.isExpired) {
                    res.status(402).json({ code: errorcode.credit.EXPIRED });
                } else {
                    var credit = new Credit;
                    credit.number = validation.card.number;
                    credit.type = validation.card.cardType;
                    credit.expired_y = validation.card.expiryYear;
                    credit.expired_m = validation.card.expiryMonth;
                    credit.cvv = validation.card.cvv;
                    credit.contact_id = user._id;
                    credit.created_at = new Date();
                    credit.updated_at = new Date();
                    credit.save(function (err) {
                        if (err) {
                            res.status(403).json({});
                        } else {
                            res.status(200).json(credit);
                        }
                    });
                }
            }
        });
    }
});

router.put('/', function (req, res) {
    var token = req.body.token;
    var number = req.body.number;
    var expired_m = req.body.expired_m;
    var expired_y = req.body.expired_y;
    var cvv = req.body.cvv;
    var id = req.body.id;
    
    if (token == null) {
        res.status(401).json({ code: errorcode.common.EMPTYTOKEN });
    } else if (id == null) { 
        res.status(401).json({ code: errorcode.credit.INVALIDID });
    } else {
        Contact.findOne({ token: token }, function (err, user) {
            if (!user) {
                res.status(401).json({ code: errorcode.common.INVALIDTOKEN });
            } else {               
                Credit.findById(id, function (err, credit) {
                    if (!credit) {
                        res.status(401).json({ code: errorcode.credit.INVALIDID });
                    } else {
                       
                        var newcard = {
                            cardType: credit.type,
                            number: number?number: credit.number,
                            expiryMonth: expired_m? expired_m: credit.expired_m,
                            expiryYear: expired_y? expired_y: credit.exired_y,
                            cvv: cvv?cvv: credit.cvv
                        };                      

                        var validation = CreditCard.validate(newcard);
                        
                        if (!validation.validCardNumber) {
                            res.status(401).json({ code: errorcode.credit.INVALIDNUMBER });
                        } else if (!validation.validExpiryYear) {
                            res.status(401).json({ code: errorcode.credit.INVALIDEXPIREDYEAR });
                        } else if (!validation.validExpiryMonth) {
                            res.status(401).json({ code: errorcode.credit.INVALIDEXPIREDMONTH });
                        } else if (!validation.validCvv) {
                            res.status(401).json({ code: errorcode.credit.INVALIDCVV });
                        } else if (validation.isExpired) {
                            res.status(402).json({ code: errorcode.credit.EXPIRED });
                        } else {
                            credit.number = validation.card.number;
                            credit.type = validation.card.cardType;
                            credit.expired_y = validation.card.expiryYear;
                            credit.expired_m = validation.card.expiryMonth;
                            credit.cvv = validation.card.cvv;
                            credit.updated_at = new Date();
                            credit.save(function (err) {
                                if (err) {
                                    res.status(403).json({});
                                } else {
                                    res.status(200).json(credit);
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
        res.status(401).json({ code: errorcode.credit.INVALIDID });
    } else {
        Contact.findOne({ token: token }, function (err, user) {
            if (!user) {
                res.status(401).json({ code: errorcode.common.INVALIDTOKEN });
            } else {
                Credit.findById(id, function (err, credit) {
                    if (!credit) {
                        res.status(401).json({ code: errorcode.credit.INVALIDID });
                    } else {
                        credit.remove(function (err) {
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