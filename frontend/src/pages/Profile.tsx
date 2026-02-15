import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  User,
  Mail,
  Calendar,
  Shield,
  Edit2,
  Save,
  X,
  Settings,
  Package,
} from "lucide-react";
import "./Profile.css";

const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    phone: user?.phone || "",
  });

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    // Redirect admin users directly to dashboard
    if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
      navigate("/admin");
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  const handleSave = async () => {
    // TODO: Implement profile update API call
    console.log("Saving profile:", formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      phone: user?.phone || "",
    });
    setIsEditing(false);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="profile-container">
      <div className="profile-wrapper">
        <div className="profile-header">
          <div className="profile-avatar">
            <User size={48} />
          </div>
          <h1 className="profile-title">My Profile</h1>
          <p className="profile-subtitle">Manage your personal information</p>
        </div>

        {/* Admin Panel Access */}
        {(user.role === "ADMIN" || user.role === "SUPER_ADMIN") && (
          <div className="admin-access-banner">
            <div className="admin-access-content">
              <Settings size={24} />
              <div>
                <h3>Admin Access</h3>
                <p>You have administrator privileges</p>
              </div>
            </div>
            <button
              className="admin-panel-btn"
              onClick={() => navigate("/admin")}
            >
              Open Admin Panel
            </button>
          </div>
        )}

        {/* My Orders Quick Access */}
        <div className="quick-access-banner">
          <div className="quick-access-content">
            <Package size={24} />
            <div>
              <h3>My Orders</h3>
              <p>Track and manage your orders</p>
            </div>
          </div>
          <button className="orders-btn" onClick={() => navigate("/my-orders")}>
            View Orders
          </button>
        </div>

        <div className="profile-content">
          <div className="profile-section">
            <div className="section-header">
              <h2>Personal Information</h2>
              {!isEditing ? (
                <button className="edit-btn" onClick={() => setIsEditing(true)}>
                  <Edit2 size={18} />
                  Edit Profile
                </button>
              ) : (
                <div className="edit-actions">
                  <button className="save-btn" onClick={handleSave}>
                    <Save size={18} />
                    Save
                  </button>
                  <button className="cancel-btn" onClick={handleCancel}>
                    <X size={18} />
                    Cancel
                  </button>
                </div>
              )}
            </div>

            <div className="profile-fields">
              <div className="profile-field">
                <label className="field-label">
                  <User size={18} />
                  First Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    className="field-input"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                  />
                ) : (
                  <p className="field-value">{user.firstName || "Not set"}</p>
                )}
              </div>

              <div className="profile-field">
                <label className="field-label">
                  <User size={18} />
                  Last Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    className="field-input"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                  />
                ) : (
                  <p className="field-value">{user.lastName || "Not set"}</p>
                )}
              </div>

              <div className="profile-field">
                <label className="field-label">
                  <Mail size={18} />
                  Email Address
                </label>
                <p className="field-value">{user.email}</p>
                <span className="field-note">Email cannot be changed</span>
              </div>

              <div className="profile-field">
                <label className="field-label">
                  <Shield size={18} />
                  Role
                </label>
                <p className="field-value">
                  <span className="role-badge">{user.role}</span>
                </p>
              </div>

              <div className="profile-field">
                <label className="field-label">
                  <Calendar size={18} />
                  Member Since
                </label>
                <p className="field-value">{formatDate(user.createdAt)}</p>
              </div>
            </div>
          </div>

          <div className="profile-section">
            <div className="section-header">
              <h2>Account Settings</h2>
            </div>

            <div className="profile-actions">
              <button className="action-btn secondary-btn">
                Change Password
              </button>
              <button className="action-btn danger-btn" onClick={logout}>
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
