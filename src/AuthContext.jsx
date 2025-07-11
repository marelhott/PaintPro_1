
import React, { createContext, useContext, useState, useEffect } from 'react';

// Vytvoření AuthContext
const AuthContext = createContext();

// Export AuthContext pro přímé použití
export { AuthContext };

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

  // Inicializace výchozího uživatele
  const initializeDefaultUser = () => {
    const users = JSON.parse(localStorage.getItem('paintpro_users') || '[]');
    if (users.length === 0) {
      const defaultUser = {
        id: 'user_1',
        name: 'Dušan',
        avatar: 'DU',
        color: '#6366f1',
        pin: '1234',
        createdAt: new Date().toISOString()
      };
      localStorage.setItem('paintpro_users', JSON.stringify([defaultUser]));
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
      const user = users.find(u => u.pin === pin);
      
      if (user) {
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

  // Získání dat uživatele (zakázky)
  const getUserData = async (userId) => {
    try {
      const orders = JSON.parse(localStorage.getItem(`paintpro_orders_${userId}`) || '[]');
      return orders;
    } catch (error) {
      console.error('Chyba při načítání dat:', error);
      return [];
    }
  };

  // Přidání nové zakázky
  const addUserOrder = async (userId, orderData) => {
    try {
      const orders = JSON.parse(localStorage.getItem(`paintpro_orders_${userId}`) || '[]');
      
      // Vytvoření nové zakázky s vypočítaným ziskem
      const newOrder = {
        ...orderData,
        id: Date.now(),
        zisk: calculateProfit(orderData),
        createdAt: new Date().toISOString()
      };
      
      const updatedOrders = [...orders, newOrder];
      localStorage.setItem(`paintpro_orders_${userId}`, JSON.stringify(updatedOrders));
      
      return updatedOrders;
    } catch (error) {
      console.error('Chyba při přidávání zakázky:', error);
      throw error;
    }
  };

  // Úprava zakázky
  const editUserOrder = async (userId, orderId, updatedData) => {
    try {
      const orders = JSON.parse(localStorage.getItem(`paintpro_orders_${userId}`) || '[]');
      
      const updatedOrders = orders.map(order => {
        if (order.id === orderId) {
          const updatedOrder = {
            ...order,
            ...updatedData,
            zisk: calculateProfit(updatedData),
            updatedAt: new Date().toISOString()
          };
          return updatedOrder;
        }
        return order;
      });
      
      localStorage.setItem(`paintpro_orders_${userId}`, JSON.stringify(updatedOrders));
      return updatedOrders;
    } catch (error) {
      console.error('Chyba při úpravě zakázky:', error);
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

  // Context hodnoty
  const value = {
    currentUser,
    isLoading,
    login,
    logout,
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

export default AuthContext;
