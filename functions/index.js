const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();

// NOTE: Configure this with your actual SMTP credentials or SendGrid
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: functions.config().email?.user || "your-email@gmail.com",
    pass: functions.config().email?.pass || "your-app-password",
  },
});

exports.sendEmailOTP = functions.https.onCall(async (data, context) => {
  const email = data.email;
  if (!email) {
    throw new functions.https.HttpsError("invalid-argument", "Email is required");
  }

  // Generate 6 digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

  // Store in Firestore
  await admin.firestore().collection("otps").doc(email).set({
    otp: otp,
    expiresAt: expiresAt,
    attempts: 0,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // Send Email
  const mailOptions = {
    from: '"FuelPro Security" <noreply@fuelpro.com>',
    to: email,
    subject: "Your FuelPro Verification Code",
    text: `Your verification code is: ${otp}. It will expire in 5 minutes.`,
    html: `<h3>FuelPro ERP</h3><p>Your verification code is: <strong>${otp}</strong></p><p>It will expire in 5 minutes.</p>`
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true, message: "OTP sent successfully" };
  } catch (error) {
    console.error("Error sending email:", error);
    throw new functions.https.HttpsError("internal", "Failed to send email");
  }
});

exports.verifyEmailOTP = functions.https.onCall(async (data, context) => {
  const { email, otp } = data;
  if (!email || !otp) {
    throw new functions.https.HttpsError("invalid-argument", "Email and OTP are required");
  }

  const docRef = admin.firestore().collection("otps").doc(email);
  const docSnap = await docRef.get();

  if (!docSnap.exists) {
    throw new functions.https.HttpsError("not-found", "No pending OTP found for this email");
  }

  const otpData = docSnap.data();

  if (Date.now() > otpData.expiresAt) {
    await docRef.delete();
    throw new functions.https.HttpsError("failed-precondition", "OTP has expired");
  }

  if (otpData.attempts >= 5) {
    await docRef.delete();
    throw new functions.https.HttpsError("resource-exhausted", "Too many failed attempts. Request a new OTP.");
  }

  if (otpData.otp !== otp) {
    await docRef.update({ attempts: admin.firestore.FieldValue.increment(1) });
    throw new functions.https.HttpsError("unauthenticated", "Invalid OTP");
  }

  // OTP is correct - delete it to prevent reuse
  await docRef.delete();

  // Find or create user in Firebase Auth
  let userRecord;
  try {
    userRecord = await admin.auth().getUserByEmail(email);
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      userRecord = await admin.auth().createUser({ email: email, emailVerified: true });
    } else {
      throw new functions.https.HttpsError("internal", "Error fetching user");
    }
  }

  // Ensure email is marked verified
  if (!userRecord.emailVerified) {
    await admin.auth().updateUser(userRecord.uid, { emailVerified: true });
  }

  // Mint Custom Token
  const customToken = await admin.auth().createCustomToken(userRecord.uid);
  return { success: true, token: customToken };
});
