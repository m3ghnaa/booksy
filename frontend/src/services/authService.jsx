import axios from 'axios';

const API_URL = "https://booksy-17xg.onrender.com/api/auth"; // updated to production backend URL

export const signup = (formData) => axios.post(`${API_URL}/signup`, formData);
export const login = (formData) => axios.post(`${API_URL}/login`, formData);
export const googleAuth = (googleData) => axios.post(`${API_URL}/google`, googleData);
