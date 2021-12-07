import sgMail from "@sendgrid/mail";
import fs from "fs";
import { dirname } from "path";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const sendWelcome = async (recipient) => {
  const msg = {
    to: recipient,
    from: "sgfishercardiff@gmail.com",
    subject: "Thank you for signing up with Panda",
    text: "I really appreciate it!",
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
    text: "If this wasn't you, please contact Panda immediately. Otherwise, you can ignore this email.",
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
    subject: "Sorry you're leaving",
    text: "So long and thanks for all the fish!",
  };
  try {
    await sgMail.send(msg);
  } catch (error) {
    console.log(error);
  }
};
