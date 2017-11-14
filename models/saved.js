var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var SavedSchema = new Schema({
    contact_id: { type: Schema.Types.ObjectId, ref: 'contacts' },
    feed_id: { type: Schema.Types.ObjectId, ref: 'feeds'}
});

module.exports = mongoose.model('saved', SavedSchema);