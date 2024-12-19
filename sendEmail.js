const nodemailer = require("nodemailer");

const sendEmail = async content => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });
  await transporter.verify();
  const data = await transporter.sendMail({
    to: process.env.SMTP_EMAIL,
    from: process.env.SMTP_EMAIL,
    subject: "New WTTJ posts that might interest you",
    html: content,
  });
  return data;
};

module.exports = { sendEmail };
