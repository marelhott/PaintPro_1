
import React, { useState } from 'react';
import { useAuth } from '../AuthContext';

const ProfileSettings = ({ isOpen, onClose }) => {
  const { changePin, currentUser } = useAuth();
  const [formData, setFormData] = useState({
    currentPin: '',
    newPin: '',
    confirmPin: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleInputChange = (field, value) => {
    // Pouze číslice, max 8 znaků
    const numericValue = value.replace(/\D/g, '').slice(0, 8);
    setFormData(prev => ({ ...prev, [field]: numericValue }));
    setMessage({ text: '', type: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.currentPin.length < 4) {
      setMessage({ text: 'Současný PIN musí mít alespoň 4 číslice', type: 'error' });
      return;
    }

    if (formData.newPin.length < 4) {
      setMessage({ text: 'Nový PIN musí mít alespoň 4 číslice', type: 'error' });
      return;
    }

    if (formData.newPin !== formData.confirmPin) {
      setMessage({ text: 'Nové PINy se neshodují', type: 'error' });
      return;
    }

    if (formData.currentPin === formData.newPin) {
      setMessage({ text: 'Nový PIN musí být odlišný od současného', type: 'error' });
      return;
    }

    setIsLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const result = await changePin(formData.currentPin, formData.newPin);
      
      if (result.success) {
        setMessage({ text: '✅ PIN byl úspěšně změněn!', type: 'success' });
        setFormData({ currentPin: '', newPin: '', confirmPin: '' });
        
        // Automaticky zavři po 2 sekundách
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setMessage({ text: result.error || 'Chyba při změně PINu', type: 'error' });
      }
    } catch (error) {
      console.error('❌ Chyba při změně PINu:', error);
      setMessage({ text: 'Chyba při změně PINu', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Nastavení profilu</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="profile-settings-content">
          {/* Informace o profilu */}
          <div className="profile-info">
            <div 
              className="profile-avatar-large"
              style={{ backgroundColor: currentUser.color }}
            >
              {currentUser.avatar}
            </div>
            <div className="profile-details">
              <h3>{currentUser.name}</h3>
              {currentUser.is_admin && <span className="admin-badge-small">Admin</span>}
            </div>
          </div>

          {/* Formulář pro změnu PINu */}
          <form onSubmit={handleSubmit} className="change-pin-form">
            <h3>Změna PINu</h3>
            
            <div className="form-group">
              <label>Současný PIN</label>
              <input
                type="password"
                value={formData.currentPin}
                onChange={e => handleInputChange('currentPin', e.target.value)}
                placeholder="Zadejte současný PIN"
                maxLength="8"
                autoComplete="current-password"
              />
            </div>

            <div className="form-group">
              <label>Nový PIN (4-8 číslic)</label>
              <input
                type="password"
                value={formData.newPin}
                onChange={e => handleInputChange('newPin', e.target.value)}
                placeholder="Zadejte nový PIN"
                maxLength="8"
                autoComplete="new-password"
              />
            </div>

            <div className="form-group">
              <label>Potvrdit nový PIN</label>
              <input
                type="password"
                value={formData.confirmPin}
                onChange={e => handleInputChange('confirmPin', e.target.value)}
                placeholder="Potvrďte nový PIN"
                maxLength="8"
                autoComplete="new-password"
              />
            </div>

            {message.text && (
              <div className={`message ${message.type}`}>
                {message.text}
              </div>
            )}

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Zrušit
              </button>
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={isLoading || !formData.currentPin || !formData.newPin || !formData.confirmPin}
              >
                {isLoading ? 'Změním...' : 'Změnit PIN'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
