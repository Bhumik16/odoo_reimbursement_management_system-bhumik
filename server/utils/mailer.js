const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendUserCredentials(email, password) {
  try {
    await transporter.sendMail({
      from: '"ReimburseHQ" <no-reply@reimbursehq.com>',
      to: email,
      subject: "Your Account Credentials",
      html: `
        <h3>Welcome to ReimburseHQ</h3>
        <p>Your account has been created.</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Password:</strong> ${password}</p>
        <p>Please login and change your password.</p>
      `
    });
    console.log('Credentials successfully sent to ' + email);
  } catch (err) {
    // Suppress the error intentionally so it does not block user creation flow
    console.error("Failed to send credentials email (check credentials in .env):", err.message);
  }
}

module.exports = { sendUserCredentials };
