import React, { useState } from "react";
import { login } from "../../services/authService";
import { useNavigate } from "react-router-dom";

function LoginForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(formData);
      navigate("/dashboard"); // assuming we will make dashboard after login
    } catch (error) {
      console.error(error.response?.data?.message || "Login failed");
    }
  };

  const handleGoogleLoginSuccess = async (response) => {
    try {
      const res = await fetch("http://localhost:5000/api/auth/google", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: response.credential }), // Send the token to the backend
      });

      const data = await res.json();

      if (data.token) {
        // Save the token in localStorage or cookies
        localStorage.setItem("token", data.token);
        navigate("/dashboard"); // Redirect to dashboard
      }
    } catch (error) {
      console.error("Google login failed", error);
    }
  };

  const handleGoogleLoginError = () => {
    console.log("Google login failed");
  };

  React.useEffect(() => {
    /* global google */
    google.accounts.id.initialize({
      client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
      callback: handleGoogleLoginSuccess,
    });
    google.accounts.id.renderButton(
      document.getElementById("google-signin-btn"),
      { theme: "outline", size: "large" }
    );
  }, []);

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <label>Email</label>
        <input type="email" name="email" onChange={handleChange} value={formData.email} required className="form-control" />
      </div>
      <div className="mb-3">
        <label>Password</label>
        <input type="password" name="password" onChange={handleChange} value={formData.password} required className="form-control" />
      </div>
      <button type="submit" className="btn btn-primary">Login</button>

      <div className="my-3" id="google-signin-btn"></div> {/* Google sign-in button */}

      <p>
        Don't have an account? <a href="/signup">Sign up with Google or create one</a>
      </p>
    </form>
  );
}

export default LoginForm;
