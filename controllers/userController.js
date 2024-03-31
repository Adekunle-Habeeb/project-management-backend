const User = require("../models/userModel");
const verificationToken = require("../models/verificationToken");
const expressAsyncHandler = require("express-async-handler");
const generateToken = require("../config/generateToken");
const { generateOTP, mailTransport, generateEmailTemplate, plainEmailTemplate, sendEmail } = require("../utils/mail")
const {isValidObjectId } = require("mongoose");


const registerController = expressAsyncHandler(async (req, res) => {
  try {
    const { firstName, lastName, email, password, nationality, designation, avatar, phoneNo } = req.body;

    // Check for all required fields
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    // Check if an account with the same email already exists
    const userExist = await User.findOne({ email });
    if (userExist) {
      return res.status(400).json({ msg: "Account already exists" });
    }

    // Create a new user
    const user = new User({
      firstName,
      lastName,
      email,
      password,
      nationality,
      designation,
      avatar,
    });

    // Save the user
    await user.save();

    // Generate OTP and create a verification token
    const OTP = generateOTP();
    const verificationTokenInstance = new verificationToken({
      owner: user._id,
      token: OTP
    });
    await verificationTokenInstance.save();

    // Send the verification email
    const transporter = mailTransport();
    const emailOptions = {
      from: "Way found support<support@wayfound.com>",
      to: user.email,
      subject: "Verify your email account",
      html: generateEmailTemplate(OTP),
    };

    transporter.sendMail(emailOptions, (error, info) => {
      if (error) {
        console.log(error);
        // Handle email sending error
        return res.status(500).json({ msg: "Email sending failed" });
      } else {
        console.log("Email sent:", info.response);
        // Continue with registration response
        res.json({
          _id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          nationality: user.nationality,
          designation: user.designation,
          avatar: user.avatar,
          phoneNo: user.phoneNo,
          token: generateToken(user._id),
        });
      }
    });
  } catch (error) {
    console.error("Registration error:", error);
    // Handle other registration errors
    res.status(500).json({ msg: "Registration failed" });
  }
});


const verifyUser = expressAsyncHandler(async (req, res) => {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp.trim()) {
      return res.status(400).json({ msg: "Invalid request, missing parameters" });
    }

    if (!isValidObjectId(userId)) {
      return res.status(400).json({ msg: "Invalid user Id" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({ msg: "Sorry, user not found" });
    }

    if (user.verified) {
      return res.status(400).json({ msg: "This account is already verified" });
    }

    const token = await verificationToken.findOne({ owner: user._id });
    if (!token) {
      return res.status(400).json({ msg: "Sorry, user not found" });
    }

    const isMatched = await token.compareToken(otp);
    if (!isMatched) {
      return res.status(400).json({ msg: "Please provide a valid token" });
    }

    user.verified = true;
    await verificationToken.findByIdAndDelete(token._id);
    await user.save();

    const transporter = mailTransport();
    const emailOptions = {
      from: "Way found support<support@wayfound.com>",
      to: user.email, // Make sure 'user.email' is defined
      subject: "verify your email account",
      html: "<h1>Email has been verified successfully</h1>",
    };

    // Send the email
    transporter.sendMail(emailOptions, (error, info) => {
      if (error) {
        console.error("Email sending failed:", error);
      } else {
        console.log("Email sent:", info.response);
      }

      // Respond to the client and stop the operation
      return res.status(200).json({ msg: "Verification successful" });
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ msg: "Internal server error" });
  }
});


const loginController = expressAsyncHandler(async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    console.log(user);

    if (user) {
      if (await user.matchPassword(password)) {
        if (user.verified) {
          res.json({
            _id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            nationality: user.nationality,
            designation: user.designation,
            avatar: user.avatar,
            phoneNo: user.phoneNo,
            token: generateToken(user._id)
          });
        } else {
          res.status(401).json({ msg: "User is not verified" });
        }
      } else {
        res.status(401).json({ msg: "Invalid password" });
      }
    } else {
      res.status(401).json({ msg: "User not found" });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ msg: "Internal server error" });
  }
});


const forgotPasswordController = expressAsyncHandler(async (req, res, next) => {
  try {
    // 1. Get the user based on their email
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found with that email' });
    }

    // 2. Generate an OTP and save it to the user
    const otp = generateOTP();
    user.passwordResetToken = otp;
    user.passwordResetTokenExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    const transporter = mailTransport();
    const emailOptions = {
      from: "Way found support<support@wayfound.com>",
      to: user.email,
      subject: "Password reset",
      html: generateEmailTemplate(otp),
    };

    transporter.sendMail(emailOptions, async (error, info) => {
      if (error) {
        console.error("Email sending failed:", error);
        // Handle email sending error
        return res.status(500).json({ msg: "Email sending failed" });
      } else {
        console.log("Email sent:", info.response);

        // Return a success response with the user's email for resetting the password
        res.status(200).json({
          status: "success",
          msg: "Please check your email for the password reset link",
          userEmail: user.email,
        });
      }
    });
  } catch (error) {
    next(error);
  }
});


