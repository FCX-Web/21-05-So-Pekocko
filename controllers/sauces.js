const Sauce = require('../models/Sauce');
const fs = require('fs');
const { exit } = require('process');

exports.createSauce = (req, res, next) => {
    const sauceObject = JSON.parse(req.body.sauce);
    const sauce = new Sauce({
        ...sauceObject,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    });
    sauce.save()
        .then(() => {
            console.log('objet enregistré !');
            res.status(201).json({ message: 'objet enregistré !' });
        })
        .catch(error => {
            console.log('erreur lors de l\'enregistrement !');
            res.status(400).json({ error: 'erreur lors de l\'enregistrement !' });
        });
    sauce.likes = 0;
    sauce.dislikes = 0;

};

exports.modifySauce = (req, res, next) => {
    const sauceObject = req.file ? {
        ...JSON.parse(req.body.sauce),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    } : {...req.body };
    Sauce.updateOne({ _id: req.params.id }, {...sauceObject, _id: req.params.id })
        .then(() => {
            res.status(200).json({ message: 'objet modifié !' });
            console.log('objet modifié !');
        })
        .catch(error => {
            res.status(400).json({ error });
            console.log('erreur lors de la modification !');
        });
};

exports.deleteSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
        .then(sauce => {
            const filename = sauce.imageUrl.split('/images/')[1];
            fs.unlink(`images/${filename}`, () => {
                Sauce.deleteOne({ _id: req.params.id })
                    .then(() => {
                        res.status(200).json({ message: 'objet supprimé !' });
                        console.log('objet supprimé !');
                    })
                    .catch(error => {
                        res.status(400).json({ error });
                        console.log('erreur lors de la suppression !');
                    });
            });
        })
        .catch(error => {
            res.status(500).json({ error });
            console.log('erreur pendant le process de suppression !');
        });
};

exports.getOneSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
        .then(sauce => res.status(200).json(sauce))
        .catch(error => res.status(404).json({ error }));
};

exports.getAllSauces = (req, res, next) => {
    Sauce.find()
        .then(sauces => res.status(200).json(sauces))
        .catch(error => res.status(400).json({ error }));
};

exports.feedbackSauce = (req, res, next) => {
    const sauceId = req.params.id;
    const userId = req.body.userId;
    const like = req.body.like;

    Sauce.findOne({ _id: sauceId })
        .then((sauce) => {
            if (sauce.userId === userId) {
                res.status(200).json({ message: 'Vous êtes propriétaire de cette sauce. Vous ne pouvez pas donner votre avis !' });
                console.log('Vous êtes propriétaire de cette sauce. Vous ne pouvez pas donner votre avis !');
            } else if (like == 0) {
                if (sauce.usersLiked.includes(userId)) {
                    Sauce.updateOne({ _id: sauceId }, { $inc: { likes: -1 }, $pull: { usersLiked: userId } })
                        .then(() => {
                            res.status(200).json({ message: 'like annulé !' });
                            console.log('Like annulé !');
                        })
                        .catch((error) => {
                            res.status(400).json({ error });
                            console.log('erreur annulation like !');
                        })
                } else {
                    Sauce.updateOne({ _id: sauceId }, { $inc: { dislikes: -1 }, $pull: { usersDisliked: userId } })
                        .then(() => {
                            res.status(200).json({ message: 'dislike annulé !' });
                            console.log('dislike annulé !');
                        })
                        .catch((error) => {
                            res.status(400).json({ error });
                            console.log('erreur annulation dislike !');
                        })
                }
                // } else if (sauce.usersLiked.includes(userId) || sauce.usersDisliked.includes(userId)) {
                //     res.status(200).json({ message: 'Avis déjà donné !' });
                //     console.log('\nAvis déjà donné !');
            } else {
                if (like == 1) {
                    Sauce.updateOne({ _id: sauceId }, { $inc: { likes: +1 }, $push: { usersLiked: userId } })
                        .then(() => {
                            res.status(200).json({ message: 'like ajouté !' });
                            console.log('like ajouté !');
                        })
                        .catch((error) => {
                            res.status(400).json({ error });
                            console.log('erreur ajout like !');
                        })
                } else {
                    Sauce.updateOne({ _id: sauceId }, { $inc: { dislikes: +1 }, $push: { usersDisliked: userId } })
                        .then(() => {
                            res.status(200).json({ message: 'dislike ajouté !' });
                            console.log('dislike ajouté !');
                        })
                        .catch((error) => {
                            res.status(400).json({ error });
                            console.log('erreur ajout dislike !');
                        })
                }
            }
        })
        .catch(error => {
            res.status(400).json({ error });
            console.log('erreur lors de la gestion des like/dislike !');
        });
};