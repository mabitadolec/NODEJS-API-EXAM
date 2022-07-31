const mongoose = require('mongoose');

const dataImagesSchema = new mongoose.Schema({
    limit: {
        type: Number,
        required: true
    },
    data: [{
        id: String,
        hits: {type: Number, default: 1},
        uri: String
    }],
    owner: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('DataImages', dataImagesSchema);