const router = require('express').Router();
const User = require('../model/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { registerValidation, loginValidation } = require('../validation');


router.post('/register', async (req,res) => {

    //Validate data
    const {error} = registerValidation(req.body);

    if (error) {
        res.status(400).send(error.details[0].message);
        return;
    };

    //Checking if the user is already in the DB
    const emailExist = await User.findOne({email: req.body.email});

    if (emailExist) {
        return res.status(400).send('Email already exist!');
    };

    //Hash passwords
    const salt = await bcrypt.genSalt(10);
    const hashPaswowrd = await bcrypt.hash(req.body.password, salt);

    //create new user
    const user = new User({
        email: req.body.email,
        password: hashPaswowrd,
        role: req.body.role
    });

    //SAVE to DB
    try {
        const savedUser = await user.save();
        res.status(201).send(savedUser);
    } catch(err) {
        res.status(400).send(err);
    }

});

router.post('/login', async (req,res) => {
    //Validate data
    const {error} = loginValidation(req.body);

    if (error) {
        res.status(400).send(error.details[0].message);
        return;
    };

    //Checking if the user is already in the DB
    const user = await User.findOne({email: req.body.email});

    if (!user) {
        return res.status(400).send('Email not found!');
    };

    //Checking password
    const validPass = await bcrypt.compare(req.body.password, user.password);

    if (!validPass) {
        return res.status(400).send('Invalid password!')
    };

    //create and assign a token for validation
    const token = jwt.sign({_id: user._id}, process.env.TOKEN_SECRET);
    res.header('auth-token', token).send('Succesfully login! ' + token);

});



module.exports = router;
