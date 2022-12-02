const express = require('express');
const router = express.Router();
const { authentication, authorization } = require('../middlewares/auth')
const { signUp, login, getUser, updateUser } = require('../controllers/userController');
const { uploadDocument, getDocumentById, deleteDocument, getAllDocument } = require('../controllers/documentController');



//----------------------------- User's API -----------------------------//

router.post('/signup', signUp);
router.post('/login', login);
router.get('/user/:userId/profile', authentication, authorization, getUser);
router.put('/user/:userId/profile', authentication, authorization, updateUser);



// //----------------------------- document's API -----------------------------//

router.post('/user/:userId/document', authentication, authorization, uploadDocument);
router.get('/user/:userId/document/:documentId', authentication, authorization, getDocumentById);
router.get('/user/:userId/document', authentication, authorization, getAllDocument);
router.delete('/user/:userId/document/:documentId', authentication, authorization, deleteDocument);



//----------------------------- For invalid end URL -----------------------------//

router.all('/**', function (_, res) {
    return res.status(400).send({ status: false, message: "Invalid http request" })
})


module.exports = router; 