import React, { useState } from 'react';
import { RiMailLine, RiLockPasswordLine, RiLoginCircleLine, RiErrorWarningLine, RiEyeLine, RiEyeOffLine } from "react-icons/ri";
import { useNavigate } from 'react-router-dom';
import './Login.css';
import img from "../../assets/logo.png";
import Swal from 'sweetalert2';

const API = process.env.REACT_APP_API_URL;

const Login = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch(`${API}/auth/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (res.ok) {
                localStorage.setItem('adminToken', data.token);
                localStorage.setItem('adminUser', JSON.stringify(data.user));

                Swal.fire({
                    title: 'Success!',
                    text: `Welcome, ${data.user.username}!`,
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false,
                    background: '#2C2F33',
                    color: '#fff',
                }).then(() => {
                    onLoginSuccess();
                    navigate('/dashboard');
                });
            } else {
                setError(data.message || 'Invalid credentials');
                setLoading(false);
            }
        } catch (err) {
            setError('Server not reachable. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <div className="login-branding">
                    <div className="km-logo-wrap">
                        <img
                            src={img}
                            alt="Logo"
                            style={{ width: '200px', height: 'auto', marginBottom: '10px' }}
                        />
                    </div>
                  
              
                    <p className="km-sub">Admin Portal — Sign in to continue</p>
                </div>

                <form onSubmit={handleLogin} className="login-form">
                    {error && (
                        <div className="error-alert">
                            <RiErrorWarningLine /> {error}
                        </div>
                    )}

                    <div className="input-field">
                        <RiMailLine className="icon" />
                        <input
                            type="email"
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-field">
                        <RiLockPasswordLine className="icon" />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{ paddingRight: '48px' }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(p => !p)}
                            className="pw-eye-btn"
                        >
                            {showPassword ? <RiEyeOffLine /> : <RiEyeLine />}
                        </button>
                    </div>

                    <button type="submit" className="login-submit-btn" disabled={loading}>
                        {loading ? "Verifying..." : <><RiLoginCircleLine /> Sign In</>}
                    </button>
                </form>

                <p className="km-footer-note">© 2026 Fashion Aura. All rights reserved.</p>
            </div>
        </div>
    );
};

export default Login;