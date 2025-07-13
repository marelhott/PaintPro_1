import React, { useState, useEffect } from 'react';

const LoginScreen = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        // Počkej na inicializaci Supabase
        let attempts = 0;
        while (!window.supabase && attempts < 50) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }

        if (!window.supabase) {
          console.error('❌ Supabase není dostupné po 5 sekundách!');
          // Fallback uživatelé
          setUsers([
            {
              id: 'admin',
              name: 'Administrátor',
              avatar: 'AD',
              color: '#8b5cf6',
              is_admin: true
            },
            {
              id: 'lenka',
              name: 'Lenka',
              avatar: 'LE',
              color: '#22c55e',
              is_admin: false
            }
          ]);
          setIsLoading(false);
          return;
        }

        console.log('🔄 Načítám uživatele z Supabase...');
        const { data: usersData, error } = await window.supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: true });

        if (error) {
          console.error('❌ Chyba při načítání uživatelů:', error);
          // Fallback uživatelé při chybě
          setUsers([
            {
              id: 'admin',
              name: 'Administrátor',
              avatar: 'AD',
              color: '#8b5cf6',
              is_admin: true
            },
            {
              id: 'lenka',
              name: 'Lenka',
              avatar: 'LE',
              color: '#22c55e',
              is_admin: false
            }
          ]);
        } else {
          setUsers(usersData || []);
          console.log('✅ Uživatelé načteni:', usersData);
        }
      } catch (error) {
        console.error('❌ Chyba při načítání uživatelů:', error);
        // Fallback uživatelé při chybě
        setUsers([
          {
            id: 'admin',
            name: 'Administrátor',
            avatar: 'AD',
            color: '#8b5cf6',
            is_admin: true
          },
          {
            id: 'lenka',
            name: 'Lenka',
            avatar: 'LE',
            color: '#22c55e',
            is_admin: false
          }
        ]);
      }
      setIsLoading(false);
    };

    loadUsers();
  }, []);

  const handleUserSelect = (userId) => {
    console.log('🔄 Přihlašuji uživatele:', userId);
    console.log('🔄 Nastavuji hash na:', `#${userId}`);
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