const resetPasswordController = expressAsyncHandler(async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    // 1. Find the user based on their email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found with that email' });
    }

    // 2. Check if the provided OTP matches the stored OTP in the user document
    if (user.passwordResetToken !== otp) {
      return res.status(401).json({ message: 'Invalid OTP' });
    }

    // 3. Check if the OTP is still valid (not expired)
    const currentTime = Date.now();
    if (currentTime > user.passwordResetTokenExpires) {
      return res.status(401).json({ message: 'OTP has expired' });
    }

    // 4. Update the user's password with the new one
    user.password = newPassword;
    // Clear the used OTP
    user.passwordResetToken = null;
    user.passwordResetTokenExpires = null;
    await user.save();

    // 5. Send an email indicating that the password has been reset
    const transporter = mailTransport();
    const emailOptions = {
      from: "Way found support<support@wayfound.com>",
      to: user.email, // Make sure 'user.email' is defined
      subject: "Password Reset Successful",
      html: "<h1>Your password has been reset successfully.</h1>",
    };

    transporter.sendMail(emailOptions, (error, info) => {
      if (error) {
        console.error("Email sending failed:", error);
        // Handle email sending error
      } else {
        console.log("Email sent:", info.response);
      }
    });

    // 6. Send a response to the client indicating that the password has been reset
    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    next(error);
  }
});


const fetchAllUsersController = expressAsyncHandler(async (req, res) => {
  const keyword = req.query.search
    ? {
        $or: [
          { username: { $regex: req.query.search, $options: "i" } },
          { name: { $regex: req.query.search, $options: "i" } },
        ],
      }
    : {};

  const users = await User.find({
    ...keyword,
    _id: { $ne: req.user._id },
  });
  res.send(users);
});

const editUserProfile = expressAsyncHandler(async (req, res) => {
  // Assuming you have a middleware that extracts the user from the request
  const userId = req.user._id;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    switch (req.method) {
      case 'GET':
        // Return user details in response for GET request
        return res.status(200).json({ user });

      case 'PUT':
        // Update user fields based on the request body
        if (req.body.firstName) user.firstName = req.body.firstName;
        if (req.body.lastName) user.lastName = req.body.lastName;
        if (req.body.designation) user.designation = req.body.designation;
        if (req.body.nationality) user.nationality = req.body.nationality;
        // Add more fields as needed

        // Validate if any field is provided for update
        if (
          !req.body.firstName &&
          !req.body.lastName &&
          !req.body.designation &&
          !req.body.nationality
          // Add more fields as needed
        ) {
          return res.status(400).json({ message: 'No valid fields provided for update' });
        }

        // Save the updated user
        await user.save();

        return res.status(200).json({ message: 'Profile updated successfully', user });

      default:
        return res.status(405).json({ message: 'Method Not Allowed' });
    }
  } catch (error) {
    console.error(error); // Log the error for debugging purposes
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});


// Controller function to change user password
const changepasswordController = async (req, res, next) => {
  try {
    // Get user from database
    const user = await User.findById(req.user._id);

    // Check if entered current password matches the stored password
    const isMatch = await user.matchPassword(req.body.currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid current password' });
    }

    // Update user password
    user.password = req.body.newPassword;
    await user.save();

    // Send response
    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};


const editUserController = expressAsyncHandler(async (req, res) => {
  try {
    const userId = req.user._id; 
    const updatedData = req.body;

    const user = await User.findByIdAndUpdate(userId, updatedData, { new: true });

    if (user) {
      
      res.json({
        _id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        nationality: user.nationality,
        designation: user.designation,
        avatar: user.avatar,
        token: generateToken(user._id)
      });
    } else {
      
      res.status(404).json({ msg: "User not found" });
    }
  } catch (error) {
    console.error("User edit error:", error);
    res.status(500).json({ msg: "Internal server error" });
  }
});


const getUserController = expressAsyncHandler(async (req, res) => {
  try {
    const userId = req.params.id; // Assuming the user ID is passed as a route parameter

    // Find the user by ID
    const user = await User.findById(userId);

    if (user) {
      res.json({
        _id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        nationality: user.nationality,
        designation: user.designation,
        avatar: user.avatar
      });
    } else {
      res.status(404).json({ msg: "User not found" });
    }
  } catch (error) {
    console.error("User details retrieval error:", error);
    res.status(500).json({ msg: "Internal server error" });
  }
});



const logoutController = (req, res) => {
  // Clear the authentication token (e.g., JWT token in a cookie)
  res.clearCookie('token');


  req.user = null;

  res.json({ msg: "Logged out successfully" });
};


module.exports = { 
  registerController, 
  verifyUser, 
  loginController, 
  logoutController, 
  forgotPasswordController, 
  resetPasswordController, 
  changepasswordController,
  editUserController,
  fetchAllUsersController,
  editUserProfile,
  getUserController
}