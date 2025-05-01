import { useState } from "react";
import { signup } from "../../services/authService";
import { useNavigate } from "react-router-dom";

function SignupForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await signup(formData);
      navigate("/login");
    } catch (error) {
      console.error(error.response?.data?.message || "Signup failed");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <label>Name</label>
        <input type="text" name="name" onChange={handleChange} value={formData.name} required className="form-control"/>
      </div>
      <div className="mb-3">
        <label>Email</label>
        <input type="email" name="email" onChange={handleChange} value={formData.email} required className="form-control"/>
      </div>
      <div className="mb-3">
        <label>Password</label>
        <input type="password" name="password" onChange={handleChange} value={formData.password} required className="form-control"/>
      </div>
      <button type="submit" className="btn btn-primary">Signup</button>
    </form>
  );
}

export default SignupForm;
