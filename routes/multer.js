const multer = require('multer');
const {v4 : uuidv4} = require('uuid');
const path = require('path')


const stoarge = multer.diskStorage({
    destination: function(req,file,cb){
        cb(null , './public/images/uploads')
    },
    filename: function(req,file,cb){
        const uniqueFileName = uuidv4();
        cb(null , uniqueFileName+path.extname(file.originalname))
    }
});

module.exports = multer({storage:stoarge});