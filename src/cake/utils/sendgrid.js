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

export const sendGoodbye = async recipient => {
    const msg = {
        to: recipient,
        from: "sgfishercardiff@gmail.com",
        subject: "Sorry you're leaving",
        text: "So long and thanks for all the fish!",
    }
    try {
      await sgMail.send(msg);
    } catch (error) {
      console.log(error);
    }
}