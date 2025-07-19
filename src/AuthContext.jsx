
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

  const isNetworkError = (error) => {
    return error?.code === 'NETWORK_ERROR' || 
           error?.message?.includes('fetch') ||
           error?.message?.includes('network') ||
           !navigator.onLine;
  };

  // 🔄 DETEKCE ONLINE/OFFLINE STAVU

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

        // Načti cache z localStorage
        const savedCache = JSON.parse(localStorage.getItem('paintpro_cache') || '{}');
        setLocalCache(savedCache);

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

  // 🔄 QUEUE MANAGEMENT

  const addToSyncQueue = (operation, data) => {
    const queueItem = {
      id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      operation,
      data,
      timestamp: new Date().toISOString(),
      attempts: 0,
      maxAttempts: 3
    };

    setSyncQueue(prev => {
      const newQueue = [...prev, queueItem];
      localStorage.setItem('paintpro_sync_queue', JSON.stringify(newQueue));
      return newQueue;
    });

    console.log('➕ Přidáno do queue:', operation, queueItem.id);
  };

  const removeFromQueue = (queueId) => {
    setSyncQueue(prev => {
      const newQueue = prev.filter(item => item.id !== queueId);
      localStorage.setItem('paintpro_sync_queue', JSON.stringify(newQueue));
      return newQueue;
    });
  };

  // 💾 CACHE MANAGEMENT

  const updateLocalCache = (userId, data, operation = 'update') => {
    setLocalCache(prev => {
      const userKey = `user_${userId}`;
      const currentUserData = prev[userKey] || [];

      let updatedUserData;
      
      switch (operation) {
        case 'add':
          updatedUserData = [...currentUserData, data];
          break;
        case 'update':
          updatedUserData = currentUserData.map(item => 
            item.id === data.id ? { ...item, ...data } : item
          );
          break;
        case 'delete':
          updatedUserData = currentUserData.filter(item => item.id !== data.id);
          break;
        case 'replace':
          updatedUserData = Array.isArray(data) ? data : [data];
          break;
        default:
          updatedUserData = currentUserData;
      }

      const newCache = {
        ...prev,
        [userKey]: updatedUserData,
        lastUpdate: new Date().toISOString()
      };

      localStorage.setItem('paintpro_cache', JSON.stringify(newCache));
      setCacheVersion(prev => prev + 1);
      
      return newCache;
    });
  };

  const replaceTempIdInCache = (userId, tempId, realData) => {
    setLocalCache(prev => {
      const userKey = `user_${userId}`;
      const currentUserData = prev[userKey] || [];
      
      const updatedUserData = currentUserData.map(item => {
        if (item.id === tempId || item._queueId === tempId) {
          return { ...realData, _isTemp: false, _queueId: undefined };
        }
        return item;
      });

      const newCache = {
        ...prev,
        [userKey]: updatedUserData,
        lastUpdate: new Date().toISOString()
      };

      localStorage.setItem('paintpro_cache', JSON.stringify(newCache));
      return newCache;
    });
  };

  // 🔄 UTILITY FUNCTIONS

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const retryOperation = async (operation, maxRetries = 3) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        
        // Exponential backoff
        const delay = 1000 * Math.pow(2, i);
        console.log(`🔄 Retry ${i + 1}/${maxRetries} za ${delay}ms`);
        await sleep(delay);
      }
    }
  };

  const resolveConflict = (localItem, remoteItem) => {
    // Timestamp-based conflict resolution
    const localTime = new Date(localItem.created_at || localItem.datum);
    const remoteTime = new Date(remoteItem.created_at || remoteItem.datum);
    
    console.log('🔀 Řeším konflikt:', {
      local: localTime.toISOString(),
      remote: remoteTime.toISOString()
    });
    
    return remoteTime > localTime ? remoteItem : localItem;
  };

  // 🔄 ATOMIC SYNC OPERATIONS

  const saveToSupabaseAtomic = async (orderData) => {
    try {
      return await retryOperation(async () => {
        const { data, error } = await supabase
          .from('orders')
          .insert([{
            user_id: orderData.user_id,
            datum: orderData.datum,
            druh: orderData.druh,
            klient: orderData.klient,
            cislo: orderData.cislo,
            castka: orderData.castka,
            fee: orderData.fee || 0,
            palivo: orderData.palivo || 0,
            material: orderData.material || 0,
            pomocnik: orderData.pomocnik || 0,
            zisk: orderData.zisk,
            adresa: orderData.adresa || '',
            typ: orderData.typ || 'nezadano',
            delkaRealizace: orderData.delkaRealizace || 1,
            poznamky: orderData.poznamky || '',
            soubory: orderData.soubory || []
          }])
          .select()
          .single();

        if (error) throw error;

        return { success: true, data };
      });
    } catch (error) {
      console.error('❌ Supabase save failed after retries:', error);
      return { success: false, error };
    }
  };

  const updateInSupabaseAtomic = async (orderId, orderData) => {
    try {
      return await retryOperation(async () => {
        const { data, error } = await supabase
          .from('orders')
          .update({
            datum: orderData.datum,
            druh: orderData.druh,
            klient: orderData.klient,
            cislo: orderData.cislo,
            castka: orderData.castka,
            fee: orderData.fee || 0,
            palivo: orderData.palivo || 0,
            material: orderData.material || 0,
            pomocnik: orderData.pomocnik || 0,
            zisk: orderData.zisk,
            adresa: orderData.adresa || '',
            typ: orderData.typ || 'nezadano',
            delkaRealizace: orderData.delkaRealizace || 1,
            poznamky: orderData.poznamky || '',
            soubory: orderData.soubory || []
          })
          .eq('id', orderId)
          .select()
          .single();

        if (error) throw error;

        return { success: true, data };
      });
    } catch (error) {
      console.error('❌ Supabase update failed after retries:', error);
      return { success: false, error };
    }
  };

  const deleteFromSupabaseAtomic = async (orderId) => {
    try {
      return await retryOperation(async () => {
        const { error } = await supabase
          .from('orders')
          .delete()
          .eq('id', orderId);

        if (error) throw error;

        return { success: true };
      });
    } catch (error) {
      console.error('❌ Supabase delete failed after retries:', error);
      return { success: false, error };
    }
  };

  const createUserInSupabaseAtomic = async (userData) => {
    try {
      return await retryOperation(async () => {
        const { data, error } = await supabase
          .from('users')
          .insert([{
            name: userData.name,
            pin_hash: userData.pin_hash,
            created_at: userData.created_at
          }])
          .select()
          .single();

        if (error) throw error;

        return { success: true, data };
      });
    } catch (error) {
      console.error('❌ Supabase user create failed after retries:', error);
      return { success: false, error };
    }
  };

  // 🔄 ATOMIC QUEUE PROCESSING

  const processQueue = async () => {
    if (isSyncing || !isOnline || syncQueue.length === 0) return;

    setIsSyncing(true);
    setSyncStatus('syncing');

    const queue = [...syncQueue]; // Kopie pro atomické zpracování
    const processedItems = [];
    const failedItems = [];

    console.log('🔄 Zpracovávám queue:', queue.length, 'položek');

    // Zpracuj každou položku atomicky
    for (const item of queue) {
      try {
        console.log('🔄 Zpracovávám:', item.operation, item.id);

        let result;
        switch (item.operation) {
          case 'CREATE':
            result = await saveToSupabaseAtomic(item.data);
            if (result.success) {
              // Nahraď dočasné ID skutečným v cache
              replaceTempIdInCache(item.data.user_id, item.data.id, result.data);
            }
            break;

          case 'UPDATE':
            result = await updateInSupabaseAtomic(item.data.id, item.data);
            if (result.success) {
              updateLocalCache(item.data.user_id, result.data, 'update');
            }
            break;

          case 'DELETE':
            result = await deleteFromSupabaseAtomic(item.data.id);
            if (result.success) {
              updateLocalCache(item.data.user_id, { id: item.data.id }, 'delete');
            }
            break;

          case 'CREATE_USER':
            result = await createUserInSupabaseAtomic(item.data);
            if (result.success) {
              // Aktualizuj cache uživatelů
              const users = JSON.parse(localStorage.getItem('paintpro_users_cache') || '[]');
              const updatedUsers = users.map(u => u.id === item.data.id ? result.data : u);
              localStorage.setItem('paintpro_users_cache', JSON.stringify(updatedUsers));
            }
            break;

          default:
            console.warn('⚠️ Neznámá operace:', item.operation);
            result = { success: false, error: 'Neznámá operace' };
        }

        if (result.success) {
          processedItems.push(item.id);
          console.log('✅ Úspěšně zpracováno:', item.id);
        } else {
          // Zvyš počet pokusů
          item.attempts = (item.attempts || 0) + 1;
          
          if (item.attempts >= item.maxAttempts) {
            console.error('❌ Max pokusy dosaženy:', item.id);
            failedItems.push(item.id);
          } else {
            console.warn('⚠️ Pokus znovu později:', item.id, `(${item.attempts}/${item.maxAttempts})`);
          }
        }

      } catch (error) {
        console.error('❌ Chyba při zpracování queue item:', error);
        
        if (isNetworkError(error)) {
          setIsOnline(false);
          break; // Přerušit zpracování při síťové chybě
        }
        
        item.attempts = (item.attempts || 0) + 1;
        if (item.attempts >= item.maxAttempts) {
          failedItems.push(item.id);
        }
      }
    }

    // Aktualizuj queue - odstraň zpracované a neúspěšné
    setSyncQueue(prev => {
      const itemsToRemove = [...processedItems, ...failedItems];
      const newQueue = prev.filter(item => !itemsToRemove.includes(item.id));
      localStorage.setItem('paintpro_sync_queue', JSON.stringify(newQueue));
      return newQueue;
    });

    // Uložit chyby pro zobrazení
    if (failedItems.length > 0) {
      setSyncErrors(prev => [...prev, ...failedItems.map(id => ({
        id,
        timestamp: new Date().toISOString(),
        message: 'Sync failed after max attempts'
      }))]);
    }

    setLastSyncTime(new Date().toISOString());
    setIsSyncing(false);
    setSyncStatus(failedItems.length > 0 ? 'error' : 'success');

    console.log('✅ Queue zpracován:', processedItems.length, 'úspěšných,', failedItems.length, 'neúspěšných');
  };

  // 📊 INTELIGENTNÍ getUserData S MERGE

  const getUserData = async (userId) => {
    try {
      console.log('🔍 Načítám data pro uživatele:', userId);

      const userKey = `user_${userId}`;
      const cachedData = localCache[userKey] || [];

      if (isOnline) {
        try {
          // Pokus o načtení z Supabase
          const { data: supabaseData, error } = await supabase
            .from('orders')
            .select('*')
            .eq('user_id', userId)
            .order('datum', { ascending: false });

          if (error) throw error;

          console.log('📡 Supabase data:', supabaseData?.length || 0, 'záznamů');
          console.log('💾 Cache data:', cachedData.length, 'záznamů');

          // INTELIGENTNÍ MERGE - Priorita: Supabase > dočasné záznamy z cache
          const supabaseIds = new Set((supabaseData || []).map(item => item.id));
          const merged = [...(supabaseData || [])];

          // Přidej dočasné záznamy z cache (pouze ty s _isTemp)
          const tempRecords = cachedData.filter(item => 
            item._isTemp && !supabaseIds.has(item.id)
          );
          
          // Řeš konflikty pro záznamy, které existují v obou zdrojích
          const conflictedRecords = cachedData.filter(item => 
            !item._isTemp && supabaseIds.has(item.id)
          );
          
          conflictedRecords.forEach(cacheItem => {
            const supabaseItem = merged.find(item => item.id === cacheItem.id);
            if (supabaseItem) {
              const resolved = resolveConflict(cacheItem, supabaseItem);
              const index = merged.findIndex(item => item.id === cacheItem.id);
              merged[index] = resolved;
            }
          });

          merged.push(...tempRecords);

          // Aktualizuj cache s merged daty
          updateLocalCache(userId, merged, 'replace');

          console.log('🔄 Merge dokončen:', merged.length, 'celkem záznamů');
          return merged;

        } catch (error) {
          console.warn('⚠️ Supabase nedostupný, používám cache:', error);
          setIsOnline(false);
          return cachedData;
        }
      } else {
        console.log('📱 Offline režim - používám cache');
        return cachedData;
      }

    } catch (error) {
      console.error('❌ Chyba při načítání dat:', error);
      return [];
    }
  };

  // ➕ INTELIGENTNÍ addUserOrder

  const addUserOrder = async (userId, orderData) => {
    try {
      console.log('➕ Přidávám zakázku pro uživatele:', userId);

      // KROK 1: Vygeneruj unikátní dočasné ID
      const tempId = `temp_${Date.now()}_${userId}_${Math.random().toString(36).substr(2, 9)}`;

      // KROK 2: Vytvoř normalizovanou zakázku
      const normalizedOrder = {
        ...orderData,
        id: tempId,
        user_id: userId,
        created_at: new Date().toISOString(),
        _isTemp: true,
        _queueId: tempId
      };

      // KROK 3: Okamžitě aktualizuj UI (optimistic update)
      updateLocalCache(userId, normalizedOrder, 'add');

      // KROK 4: Zkus online uložení
      if (isOnline) {
        try {
          const result = await saveToSupabaseAtomic(normalizedOrder);
          if (result.success) {
            // Nahraď dočasné ID skutečným
            replaceTempIdInCache(userId, tempId, result.data);
            console.log('✅ Zakázka uložena online s ID:', result.data.id);
            return await getUserData(userId);
          }
        } catch (error) {
          console.warn('Online uložení selhalo:', error);
          setIsOnline(false);
        }
      }

      // KROK 5: Přidej do queue pro pozdější synchronizaci
      addToSyncQueue('CREATE', normalizedOrder);

      console.log('📱 Zakázka uložena offline s temp ID:', tempId);
      return await getUserData(userId);

    } catch (error) {
      console.error('❌ Chyba při přidávání zakázky:', error);
      throw error;
    }
  };

  // ✏️ INTELIGENTNÍ editUserOrder

  const editUserOrder = async (userId, orderId, orderData) => {
    try {
      console.log('✏️ Upravuji zakázku:', orderId);

      // Přepočítej zisk
      const castka = Number(orderData.castka) || 0;
      const fee = Number(orderData.fee) || 0;
      const material = Number(orderData.material) || 0;
      const pomocnik = Number(orderData.pomocnik) || 0;
      const palivo = Number(orderData.palivo) || 0;

      const updatedOrder = {
        ...orderData,
        id: orderId,
        user_id: userId,
        zisk: castka - fee - material - pomocnik - palivo
      };

      // Okamžitě aktualizuj cache
      updateLocalCache(userId, updatedOrder, 'update');

      // Zkus online uložení
      if (isOnline && !orderId.startsWith('temp_')) {
        try {
          const result = await updateInSupabaseAtomic(orderId, updatedOrder);
          if (result.success) {
            console.log('✅ Zakázka upravena online:', orderId);
            return await getUserData(userId);
          }
        } catch (error) {
          console.warn('Online úprava selhala:', error);
          setIsOnline(false);
        }
      }

      // Přidej do queue pro pozdější synchronizaci
      addToSyncQueue('UPDATE', updatedOrder);

      console.log('📱 Zakázka upravena offline:', orderId);
      return await getUserData(userId);

    } catch (error) {
      console.error('❌ Chyba při úpravě zakázky:', error);
      throw error;
    }
  };

  // 🗑️ INTELIGENTNÍ deleteUserOrder

  const deleteUserOrder = async (userId, orderId) => {
    try {
      console.log('🗑️ Mažu zakázku:', orderId);

      // Okamžitě odstraň z cache
      updateLocalCache(userId, { id: orderId }, 'delete');

      // Zkus online smazání
      if (isOnline && !orderId.startsWith('temp_')) {
        try {
          const result = await deleteFromSupabaseAtomic(orderId);
          if (result.success) {
            console.log('✅ Zakázka smazána online:', orderId);
            return await getUserData(userId);
          }
        } catch (error) {
          console.warn('Online smazání selhalo:', error);
          setIsOnline(false);
        }
      }

      // Pokud je to temp záznam, pouze ho odstraň z queue
      if (orderId.startsWith('temp_')) {
        setSyncQueue(prev => {
          const newQueue = prev.filter(item => item.data.id !== orderId);
          localStorage.setItem('paintpro_sync_queue', JSON.stringify(newQueue));
          return newQueue;
        });
        console.log('📱 Temp zakázka odstraněna:', orderId);
      } else {
        // Přidej do queue pro pozdější smazání
        addToSyncQueue('DELETE', { id: orderId, user_id: userId });
        console.log('📱 Zakázka označena ke smazání:', orderId);
      }

      return await getUserData(userId);

    } catch (error) {
      console.error('❌ Chyba při mazání zakázky:', error);
      throw error;
    }
  };

  // 👥 UŽIVATELSKÉ FUNKCE

  const loadUsers = async () => {
    try {
      // Načti z cache
      const cachedUsers = JSON.parse(localStorage.getItem('paintpro_users_cache') || '[]');

      if (isOnline) {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('*');

          if (error) throw error;

          // Aktualizuj cache
          localStorage.setItem('paintpro_users_cache', JSON.stringify(data));
          return data;
        } catch (error) {
          console.warn('⚠️ Načítám uživatele z cache:', error);
          setIsOnline(false);
          return cachedUsers;
        }
      }

      return cachedUsers;
    } catch (error) {
      console.error('❌ Chyba při načítání uživatelů:', error);
      return [];
    }
  };

  const addUser = async (userData) => {
    try {
      console.log('👤 Vytvářím nového uživatele:', userData.name);

      // Validace
      if (!userData.name || !userData.pin_hash) {
        return { success: false, error: 'Jméno a PIN jsou povinné' };
      }

      const userWithId = {
        ...userData,
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        created_at: new Date().toISOString(),
        _isTemp: true
      };

      // Okamžitě aktualizuj cache
      const cachedUsers = JSON.parse(localStorage.getItem('paintpro_users_cache') || '[]');
      const updatedUsers = [...cachedUsers, userWithId];
      localStorage.setItem('paintpro_users_cache', JSON.stringify(updatedUsers));

      if (isOnline) {
        try {
          const result = await createUserInSupabaseAtomic(userWithId);
          if (result.success) {
            // Nahraď temp záznam skutečným
            const finalUsers = updatedUsers.map(u => 
              u.id === userWithId.id ? { ...result.data, _isTemp: false } : u
            );
            localStorage.setItem('paintpro_users_cache', JSON.stringify(finalUsers));
            
            console.log('✅ Uživatel vytvořen online s ID:', result.data.id);
            return { success: true, user: result.data };
          }
        } catch (error) {
          console.warn('Online vytvoření uživatele selhalo:', error);
          setIsOnline(false);
        }
      }

      // Přidej do queue pro pozdější synchronizaci
      addToSyncQueue('CREATE_USER', userWithId);

      console.log('📱 Uživatel vytvořen offline s temp ID:', userWithId.id);
      return { success: true, user: userWithId };

    } catch (error) {
      console.error('❌ Chyba při vytváření uživatele:', error);
      return { success: false, error: error.message };
    }
  };

  const login = async (pin, userId) => {
    try {
      const users = await loadUsers();
      const user = users.find(u => u.id === userId);

      if (!user) {
        return { success: false, error: 'Uživatel nenalezen' };
      }

      const hashedPin = hashPin(pin);
      if (user.pin_hash !== hashedPin) {
        return { success: false, error: 'Neplatný PIN' };
      }

      setCurrentUser(user);
      localStorage.setItem('paintpro_current_user', JSON.stringify(user));

      console.log('✅ Uživatel přihlášen:', user.name);
      return { success: true, user };
    } catch (error) {
      console.error('❌ Chyba při přihlašování:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('paintpro_current_user');
    console.log('👋 Uživatel odhlášen');
  };

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
    loadUsers,
    addUser,
    getUserData,
    addUserOrder,
    editUserOrder,
    deleteUserOrder,

    // Debug a monitoring funkce
    processQueue,
    clearSyncErrors: () => setSyncErrors([]),
    clearQueue: () => {
      setSyncQueue([]);
      localStorage.removeItem('paintpro_sync_queue');
      console.log('🧹 Queue vyčištěn');
    },
    
    // Diagnostické funkce
    getDebugInfo: () => ({
      isOnline,
      isSyncing,
      syncStatus,
      queueLength: syncQueue.length,
      cacheVersion,
      lastSyncTime,
      lastOnlineTime,
      dataState,
      syncErrorsCount: syncErrors.length,
      cacheKeys: Object.keys(localCache)
    }),
    
    // Force sync - pro manuální trigger
    forceSync: () => {
      if (isOnline) {
        console.log('🚀 Nucený sync spuštěn');
        processQueue();
      } else {
        console.warn('⚠️ Nemůžu syncovat - offline režim');
      }
    },
    
    // Cache management
    clearCache: () => {
      setLocalCache({});
      localStorage.removeItem('paintpro_cache');
      setCacheVersion(prev => prev + 1);
      console.log('🧹 Cache vyčištěn');
    },
    
    // Získání cache dat pro debug
    getCacheData: (userId) => {
      const userKey = `user_${userId}`;
      return localCache[userKey] || [];
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
