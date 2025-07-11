import React, { useState } from "react";
import { useAuth } from "./AuthContext";
import "./App.css";

const LoginScreen = () => {
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (pin.length !== 4) {
      setError("PIN musí mít 4 číslice");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await login(pin);
      if (!result.success) {
        setError(result.error || "Neplatný PIN");
      }
    } catch (error) {
      setError("Chyba při přihlašování");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 4);
    setPin(value);
    setError("");
  };

  return (
    <div className="login-screen">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="logo">
              <div className="modern-icon size-large icon-dashboard"></div>
              <div className="logo-text">
                <div className="logo-title">PaintPro</div>
                <div className="logo-subtitle">Správa malířských zakázek</div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="pin" className="form-label">
                Zadejte PIN pro přístup
              </label>
              <input
                id="pin"
                type="password"
                value={pin}
                onChange={handlePinChange}
                placeholder="••••"
                maxLength="4"
                className={`pin-input ${error ? "error" : ""}`}
                disabled={isLoading}
                autoFocus
              />
              {error && <div className="error-message">{error}</div>}
            </div>

            <button
              type="submit"
              className="login-button"
              disabled={isLoading || pin.length !== 4}
            >
              {isLoading ? (
                <span>Přihlašování...</span>
              ) : (
                <span>Přihlásit se</span>
              )}
            </button>
          </form>

          <div className="login-footer">
            <div className="login-hint">
              <div className="modern-icon icon-info"></div>
              <span>Výchozí PIN: 1234</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
