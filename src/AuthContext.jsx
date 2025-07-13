import React, { createContext, useContext, useState, useEffect } from 'react';
import DataManager from './DataManager';

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

  // Funkce pro výpočet zisku
  const calculateProfit = (orderData) => {
    const castka = Number(orderData.castka) || 0;
    const fee = Number(orderData.fee) || 0;
    const material = Number(orderData.material) || 0;
    const pomocnik = Number(orderData.pomocnik) || 0;
    const palivo = Number(orderData.palivo) || 0;

    return castka - fee - material - pomocnik - palivo;
  };

  // Hash funkce pro PIN (jednoduchá implementace)
  const hashPin = (pin) => {
    let hash = 0;
    for (let i = 0; i < pin.length; i++) {
      const char = pin.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
  };

  // Inicializace výchozího uživatele
  const initializeDefaultUser = () => {
    const adminPin = '123456';
    const adminPinHash = hashPin(adminPin);

    console.log('🔄 Kontroluji administrátora a ukázková data...');

    const adminUser = {
      id: 'admin_1',
      name: 'Administrátor', 
      avatar: 'AD',
      color: '#8b5cf6',
      pin: adminPinHash,
      isAdmin: true,
      createdAt: new Date().toISOString()
    };

    localStorage.setItem('paintpro_users', JSON.stringify([adminUser]));
    console.log('🔐 Administrátor nastaven s PIN: 123456');

    // VŽDY zkontroluj a obnov ukázková data
    const existingOrders = JSON.parse(localStorage.getItem('paintpro_orders_admin_1') || '[]');
    console.log('📊 Současné zakázky administrátora:', existingOrders.length);

    if (existingOrders.length === 0) {
      console.log('🔧 Přidávám ukázková data pro administrátora...');

      // Přidání ukázkových zakázek pro administrátora
      const sampleOrders = [
        {
          id: 1,
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
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
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
          createdAt: new Date().toISOString()
        },
        {
          id: 3,
          datum: '17. 4. 2025',
          druh: 'MVČ',
          klient: 'Katka Szczepaniková',
          cislo: 'MVČ-002',
          castka: 15000,
          fee: 2000,
          material: 0,
          pomocnik: 0,
          palivo: 0,
          adresa: 'Nad aleji 23, Praha 6',
          typ: 'byt',
          doba_realizace: 2,
          poznamka: '',
          soubory: [],
          zisk: 13000,
          createdAt: new Date().toISOString()
        },
        {
          id: 4,
          datum: '18. 4. 2025',
          druh: 'Adam - Albert',
          klient: 'Jan Novák',
          cislo: 'ADM-002',
          castka: 3000,
          fee: 0,
          material: 0,
          pomocnik: 0,
          palivo: 0,
          adresa: 'U Průhonu, Praha 7',
          typ: 'byt',
          doba_realizace: 1,
          poznamka: '',
          soubory: [],
          zisk: 3000,
          createdAt: new Date().toISOString()
        },
        {
          id: 5,
          datum: '21. 4. 2025',
          druh: 'MVČ',
          klient: 'Marek Rucki',
          cislo: 'MVČ-003',
          castka: 25000,
          fee: 4000,
          material: 0,
          pomocnik: 0,
          palivo: 0,
          adresa: 'Národní obrany 49, Praha 6',
          typ: 'byt',
          doba_realizace: 2,
          poznamka: '',
          soubory: [],
          zisk: 21000,
          createdAt: new Date().toISOString()
        },
        {
          id: 6,
          datum: '26. 4. 2025',
          druh: 'MVČ',
          klient: 'Katka Szczepaniková',
          cislo: 'MVČ-004',
          castka: 10000,
          fee: 0,
          material: 0,
          pomocnik: 0,
          palivo: 0,
          adresa: 'Nad aleji 23, Praha 6',
          typ: 'byt',
          doba_realizace: 2,
          poznamka: 'dekor malba',
          soubory: [],
          zisk: 10000,
          createdAt: new Date().toISOString()
        },
        {
          id: 7,
          datum: '27. 4. 2025',
          druh: 'poplavky',
          klient: 'Augustin',
          cislo: 'POP-001',
          castka: 72000,
          fee: 20000,
          material: 0,
          pomocnik: 0,
          palivo: 0,
          adresa: 'Horní poluby, Křenov',
          typ: 'pension',
          doba_realizace: 18,
          poznamka: 'doplatek',
          soubory: [],
          zisk: 52000,
          createdAt: new Date().toISOString()
        },
        {
          id: 8,
          datum: '28. 4. 2025',
          druh: 'MVČ',
          klient: 'Zdeněk Fiedler',
          cislo: 'MVČ-005',
          castka: 24000,
          fee: 4000,
          material: 0,
          pomocnik: 0,
          palivo: 0,
          adresa: 'Pod jarovem 14, Praha 3',
          typ: 'byt',
          doba_realizace: 3,
          poznamka: '',
          soubory: [],
          zisk: 20000,
          createdAt: new Date().toISOString()
        },
        {
          id: 9,
          datum: '2. 5. 2025',
          druh: 'MVČ',
          klient: 'Vojtěch Král',
          cislo: 'MVČ-006',
          castka: 15000,
          fee: 0,
          material: 0,
          pomocnik: 0,
          palivo: 0,
          adresa: 'Kaběšova 943/2, Praha 9',
          typ: 'byt',
          doba_realizace: 2,
          poznamka: '',
          soubory: [],
          zisk: 15000,
          createdAt: new Date().toISOString()
        },
        {
          id: 10,
          datum: '5. 5. 2025',
          druh: 'MVČ',
          klient: 'Petr Dvořák',
          cislo: 'MVČ-007',
          castka: 30000,
          fee: 6000,
          material: 0,
          pomocnik: 0,
          palivo: 0,
          adresa: 'Za Mlýnem 1746, Hostivice',
          typ: 'byt',
          doba_realizace: 2,
          poznamka: '',
          soubory: [],
          zisk: 24000,
          createdAt: new Date().toISOString()
        },
        {
          id: 11,
          datum: '7. 5. 2025',
          druh: 'Adam - Albert',
          klient: '',
          cislo: 'ADM-003',
          castka: 4500,
          fee: 0,
          material: 0,
          pomocnik: 0,
          palivo: 0,
          adresa: 'Beroun',
          typ: 'dům',
          doba_realizace: 1,
          poznamka: '',
          soubory: [],
          zisk: 4500,
          createdAt: new Date().toISOString()
        },
        {
          id: 12,
          datum: '11. 5. 2025',
          druh: 'Adam - Lenka',
          klient: 'Andrej Vacík',
          cislo: 'ADM-004',
          castka: 17800,
          fee: 4000,
          material: 0,
          pomocnik: 0,
          palivo: 0,
          adresa: 'Na Pomezí 133/38, Praha 5',
          typ: 'byt',
          doba_realizace: 2,
          poznamka: '',
          soubory: [],
          zisk: 13800,
          createdAt: new Date().toISOString()
        },
        {
          id: 13,
          datum: '13. 5. 2025',
          druh: 'Adam - Lenka',
          klient: '',
          cislo: 'ADM-005',
          castka: 2000,
          fee: 0,
          material: 0,
          pomocnik: 0,
          palivo: 0,
          adresa: '',
          typ: 'byt',
          doba_realizace: 1,
          poznamka: '',
          soubory: [],
          zisk: 2000,
          createdAt: new Date().toISOString()
        },
        {
          id: 14,
          datum: '14. 5. 2025',
          druh: 'Adam - Lenka',
          klient: '',
          cislo: 'ADM-006',
          castka: 2000,
          fee: 0,
          material: 0,
          pomocnik: 0,
          palivo: 0,
          adresa: 'Beroun',
          typ: 'byt',
          doba_realizace: 1,
          poznamka: '',
          soubory: [],
          zisk: 2000,
          createdAt: new Date().toISOString()
        },
        {
          id: 15,
          datum: '15. 5. 2025',
          druh: 'Adam - Lenka',
          klient: '',
          cislo: 'ADM-007',
          castka: 2000,
          fee: 0,
          material: 0,
          pomocnik: 0,
          palivo: 0,
          adresa: 'Říčany',
          typ: 'dům',
          doba_realizace: 1,
          poznamka: '',
          soubory: [],
          zisk: 2000,
          createdAt: new Date().toISOString()
        },
        {
          id: 16,
          datum: '16. 5. 2025',
          druh: 'MVČ',
          klient: 'Tomáš Patria',
          cislo: 'MVČ-008',
          castka: 9000,
          fee: 1000,
          material: 0,
          pomocnik: 0,
          palivo: 0,
          adresa: 'V Dolině 1515/1c, Praha Michle',
          typ: 'byt',
          doba_realizace: 2,
          poznamka: '',
          soubory: [],
          zisk: 8000,
          createdAt: new Date().toISOString()
        },
        {
          id: 17,
          datum: '17. 5. 2025',
          druh: 'Adam - Martin',
          klient: '',
          cislo: 'ADM-008',
          castka: 11300,
          fee: 4000,
          material: 0,
          pomocnik: 0,
          palivo: 0,
          adresa: 'Tuchoměřice',
          typ: 'byt',
          doba_realizace: 2,
          poznamka: '',
          soubory: [],
          zisk: 7300,
          createdAt: new Date().toISOString()
        },
        {
          id: 18,
          datum: '20. 5. 2025',
          druh: 'Adam - Albert',
          klient: '',
          cislo: 'ADM-009',
          castka: 2800,
          fee: 0,
          material: 0,
          pomocnik: 0,
          palivo: 0,
          adresa: 'Praha Kamýk',
          typ: 'dveře',
          doba_realizace: 1,
          poznamka: '',
          soubory: [],
          zisk: 2800,
          createdAt: new Date().toISOString()
        },
        {
          id: 19,
          datum: '20. 5. 2025',
          druh: 'dohoz',
          klient: 'Josef Švejda',
          cislo: 'DOH-001',
          castka: 4000,
          fee: 0,
          material: 0,
          pomocnik: 0,
          palivo: 0,
          adresa: 'Ortenovo náměstí, Praha 7',
          typ: 'podlaha',
          doba_realizace: 1,
          poznamka: '',
          soubory: [],
          zisk: 4000,
          createdAt: new Date().toISOString()
        },
        {
          id: 20,
          datum: '22. 5. 2025',
          druh: 'Adam - Albert',
          klient: '',
          cislo: 'ADM-010',
          castka: 3500,
          fee: 0,
          material: 0,
          pomocnik: 0,
          palivo: 0,
          adresa: 'Všovice',
          typ: 'byt',
          doba_realizace: 1,
          poznamka: '',
          soubory: [],
          zisk: 3500,
          createdAt: new Date().toISOString()
        },
        {
          id: 21,
          datum: '23. 5. 2025',
          druh: 'Adam - Vincent',
          klient: '',
          cislo: 'ADM-011',
          castka: 8000,
          fee: 2000,
          material: 0,
          pomocnik: 0,
          palivo: 0,
          adresa: 'Říčany',
          typ: 'dům',
          doba_realizace: 3,
          poznamka: '',
          soubory: [],
          zisk: 6000,
          createdAt: new Date().toISOString()
        },
        {
          id: 22,
          datum: '26. 5. 2025',
          druh: 'Adam - Vincent',
          klient: '',
          cislo: 'ADM-012',
          castka: 4000,
          fee: 0,
          material: 0,
          pomocnik: 0,
          palivo: 0,
          adresa: 'Zbraslav',
          typ: 'dům',
          doba_realizace: 1,
          poznamka: '',
          soubory: [],
          zisk: 4000,
          createdAt: new Date().toISOString()
        },
        {
          id: 23,
          datum: '27. 5. 2025',
          druh: 'MVČ',
          klient: 'Hanzlík',
          cislo: 'MVČ-009',
          castka: 8000,
          fee: 0,
          material: 0,
          pomocnik: 0,
          palivo: 0,
          adresa: 'Praha Řepy',
          typ: 'byt',
          doba_realizace: 1,
          poznamka: '',
          soubory: [],
          zisk: 8000,
          createdAt: new Date().toISOString()
        },
        {
          id: 24,
          datum: '28. 5. 2025',
          druh: 'MVČ',
          klient: 'Kolínský - Mc Donalds',
          cislo: 'MVČ-010',
          castka: 6000,
          fee: 0,
          material: 0,
          pomocnik: 0,
          palivo: 0,
          adresa: 'Benátky na Jizerou',
          typ: 'provozovna',
          doba_realizace: 1,
          poznamka: '',
          soubory: [],
          zisk: 6000,
          createdAt: new Date().toISOString()
        }
      ];

      localStorage.setItem('paintpro_orders_admin_1', JSON.stringify(sampleOrders));
      console.log('✅ Ukázková data přidána pro administrátora:', sampleOrders.length, 'zakázek');
    } else {
      console.log('📊 Administrátor má existující data:', existingOrders.length, 'zakázek');
    }
  };

  // Přihlášení pomocí PIN
  const login = async (pin, userId = null) => {
    try {
      const users = JSON.parse(localStorage.getItem('paintpro_users') || '[]');
      const hashedPin = hashPin(pin);

      let user;
      if (userId) {
        // Pokud je zadáno userId, najdi konkrétního uživatele
        user = users.find(u => u.id === userId && u.pin === hashedPin);
      } else {
        // Jinak najdi podle PIN
        user = users.find(u => u.pin === hashedPin);
      }

      if (user) {
        // Odstraň plainPin po prvním přihlášení
        if (user.plainPin) {
          delete user.plainPin;
          const updatedUsers = users.map(u => u.id === user.id ? user : u);
          localStorage.setItem('paintpro_users', JSON.stringify(updatedUsers));
        }

        setCurrentUser(user);
        localStorage.setItem('paintpro_current_user', JSON.stringify(user));
        console.log('✅ Úspěšné přihlášení uživatele:', user.name);
        return { success: true };
      } else {
        console.log('❌ Neplatný PIN pro uživatele:', userId || 'neznámý');
        return { success: false, error: 'Neplatný PIN' };
      }
    } catch (error) {
      console.error('Chyba při přihlašování:', error);
      return { success: false, error: 'Chyba při přihlašování' };
    }
  };

  // Odhlášení
  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('paintpro_current_user');
  };

  // Funkce pro získání dat uživatele
  const getUserData = async (userId) => {
    try {
      console.log('🔄 AuthContext: Načítám data pro uživatele:', userId);
      
      // Nejdříve vynutit synchronizaci ze Supabase
      const supabaseData = await DataManager.forceSyncFromSupabase(userId);
      console.log('✅ Vynucená synchronizace dokončena:', supabaseData.length, 'zakázek');
      
      return supabaseData;
    } catch (error) {
      console.error('❌ Chyba při načítání dat:', error);
      // Fallback na normální načtení
      return await DataManager.getUserOrders(userId);
    }
  };

  // Funkce pro čištění duplicit
  const cleanDuplicates = async (userId) => {
    try {
      return await DataManager.cleanDuplicates(userId);
    } catch (error) {
      console.error('❌ Chyba při čištění duplicit:', error);
    }
  };

  // Funkce pro vynucenou synchronizaci ze Supabase
  const forceSyncFromSupabase = async (userId) => {
    try {
      console.log('🔄 Spouštím vynucenou synchronizaci ze Supabase...');
      return await DataManager.forceSyncFromSupabase(userId);
    } catch (error) {
      console.error('❌ Chyba při vynucené synchronizaci:', error);
      throw error;
    }
  };

  // Funkce pro přidání nového uživatele
  const addUser = async (userData) => {
    try {
      console.log('🆕 Vytvářím nový profil:', userData.name);

      const users = JSON.parse(localStorage.getItem('paintpro_users') || '[]');
      const newUser = {
        id: `user_${Date.now()}`,
        ...userData,
        createdAt: new Date().toISOString()
      };

      // Uložit lokálně
      users.push(newUser);
      localStorage.setItem('paintpro_users', JSON.stringify(users));
      console.log('✅ Profil uložen lokálně:', newUser.name);

      // Synchronizovat do Supabase
      if (supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('undefined')) {
        try {
          console.log('🔄 Synchronizuji profil do Supabase...');

          const { data, error } = await supabase
            .from('users')
            .insert([{
              id: newUser.id,
              name: newUser.name,
              avatar: newUser.avatar,
              color: newUser.color,
              pin_hash: newUser.pin,
              created_at: newUser.createdAt
            }])
            .select()
            .single();

          if (error) {
            console.error('❌ Chyba při ukládání do Supabase:', error.message);
            console.error('❌ Detaily chyby:', error);
            // Nepokračuj s chybou, profil je uložen lokálně
          } else {
            console.log('✅ Profil úspěšně uložen do Supabase:', data);
          }
        } catch (supabaseError) {
          console.error('❌ Supabase nedostupný při vytváření profilu:', supabaseError);
        }
      } else {
        console.warn('⚠️ Supabase není správně nakonfigurován');
      }

      return { success: true, user: newUser };
    } catch (error) {
      console.error('❌ Chyba při přidávání uživatele:', error);
      return { success: false, error: 'Chyba při přidávání uživatele' };
    }
  };

  // Funkce pro přidání nové zakázky
  const addUserOrder = async (userId, orderData) => {
    try {
      console.log('🔄 Přidávám novou zakázku pro uživatele:', userId);
      const savedOrder = await DataManager.saveUserOrder(userId, orderData);
      
      // Načti a vrať aktuální stav
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
      
      // Načti a vrať aktuální stav
      return await DataManager.getUserOrders(userId);
    } catch (error) {
      console.error('❌ Chyba při editaci zakázky:', error);
      throw error;
    }
  };

  // Smazání zakázky
  const deleteUserOrder = async (userId, orderId) => {
    try {
      const orders = JSON.parse(localStorage.getItem(`paintpro_orders_${userId}`) || '[]');
      const updatedOrders = orders.filter(order => order.id !== orderId);

      localStorage.setItem(`paintpro_orders_${userId}`, JSON.stringify(updatedOrders));
      return updatedOrders;
    } catch (error) {
      console.error('Chyba při mazání zakázky:', error);
      throw error;
    }
  };

  // Kontrola přihlášeného uživatele při načtení
  useEffect(() => {
    const checkCurrentUser = async () => {
      try {
        // Inicializace výchozího uživatele
        initializeDefaultUser();

        // Kontrola uloženého uživatele
        const savedUser = localStorage.getItem('paintpro_current_user');
        if (savedUser) {
          const user = JSON.parse(savedUser);
          setCurrentUser(user);

          // Pokud je to Lenka, přidej jí data přímo
          if (user.name === 'Lenka') {
            console.log('📊 Přidávám data pro Lenku...');
            const lenkaData = [
              { datum: 'Leden', cislo: '#14347', castka: 6700, material: 4851.3, pomocnik: 300, fee: 1000, druh: 'Adam', klient: '', adresa: '', typ: 'byt', doba_realizace: 1, poznamka: '', soubory: [] },
              { datum: 'Leden', cislo: '#14348', castka: 5750, material: 4249.25, pomocnik: 300, fee: 1000, druh: 'Adam - Vincent', klient: '', adresa: '', typ: 'byt', doba_realizace: 1, poznamka: '', soubory: [] },
              { datum: 'Únor', cislo: '#14181', castka: 6400, material: 4729.6, pomocnik: 300, fee: 400, druh: 'Adam', klient: '', adresa: '', typ: 'byt', doba_realizace: 1, poznamka: '', soubory: [] },
              { datum: 'Únor', cislo: '#14674', castka: 5800, material: 4286.2, pomocnik: 300, fee: 400, druh: 'Adam', klient: '', adresa: '', typ: 'byt', doba_realizace: 1, poznamka: '', soubory: [] },
              { datum: 'Duben', cislo: '#15457', castka: 8400, material: 6165.6, pomocnik: 500, fee: 1000, druh: 'Adam', klient: '', adresa: '', typ: 'byt', doba_realizace: 1, poznamka: '', soubory: [] },
              { datum: 'Duben', cislo: '#91913', castka: 10400, material: 7760.4, pomocnik: 200, fee: 1000, druh: 'Adam', klient: '', adresa: '', typ: 'byt', doba_realizace: 1, poznamka: '', soubory: [] },
              { datum: 'Duben', cislo: '#67703', castka: 10400, material: 7653.6, pomocnik: 500, fee: 1000, druh: 'Adam', klient: '', adresa: '', typ: 'byt', doba_realizace: 1, poznamka: '', soubory: [] },
              { datum: 'Duben', cislo: '#87637', castka: 17800, material: 13069.2, pomocnik: 300, fee: 700, druh: 'Adam', klient: '', adresa: '', typ: 'byt', doba_realizace: 1, poznamka: '', soubory: [] },
              { datum: 'Květen', cislo: '#95067', castka: 7600, material: 5578.4, pomocnik: 300, fee: 700, druh: 'Adam', klient: '', adresa: '', typ: 'byt', doba_realizace: 1, poznamka: '', soubory: [] },
              { datum: 'Květen', cislo: '#95105', castka: 11400, material: 8367.6, pomocnik: 300, fee: 700, druh: 'Adam', klient: '', adresa: '', typ: 'byt', doba_realizace: 1, poznamka: '', soubory: [] },
              { datum: 'Květen', cislo: '#87475', castka: 8100, material: 5945.4, pomocnik: 300, fee: 700, druh: 'Adam', klient: '', adresa: '', typ: 'byt', doba_realizace: 1, poznamka: '', soubory: [] },
              { datum: 'Květen', cislo: '#85333', castka: 24000, material: 17616, pomocnik: 0, fee: 0, druh: 'Adam', klient: '', adresa: '', typ: 'byt', doba_realizace: 1, poznamka: '', soubory: [] },
              { datum: 'Květen', cislo: '#104470', castka: 7200, material: 5284.8, pomocnik: 200, fee: 700, druh: 'Adam', klient: '', adresa: '', typ: 'byt', doba_realizace: 1, poznamka: '', soubory: [] },
              { datum: 'Květen', cislo: '#69268', castka: 27200, material: 19964.8, pomocnik: 700, fee: 2400, druh: 'Adam', klient: '', adresa: '', typ: 'byt', doba_realizace: 1, poznamka: '', soubory: [] },
              { datum: 'Květen', cislo: '#107239', castka: 3300, material: 2400.92, pomocnik: 0, fee: 0, druh: 'Adam', klient: '', adresa: '', typ: 'byt', doba_realizace: 1, poznamka: '', soubory: [] }
            ];

            for (const order of lenkaData) {
              const zisk = order.castka - (order.fee || 0) - order.material - order.pomocnik;
              const orderData = {
                ...order,
                id: Date.now() + Math.random(),
                palivo: 0,
                zisk: zisk,
                createdAt: new Date().toISOString()
              };
              
              try {
                await addUserOrder(user.id, orderData);
                console.log('✅ Přidána zakázka:', order.cislo);
              } catch (error) {
                console.error('❌ Chyba při přidávání:', order.cislo, error);
              }
            }
            console.log('✅ Data pro Lenku přidána');
          }
        }

        // Spusť synchronizaci profilů do Supabase
        console.log('🔄 Spouštím automatickou synchronizaci profilů...');
        const syncResult = await syncUsersToSupabase();
        if (syncResult.success) {
          console.log('✅ Profily synchronizovány:', syncResult.synced, 'úspěšných');
        }
      } catch (error) {
        console.error('Chyba při kontrole přihlášeného uživatele:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkCurrentUser();
  }, []);

  // Funkce pro změnu PINu
  const changePin = async (currentPinPlain, newPinPlain) => {
    try {
      // Ověř současný PIN
      const users = JSON.parse(localStorage.getItem('paintpro_users') || '[]');
      const hashedCurrentPin = hashPin(currentPinPlain);
      const user = users.find(u => u.id === currentUser.id && u.pin === hashedCurrentPin);

      if (!user) {
        return { success: false, error: 'Současný PIN je nesprávný' };
      }

      // Změň PIN
      const hashedNewPin = hashPin(newPinPlain);
      const userIndex = users.findIndex(u => u.id === currentUser.id);

      if (userIndex !== -1) {
        users[userIndex].pin = hashedNewPin;
        localStorage.setItem('paintpro_users', JSON.stringify(users));

        // Aktualizuj současného uživatele
        const updatedUser = { ...currentUser, pin: hashedNewPin };
        setCurrentUser(updatedUser);
        localStorage.setItem('paintpro_current_user', JSON.stringify(updatedUser));

        return { success: true };
      }

      return { success: false, error: 'Uživatel nenalezen' };
    } catch (error) {
      console.error('Chyba při změně PINu:', error);
      return { success: false, error: 'Chyba při změně PINu' };
    }
  };

  

  // Context hodnoty
  const value = {
    currentUser,
    isLoading,
    login,
    logout,
    getUserData,
    addUserOrder,
    editUserOrder,
    deleteUserOrder,
    changePin,
    cleanDuplicates,
    addUser,
    forceSyncFromSupabase
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// This line was added to trigger import immediately.
// importGoogleSheetsData();
export { AuthContext };
export default AuthProvider;