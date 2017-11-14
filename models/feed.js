var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var FeedSchema = new Schema({
    heading: String,
    description: String,
    type: Number,
    original_cost: Number,
    discounted_cost: Number,
    discount_percentage: Number,
    expired_date: Date,
    ranking_level: Number,
    interests: [{ type: Schema.Types.ObjectId, ref: 'interests' }],
    image: String,
    created_at: Date,
    updated_at: Date
});

module.exports = mongoose.model('feeds', FeedSchema);