import axios from 'axios';

const API_URL = "http://localhost:5000/api/auth"; // adjust if your backend URL is different

export const signup = (formData) => axios.post(`${API_URL}/signup`, formData);
export const login = (formData) => axios.post(`${API_URL}/login`, formData);
export const googleAuth = (googleData) => axios.post(`${API_URL}/google`, googleData);
