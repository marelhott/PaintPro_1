import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Inicializace Supabase klienta
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://lseqrqmtjymukewnejdd.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzZXFycW10anltdWtld25lamRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyNjQ2MjcsImV4cCI6MjA2Nzg0MDYyN30.SgWjc-GETZ_D0tJNtErxXhUaH6z_MgRJtxc94RsUXPw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Vytvoření AuthContext
const AuthContext = createContext();

// Hook pro použití AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// AuthProvider komponenta
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Hash funkce pro PIN
  const hashPin = (pin) => {
    let hash = 0;
    for (let i = 0; i < pin.length; i++) {
      const char = pin.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString();
  };

  // Offline queue pro synchronizaci
  const addToQueue = (operation) => {
    const queue = JSON.parse(localStorage.getItem('sync_queue') || '[]');
    queue.push({
      ...operation,
      timestamp: Date.now(),
      id: Date.now() + Math.random()
    });
    localStorage.setItem('sync_queue', JSON.stringify(queue));
  };

  // Zpracování offline queue
  const processQueue = async () => {
    if (!isOnline) return;

    const queue = JSON.parse(localStorage.getItem('sync_queue') || '[]');
    if (queue.length === 0) return;

    console.log('🔄 Zpracovávám offline queue:', queue.length, 'operací');

    for (const operation of queue) {
      try {
        switch (operation.type) {
          case 'create_user':
            await supabase.from('users').insert([operation.data]);
            break;
          case 'create_order':
            await supabase.from('orders').insert([operation.data]);
            break;
          case 'update_order':
            await supabase.from('orders').update(operation.data).eq('id', operation.orderId);
            break;
          case 'delete_order':
            await supabase.from('orders').delete().eq('id', operation.orderId);
            break;
        }
        console.log('✅ Synchronizována operace:', operation.type);
      } catch (error) {
        console.error('❌ Chyba při synchronizaci:', operation.type, error);
        continue;
      }
    }

    // Vymaž queue po úspěšné synchronizaci
    localStorage.setItem('sync_queue', JSON.stringify([]));
    console.log('✅ Offline queue zpracována');
  };

  // Načtení uživatelů (Supabase first, localStorage fallback)
  const loadUsers = async () => {
    try {
      if (isOnline) {
        const { data, error } = await supabase.from('users').select('*');
        if (!error && data) {
          localStorage.setItem('paintpro_users_cache', JSON.stringify(data));
          return data;
        }
      }

      // Fallback na cache
      const cached = JSON.parse(localStorage.getItem('paintpro_users_cache') || '[]');
      if (cached.length > 0) return cached;

      // Vytvoř admin pokud neexistuje
      return createDefaultAdmin();
    } catch (error) {
      console.error('❌ Chyba při načítání uživatelů:', error);
      return createDefaultAdmin();
    }
  };

  // Vytvoření výchozího admina
  const createDefaultAdmin = () => {
    const admin = {
      id: 'admin_1',
      name: 'Administrátor',
      avatar: 'AD',
      color: '#8b5cf6',
      pin_hash: hashPin('123456'),
      is_admin: true,
      created_at: new Date().toISOString()
    };

    localStorage.setItem('paintpro_users_cache', JSON.stringify([admin]));

    // Přidej do queue pro synchronizaci
    if (isOnline) {
      addToQueue({
        type: 'create_user',
        data: admin
      });
    }

    return [admin];
  };

  // Přihlášení pomocí PIN
  const login = async (pin, userId = null) => {
    try {
      const users = await loadUsers();
      const hashedPin = hashPin(pin);

      let user;
      if (userId) {
        user = users.find(u => u.id === userId && u.pin_hash === hashedPin);
      } else {
        user = users.find(u => u.pin_hash === hashedPin);
      }

      if (user) {
        setCurrentUser(user);
        localStorage.setItem('paintpro_current_user', JSON.stringify(user));
        console.log('✅ Úspěšné přihlášení:', user.name);
        return { success: true };
      }

      return { success: false, error: 'Neplatný PIN' };
    } catch (error) {
      console.error('❌ Chyba při přihlašování:', error);
      return { success: false, error: 'Chyba při přihlašování' };
    }
  };

  // Odhlášení
  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('paintpro_current_user');
  };

  // Načtení dat uživatele (Supabase first, localStorage cache)
  const getUserData = async (userId) => {
    try {
      const cacheKey = `paintpro_orders_cache_${userId}`;

      if (isOnline) {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          localStorage.setItem(cacheKey, JSON.stringify(data));
          console.log('✅ Data načtena ze Supabase:', data.length, 'zakázek');
          return data;
        }
      }

      // Fallback na cache
      const cached = JSON.parse(localStorage.getItem(cacheKey) || '[]');
      console.log('📦 Použita cache:', cached.length, 'zakázek');
      return cached;
    } catch (error) {
      console.error('❌ Chyba při načítání dat:', error);
      return JSON.parse(localStorage.getItem(`paintpro_orders_cache_${userId}`) || '[]');
    }
  };

  // Přidání nového uživatele
  const addUser = async (userData) => {
    try {
      const newUser = {
        id: `user_${Date.now()}`,
        name: userData.name,
        avatar: userData.avatar,
        color: userData.color,
        pin_hash: userData.pin,
        is_admin: false,
        created_at: new Date().toISOString()
      };

      // Aktualizuj cache
      const cached = JSON.parse(localStorage.getItem('paintpro_users_cache') || '[]');
      cached.push(newUser);
      localStorage.setItem('paintpro_users_cache', JSON.stringify(cached));

      if (isOnline) {
        try {
          const { error } = await supabase.from('users').insert([newUser]);
          if (error) throw error;
          console.log('✅ Uživatel vytvořen v Supabase');
        } catch (supabaseError) {
          console.warn('⚠️ Supabase nedostupný, přidáno do queue');
          addToQueue({
            type: 'create_user',
            data: newUser
          });
        }
      } else {
        addToQueue({
          type: 'create_user',
          data: newUser
        });
      }

      return { success: true, user: newUser };
    } catch (error) {
      console.error('❌ Chyba při přidávání uživatele:', error);
      return { success: false, error: 'Chyba při přidávání uživatele' };
    }
  };

  // Přidání nové zakázky
  const addUserOrder = async (userId, orderData) => {
    try {
      const newOrder = {
        user_id: userId,
        datum: orderData.datum,
        druh: orderData.druh,
        klient: orderData.klient || '',
        cislo: orderData.cislo,
        castka: orderData.castka || 0,
        fee: orderData.fee || 0,
        material: orderData.material || 0,
        pomocnik: orderData.pomocnik || 0,
        palivo: orderData.palivo || 0,
        adresa: orderData.adresa || '',
        typ: orderData.typ || 'byt',
        doba_realizace: orderData.doba_realizace || 1,
        poznamka: orderData.poznamka || '',
        soubory: orderData.soubory || [],
        zisk: (orderData.castka || 0) - (orderData.fee || 0) - (orderData.material || 0) - (orderData.pomocnik || 0) - (orderData.palivo || 0),
        created_at: new Date().toISOString()
      };

      // Dočasné ID pro cache
      const tempId = Date.now() + Math.random();
      const orderWithTempId = { ...newOrder, id: tempId };

      // Okamžitě aktualizuj cache
      const cacheKey = `paintpro_orders_cache_${userId}`;
      const cached = JSON.parse(localStorage.getItem(cacheKey) || '[]');
      cached.unshift(orderWithTempId);
      localStorage.setItem(cacheKey, JSON.stringify(cached));

      if (isOnline) {
        try {
          const { data, error } = await supabase.from('orders').insert([newOrder]).select().single();
          if (error) throw error;

          // Aktualizuj cache s reálným ID
          const updatedCache = cached.map(order => 
            order.id === tempId ? { ...data } : order
          );
          localStorage.setItem(cacheKey, JSON.stringify(updatedCache));

          console.log('✅ Zakázka vytvořena v Supabase');
          return updatedCache;
        } catch (supabaseError) {
          console.warn('⚠️ Supabase nedostupný, přidáno do queue');
          addToQueue({
            type: 'create_order',
            data: newOrder
          });
        }
      } else {
        addToQueue({
          type: 'create_order',
          data: newOrder
        });
      }

      return cached;
    } catch (error) {
      console.error('❌ Chyba při přidávání zakázky:', error);
      throw error;
    }
  };

  // Editace zakázky
  const editUserOrder = async (userId, orderId, updatedData) => {
    try {
      const updatedOrderData = {
        ...updatedData,
        zisk: (updatedData.castka || 0) - (updatedData.fee || 0) - (updatedData.material || 0) - (updatedData.pomocnik || 0) - (updatedData.palivo || 0)
      };

      // Okamžitě aktualizuj cache
      const cacheKey = `paintpro_orders_cache_${userId}`;
      const cached = JSON.parse(localStorage.getItem(cacheKey) || '[]');
      const orderIndex = cached.findIndex(order => order.id == orderId);

      if (orderIndex !== -1) {
        cached[orderIndex] = { ...cached[orderIndex], ...updatedOrderData };
        localStorage.setItem(cacheKey, JSON.stringify(cached));
      }

      if (isOnline) {
        try {
          const { error } = await supabase
            .from('orders')
            .update(updatedOrderData)
            .eq('id', orderId)
            .eq('user_id', userId);

          if (error) throw error;
          console.log('✅ Zakázka upravena v Supabase');
        } catch (supabaseError) {
          console.warn('⚠️ Supabase nedostupný, přidáno do queue');
          addToQueue({
            type: 'update_order',
            orderId: orderId,
            data: updatedOrderData
          });
        }
      } else {
        addToQueue({
          type: 'update_order',
          orderId: orderId,
          data: updatedOrderData
        });
      }

      return cached;
    } catch (error) {
      console.error('❌ Chyba při editaci zakázky:', error);
      throw error;
    }
  };

  // Smazání zakázky
  const deleteUserOrder = async (userId, orderId) => {
    try {
      // Okamžitě odstraň z cache
      const cacheKey = `paintpro_orders_cache_${userId}`;
      const cached = JSON.parse(localStorage.getItem(cacheKey) || '[]');
      const updatedOrders = cached.filter(order => order.id != orderId);
      localStorage.setItem(cacheKey, JSON.stringify(updatedOrders));

      if (isOnline) {
        try {
          const { error } = await supabase
            .from('orders')
            .delete()
            .eq('id', orderId)
            .eq('user_id', userId);

          if (error) throw error;
          console.log('✅ Zakázka smazána v Supabase');
        } catch (supabaseError) {
          console.warn('⚠️ Supabase nedostupný, přidáno do queue');
          addToQueue({
            type: 'delete_order',
            orderId: orderId
          });
        }
      } else {
        addToQueue({
          type: 'delete_order',
          orderId: orderId
        });
      }

      return updatedOrders;
    } catch (error) {
      console.error('❌ Chyba při mazání zakázky:', error);
      throw error;
    }
  };

  // Změna PINu
  const changePin = async (currentPinPlain, newPinPlain) => {
    try {
      const users = await loadUsers();
      const hashedCurrentPin = hashPin(currentPinPlain);
      const user = users.find(u => u.id === currentUser.id && u.pin_hash === hashedCurrentPin);

      if (!user) {
        return { success: false, error: 'Současný PIN je nesprávný' };
      }

      const hashedNewPin = hashPin(newPinPlain);
      const updatedUsers = users.map(u => 
        u.id === currentUser.id ? { ...u, pin_hash: hashedNewPin } : u
      );

      // Aktualizuj cache
      localStorage.setItem('paintpro_users_cache', JSON.stringify(updatedUsers));

      // Aktualizuj současného uživatele
      const updatedUser = { ...currentUser, pin_hash: hashedNewPin };
      setCurrentUser(updatedUser);
      localStorage.setItem('paintpro_current_user', JSON.stringify(updatedUser));

      // Synchronizuj s Supabase
      if (isOnline) {
        try {
          await supabase
            .from('users')
            .update({ pin_hash: hashedNewPin })
            .eq('id', currentUser.id);
        } catch (error) {
          console.warn('⚠️ PIN změněn lokálně, bude synchronizován později');
        }
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Chyba při změně PINu:', error);
      return { success: false, error: 'Chyba při změně PINu' };
    }
  };

  // Sledování online/offline stavu
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('🌐 Připojení obnoveno');
      processQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('📱 Offline režim');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Inicializace
  useEffect(() => {
    const initialize = async () => {
      try {
        // Zkontroluj uloženého uživatele
        const savedUser = localStorage.getItem('paintpro_current_user');
        if (savedUser) {
          setCurrentUser(JSON.parse(savedUser));
        }

        // Zpracuj queue při startu
        if (isOnline) {
          await processQueue();
        }
      } catch (error) {
        console.error('❌ Chyba při inicializaci:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, [isOnline]);

  const value = {
    currentUser,
    isLoading,
    isOnline,
    login,
    logout,
    getUserData,
    addUserOrder,
    editUserOrder,
    deleteUserOrder,
    changePin,
    addUser,
    loadUsers
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };
export default AuthProvider;