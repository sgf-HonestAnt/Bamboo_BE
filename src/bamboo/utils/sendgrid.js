import sgMail from "@sendgrid/mail";
import fs from "fs";
import { dirname } from "path";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const sendWelcome = async (recipient) => {
  const msg = {
    to: recipient,
    from: "sgfishercardiff@gmail.com",
    subject: "Thank you for signing up!",
    text: "Hi, I'm Sarah Fisher, a full-stack student at Strive School 2021-2022. The Bamboo task app was my capstone project. You can see more about what I'm up to (and a link to my portfolio) at github.com/sgf-HonestAnt.",
  };
  try {
    await sgMail.send(msg);
  } catch (error) {
    console.log(error);
  }
};
export const confirmEdit = async (recipient, pdfPath) => {
  const attachment = fs.readFileSync(pdfPath).toString("base64");
  const msg = {
    to: recipient,
    from: "sgfishercardiff@gmail.com",
    subject: "Your details have been changed!",
    text: "If this wasn't you, please contact us immediately. Otherwise, you can safely ignore this email.",
    attachments: [
      {
        content: attachment,
        filename: "profile.pdf",
        type: "application/pdf",
        disposition: "attachment",
      },
    ],
  };
  try {
    await sgMail.send(msg);
  } catch (error) {
    console.log(error);
  }
};
export const sendGoodbye = async (recipient) => {
  const msg = {
    to: recipient,
    from: "sgfishercardiff@gmail.com",
    subject: "You have successfully removed your details from Bamboo",
    text: "Hi, I'm Sarah Fisher, a full-stack student at Strive School 2021-2022. The Bamboo task app was my capstone project. You can see more about what I'm up to (and a link to my portfolio) at github.com/sgf-HonestAnt.",
  };
  try {
    await sgMail.send(msg);
  } catch (error) {
    console.log(error);
  }
};
