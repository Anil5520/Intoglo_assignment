const userModel = require("../models/userModel");
const jwt = require("jsonwebtoken");
const upload = require('../.aws/config');


const isValid = function (value) {
    if (typeof value === "undefined" || value === null) return false;
    if (typeof value === "string" && value.trim().length === 0) return false;
    return true;
};
const isValidBody = function (data) {
    return Object.keys(data).length > 0;
};


let validname = /^[a-zA-Z\.]+$/;
let emailRegex = /^([0-9a-z]([-_\\.]*[0-9a-z]+)*)@([a-z]([-_\\.]*[a-z]+)*)[\\.]([a-z]{2,9})+$/;
let validPhone = /^[6-9]\d{9}$/;
let validPassword = /^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z]).{8,15}$/;





/*############################################ 1.Create User Api ###############################################*/


const signUp = async function (req, res) {
    try {
        const data = req.body;
        let files = req.files;
        const { name, phone, email, password } = data

        if (Object.keys(data).length == 0) {
            return res.status(400).send({ status: false, message: "Body cannot be empty" });
        }

        // Checks whether name is empty or is enter as a string or contains only letters
        if (!isValid(name)) {
            return res.status(400).send({ status: false, message: "Please enter user name" });
        }
        if (!validname.test(name)) {
            return res.status(400).send({ status: false, message: "The user name may contain only letters" });
        }


        // phone validations
        if (!isValid(phone)) {
            return res.status(400).send({ status: false, message: "Please Enter Phone Number" });
        }
        if (!validPhone.test(phone)) {
            return res.status(400).send({ status: false, message: "The user phone number should be indian may contain only 10 number" });
        }


        // email validations
        if (!isValid(email)) {
            return res.status(400).send({ status: false, message: "Please enter E-mail" });
        }
        if (!emailRegex.test(email)) {
            return res.status(400).send({ status: false, message: "Entered email is invalid" });
        }


        // Checks whether password is empty or is enter as a string or a valid pasword.
        if (!isValid(password)) {
            return res.status(400).send({ status: false, message: "Please enter Password" });
        }
        if (!validPassword.test(password)) {
            return res.status(400).send({ status: false, message: "Please enter password in range of '8-15', with at least a symbol, upper and lower case letters and a number" });
        }


        // checking uniqueness of email and phone
        let duplicatePhone = await userModel.findOne({ phone });
        if (duplicatePhone) {
            return res.status(409).send({ status: false, message: `${phone} already exists` });
        }
        let duplicateEmail = await userModel.findOne({ email });
        if (duplicateEmail) {
            return res.status(409).send({ status: false, message: `${email} already exists` });
        }

        // if photo is provided then cheking extension of file.
        if (files && files.length > 0) {
            let check = files[0].originalname.split(".")
            const extension = ["png", "jpg", "jpeg", "webp"]
            if (extension.indexOf(check[check.length - 1]) == -1) {
                return res.status(400).send({ status: false, message: "Please provide image only" })
            }
            //upload to s3 and get the uploaded link
            let uploadedFileURL = await upload.uploadFile(files[0])
            data.photo = uploadedFileURL;
        }

        //user creation
        let savedData = await userModel.create(data)
        return res.status(201).send({ status: true, data: savedData })
    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}






/*############################################ 2. Login ###############################################*/


const login = async function (req, res) {
    try {
        let data = req.body
        let { email, password } = data

        if (Object.keys(data).length == 0) {
            return res.status(400).send({ status: false, message: "Body cannot be empty" });
        }

        // Checks whether email is entered or not
        if (!email) {
            return res.status(400).send({ status: false, message: "Please enter E-mail" });
        }
        // Checks whether password is entered or not
        if (!password) {
            return res.status(400).send({ status: false, message: "Please enter Password" });
        }

        //Finding credentials 
        let user = await userModel.findOne({ email, password })
        if (!user) {
            return res.status(401).send({ status: false, message: "Invalid credential" })
        }

        //Token generation
        const token = jwt.sign({
            userId: user._id.toString(),
            project: "intoglo_assignment",
        }, "doneByAnil")

        res.setHeader("Authorization", token);
        const output = {
            userId: user._id,
            token: token
        }
        return res.status(200).send({ status: true, message: "User login successfull", data: output })
    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
};







/*########################################## 3. Get User Detail ############################################*/

const getUser = async function (req, res) {
    try {
        let userId = req.params.userId

        //----------------------------- Getting User Detail -----------------------------//
        let userData = await userModel.findById(userId)
        return res.status(200).send({ status: true, message: "User profile details", data: userData })
    }
    catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
}






/*############################################ 4. Update User ###############################################*/

const updateUser = async function (req, res) {
    try {
        let userId = req.params.userId
        let data = req.body
        let files = req.files

        //----------------------------- Checking if user exist or not -----------------------------//
        let checkUser = await userModel.findOne({ _id: userId })
        if (!checkUser) {
            return res.status(404).send({ status: false, message: "User does not exist with this userId" })
        }

        let { name, phone, email, password, photo } = data

        //----------------------------- Validating body -----------------------------//
        if (!isValidBody(data) && !isValid(files)) {
            return res.status(400).send({ status: false, message: "please provide data in request body" })
        }

        if ('photo' in data) {
            if (Object.keys(photo).length === 0) {
                return res.status(400).send({ status: false, message: 'profileImage is empty, either provide file or deselect it.' })
            }
        }

        //----------------------------- Updating Profile Image -----------------------------//       
        if (files && files.length != 0) {
            //if key of provided file do not matches with 'profileImage' then it will return the response here only 
            if (!(files[0].fieldname === "photo")) {
                return res.status(400).send({ status: false, message: "Please provide valid field name as 'photo' only" })
            }

            let check = files[0].originalname.split(".")
            const extension = ["png", "jpg", "jpeg", "webp"]
            if (extension.indexOf(check[check.length - 1]) == -1) {
                return res.status(400).send({ status: false, message: "Please provide image only" })
            }
            let uploadedFileURL = await upload.uploadFile(files[0])
            checkUser.photo = uploadedFileURL
        }


        //----------------------------- Updating name -----------------------------//
        if ("name" in data) {
            if (!isValid(name) || !validname.test(name)) {
                return res.status(400).send({ status: false, message: "name should contain alphabetic character only" })
            } checkUser.name = name
        }


        //----------------------------- Updating email -----------------------------//
        if ("email" in data) {
            if (!isValid(email) || !emailRegex.test(email)) {
                return res.status(400).send({ status: false, message: "email is not Valid" })
            }
            let uniqueEmail = await userModel.findOne({ email })
            if (uniqueEmail) {
                return res.status(409).send({ status: false, message: "This email already exists, Please try another one." })
            } checkUser.email = email
        }

        //----------------------------- Updating phone -----------------------------//
        if ("phone" in data) {
            if (!isValid(phone) || !phoneRegex.test(phone)) {
                return res.status(400).send({ status: false, message: "Phone no is not Valid" })
            }
            let uniquePhone = await userModel.findOne({ phone })
            if (uniquePhone) {
                return res.status(409).send({ status: false, message: "This phone number already exists, Please try another one." })
            } checkUser.phone = phone
        }

        //----------------------------- Updating Bcrypted Password -----------------------------//
        if ("password" in data) {
            if (!validPassword.test(password)) {
                return res.status(400).send({ status: false, message: "Please enter password in range of '8-15', with at least a symbol, upper and lower case letters and a number" });
            }
            checkUser.password = password
        }


        //----------------------------- Saving Updates -----------------------------//
        await checkUser.save()
        return res.status(200).send({ status: true, message: "User profile updated", data: checkUser })
    }
    catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
}




module.exports = { signUp, login, getUser, updateUser }