"use strict";
var nodemailer = require('nodemailer');

function Logger(options) {
    var mailOptions;
    var mailTransport;
    var transportOptions;
    var mailObject = {};

    this.log = function(message, subject) {
        subject = subject || "";

        if (options.console === true) {
            console.log(message);
        }

        if (options.mail !== undefined && options.mail !== false) {
            mailOptions = options.mail;
            transportOptions = mailOptions.transportOptions || {};
            mailTransport = nodemailer.createTransport(mailOptions.transport, transportOptions);

            mailObject.to = mailOptions.to;
            mailObject.from = mailOptions.from;
            mailObject.subject = mailOptions.subjectPrefix + " " + subject;
            mailObject.text = message;

            mailTransport.sendMail(mailObject, function(err, response) {
                if (err) {
                    console.log(err);
                }
            })
        }
    };
}

exports.Logger = Logger;
