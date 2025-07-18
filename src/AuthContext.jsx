import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Supabase konfigurace
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://lseqrqmtjymukewnejdd.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzZXFycW10anltdWtld25lamRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyNjQ2MjcsImV4cCI6MjA2Nzg0MDYyN30.SgWjc-GETZ_D0tJNtErxXhUaH6z_MgRJtxc94RsUXPw';

console.log('🔧 Nová AuthContext architektura inicializována');

const supabase = createClient(supabaseUrl, supabaseKey);
const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // 🏗️ NOVÁ ARCHITEKTURA - 5 HLAVNÍCH VRSTEV

  // 1. CONNECTION LAYER - detekce online/offline
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastOnlineTime, setLastOnlineTime] = useState(null);

  // 2. QUEUE LAYER - atomický queue management
  const [syncQueue, setSyncQueue] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle');

  // 3. CACHE LAYER - inteligentní cache management
  const [localCache, setLocalCache] = useState({});
  const [cacheVersion, setCacheVersion] = useState(0);

  // 4. SYNC LAYER - spolehlivá synchronizace
  const [syncErrors, setSyncErrors] = useState([]);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // 5. DATA LAYER - jediný zdroj pravdy
  const [dataState, setDataState] = useState('loading');

  // 🔧 POMOCNÉ FUNKCE

  const hashPin = (pin) => {
    let hash = 0;
    for (let i = 0; i < pin.length; i++) {
      const char = pin.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString();
  };

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const isNetworkError = (error) => {
    return error?.message?.includes('fetch') || 
           error?.message?.includes('network') || 
           error?.code === 'NETWORK_FAILURE' ||
           !navigator.onLine;
  };

  const generateTempId = (userId) => {
    return `temp_${Date.now()}_${userId}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // 🗄️ CACHE MANAGEMENT

  const updateLocalCache = (userId, orderData, operation) => {
    const cacheKey = `paintpro_orders_cache_${userId}`;
    const cached = JSON.parse(localStorage.getItem(cacheKey) || '[]');

    let updatedCache;
    switch (operation) {
      case 'add':
        updatedCache = [orderData, ...cached];
        break;
      case 'update':
        updatedCache = cached.map(order => 
          order.id === orderData.id ? { ...order, ...orderData } : order
        );
        break;
      case 'delete':
        updatedCache = cached.filter(order => order.id !== orderData.id);
        break;
      case 'replace_all':
        updatedCache = orderData;
        break;
      default:
        updatedCache = cached;
    }

    localStorage.setItem(cacheKey, JSON.stringify(updatedCache));
    setLocalCache(prev => ({ ...prev, [userId]: updatedCache }));
    setCacheVersion(prev => prev + 1);

    console.log(`📦 Cache aktualizována (${operation}):`, updatedCache.length, 'zakázek');
    return updatedCache;
  };

  const replaceTempIdInCache = (userId, tempId, realData) => {
    const cacheKey = `paintpro_orders_cache_${userId}`;
    const cached = JSON.parse(localStorage.getItem(cacheKey) || '[]');

    const updatedCache = cached.map(order => 
      order.id === tempId ? realData : order
    );

    localStorage.setItem(cacheKey, JSON.stringify(updatedCache));
    setLocalCache(prev => ({ ...prev, [userId]: updatedCache }));

    console.log(`🔄 ID nahrazeno: ${tempId} -> ${realData.id}`);
    return updatedCache;
  };

  // 📋 QUEUE MANAGEMENT

  const addToSyncQueue = (type, data, options = {}) => {
    const queueItem = {
      id: Date.now() + Math.random(),
      type,
      data,
      timestamp: Date.now(),
      retries: 0,
      maxRetries: 3,
      ...options
    };

    setSyncQueue(prev => {
      const updated = [...prev, queueItem];
      localStorage.setItem('paintpro_sync_queue', JSON.stringify(updated));
      console.log(`📋 Přidáno do queue: ${type}`, queueItem);
      return updated;
    });
  };

  const removeFromSyncQueue = (itemId) => {
    setSyncQueue(prev => {
      const updated = prev.filter(item => item.id !== itemId);
      localStorage.setItem('paintpro_sync_queue', JSON.stringify(updated));
      return updated;
    });
  };

  // 💾 ATOMICKÉ SUPABASE OPERACE

  const saveToSupabaseAtomic = async (orderData) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('❌ Supabase atomic save failed:', error);
      if (isNetworkError(error)) {
        setIsOnline(false);
      }
      return { success: false, error };
    }
  };

  const retryOperation = async (operation, maxRetries = 3) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await sleep(1000 * Math.pow(2, i)); // Exponential backoff
      }
    }
  };

  // 🔄 ATOMICKÝ PROCESS QUEUE

  const processQueue = async () => {
    if (isSyncing || !isOnline || syncQueue.length === 0) {
      return;
    }

    setIsSyncing(true);
    setSyncStatus('syncing');
    console.log('🔄 Začínám atomické zpracování queue:', syncQueue.length, 'položek');

    const queue = [...syncQueue]; // Kopie pro atomické zpracování
    const processedItems = [];
    const failedItems = [];

    for (const item of queue) {
      try {
        console.log(`🔄 Zpracovávám: ${item.type}`, item.id);

        let result = null;
        switch (item.type) {
          case 'CREATE':
            result = await retryOperation(() => 
              supabase.from('orders').insert([item.data]).select().single()
            );

            // Nahraď dočasné ID skutečným
            if (item.tempId && result.data && currentUser?.id) {
              replaceTempIdInCache(currentUser.id, item.tempId, result.data);
            }
            break;

          case 'UPDATE':
            result = await retryOperation(() =>
              supabase.from('orders').update(item.data).eq('id', item.orderId).select()
            );
            break;

          case 'DELETE':
            result = await retryOperation(() =>
              supabase.from('orders').delete().eq('id', item.orderId)
            );
            break;

          case 'CREATE_USER':
            result = await retryOperation(() =>
              supabase.from('users').insert([item.data]).select().single()
            );
            break;

          case 'UPDATE_USER_PIN':
            result = await retryOperation(() =>
              supabase.from('users').update(item.data).eq('id', item.userId).select()
            );
            break;
        }

        if (result?.error) throw result.error;

        console.log('✅ Synchronizováno:', item.type, item.id);
        processedItems.push(item);
        removeFromSyncQueue(item.id);

      } catch (error) {
        console.error('❌ Synchronizace selhala:', item.type, error);

        if (isNetworkError(error)) {
          setIsOnline(false);
          break; // Přerušit při síťové chybě
        }

        // Retry logika
        if (item.retries < item.maxRetries) {
          setSyncQueue(prev => prev.map(queueItem => 
            queueItem.id === item.id 
              ? { ...queueItem, retries: queueItem.retries + 1 }
              : queueItem
          ));
        } else {
          failedItems.push(item);
          setSyncErrors(prev => [...prev, { item, error: error.message }]);
          removeFromSyncQueue(item.id);
        }
      }
    }

    setIsSyncing(false);
    setSyncStatus('idle');
    setLastSyncTime(new Date().toISOString());

    console.log(`✅ Queue zpracována: ${processedItems.length} úspěšných, ${failedItems.length} selhalo`);

    // Refresh dat po úspěšné synchronizaci
    if (processedItems.length > 0 && currentUser?.id) {
      await getUserData(currentUser.id, true); // Force refresh
    }
  };

  // 📊 INTELIGENTNÍ getUserData

  const getUserData = async (userId, forceRefresh = false) => {
    try {
      const cacheKey = `paintpro_orders_cache_${userId}`;
      console.log('🔍 getUserData START - userId:', userId, 'online:', isOnline, 'forceRefresh:', forceRefresh);

      // Načti z cache jako základ
      const cachedData = JSON.parse(localStorage.getItem(cacheKey) || '[]');
      console.log('📦 Cache obsahuje:', cachedData.length, 'zakázek');

      if (isOnline || forceRefresh) {
        try {
          console.log('🌐 Načítám ze Supabase...');
          const { data: supabaseData, error } = await supabase
            .from('orders')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

          if (error) throw error;

          console.log('✅ Supabase data:', supabaseData?.length || 0, 'zakázek');

          // INTELIGENTNÍ MERGE: Priorita Supabase > dočasné záznamy z cache
          const merged = [...(supabaseData || [])];

          // Přidej dočasné záznamy z cache, které nejsou v Supabase
          const tempRecords = cachedData.filter(cached => 
            cached.id?.toString().startsWith('temp_') || 
            cached.id?.toString().startsWith('offline_')
          );

          merged.unshift(...tempRecords);

          console.log('🔗 Merged data:', merged.length, 'zakázek (včetně', tempRecords.length, 'dočasných)');

          // Aktualizuj cache s merged daty
          updateLocalCache(userId, merged, 'replace_all');

          return merged;

        } catch (error) {
          console.error('❌ Supabase nedostupný:', error);
          if (isNetworkError(error)) {
            setIsOnline(false);
          }
          // Fallback na cache
          console.log('📦 Používám cache jako fallback');
          return cachedData;
        }
      } else {
        console.log('📱 Offline - používám cache');
        return cachedData;
      }
    } catch (error) {
      console.error('❌ Kritická chyba getUserData:', error);
      return [];
    }
  };

  // ➕ INTELIGENTNÍ addUserOrder

  const addUserOrder = async (userId, orderData) => {
    try {
      console.log('🔄 addUserOrder START:', userId, orderData);

      // KROK 1: Vygeneruj unikátní dočasné ID
      const tempId = generateTempId(userId);

      // KROK 2: Vytvoř normalizovanou zakázku
      const normalizedOrder = {
        ...orderData,
        id: tempId,
        user_id: userId,
        created_at: new Date().toISOString(),
        zisk: (orderData.castka || 0) - (orderData.fee || 0) - (orderData.material || 0) - (orderData.pomocnik || 0) - (orderData.palivo || 0),
        _isTemp: true,
        _queueId: tempId
      };

      console.log('📋 Normalizovaná zakázka:', normalizedOrder);

      // KROK 3: Okamžitě aktualizuj UI (optimistic update)
      const updatedCache = updateLocalCache(userId, normalizedOrder, 'add');

      // KROK 4: Zkus online uložení
      if (isOnline) {
        try {
          const result = await saveToSupabaseAtomic(normalizedOrder);
          if (result.success) {
            // Nahraď dočasné ID skutečným
            replaceTempIdInCache(userId, tempId, result.data);
            console.log('✅ Zakázka uložena online:', result.data.id);
            return result.data;
          }
        } catch (error) {
          console.warn('⚠️ Online uložení selhalo:', error);
          setIsOnline(false);
        }
      }

      // KROK 5: Přidej do queue pro pozdější synchronizaci
      addToSyncQueue('CREATE', normalizedOrder, { tempId });

      console.log('📋 Zakázka přidána do queue pro pozdější sync');
      return normalizedOrder;

    } catch (error) {
      console.error('❌ Kritická chyba addUserOrder:', error);
      throw error;
    }
  };

  // ✏️ EDITACE ZAKÁZKY

  const editUserOrder = async (userId, orderId, updatedData) => {
    try {
      const normalizedData = {
        ...updatedData,
        zisk: (updatedData.castka || 0) - (updatedData.fee || 0) - (updatedData.material || 0) - (updatedData.pomocnik || 0) - (updatedData.palivo || 0)
      };

      // Okamžitě aktualizuj cache
      updateLocalCache(userId, { id: orderId, ...normalizedData }, 'update');

      if (isOnline) {
        try {
          const { error } = await supabase
            .from('orders')
            .update(normalizedData)
            .eq('id', orderId)
            .eq('user_id', userId);

          if (error) throw error;
          console.log('✅ Zakázka upravena online');
        } catch (error) {
          console.warn('⚠️ Online editace selhala, přidáno do queue');
          addToSyncQueue('UPDATE', normalizedData, { orderId });
        }
      } else {
        addToSyncQueue('UPDATE', normalizedData, { orderId });
      }

      return await getUserData(userId);
    } catch (error) {
      console.error('❌ Chyba při editaci:', error);
      throw error;
    }
  };

  // 🗑️ SMAZÁNÍ ZAKÁZKY

  const deleteUserOrder = async (userId, orderId) => {
    try {
      // Okamžitě odstraň z cache
      updateLocalCache(userId, { id: orderId }, 'delete');

      if (isOnline) {
        try {
          const { error } = await supabase
            .from('orders')
            .delete()
            .eq('id', orderId)
            .eq('user_id', userId);

          if (error) throw error;
          console.log('✅ Zakázka smazána online');
        } catch (error) {
          console.warn('⚠️ Online smazání selhalo, přidáno do queue');
          addToSyncQueue('DELETE', {}, { orderId });
        }
      } else {
        addToSyncQueue('DELETE', {}, { orderId });
      }

      return await getUserData(userId);
    } catch (error) {
      console.error('❌ Chyba při mazání:', error);
      throw error;
    }
  };

  // 👤 SPRÁVA UŽIVATELŮ

  const loadUsers = async () => {
    try {
      if (isOnline) {
        const { data, error } = await supabase.from('users').select('*');
        if (!error && data?.length > 0) {
          localStorage.setItem('paintpro_users_cache', JSON.stringify(data));
          return data;
        }
      }

      const cached = JSON.parse(localStorage.getItem('paintpro_users_cache') || '[]');
      return cached.length > 0 ? cached : createDefaultAdmin();
    } catch (error) {
      console.error('❌ Chyba při načítání uživatelů:', error);
      return createDefaultAdmin();
    }
  };

  const createDefaultAdmin = () => {
    const admin = {
      id: 'admin_1',
      name: 'Administrátor',
      avatar: 'AD',
      color: '#8b5cf6',
      pin_hash: hashPin('135715'),
      is_admin: true,
      created_at: new Date().toISOString()
    };

    localStorage.setItem('paintpro_users_cache', JSON.stringify([admin]));
    addToSyncQueue('CREATE_USER', admin);
    return [admin];
  };

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

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('paintpro_current_user');
  };

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

      const cached = JSON.parse(localStorage.getItem('paintpro_users_cache') || '[]');
      cached.push(newUser);
      localStorage.setItem('paintpro_users_cache', JSON.stringify(cached));

      addToSyncQueue('CREATE_USER', newUser);

      return { success: true, user: newUser };
    } catch (error) {
      console.error('❌ Chyba při přidávání uživatele:', error);
      return { success: false, error: 'Chyba při přidávání uživatele' };
    }
  };

  const changePin = async (currentPinPlain, newPinPlain) => {
    try {
      if (!currentUser) {
        return { success: false, error: 'Žádný přihlášený uživatel' };
      }

      const hashedCurrentPin = hashPin(currentPinPlain);
      if (currentUser.pin_hash !== hashedCurrentPin) {
        return { success: false, error: 'Současný PIN je nesprávný' };
      }

      const hashedNewPin = hashPin(newPinPlain);
      const updatedUserData = { ...currentUser, pin_hash: hashedNewPin };

      // Okamžitě aktualizuj stav
      setCurrentUser(updatedUserData);
      localStorage.setItem('paintpro_current_user', JSON.stringify(updatedUserData));

      // Aktualizuj cache uživatelů
      const users = JSON.parse(localStorage.getItem('paintpro_users_cache') || '[]');
      const updatedUsers = users.map(u => 
        u.id === currentUser.id ? updatedUserData : u
      );
      localStorage.setItem('paintpro_users_cache', JSON.stringify(updatedUsers));

      // Synchronizuj s Supabase
      addToSyncQueue('UPDATE_USER_PIN', { pin_hash: hashedNewPin }, { userId: currentUser.id });

      return { success: true };
    } catch (error) {
      console.error('❌ Chyba při změně PINu:', error);
      return { success: false, error: 'Chyba při změně PINu' };
    }
  };

  // 📡 SLEDOVÁNÍ ONLINE/OFFLINE STAVU

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastOnlineTime(new Date().toISOString());
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

  // 🚀 INICIALIZACE

  useEffect(() => {
    const initialize = async () => {
      try {
        console.log('🚀 Inicializace nové AuthContext architektury...');

        // Načti queue z localStorage
        const savedQueue = JSON.parse(localStorage.getItem('paintpro_sync_queue') || '[]');
        setSyncQueue(savedQueue);

        // Načti uživatele
        await loadUsers();

        // Obnov uloženého uživatele
        const savedUser = localStorage.getItem('paintpro_current_user');
        if (savedUser) {
          const user = JSON.parse(savedUser);
          setCurrentUser(user);
          console.log('👤 Obnoven uživatel:', user.name);
        }

        // Zpracuj queue při startu
        if (isOnline && savedQueue.length > 0) {
          console.log('🔄 Zpracovávám queue při startu...');
          setTimeout(() => processQueue(), 1000);
        }

        setDataState('ready');
      } catch (error) {
        console.error('❌ Chyba při inicializaci:', error);
        setDataState('error');
      } finally {
        setIsLoading(false);
        console.log('✅ Nová AuthContext architektura inicializována');
      }
    };

    initialize();
  }, []);

  // Auto-sync při připojení
  useEffect(() => {
    if (isOnline && syncQueue.length > 0) {
      const timer = setTimeout(() => processQueue(), 2000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, syncQueue.length]);

  const value = {
    // Uživatelský stav
    currentUser,
    isLoading,

    // Síťový stav
    isOnline,
    lastOnlineTime,

    // Synchronizační stav
    isSyncing,
    syncStatus,
    syncErrors,
    lastSyncTime,

    // Data stav
    dataState,
    cacheVersion,

    // Queue info
    queueLength: syncQueue.length,

    // Hlavní funkce
    login,
    logout,
    getUserData,
    addUserOrder,
    editUserOrder,
    deleteUserOrder,
    changePin,
    addUser,
    loadUsers,

    // Utility funkce
    processQueue: () => processQueue(),
    clearSyncErrors: () => setSyncErrors([])
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };
export default AuthProvider;