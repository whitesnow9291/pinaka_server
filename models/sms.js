var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var SmsSchema = new Schema({
    phone: String,
    code: String,
    token: String,
    created_at: Date
});

module.exports = mongoose.model('sms', SmsSchema);