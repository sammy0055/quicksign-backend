require('dotenv').config();
module.exports = {
    host: process.env.GOOGLE_HOST,
    port: 465,
    secure: true,
    auth: {
        user: process.env.GOOGLE_GENEREATED_ETHEREAL_USER, // generated ethereal user
        pass: process.env.GOOGLE_GENEREATED_ETHEREAL_PASSWORD, // generated ethereal password
    },
};