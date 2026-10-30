import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/profile", authMiddleware, (req, res) => {
  return res.status(200).json({
    message: "Protected route accessed successfully",
    userId: req.user.userId,
  });
});

export default router;