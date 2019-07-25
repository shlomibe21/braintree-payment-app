'use strict';

const mongoose = require('mongoose');
//ar dateFormat = require('dateformat');
mongoose.Promise = global.Promise;

const subscriptionSchema = mongoose.Schema({
    subscriptionId: { type: String, required: true },
    subscriptionType: { type: String },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
});

subscriptionSchema.methods.serialize = function () {
    return {
        id: this._id,
        subscriptionId: this.subscriptionId,
        subscriptionType: this.subscriptionType
    };
};

const SubscriptionsDB = mongoose.model('subscription', subscriptionSchema);

module.exports = { SubscriptionsDB };