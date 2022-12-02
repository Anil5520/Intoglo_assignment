const documentModel = require('../models/documentModel');
const upload = require('../.aws/config');
const mongoose = require('mongoose');



const uploadDocument = async function (req, res) {
    try {
        let files = req.files;
        let userId = req.params.userId;

        // if document is provided then cheking extension of file.
        if (files && files.length > 0) {
            let check = files[0].originalname.split(".")
            const extension = ["csv", "pdf", 'xls']
            if (extension.indexOf(check[check.length - 1]) == -1) {
                return res.status(400).send({ status: false, message: "Please provide 'pdf', 'csv' or 'xls' file only" })
            }
            //upload to s3 and get the uploaded link
            let uploadedFileURL = await upload.uploadFile(files[0])
            files = uploadedFileURL;
        } else {
            return res.status(400).send({ status: false, message: "Please Provide document, It is mandatory" })
        }


        //document creation
        let savedData = await documentModel.create({ document: files, userId })
        return res.status(201).send({ status: true, data: savedData })
    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}




const getDocumentById = async function (req, res) {
    try {
        const documentId = req.params.documentId

        //validation for given documentId
        if (!mongoose.isValidObjectId(documentId)) {
            return res.status(400).send({ status: false, message: "please enter valid documentId" })
        }

        //----------------------------- Getting document Detail -----------------------------//
        const documentData = await documentModel.findOne({ _id: documentId, isDeleted: false })
        if (!documentData) {
            return res.status(404).send({ status: false, message: "document not found" })
        }

        return res.status(200).send({ status: true, message: "document Detail", data: documentData })
    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}




const getAllDocument = async function (req, res) {
    try {
        const userId = req.params.userId

        //----------------------------- Getting document Detail -----------------------------//
        const documentData = await documentModel.find({ userId, isDeleted: false })
        if (!documentData) {
            return res.status(404).send({ status: false, message: "document not found" })
        }
        return res.status(200).send({ status: true, message: "document Detail", data: documentData })
    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}




const deleteDocument = async function (req, res) {
    try {
        const documentId = req.params.documentId

        //validation for given documentId
        if (!mongoose.isValidObjectId(documentId)) {
            return res.status(400).send({ status: false, message: "please enter valid documentId" })
        }

        //----------------------------- Product Deletion -----------------------------//
        let productData = await documentModel.updateOne({ _id: documentId, isDeleted: false }, { $set: { isDeleted: true } }, { returnDocument: "after" })
        if (productData.modifiedCount == 0) {
            return res.status(404).send({ status: false, message: "Document is already deleted or does not exist" })
        }
        return res.status(200).send({ status: true, message: "Document deleted Successfully..." })
    }
    catch (error) {
        res.status(500).send({ status: false, messsage: error.message })
    }
}


module.exports = { uploadDocument, getDocumentById, deleteDocument, getAllDocument }