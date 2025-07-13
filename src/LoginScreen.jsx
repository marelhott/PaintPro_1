
import React, { useState, useEffect } from 'react';

const LoginScreen = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        if (!window.supabase) {
          console.error('❌ Supabase není dostupné!');
          setIsLoading(false);
          return;
        }

        const { data: usersData } = await window.supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: true });

        setUsers(usersData || []);
        console.log('✅ Uživatelé načteni:', usersData);
      } catch (error) {
        console.error('❌ Chyba při načítání uživatelů:', error);
      }
      setIsLoading(false);
    };

    loadUsers();
  }, []);

  const handleUserSelect = (userId) => {
    console.log('🔄 Přihlašuji uživatele:', userId);
    window.location.hash = `#${userId}`;
  };

  if (isLoading) {
    return (
      <div className="login-screen">
        <div className="loading-spinner"></div>
        <p>Načítám profily...</p>
      </div>
    );
  }

  return (
    <div className="login-screen">
      <div className="login-container">
        <div className="login-header">
          <h1>PaintPro</h1>
          <p>Vyberte svůj profil</p>
        </div>

        <div className="profiles-grid">
          {users.map((user) => (
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
              {user.is_admin && (
                <div className="admin-badge">Admin</div>
              )}
            </div>
          ))}
        </div>

        <div className="login-hint">
          Klikněte na váš profil pro přihlášení do aplikace
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
