
import React, { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import "./App.css";

const LoginScreen = () => {
  const [pin, setPin] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);
  const { login } = useAuth();

  // Hash funkce pro PIN
  const hashPin = (pin) => {
    if (!pin) {
      console.error('❌ hashPin: PIN je prázdný!', pin);
      return '';
    }
    console.log('🔑 hashPin vstup:', pin, 'typ:', typeof pin);
    let hash = 0;
    const pinStr = String(pin);
    for (let i = 0; i < pinStr.length; i++) {
      const char = pinStr.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    const result = hash.toString();
    console.log('🔑 hashPin výstup:', result);
    return result;
  };

  // Načtení uživatelů při startu
  useEffect(() => {
    console.log('🎯 LoginScreen useEffect - spouštím initializeUsers...');
    const loadUsers = async () => {
      try {
        await initializeUsers();
      } catch (error) {
        console.error('❌ Chyba při načítání uživatelů:', error);
      }
    };
    loadUsers();
  }, []);

  const initializeUsers = async () => {
    console.log('🚀 Inicializuji uživatele...');
    console.log('🔍 Kontroluji Supabase připojení...');
    
    // KONTROLA Supabase připojení
    if (!window.supabase) {
      console.error('❌ Supabase není dostupné!');
      // Fallback - použij pouze lokální profily
      const adminUser = {
        id: 'admin_1',
        name: 'Administrátor',
        avatar: 'AD',
        color: '#8b5cf6',
        pin: hashPin('123456'),
        isAdmin: true,
        createdAt: new Date().toISOString()
      };
      const lenkaUser = {
        id: 'user_lenka',
        name: 'Lenka',
        avatar: 'LE',
        color: '#22c55e',
        pin: hashPin('321321'),
        isAdmin: false,
        createdAt: new Date().toISOString()
      };
      setUsers([adminUser, lenkaUser]);
      console.log('✅ Lokální profily nastaveny');
      return;
    }
    
    // Základní admin profil
    const adminUser = {
      id: 'admin_1',
      name: 'Administrátor',
      avatar: 'AD',
      color: '#8b5cf6',
      pin: hashPin('123456'),
      isAdmin: true,
      createdAt: new Date().toISOString()
    };

    // PROFIL LENKA
    const lenkaUser = {
      id: 'user_lenka',
      name: 'Lenka',
      avatar: 'LE',
      color: '#22c55e',
      pin: hashPin('321321'),
      isAdmin: false,
      createdAt: new Date().toISOString()
    };

    try {
      // Zkus načíst ze Supabase
      const { data, error } = await window.supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: true });

      let finalUsers = [];

      if (error || !data || data.length === 0) {
        console.log('📝 Supabase prázdný, vytvářím základní data...');
        
        // Vytvoř admin + Lenka v Supabase
        await window.supabase
          .from('users')
          .insert([
            {
              id: adminUser.id,
              name: adminUser.name,
              avatar: adminUser.avatar,
              color: adminUser.color,
              pin: adminUser.pin,
              is_admin: true,
              created_at: adminUser.createdAt
            },
            {
              id: lenkaUser.id,
              name: lenkaUser.name,
              avatar: lenkaUser.avatar,
              color: lenkaUser.color,
              pin: lenkaUser.pin,
              is_admin: false,
              created_at: lenkaUser.createdAt
            }
          ]);

        finalUsers = [adminUser, lenkaUser];
        console.log('✅ Vytvořeni admin + Lenka v Supabase');
        console.log('📋 Profil Lenka:', lenkaUser);
      } else {
        // Převeď ze Supabase formátu
        finalUsers = data.map(user => ({
          id: user.id,
          name: user.name,
          avatar: user.avatar,
          color: user.color,
          pin: user.pin,
          isAdmin: user.is_admin,
          createdAt: user.created_at
        }));

        // KONTROLA: Existuje Lenka? Pokud ne, přidej ji
        const lenkaExists = finalUsers.find(user => user.id === 'user_lenka');
        if (!lenkaExists) {
          console.log('🆕 Přidávám profil Lenka do Supabase...');
          await window.supabase
            .from('users')
            .insert([{
              id: lenkaUser.id,
              name: lenkaUser.name,
              avatar: lenkaUser.avatar,
              color: lenkaUser.color,
              pin: lenkaUser.pin,
              is_admin: false,
              created_at: lenkaUser.createdAt
            }]);
          
          finalUsers.push(lenkaUser);
          console.log('✅ Profil Lenka přidán do Supabase');
          console.log('📋 Přidaný profil Lenka:', lenkaUser);
        }
      }

      setUsers(finalUsers);
      console.log('✅ Uživatelé načteni:', finalUsers.length);
      console.log('👥 Seznam profilů:');
      finalUsers.forEach(user => {
        console.log(`- ${user.name} (${user.id}): PIN hash = ${user.pin}`);
      });
      
      // TESTOVACÍ VÝPISY - ověření PIN hashů
      console.log('🧪 TESTOVACÍ PIN KONTROLA:');
      console.log('- Admin PIN 123456 -> hash:', hashPin('123456'));
      console.log('- Lenka PIN 321321 -> hash:', hashPin('321321'));
      
      const adminUser = finalUsers.find(u => u.name === 'Administrátor');
      const lenkaUser = finalUsers.find(u => u.name === 'Lenka');
      
      if (adminUser) {
        console.log('✅ Admin nalezen, hash uložený:', adminUser.pin);
        console.log('✅ Admin PIN shoda:', adminUser.pin === hashPin('123456'));
      } else {
        console.log('❌ Admin NENALEZEN!');
      }
      
      if (lenkaUser) {
        console.log('✅ Lenka nalezena, hash uložený:', lenkaUser.pin);
        console.log('✅ Lenka PIN shoda:', lenkaUser.pin === hashPin('321321'));
      } else {
        console.log('❌ Lenka NENALEZENA!');
      }

    } catch (error) {
      console.error('❌ Chyba při načítání:', error);
      // Fallback - admin + Lenka lokálně
      setUsers([adminUser, lenkaUser]);
    }
  };

  // Generování náhodné barvy
  const generateColor = () => {
    const colors = [
      '#8b5cf6', '#ef4444', '#f97316', '#eab308', '#84cc16', 
      '#22c55e', '#06b6d4', '#3b82f6', '#6366f1', '#d946ef',
      '#ec4899', '#f43f5e'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Komponenta pro přidání uživatele
  const AddUserModal = ({ setError }) => {
    const [formData, setFormData] = useState({
      name: '',
      pin: '',
      color: generateColor()
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!formData.name.trim() || !formData.pin) {
        setError("Vyplňte všechna pole");
        return;
      }

      setIsSubmitting(true);
      setError("");

      try {
        const newUser = {
          id: `user_${Date.now()}`,
          name: formData.name.trim(),
          avatar: formData.name.trim().substring(0, 2).toUpperCase(),
          color: formData.color,
          pin: hashPin(formData.pin),
          isAdmin: false,
          createdAt: new Date().toISOString()
        };

        console.log('💾 Přidávám uživatele:', newUser.name);

        // Přidej do Supabase BEZ složitostí
        const { error: insertError } = await window.supabase
          .from('users')
          .insert([{
            id: newUser.id,
            name: newUser.name,
            avatar: newUser.avatar,
            color: newUser.color,
            pin: newUser.pin,
            is_admin: false,
            created_at: newUser.createdAt
          }]);

        if (insertError) {
          console.error('❌ Supabase chyba:', insertError);
          setError("Chyba při ukládání: " + insertError.message);
          return;
        }

        // Aktualizuj lokální seznam
        const updatedUsers = [...users, newUser];
        setUsers(updatedUsers);
        
        setShowAddUser(false);
        setError("");
        console.log('✅ Uživatel přidán úspěšně');
        
      } catch (error) {
        console.error('❌ Chyba při přidávání:', error);
        setError("Chyba: " + error.message);
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div className="modal-overlay" onClick={() => setShowAddUser(false)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Přidat nový profil</h2>
            <button className="modal-close" onClick={() => setShowAddUser(false)}>×</button>
          </div>
          <form onSubmit={handleSubmit} className="modal-form">
            <div className="form-group">
              <label>Jméno</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="Zadejte jméno"
                autoFocus
              />
            </div>
            <div className="form-group">
              <label>PIN (4-8 číslic)</label>
              <input
                type="password"
                value={formData.pin}
                onChange={e => setFormData({...formData, pin: e.target.value.replace(/\D/g, "").slice(0, 8)})}
                placeholder="Zadejte PIN"
              />
            </div>
            <div className="form-group">
              <label>Barva profilu</label>
              <div className="color-picker">
                {['#8b5cf6', '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#06b6d4', '#3b82f6', '#6366f1', '#d946ef', '#ec4899', '#f43f5e'].map(color => (
                  <div
                    key={color}
                    className={`color-option ${formData.color === color ? 'selected' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData({...formData, color})}
                  />
                ))}
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowAddUser(false)}>
                Zrušit
              </button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Vytvářím...' : 'Vytvořit profil'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Komponenta pro editaci uživatele
  const EditUserModal = ({ user }) => {
    const [formData, setFormData] = useState({
      name: user.name,
      pin: '',
      color: user.color
    });

    const handleSubmit = async (e) => {
      e.preventDefault();
      
      const updatedUser = {
        ...user,
        name: formData.name.trim(),
        avatar: formData.name.trim().substring(0, 2).toUpperCase(),
        color: formData.color
      };

      if (formData.pin) {
        updatedUser.pin = hashPin(formData.pin);
      }

      try {
        // Aktualizuj v Supabase
        const { error } = await window.supabase
          .from('users')
          .update({
            name: updatedUser.name,
            avatar: updatedUser.avatar,
            color: updatedUser.color,
            ...(formData.pin && { pin: updatedUser.pin })
          })
          .eq('id', user.id);

        if (error) {
          setError("Chyba při aktualizaci");
          return;
        }

        // Aktualizuj lokální seznam
        const updatedUsers = users.map(u => u.id === user.id ? updatedUser : u);
        setUsers(updatedUsers);
        
        setShowEditUser(null);
        
      } catch (error) {
        setError("Chyba při editaci");
      }
    };

    const handleDelete = async () => {
      if (user.isAdmin) {
        setError("Nelze smazat administrátora");
        return;
      }
      
      if (window.confirm(`Opravdu chcete smazat profil ${user.name}?`)) {
        try {
          const { error } = await window.supabase
            .from('users')
            .delete()
            .eq('id', user.id);

          if (error) {
            setError("Chyba při mazání");
            return;
          }

          // Odstraň z lokálního seznamu
          const updatedUsers = users.filter(u => u.id !== user.id);
          setUsers(updatedUsers);
          
          setShowEditUser(null);
          
        } catch (error) {
          setError("Chyba při mazání");
        }
      }
    };

    return (
      <div className="modal-overlay" onClick={() => setShowEditUser(null)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Upravit profil</h2>
            <button className="modal-close" onClick={() => setShowEditUser(null)}>×</button>
          </div>
          <form onSubmit={handleSubmit} className="modal-form">
            <div className="form-group">
              <label>Jméno</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="Zadejte jméno"
              />
            </div>
            <div className="form-group">
              <label>Nový PIN (volitelné)</label>
              <input
                type="password"
                value={formData.pin}
                onChange={e => setFormData({...formData, pin: e.target.value.replace(/\D/g, "").slice(0, 8)})}
                placeholder="Ponechte prázdné pro zachování"
              />
            </div>
            <div className="form-group">
              <label>Barva profilu</label>
              <div className="color-picker">
                {['#8b5cf6', '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#06b6d4', '#3b82f6', '#6366f1', '#d946ef', '#ec4899', '#f43f5e'].map(color => (
                  <div
                    key={color}
                    className={`color-option ${formData.color === color ? 'selected' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData({...formData, color})}
                  />
                ))}
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowEditUser(null)}>
                Zrušit
              </button>
              {!user.isAdmin && (
                <button type="button" className="btn btn-danger" onClick={handleDelete}>
                  Smazat profil
                </button>
              )}
              <button type="submit" className="btn btn-primary">
                Uložit změny
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Přihlášení
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser) {
      setError("Vyberte prosím uživatele");
      return;
    }
    if (pin.length < 4) {
      setError("PIN musí mít alespoň 4 číslice");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      console.log('🔐 PŘIHLAŠOVÁNÍ - uživatel:', selectedUser.name);
      console.log('🔐 PŘIHLAŠOVÁNÍ - zadaný PIN:', pin);
      console.log('🔐 PŘIHLAŠOVÁNÍ - uložený hash:', selectedUser.pin);
      
      const hashedPin = hashPin(pin);
      console.log('🔐 PŘIHLAŠOVÁNÍ - nový hash:', hashedPin);
      console.log('🔐 PŘIHLAŠOVÁNÍ - shoda?', selectedUser.pin === hashedPin);
      
      if (selectedUser.pin === hashedPin) {
        const result = await login(pin, selectedUser.id);
        if (!result.success) {
          setError(result.error || "Neplatný PIN");
        }
      } else {
        setError("Neplatný PIN");
      }
    } catch (error) {
      console.error('❌ Chyba při přihlašování:', error);
      setError("Chyba při přihlašování");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 8);
    setPin(value);
    setError("");
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setPin("");
    setError("");
  };

  return (
    <div className="login-screen">
      <div className="login-container">
        {!selectedUser ? (
          <div className="user-selection">
            <h2>Vyberte profil</h2>
            <div className="profiles-grid">
              {users.map(user => (
                <div key={user.id} className="profile-card-container">
                  <div 
                    className="profile-card"
                    onClick={() => handleUserSelect(user)}
                  >
                    <div 
                      className="profile-avatar"
                      style={{ backgroundColor: user.color }}
                    >
                      {user.avatar}
                    </div>
                    <div className="profile-name">{user.name}</div>
                    {user.isAdmin && <div className="admin-badge">Admin</div>}
                  </div>
                  <button 
                    className="edit-profile-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowEditUser(user);
                    }}
                  >
                    ⚙️
                  </button>
                </div>
              ))}
              
              <div className="profile-card add-profile" onClick={() => setShowAddUser(true)}>
                <div className="add-plus-icon">+</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="pin-input-section">
            <button className="back-button" onClick={() => setSelectedUser(null)}>
              ← Zpět
            </button>
            
            <div className="pin-header">
              <div 
                className="selected-avatar"
                style={{ backgroundColor: selectedUser.color }}
              >
                {selectedUser.avatar}
              </div>
              <h2>Vítejte, {selectedUser.name}</h2>
              <p>Zadejte PIN pro přihlášení</p>
            </div>

            <form onSubmit={handleSubmit} className="pin-form">
              <div className="pin-input-container">
                <input
                  type="password"
                  value={pin}
                  onChange={handlePinChange}
                  placeholder="••••••"
                  maxLength="8"
                  className={`pin-input ${error ? "error" : ""}`}
                  disabled={isLoading}
                  autoFocus
                />
              </div>
              
              {error && <div className="error-message">{error}</div>}

              <button
                type="submit"
                className="login-button"
                disabled={isLoading || pin.length < 4}
              >
                {isLoading ? "Přihlašování..." : "Přihlásit se"}
              </button>
            </form>

            <div className="login-hint">
              <span>💡 Administrátor má PIN: 123456</span>
            </div>
          </div>
        )}

        {showAddUser && <AddUserModal setError={setError} />}
        {showEditUser && <EditUserModal user={showEditUser} />}
      </div>
    </div>
  );
};

export default LoginScreen;
