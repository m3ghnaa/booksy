import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { Form, Button, Container, Card } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import {
  loginStart,
  loginSuccess,
  loginFailure,
} from '../redux/authSlice';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    dispatch(loginStart());

    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.token) {
        dispatch(loginSuccess({ user: data.user, token: data.token }));
        localStorage.setItem('token', data.token);
        navigate('/dashboard');
      } else {
        dispatch(loginFailure(data.message || 'Login failed'));
      }
    } catch (err) {
      dispatch(loginFailure('Server error. Try again.'));
      console.error('Login error', err);
    }
  };

  const handleGoogleLogin = async (response) => {
    const { credential } = response;
    dispatch(loginStart());

    try {
      const res = await fetch('http://localhost:5000/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: credential }),
      });
      const data = await res.json();
      if (data.token) {
        dispatch(loginSuccess({ user: data.user, token: data.token }));
        localStorage.setItem('token', data.token);
        navigate('/dashboard');
      } else {
        dispatch(loginFailure('Google login failed'));
      }
    } catch (err) {
      dispatch(loginFailure('Google login failed'));
      console.error('Google login error', err);
    }
  };

  return (
    <Container className="mt-5 d-flex justify-content-center">
      <Card style={{ width: '24rem' }} className="p-4 shadow">
        <h3 className="text-center mb-3">Login</h3>
        <Form onSubmit={handleEmailLogin}>
          <Form.Group className="mb-3">
            <Form.Label>Email address</Form.Label>
            <Form.Control type="email" required onChange={(e) => setEmail(e.target.value)} />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Password</Form.Label>
            <Form.Control type="password" required onChange={(e) => setPassword(e.target.value)} />
          </Form.Group>
          <Button type="submit" className="w-100" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </Form>
        {error && <div className="text-danger mt-2 text-center">{error}</div>}
        <hr />
        <GoogleLogin onSuccess={handleGoogleLogin} onError={() => dispatch(loginFailure('Google login failed'))} />
        <p className="mt-3 text-center">
          Don’t have an account? <a href="/signup">Sign up</a>
        </p>
      </Card>
    </Container>
  );
};

export default LoginPage;
