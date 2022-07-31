const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true,
        required: true,
        min: 10,
        max: 255
    },
    password: {
        type: String,
        required: true,
        min: 8,
        max: 1024
    },
    role: {
        type: String,
        default: 'user'
    }
});

module.exports = mongoose.model('User', userSchema);