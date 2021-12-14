const Sauce = require('../models/Sauce');
const fs = require('fs');

//Requête GET générale
exports.getAllSauces = (req, res, next) => {
    Sauce.find()
        .then(sauces => res.status(200).json(sauces))
        .catch(error => res.status(400).json({error}));
};

//Requête GET ciblée
exports.getOneSauce = (req, res, next) => {
    Sauce.findOne({_id: req.params.id})
        .then(sauces => res.status(200).json(sauces))
        .catch(error => res.status(404).json({error}));
};

//Requête POST sauce
exports.createSauce = (req, res, next) => {
    const sauceObject = JSON.parse(req.body.sauce);
    delete sauceObject._id;    
    const sauce = new Sauce ({
        ...sauceObject,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
        likes: 0,
        dislikes: 0,
        usersLiked:[],
        usersDisliked: []
    });
    sauce.save()
        .then(() => res.status(201).json({message: "Nouvelle sauce créée"}))
        .catch(error => res.status(400).json({error}));
};

//Requête PUT
exports.updateSauce = (req, res, next) => {
    if (req.file) {
        Sauce.findOne({_id: req.params.id})
            .then (sauce => {
                const filename = sauce.imageUrl.split('/images/')[1];
                fs.unlinkSync(`images/${filename}`);})
            .catch (error => res.status(500).json({error}));
    }
    const sauceObject = req.file ? 
        { ...JSON.parse(req.body.sauce),
            imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
        } : { ...req.body};    
    Sauce.updateOne({_id: req.params.id},{...sauceObject, _id: req.params.id})
      .then(() => res.status(200).json({message: 'Objet modifié'}))
      .catch(error => res.status(400).json({error}));
};

//Requête DELETE
exports.deleteSauce = (req, res, next) => {
    Sauce.findOne({_id: req.params.id})
      .then (sauce => {
        const filename = sauce.imageUrl.split('/images/')[1];
        fs.unlink(`images/${filename}`, () => {
          Sauce.deleteOne({_id: req.params.id})
            .then(() => res.status(200).json({message: 'Objet supprimé'}))  
            .catch(error => res.status(400).json({error}));
        });
      })
      .catch(error => res.status(500).json({error}));
};

//Requête POST like
exports.likeSauce = (req, res, next) => {
    const like = req.body.like;
    const userId = req.body.userId;
    Sauce.findOne({_id: req.params.id})
        .then (sauce => {
            switch (like) {
                case 0: 
                    if (sauce.usersLiked.includes(userId)) {
                        sauce.usersLiked.splice(sauce.usersLiked.indexOf(userId),1);
                        sauce.likes--;
                    } 
                    if (sauce.usersDisliked.includes(userId)) {
                        sauce.usersDisliked.splice(sauce.usersDisliked.indexOf(userId),1);
                        sauce.dislikes--;
                    } 
                    break;
                case 1:
                    if (!sauce.usersLiked.includes(userId)) {
                        sauce.usersLiked.push(userId);
                        sauce.likes++;
                    }; 
                    break;
                case -1:
                    if (!sauce.usersDisliked.includes(userId)) {
                        sauce.usersDisliked.push(userId);
                        sauce.dislikes++;
                    };
                    break;
            };
            sauceObject = {
                likes: sauce.likes,
                dislikes: sauce.dislikes,
                usersLiked: sauce.usersLiked,
                usersDisliked: sauce.usersDisliked
            }
            Sauce.updateOne({_id: req.params.id}, {...sauceObject, _id: req.params.id})
                .then(() => res.status(200).json({message: 'Like modifié'}))
                .catch(error => res.status(400).json({error}));
        })
        .catch(error => res.status(500).json({error}));
};