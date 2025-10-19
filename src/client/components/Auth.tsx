import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';

const Auth: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [password, setPassword] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const [adminPassword, setAdminPassword] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [verificationEmail, setVerificationEmail] = useState('');
    const [isResending, setIsResending] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useUser();

    useEffect(() => {
        // Check for verification email in location state
        if (location.state?.verificationEmail) {
            setVerificationEmail(location.state.verificationEmail);
            setSuccessMessage('Registration successful! Please check your email to verify your account.');
        }
    }, [location]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setRemainingAttempts(null);
        const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    email, 
                    password,
                    ...(isLogin ? {} : { 
                        displayName,
                        isAdmin,
                        ...(isAdmin ? { adminPassword } : {})
                    })
                }),
            });

            const data = await response.json();
            
            if (!response.ok) {
                // Check if user is locked out
                if (data.isLocked) {
                    setIsLocked(true);
                    setAdminPassword('');
                    throw new Error(data.error || 'Too many failed attempts');
                }

                // Show remaining attempts if available
                if (data.remainingAttempts !== undefined) {
                    setRemainingAttempts(data.remainingAttempts);
                    setAdminPassword(''); // Clear the admin password field
                }

                if (data.needsVerification) {
                    setVerificationEmail(data.email);
                    setSuccessMessage('Please verify your email before logging in. Check your inbox for a verification link.');
                } else {
                    throw new Error(data.error || 'Authentication failed');
                }
                return;
            }

            if (isLogin) {
                // Login successful - use the login method from context
                login(data.token, data.user);
                navigate('/');
            } else {
                // Registration successful
                if (data.autoVerified) {
                    // Admin was auto-verified, log them in immediately
                    login(data.token, data.user);
                    setSuccessMessage(data.message);
                    setTimeout(() => navigate('/'), 2000);
                } else {
                    // Normal registration, needs verification
                    setVerificationEmail(data.email);
                    setSuccessMessage(data.message);
                    setIsLogin(true);
                    setPassword('');
                    setIsLocked(false);
                    setRemainingAttempts(null);
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Authentication failed');
        }
    };

    const handleResendVerification = async () => {
        if (!verificationEmail) return;
        
        setIsResending(true);
        setError('');
        setSuccessMessage('');

        try {
            const response = await fetch('/api/auth/resend-verification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: verificationEmail }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to resend verification email');
            }

            setSuccessMessage('Verification email sent! Please check your inbox.');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to resend verification email');
        } finally {
            setIsResending(false);
        }
    };

    const closeBanner = () => {
        setVerificationEmail('');
        setSuccessMessage('');
    };

    const handleAdminCheckboxChange = (checked: boolean) => {
        setIsAdmin(checked);
        setAdminPassword('');
        setError('');
        setRemainingAttempts(null);
        setIsLocked(false);
    };

    return (
        <div className="auth-container">
            {verificationEmail && (
                <div className="verification-banner">
                    <button 
                        onClick={closeBanner}
                        className="banner-close"
                        aria-label="Close banner"
                    >
                        ×
                    </button>
                    <div className="verification-banner-content">
                        <div className="verification-icon">✉️</div>
                        <div className="verification-text">
                            <strong>Email Verification Required</strong>
                            <p>We sent a verification link to <strong>{verificationEmail}</strong></p>
                        </div>
                    </div>
                    <button 
                        onClick={handleResendVerification}
                        disabled={isResending}
                        className="resend-btn"
                    >
                        {isResending ? 'Sending...' : 'Resend Email'}
                    </button>
                </div>
            )}

            <h2>{isLogin ? 'Login' : 'Register'}</h2>
            
            {error && (
                <div className={`error ${isLocked ? 'error-locked' : ''}`}>
                    {isLocked && <span className="lock-icon">🔒</span>}
                    {error}
                </div>
            )}
            {successMessage && <div className="success">{successMessage}</div>}
            {remainingAttempts !== null && !error && (
                <div className="warning">
                    ⚠️ {remainingAttempts} attempt{remainingAttempts !== 1 ? 's' : ''} remaining before lockout
                </div>
            )}
            
            <form onSubmit={handleSubmit} className="auth-form">
                <div className="form-group">
                    <label htmlFor="email">Email:</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="you@example.com"
                    />
                </div>

                {!isLogin && (
                    <>
                        <div className="form-group">
                            <label htmlFor="displayName">Display Name:</label>
                            <input
                                type="text"
                                id="displayName"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                required
                                minLength={2}
                            />
                        </div>

                        <div className="form-group checkbox-group">
                            <input
                                type="checkbox"
                                id="isAdmin"
                                checked={isAdmin}
                                onChange={(e) => handleAdminCheckboxChange(e.target.checked)}
                            />
                            <label htmlFor="isAdmin">Register as Admin</label>
                        </div>

                        {isAdmin && (
                            <div className="form-group">
                                <label htmlFor="adminPassword">
                                    Admin Registration Password:
                                    {remainingAttempts !== null && (
                                        <span className="attempts-badge">
                                            {remainingAttempts} left
                                        </span>
                                    )}
                                </label>
                                <input
                                    type="password"
                                    id="adminPassword"
                                    value={adminPassword}
                                    onChange={(e) => setAdminPassword(e.target.value)}
                                    required
                                    disabled={isLocked}
                                    className={isLocked ? 'locked-field' : ''}
                                    placeholder="Default: admin"
                                />
                                {isLocked && (
                                    <p className="field-help error-text">
                                        🔒 Account temporarily locked due to too many failed attempts
                                    </p>
                                )}
                                {!isLocked && (
                                    <p className="field-help">
                                        Required to register as an admin user. Default password is "admin" for initial setup.
                                    </p>
                                )}
                            </div>
                        )}
                    </>
                )}

                <div className="form-group">
                    <label htmlFor="password">Password:</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                    />
                </div>

                <button type="submit" className="auth-button" disabled={isLocked && !isLogin}>
                    {isLogin ? 'Login' : (isLocked ? 'Locked Out' : 'Register')}
                </button>
            </form>

            <button 
                className="toggle-auth"
                onClick={() => {
                    setIsLogin(!isLogin);
                    setError('');
                    setSuccessMessage('');
                    setRemainingAttempts(null);
                    setIsLocked(false);
                    setAdminPassword('');
                }}
            >
                {isLogin ? 'Need an account? Register' : 'Have an account? Login'}
            </button>
        </div>
    );
};

export default Auth;