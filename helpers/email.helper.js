const nodemailer = require("nodemailer");

exports.emailSMPT = {
  sendEmail: async (toEmail, subject, html) => {
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_SMTP,
        pass: process.env.EMAIL_PASSWORD_SMTP,
      },
    });
    const mailOptions = {
      from: "admin@gmail.com",
      to: toEmail,
      subject: subject,
      html: html,
    };

    // Gửi email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
      } else {
        console.log("Email sent:", info.response);
      }
    });
  },
};
