const mongoose = require('mongoose');

const userScehema = new mongoose.Schema({
    name: {
        type: mongoose.SchemaTypes.String,
        required: true
    },
    userName: {
        type: mongoose.SchemaTypes.String,
        required: true,
    },
    profileIimage_url: {
        type: mongoose.SchemaTypes.String,
        required: true
    },
    twitterId: {
        type: mongoose.SchemaTypes.String,
        required: true
    },
}, {
    timestamps: true
});

const User = mongoose.model('User', userScehema);
module.exports = User;