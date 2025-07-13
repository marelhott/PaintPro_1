import React, { createContext, useContext, useState, useEffect } from 'react';
import DataManager from './DataManager';

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

  // Funkce pro výpočet zisku
  const calculateProfit = (orderData) => {
    const castka = Number(orderData.castka) || 0;
    const fee = Number(orderData.fee) || 0;
    const material = Number(orderData.material) || 0;
    const pomocnik = Number(orderData.pomocnik) || 0;
    const palivo = Number(orderData.palivo) || 0;

    return castka - fee - material - pomocnik - palivo;
  };

  // Inicializace uživatelů v Supabase
  const initializeUsers = async () => {
    try {
      console.log('🚀 Inicializuji uživatele v Supabase...');

      if (!window.supabase) {
        console.error('❌ Supabase není dostupné!');
        return;
      }

      // Základní uživatelé
      const users = [
        {
          id: 'admin',
          name: 'Administrátor',
          avatar: 'AD',
          color: '#8b5cf6',
          is_admin: true,
          created_at: new Date().toISOString()
        },
        {
          id: 'lenka',
          name: 'Lenka',
          avatar: 'LE',
          color: '#22c55e',
          is_admin: false,
          created_at: new Date().toISOString()
        }
      ];

      // Zkontroluj existující uživatele
      const { data: existingUsers } = await window.supabase
        .from('users')
        .select('*');

      // Přidej pouze nové uživatele
      for (const user of users) {
        const exists = existingUsers?.find(u => u.id === user.id);
        if (!exists) {
          console.log('➕ Přidávám uživatele:', user.name);
          await window.supabase
            .from('users')
            .insert([user]);
        }
      }

      console.log('✅ Uživatelé inicializováni');
    } catch (error) {
      console.error('❌ Chyba při inicializaci uživatelů:', error);
    }
  };

  // Načtení uživatele podle URL hash
  const loadUserFromUrl = async () => {
    try {
      const hash = window.location.hash.slice(1); // Odstraň #
      
      console.log('🔍 loadUserFromUrl volána s hash:', hash);
      
      // Pokud není hash, zobraz výběr profilu
      if (!hash) {
        console.log('📋 Žádný hash - zobrazujem výběr profilu');
        setCurrentUser(null);
        setIsLoading(false);
        return;
      }

      // Fallback uživatelé pro rychlé načtení
      const fallbackUsers = [
        {
          id: 'admin',
          name: 'Administrátor',
          avatar: 'AD',
          color: '#8b5cf6',
          isAdmin: true
        },
        {
          id: 'lenka',
          name: 'Lenka',
          avatar: 'LE',
          color: '#22c55e',
          isAdmin: false
        }
      ];

      // Najdi uživatele ve fallback datech
      const user = fallbackUsers.find(u => u.id === hash);
      
      if (user) {
        console.log('✅ Uživatel načten:', user.name);
        console.log('🔄 Nastavuji currentUser:', user);
        setCurrentUser(user);
        setIsLoading(false);
        
        // Krátká pauza pro stabilizaci stavu
        await new Promise(resolve => setTimeout(resolve, 100));
        
        console.log('✅ currentUser nastaven, isLoading:', false);
        
        // Inicializuj ukázková data pro admin
        if (hash === 'admin') {
          await initializeAdminData();
        }
      } else {
        console.log('⚠️ Uživatel nenalezen, zobrazujem výběr profilu');
        window.location.hash = '';
        setCurrentUser(null);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('❌ Chyba při načítání uživatele:', error);
      setCurrentUser(null);
      setIsLoading(false);
    }
  };

  // Inicializace ukázkových dat pro administrátora
  const initializeAdminData = async () => {
    try {
      const { data: existingOrders } = await window.supabase
        .from('orders')
        .select('*')
        .eq('user_id', 'admin');

      if (existingOrders && existingOrders.length > 0) {
        console.log('📊 Admin má existující data:', existingOrders.length, 'zakázek');
        return;
      }

      console.log('🔧 Přidávám ukázková data pro administrátora...');

      const sampleOrders = [
        {
          user_id: 'admin',
          datum: '11. 4. 2025',
          druh: 'MVČ',
          klient: 'Gabriela Hajduchová',
          cislo: 'MVČ-001',
          castka: 10000,
          fee: 2000,
          material: 0,
          pomocnik: 0,
          palivo: 0,
          adresa: 'Letohradská, Praha 7',
          typ: 'byt',
          doba_realizace: 2,
          poznamka: '',
          soubory: [],
          zisk: 8000,
          created_at: new Date().toISOString()
        },
        {
          user_id: 'admin',
          datum: '14. 4. 2025',
          druh: 'Adam - minutost',
          klient: 'Tereza Pochobradská',
          cislo: 'ADM-001',
          castka: 14000,
          fee: 2000,
          material: 0,
          pomocnik: 0,
          palivo: 0,
          adresa: 'Cimburkova 9, Praha 3',
          typ: 'byt',
          doba_realizace: 2,
          poznamka: '',
          soubory: [],
          zisk: 12000,
          created_at: new Date().toISOString()
        }
      ];

      await window.supabase
        .from('orders')
        .insert(sampleOrders);

      console.log('✅ Ukázková data přidána');
    } catch (error) {
      console.error('❌ Chyba při inicializaci dat:', error);
    }
  };

  // Funkce pro získání dat uživatele
  const getUserData = async (userId) => {
    try {
      console.log('🔄 Načítám data pro uživatele:', userId);
      return await DataManager.getUserOrders(userId);
    } catch (error) {
      console.error('❌ Chyba při načítání dat:', error);
      return [];
    }
  };

  // Funkce pro přidání nové zakázky
  const addUserOrder = async (userId, orderData) => {
    try {
      console.log('🔄 Přidávám novou zakázku pro uživatele:', userId);
      const savedOrder = await DataManager.saveUserOrder(userId, orderData);
      return await DataManager.getUserOrders(userId);
    } catch (error) {
      console.error('❌ Chyba při přidávání zakázky:', error);
      throw error;
    }
  };

  // Funkce pro editaci zakázky
  const editUserOrder = async (userId, orderId, updatedData) => {
    try {
      console.log('🔄 Upravuji zakázku:', orderId, 'pro uživatele:', userId);
      await DataManager.updateUserOrder(userId, orderId, updatedData);
      return await DataManager.getUserOrders(userId);
    } catch (error) {
      console.error('❌ Chyba při editaci zakázky:', error);
      throw error;
    }
  };

  // Smazání zakázky
  const deleteUserOrder = async (userId, orderId) => {
    try {
      await DataManager.deleteUserOrder(userId, orderId);
      return await DataManager.getUserOrders(userId);
    } catch (error) {
      console.error('Chyba při mazání zakázky:', error);
      throw error;
    }
  };

  // Inicializace při načtení
  useEffect(() => {
    console.log('🚀 AuthContext inicializace...');
    
    // Okamžitě načti uživatele z URL
    loadUserFromUrl();

    // Poslouchej změny URL hash
    const handleHashChange = () => {
      console.log('🔄 Hash change na:', window.location.hash);
      loadUserFromUrl();
    };

    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // Context hodnoty
  const value = {
    currentUser,
    isLoading,
    getUserData,
    addUserOrder,
    editUserOrder,
    deleteUserOrder
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };
export default AuthProvider;