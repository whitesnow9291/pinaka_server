var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ActivitySchema = new Schema({
    contact_id: { type: Schema.Types.ObjectId, ref: 'contacts' },
    type: Number,
    time: DateTime,
    location: String
});

module.exports = mongoose.model('activities', ActivitySchema);