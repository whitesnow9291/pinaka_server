var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ReservationSchema = new Schema({
    updated_at: Date,
    created_at: Date,
    people_count: Number,
    lane_count: Number,
    booking_time: Date,
    purchase_amount: Number,
    feed_id: { type: Schema.Types.ObjectId, ref: 'feeds' },
    contact_id: { type: Schema.Types.ObjectId, ref: 'contacts' },
    confirmation_id: String,
    status: Number
});

module.exports = mongoose.model('reservation', ReservationSchema);