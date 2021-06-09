const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const passwordValidator = require("password-validator");
const cryptojs = require("crypto-js");

const User = require('../models/User');

const schema = new passwordValidator();
schema
    .is().min(8) // minimum 8 caractères
    .is().max(20) // maximum 20 caractères
    .has().uppercase() // doit avoir des majuscules
    .has().lowercase() // doit avoir des minuscules
    .has().digits() // doit avoir des chiffres
    .has().not().spaces(); // ne doit pas avoir d'espace

const checkSpecialChar = /^-|[&#{([|\@)\]}+£$%*?,.;/!]/;

exports.signup = async(req, res, next) => {
    let hash = null;
    const pwd = req.body.password;
    const encryptedEmail = cryptojs.HmacSHA256(req.body.email, process.env.secureEmail).toString();

    if (!schema.validate(pwd) && !pwd.match(checkSpecialChar)) {
        console.log("erreur format password !");
        return res.status(500).json({ error: 'erreur format password !' });
    }

    try {
        hash = await bcrypt.hash(pwd, 10);
    } catch (error) {
        console.log('erreur pendant le process de création !');
        return res.status(500).json({ error: 'erreur pendant le process de création !' });
    }

    const user = new User({
        email: encryptedEmail,
        password: hash
    });

    try {
        await user.save();
        console.log('Utilisateur créé !');
        return res.status(201).json({ message: 'Utilisateur créé !' });
    } catch (error) {
        console.log('erreur lors de la création !');
        return res.status(400).json({ error: 'erreur lors de la création !' });
    }
};

exports.login = (req, res, next) => {
    const encryptedEmail = cryptojs.HmacSHA256(req.body.email, process.env.secureEmail).toString();

    User.findOne({ email: encryptedEmail })
        .then(user => {
            if (!user) {
                console.log('Utilisateur non trouvé !');
                return res.status(401).json({ error: 'Utilisateur non trouvé !' });
            }
            bcrypt.compare(req.body.password, user.password)
                .then(valid => {
                    if (!valid) {
                        console.log('Mot de passe incorrect !');
                        return res.status(401).json({ error: 'Mot de passe incorrect !' });
                    }
                    res.status(200).json({
                        userId: user._id,
                        token: jwt.sign({ userId: user._id },
                            process.env.tokenDev, { expiresIn: '2h' }
                        )
                    });
                    console.log('Connexion réussie !');
                })
                .catch(error => {
                    console.log('erreur lors de l\'authentification');
                    res.status(500).json({ error: 'erreur lors de l\'authentification' });
                });
        })
        .catch(error => {
            console.log('erreur pendant le process d\'authentification !');
            res.status(500).json({ error: 'erreur pendant le process d\'authentification !' });
        });
};

//Limiter le nombre de tentatives de connexion : https://github.com/StephaneChimy/projet-6