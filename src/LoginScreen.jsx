import React, { useState, useEffect } from "react";
import "./App.css";

const LoginScreen = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Načtení uživatelů ze Supabase
  useEffect(() => {
    const loadUsers = async () => {
      try {
        if (!window.supabase) {
          console.error('❌ Supabase není dostupné!');
          setIsLoading(false);
          return;
        }

        const { data, error } = await window.supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: true });

        if (error) {
          console.error('❌ Chyba při načítání uživatelů:', error);
        } else {
          setUsers(data || []);
        }
      } catch (error) {
        console.error('❌ Chyba při komunikaci s Supabase:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUsers();
  }, []);

  // Výběr uživatele
  const handleUserSelect = (userId) => {
    console.log('👤 Přepínám na uživatele:', userId);
    window.location.hash = `#${userId}`;
    // Stránka se automaticky znovu načte díky AuthContext
  };

  if (isLoading) {
    return (
      <div className="login-screen">
        <div className="login-container">
          <div className="loading">Načítám profily...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-screen">
      <div className="login-container">
        <div className="user-selection">
          <h2>Vyberte profil</h2>
          <p className="subtitle">Klikněte na profil pro přístup k aplikaci</p>

          <div className="profiles-grid">
            {users.map(user => (
              <div 
                key={user.id}
                className="profile-card"
                onClick={() => handleUserSelect(user.id)}
              >
                <div 
                  className="profile-avatar"
                  style={{ backgroundColor: user.color }}
                >
                  {user.avatar}
                </div>
                <div className="profile-name">{user.name}</div>
                {user.is_admin && <div className="admin-badge">Admin</div>}
              </div>
            ))}
          </div>

          <div className="url-info">
            <h3>💡 Tip pro pokročilé</h3>
            <p>Můžete přímo použít URL:</p>
            <code>zakazky.malirivcernem.cz/#admin</code><br/>
            <code>zakazky.malirivcernem.cz/#lenka</code>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;