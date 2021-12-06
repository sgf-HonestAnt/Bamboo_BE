import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

export const sendWelcome = async recipient => {
    const msg = {
        to: recipient,
        from: "sgfishercardiff@gmail.com",
        subject: "Thank you for signing up with Panda",
        text: "I really appreciate it!",
    }
    try {
      await sgMail.send(msg);
    } catch (error) {
      console.log(error);
    }
}