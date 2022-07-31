const router = require('express').Router();
const verify = require('./verifyToken');
const User = require('../model/User');
const dataImages = require('../model/DataImages')
const fs = require('node:fs/promises');
const { Client } = require('node-pexels');
const cloudinary = require('cloudinary').v2;


//Had to import and run these again because it is not detecting the dotenv data for cloudinary config.
const dotenv = require('dotenv');
dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const client = new Client({ apiKey: process.env.PEXELS_API });

//REQUESTING MULTIPLE IMAGES
//The 'verify code is to validate the login status before using router.GET
router.get('/', verify, async (req, res) => {
    const user = await User.findOne({_id: req.user});
    const userID = user._id;
    const userRole = user.role;

    //Checking the role of the user who logged in. 
    if (userRole !== 'admin' && userRole !== 'user') {
        res.status(404).send('You do not have have permission.');
        return;
    }

    //Checking the limit if it is greather than 10
    if (req.body.limit > 10) {
        res.status(404).send('Too many pictures. Maximum of 10 only.');
        return;
    } 

    //if Quantity or topic was not specified in the GET request. 
    const imageQuantity = req.body.limit || 5;
    const topic = req.body.topic || 'random';

    //Search function
    const search = await client.v1.photos.search(topic, { perPage: imageQuantity, page: 1 });

    if (!search) {
        res.status(404).send('No results found!');
        return;
    }

    //Array Variables for saving the informations of the uploaded images per imageQuantity
    var sub_array = [];
    var super_array = [];

    //Looping to the number of image quantity and downloading it.
    for (i = 0; i <= imageQuantity - 1; i++) {
        const photo = await client.v1.photos.fetch(search.photos[i], 'medium')

        const format = photo.format;
        const data = photo.data;
        const path = `./downloadedImages/${userID}_${topic} ${i + 1}.${format}`;

        fs.writeFile(path, data);
   
        try {
             //Uploading to Cloudinary
            const result = await cloudinary.uploader.upload(path, data);

            sub_array.push({
                id: result.public_id,
                hits: 1,
                uri: result.secure_url
            });

            super_array.push(sub_array.slice(0));

        } catch(err) {
            console.log(err);
        };
  

        if (i === imageQuantity - 1) {

            //create new entry to database
            const dataimages = new dataImages({
                limit: imageQuantity,
                data: sub_array,
                owner: userID
            })

            const saveddataimages = await dataimages.save();
            res.status(200).send(saveddataimages);

        };
        
     };
});


//REQUESTING A SINGLE IMAGE BY ID
router.get('/:id', verify, async (req, res) => {
    const user = await User.findOne({_id: req.user});
    const userID = user._id;
    const userRole = user.role;
    
    //Checking the role of the user who logged in. 
    if (userRole !== 'admin' && userRole !== 'user') {
        res.status(404).send('You do not have have permission.');
        return;
    }

    const imageData = await dataImages.findOne({owner: userID})

    var resultIndex = 0;
    var exist = false

    for (i = 0; i < imageData.limit; i++) {
        const imageID = imageData.data[i].id;

        if (imageID === req.params.id) {
            resultIndex = i;
            exist = true;
            break;
        }
    }


    if (exist === true) {
        imageData.data[resultIndex].hits += 1;

        const save = await imageData.save();

        res.status(200).send(imageData.data[resultIndex]);
        
    } else {
        res.status(404).send(`No image with ID: ${req.params.id} found in your account!`);
    }

});

//UPDATING IMAGE BY AN ID
router.patch('/:id', verify, async (req, res) => {
    const user = await User.findOne({_id: req.user});
    const userID = user._id;
    const userRole = user.role;

    //Checking the role of the user who logged in. 
    if (userRole !== 'admin' && userRole !== 'user') {
        res.status(404).send('You do not have have permission.');
        return;
    }

    const imageData = await dataImages.findOne({owner: userID})

    var resultIndex = 0;
    var exist = false

    for (i = 0; i < imageData.limit; i++) {
        const imageID = imageData.data[i].id;

        if (imageID === req.params.id) {
            resultIndex = i;
            var exist = true;
            break;
        }
    }

    if (exist === true) {
        imageData.data[resultIndex].hits = req.body.hits;
        imageData.data[resultIndex].uri = req.body.uri;

        const save = await imageData.save();

        res.json(imageData.data[resultIndex]);

    } else {
        res.status(404).send(`No image with ID: ${req.params.id} found in your account!`);
    };


});

//CREATING A SINGLE IMAGE
router.post('/', verify, async (req, res) => {
    const user = await User.findOne({_id: req.user});
    const userID = user._id;
    const userRole = user.role;

    //Checking the role of the user who logged in. 
    if (userRole !== 'admin' && userRole !== 'user') {
        res.status(404).send('You do not have have permission.');
        return;
    };

    const imageData = await dataImages.findOneAndUpdate({owner : userID})

    imageData.limit += 1;
    imageData.data.push({
        uri: req.body.uri,
        owner: userID
    })

    const save = imageData.save();

    res.status(200).json(imageData);
})

//DELETING AN IMAGE BY AN ID
router.delete('/:id', verify, async (req, res) => {
    const user = await User.findOne({_id: req.user});
    const userID = user._id;
    const userRole = user.role;

    //Checking the role of the user who logged in. 
    if (userRole !== 'admin' && userRole !== 'user') {
        res.status(404).send('You do not have have permission.');
        return;
    };

    const imageData = await dataImages.findOneAndUpdate({owner : userID})

    var resultIndex = 0;
    var exist = false

    for (i = 0; i < imageData.limit; i++) {
        const imageID = imageData.data[i].id;

        if (imageID === req.params.id) {
            resultIndex = i;
            break;
        }
    }

    if (exist == true) {
        imageData.limit -= 1;

        imageData.data[resultIndex].delete()

        const save = await imageData.save();
        
        res.status(200).json(imageData);

    } else {
        res.status(404).send(`No image with ID: ${req.params.id} found in your account!`);
    };
})

module.exports = router;