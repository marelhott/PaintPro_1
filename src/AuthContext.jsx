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
    const users = JSON.parse(localStorage.getItem('paintpro_users') || '[]');
    if (users.length === 0) {
      // Administrátor s PIN 123456
      const adminPin = '123456';
      const adminUser = {
        id: 'admin_1',
        name: 'Administrátor',
        avatar: 'AD',
        color: '#8b5cf6',
        pin: hashPin(adminPin),
        isAdmin: true,
        createdAt: new Date().toISOString()
      };
      localStorage.setItem('paintpro_users', JSON.stringify([adminUser]));

      console.log('🔐 Administrátor vytvořen s PIN: 123456');
    }

    // OPRAVA: Vždy zkontroluj a přidej ukázková data, pokud nejsou
    const existingOrders = JSON.parse(localStorage.getItem('paintpro_orders_user_1') || '[]');
    if (existingOrders.length === 0) {
      console.log('🔧 Přidávám ukázková data...');

      // Přidání ukázkových zakázek pro výchozího uživatele
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

      localStorage.setItem('paintpro_orders_user_1', JSON.stringify(sampleOrders));
      console.log('✅ Ukázková data přidána:', sampleOrders.length, 'zakázek');
    } else {
      console.log('📊 Existující data:', existingOrders.length, 'zakázek');
    }
  };

  // Přihlášení pomocí PIN
  const login = async (pin) => {
    try {
      const users = JSON.parse(localStorage.getItem('paintpro_users') || '[]');
      const hashedPin = hashPin(pin);
      const user = users.find(u => u.pin === hashedPin);

      if (user) {
        // Odstraň plainPin po prvním přihlášení
        if (user.plainPin) {
          delete user.plainPin;
          const updatedUsers = users.map(u => u.id === user.id ? user : u);
          localStorage.setItem('paintpro_users', JSON.stringify(updatedUsers));
        }

        setCurrentUser(user);
        localStorage.setItem('paintpro_current_user', JSON.stringify(user));
        return { success: true };
      } else {
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
      // Nejprve načti z localStorage
      const localOrders = JSON.parse(localStorage.getItem(`paintpro_orders_${userId}`) || '[]');
      console.log('📊 localStorage obsahuje:', localOrders.length, 'zakázek');

      // Pokud máme Supabase nastavený, zkus synchronizaci
      if (supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('undefined')) {
        try {
          // Zkontroluj, kolik dat je v Supabase
          const { data: supabaseData, error } = await supabase
            .from('orders')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

          const supabaseCount = supabaseData?.length || 0;
          console.log('📊 Supabase obsahuje:', supabaseCount, 'zakázek');

          // Pokud localStorage má více dat než Supabase, synchronizuj
          if (localOrders.length > supabaseCount) {
            console.log('🔄 Spouštím synchronizaci:', localOrders.length, 'localStorage →', supabaseCount, 'Supabase');
            await syncLocalToSupabase(userId, localOrders);
            console.log('✅ Synchronizace dokončena');
          }

          // Vrať data z localStorage (jako primary source)
          if (localOrders.length > 0) {
            console.log('✅ Data načtena z localStorage pro uživatele:', userId);
            return localOrders;
          }

          // Pokud localStorage je prázdný, ale Supabase má data, vrať Supabase data
          if (supabaseData && supabaseData.length > 0) {
            console.log('✅ Data načtena ze Supabase pro uživatele:', userId);
            return supabaseData;
          }

        } catch (supabaseError) {
          console.warn('⚠️ Supabase chyba při synchronizaci:', supabaseError.message);
          
          // Fallback na localStorage (už je deklarovaný nahoře)
          if (localOrders.length > 0) {
            console.log('✅ Data načtena z localStorage (fallback) pro uživatele:', userId, 'počet zakázek:', localOrders.length);
            return localOrders;
          }
        }
      }

      // Pokud localStorage má data, vrať je
      if (localOrders.length > 0) {
        console.log('✅ Data načtena z localStorage pro uživatele:', userId, 'počet zakázek:', localOrders.length);
        return localOrders;
      }

      console.log('📊 Žádná data nenalezena pro uživatele:', userId);
      return [];
    } catch (error) {
      console.error('❌ Chyba při načítání dat uživatele:', error);
      return [];
    }
  };

  // Funkce pro synchronizaci localStorage dat do Supabase
  const syncLocalToSupabase = async (userId, localOrders) => {
    try {
      console.log('🔄 Začínám synchronizaci:', localOrders.length, 'zakázek');
      console.log('🔍 Supabase URL:', supabaseUrl);
      console.log('🔍 Supabase Key exists:', !!supabaseAnonKey);

      // Test připojení k Supabase
      try {
        const { data: testData, error: testError } = await supabase
          .from('orders')
          .select('count', { count: 'exact' })
          .eq('user_id', userId);

        console.log('🔍 Test připojení - současný počet zakázek v Supabase:', testData);
        if (testError) {
          console.error('❌ Chyba při testu připojení:', testError);
        }
      } catch (testErr) {
        console.error('❌ Kritická chyba připojení:', testErr);
        return;
      }

      // Nejprve vytvoř uživatele pokud neexistuje
      const { error: userError } = await supabase
        .from('users')
        .upsert([{
          id: userId,
          name: currentUser?.name || 'Dušan',
          avatar: currentUser?.avatar || 'DU',
          color: currentUser?.color || '#6366f1',
          pin_hash: currentUser?.pin || 'temp'
        }]);

      if (userError) {
        console.warn('⚠️ Uživatel již existuje nebo chyba:', userError.message);
      } else {
        console.log('✅ Uživatel vytvořen/aktualizován');
      }

      // Pak synchronizuj zakázky
      const ordersToSync = localOrders.map(order => ({
        user_id: userId,
        datum: order.datum,
        druh: order.druh,
        klient: order.klient || '',
        cislo: order.cislo,
        castka: order.castka || 0,
        fee: order.fee || 0,
        material: order.material || 0,
        pomocnik: order.pomocnik || 0,
        palivo: order.palivo || 0,
        adresa: order.adresa || '',
        typ: order.typ || 'byt',
        doba_realizace: order.doba_realizace || 1,
        poznamka: order.poznamka || '',
        soubory: order.soubory || [],
        zisk: order.zisk || 0
      }));

      console.log('📝 Synchronizuji', ordersToSync.length, 'zakázek do Supabase...');

      console.log('📝 Pripravuji', ordersToSync.length, 'zakázek k synchronizaci...');
      console.log('📝 Ukázka dat k synchronizaci:', ordersToSync.slice(0, 2));

      const { data, error } = await supabase
        .from('orders')
        .insert(ordersToSync)
        .select();

      if (error) {
        console.error('❌ Chyba při synchronizaci do Supabase:', error.message);
        console.error('❌ Detaily chyby:', error);
        console.error('❌ Ukázkové data které selhaly:', ordersToSync.slice(0, 1));
      } else {
        console.log('✅ Synchronizace úspěšně dokončena!');
        console.log('✅ Vloženo', data?.length || 0, 'zakázek do Supabase');
        console.log('✅ Ukázka vložených dat:', data?.slice(0, 2));
        
        // Ověření - zkontroluj že data jsou skutečně v DB
        try {
          const { data: verifyData, error: verifyError } = await supabase
            .from('orders')
            .select('count', { count: 'exact' })
            .eq('user_id', userId);
          
          console.log('🔍 Ověření po synchronizaci - počet zakázek v DB:', verifyData);
        } catch (verifyErr) {
          console.warn('⚠️ Chyba při ověření:', verifyErr);
        }
      }

    } catch (error) {
      console.error('❌ Kritická chyba při synchronizaci:', error);
    }
  };

  // Funkce pro přidání nové zakázky
  const addUserOrder = async (userId, orderData) => {
    try {
      // Pokusit se uložit do Supabase
      try {
        const { data, error } = await supabase
          .from('orders')
          .insert([{
            user_id: userId,
            ...orderData,
            created_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (error) throw error;

        console.log('✅ Zakázka uložena do Supabase:', data);
        return data;
      } catch (supabaseError) {
        console.warn('⚠️ Supabase nedostupný, ukládám lokálně:', supabaseError);

        // Fallback na localStorage
        const users = JSON.parse(localStorage.getItem('paintpro_users') || '[]');
        const userIndex = users.findIndex(u => u.id === userId);

        if (userIndex !== -1) {
          const newOrder = {
            ...orderData,
            id: Date.now(),
            createdAt: new Date().toISOString()
          };

          users[userIndex].orders.push(newOrder);
          localStorage.setItem('paintpro_users', JSON.stringify(users));
          return newOrder;
        }

        throw new Error('Uživatel nenalezen');
      }
    } catch (error) {
      console.error('❌ Chyba při přidávání zakázky:', error);
      throw error;
    }
  };

  // Funkce pro editaci zakázky
  const editUserOrder = async (userId, orderId, updatedData) => {
    try {
      // Pokusit se aktualizovat v Supabase
      try {
        const { data, error } = await supabase
          .from('orders')
          .update(updatedData)
          .eq('id', orderId)
          .eq('user_id', userId)
          .select()
          .single();

        if (error) throw error;

        console.log('✅ Zakázka aktualizována v Supabase:', data);
        return data;
      } catch (supabaseError) {
        console.warn('⚠️ Supabase nedostupný, aktualizuji lokálně:', supabaseError);

        // Fallback na localStorage
        const users = JSON.parse(localStorage.getItem('paintpro_users') || '[]');
        const userIndex = users.findIndex(u => u.id === userId);

        if (userIndex !== -1) {
          const orderIndex = users[userIndex].orders.findIndex(o => o.id === orderId);
          if (orderIndex !== -1) {
            users[userIndex].orders[orderIndex] = {
              ...users[userIndex].orders[orderIndex],
              ...updatedData
            };
            localStorage.setItem('paintpro_users', JSON.stringify(users));
            return users[userIndex].orders[orderIndex];
          }
        }

        throw new Error('Zakázka nenalezena');
      }
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
    const checkCurrentUser = () => {
      try {
        // Inicializace výchozího uživatele
        initializeDefaultUser();

        // Kontrola uloženého uživatele
        const savedUser = localStorage.getItem('paintpro_current_user');
        if (savedUser) {
          const user = JSON.parse(savedUser);
          setCurrentUser(user);
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
    syncLocalToSupabase // Exportujeme pro manuální použití
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };
export default AuthProvider;