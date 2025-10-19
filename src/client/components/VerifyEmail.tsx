import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const VerifyEmail: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState<'verifying' | 'success' | 'already-verified' | 'expired' | 'error'>('verifying');
    const [message, setMessage] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const navigate = useNavigate();
    const hasVerified = useRef(false);

    useEffect(() => {
        const token = searchParams.get('token');
        
        if (!token) {
            setStatus('error');
            setMessage('Invalid verification link');
            return;
        }

        // Prevent double verification
        if (hasVerified.current) {
            return;
        }

        hasVerified.current = true;
        verifyEmail(token);
    }, [searchParams]);

    const verifyEmail = async (token: string) => {
        try {
            const response = await fetch(`/api/auth/verify-email?token=${token}`);
            const data = await response.json();

            if (!response.ok) {
                // Check if token expired
                if (data.expired) {
                    setStatus('expired');
                    setMessage(data.error);
                    setUserEmail(data.email);
                    return;
                }
                throw new Error(data.error || 'Verification failed');
            }

            // Check if already verified
            if (data.alreadyVerified) {
                setStatus('already-verified');
                setMessage('Your email is already verified! You can log in now.');
                
                // Redirect to login after 3 seconds
                setTimeout(() => {
                    navigate('/auth');
                }, 3000);
                return;
            }

            setStatus('success');
            setMessage(data.message);
            
            // Redirect to login after 3 seconds
            setTimeout(() => {
                navigate('/auth', { state: { verified: true } });
            }, 3000);
        } catch (err) {
            setStatus('error');
            setMessage(err instanceof Error ? err.message : 'Verification failed');
        }
    };

    const handleResendVerification = async () => {
        if (!userEmail) return;

        try {
            const response = await fetch('/api/auth/resend-verification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: userEmail }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to resend verification email');
            }

            setStatus('success');
            setMessage('New verification email sent! Please check your inbox.');
        } catch (err) {
            setMessage(err instanceof Error ? err.message : 'Failed to resend email');
        }
    };

    return (
        <div className="verify-email-container">
            <div className="verify-email-card">
                {status === 'verifying' && (
                    <>
                        <div className="verify-spinner"></div>
                        <h2>Verifying your email...</h2>
                        <p>Please wait while we verify your account.</p>
                    </>
                )}
                
                {status === 'success' && (
                    <>
                        <div className="verify-icon success">✓</div>
                        <h2>Email Verified!</h2>
                        <p>{message}</p>
                        <p className="redirect-message">Redirecting to login...</p>
                    </>
                )}
                
                {status === 'already-verified' && (
                    <>
                        <div className="verify-icon success">✓</div>
                        <h2>Already Verified</h2>
                        <p>{message}</p>
                        <p className="redirect-message">Redirecting to login...</p>
                    </>
                )}
                
                {status === 'expired' && (
                    <>
                        <div className="verify-icon error">⏰</div>
                        <h2>Link Expired</h2>
                        <p>{message}</p>
                        <button onClick={handleResendVerification} className="back-btn">
                            Send New Verification Email
                        </button>
                        <button 
                            onClick={() => navigate('/auth')} 
                            className="back-btn"
                            style={{ marginTop: '0.5rem', background: 'transparent', border: '1px solid var(--glass-border)' }}
                        >
                            Back to Login
                        </button>
                    </>
                )}
                
                {status === 'error' && (
                    <>
                        <div className="verify-icon error">✗</div>
                        <h2>Verification Failed</h2>
                        <p>{message}</p>
                        <button onClick={() => navigate('/auth')} className="back-btn">
                            Back to Login
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default VerifyEmail;