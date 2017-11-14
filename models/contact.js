var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ContactSchema = new Schema({
    name: String,
    email: String,
    phone: String,
    birthday: Date,
    zipcode: String,
    gender: Boolean,
    kids: Boolean,
    marital: Boolean,
    interests: [{ id: { type: Schema.Types.ObjectId, ref: 'interests' }, level: Number}],
    contact_source: Number,
    password: String,
    type: Boolean,
    created_at: Date,
    updated_at: Date,
    token: String
});

module.exports = mongoose.model('contacts', ContactSchema);