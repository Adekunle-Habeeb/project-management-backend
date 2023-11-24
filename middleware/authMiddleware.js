const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const expressAsyncHandler = require("express-async-handler");

const protect = expressAsyncHandler(async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        try {
            token = req.headers.authorization.split(" ")[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select("-password");
            next(); // Call next to move to the next middleware or route handler
        } catch (error) {
            res.status(401).json({ msg: "Not authorized, token failed" });
        }
    }

    if (!token) {
        res.status(401).json({ msg: "Not authorized, no token" });
    }
});


module.exports = { protect }