import React, { useState } from 'react';
import { X, Mail, Lock, User as UserIcon } from 'lucide-react';
import './LoginModal.css';
import googleIcon from '../assets/google-icon.svg';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const [isRegistering, setIsRegistering] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>
          <X size={24} />
        </button>

        <div className="modal-header">
          <h2>{isRegistering ? 'Create Account' : 'Welcome Back'}</h2>
          <p>
            {isRegistering 
              ? 'Join the Exovita community for exclusive rewards.' 
              : 'Log in to access your wishlist and orders.'}
          </p>
        </div>

        <div className="form-container">
          {isRegistering && (
            <div className="input-group">
              <UserIcon size={20} className="input-icon" />
              <input type="text" placeholder="Full Name" />
            </div>
          )}
          
          <div className="input-group">
            <Mail size={20} className="input-icon" />
            <input type="email" placeholder="Email Address" />
          </div>

          <div className="input-group">
            <Lock size={20} className="input-icon" />
            <input type="password" placeholder="Password" />
          </div>

          <button className="submit-btn">
            {isRegistering ? 'Sign Up' : 'Log In'}
          </button>

          <div className="divider">
            <span>Or continue with</span>
          </div>

          <button className="google-btn">
            <img 
              src={googleIcon}
              alt="Google" 
              className="google-icon"
            />
            <span>Google</span>
          </button>
        </div>

        <div className="modal-footer">
          <p>
            {isRegistering ? 'Already have an account?' : "Don't have an account?"}
            <button 
              className="toggle-btn" 
              onClick={() => setIsRegistering(!isRegistering)}
            >
              {isRegistering ? 'Log In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
