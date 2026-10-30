
import { useState } from "react";
import axios from "../api/axios";

function Login({
  email,
  setEmail,
  password,
  setPassword,
  handleLogin,
  loading,
  message,
}) {
  const [showPassword, setShowPassword] = useState(false);

  // Forgot password flow
  const [screen, setScreen] = useState("login");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [recoveryMessage, setRecoveryMessage] = useState("");
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setRecoveryMessage("");

    try {
      setRecoveryLoading(true);

      const response = await axios.post("/auth/forgot-password", {
        email,
      });

      setRecoveryMessage(
        response.data.message || "If the account exists, an OTP has been sent."
      );

      setScreen("otp");
    } catch (error) {
      setRecoveryMessage(
        error.response?.data?.message || "Unable to send OTP. Please try again."
      );
    } finally {
      setRecoveryLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setRecoveryMessage("");

    if (!/^\d{6}$/.test(otp)) {
      setRecoveryMessage("Please enter a valid 6-digit OTP.");
      return;
    }

    try {
      setRecoveryLoading(true);

      const response = await axios.post("/auth/verify-otp", {
        email,
        otp,
      });

      setResetToken(response.data.resetToken);
      setRecoveryMessage("OTP verified successfully.");
      setScreen("reset");
    } catch (error) {
      setRecoveryMessage(
        error.response?.data?.message || "Invalid or expired OTP."
      );
    } finally {
      setRecoveryLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setRecoveryMessage("");

    if (newPassword.length < 6) {
      setRecoveryMessage("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setRecoveryMessage("Passwords do not match.");
      return;
    }

    try {
      setRecoveryLoading(true);

      const response = await axios.post("/auth/reset-password", {
        resetToken,
        newPassword,
      });

      setRecoveryMessage(
        response.data.message || "Password reset successfully."
      );

      setPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setOtp("");
      setResetToken("");

      setScreen("login");
    } catch (error) {
      setRecoveryMessage(
        error.response?.data?.message ||
          "Unable to reset password. Please try again."
      );
    } finally {
      setRecoveryLoading(false);
    }
  };

  const goToLogin = () => {
    setScreen("login");
    setOtp("");
    setResetToken("");
    setNewPassword("");
    setConfirmPassword("");
    setRecoveryMessage("");
  };

  return (
    <main className="login-page">
      <section className="login-card">
        <h1>TaskFlow</h1>

        <p className="subtitle">
          Organize your work. Achieve more together.
        </p>

        {screen === "login" && (
          <>
            <h2>Welcome back</h2>
            <p className="description">Sign in to your account</p>

            <form onSubmit={handleLogin}>
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />

              <label htmlFor="password">Password</label>

              <div className="password-input-wrapper">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "◡" : "👁"}
                </button>
              </div>

              <div className="forgot-password-link">
                <button
                  type="button"
                  onClick={() => {
                    setRecoveryMessage("");
                    setScreen("forgot");
                  }}
                >
                  Forgot Password?
                </button>
              </div>

              <button type="submit" disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>

            {message && (
              <p className="login-message" role="status">
                {message}
              </p>
            )}
          </>
        )}

        {screen === "forgot" && (
          <>
            <h2>Forgot Password?</h2>
            <p className="description">
              Enter your registered email address. We'll send you an OTP.
            </p>

            <form onSubmit={handleForgotPassword}>
              <label htmlFor="forgot-email">Email address</label>
              <input
                id="forgot-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <button type="submit" disabled={recoveryLoading}>
                {recoveryLoading ? "Sending OTP..." : "Send OTP"}
              </button>
            </form>

            <button
              type="button"
              className="back-to-login"
              onClick={goToLogin}
            >
              Back to Login
            </button>
          </>
        )}

        {screen === "otp" && (
          <>
            <h2>Verify OTP</h2>
            <p className="description">
              Enter the 6-digit OTP sent to your email address.
            </p>

            <form onSubmit={handleVerifyOtp}>
              <label htmlFor="otp">Enter OTP</label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                required
              />

              <button type="submit" disabled={recoveryLoading}>
                {recoveryLoading ? "Verifying..." : "Verify OTP"}
              </button>
            </form>

            <button
              type="button"
              className="back-to-login"
              onClick={goToLogin}
            >
              Back to Login
            </button>
          </>
        )}

        {screen === "reset" && (
          <>
            <h2>Reset Password</h2>
            <p className="description">
              Create a new password for your account.
            </p>

            <form onSubmit={handleResetPassword}>
              <label htmlFor="new-password">New Password</label>

              <div className="password-input-wrapper">
                <input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? "◡" : "👁"}
                </button>
              </div>

              <label htmlFor="confirm-password">
                Confirm New Password
              </label>

              <input
                id="confirm-password"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
              />

              <button type="submit" disabled={recoveryLoading}>
                {recoveryLoading ? "Resetting..." : "Reset Password"}
              </button>
            </form>

            <button
              type="button"
              className="back-to-login"
              onClick={goToLogin}
            >
              Back to Login
            </button>
          </>
        )}

        {recoveryMessage && (
          <p className="login-message" role="status">
            {recoveryMessage}
          </p>
        )}
      </section>
    </main>
  );
}

export default Login;
