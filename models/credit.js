var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var CreditSchema = new Schema({
    type: String,
    number: String,
    expired_y: Number,
    expired_m: Number,
    cvv: Number,
    contact_id: { type: Schema.Types.ObjectId, ref: 'contacts' },
    created_at: Date,
    updated_at: Date
});

module.exports = mongoose.model('credit', CreditSchema);