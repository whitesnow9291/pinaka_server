var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ContactInterestSchema = new Schema({
    contact_id: { type: Schema.Types.ObjectId, ref: 'contacts' },
    interest_id: { type: Schema.Types.ObjectId, ref: 'interests' },
    interest_level: Number
});

module.exports = mongoose.model('contactinterest', ContactInterestSchema);