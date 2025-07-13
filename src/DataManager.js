
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://lseqrqmtjymukewnejdd.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzZXFycW10anltdWtld25lamRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyNjQ2MjcsImV4cCI6MjA2Nzg0MDYyN30.SgWjc-GETZ_D0tJNtErxXhUaH6z_MgRJtxc94RsUXPw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

class DataManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.syncQueue = [];
    this.setupEventListeners();
  }

  setupEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processSyncQueue();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  // HLAVNÍ METODA PRO NAČTENÍ DAT - OPRAVENO
  async getUserOrders(userId) {
    try {
      if (this.isOnline) {
        console.log('🔄 Načítám data ze Supabase pro uživatele:', userId);
        
        // 1. PRIMÁRNÍ: Načti ze Supabase
        const supabaseData = await this.loadFromSupabase(userId);
        console.log('📊 Supabase obsahuje:', supabaseData.length, 'zakázek');
        
        // 2. VŽDY přepsat localStorage daty ze Supabase
        console.log('💾 Přepisuji localStorage daty ze Supabase...');
        this.saveToLocalStorage(userId, supabaseData);
        
        // 3. Kontrola po uložení
        const verifyLocal = this.loadFromLocalStorage(userId);
        console.log('✅ Verifikace localStorage po uložení:', verifyLocal.length, 'zakázek');
        
        console.log('✅ Data načtena ze Supabase a uložena do localStorage');
        return supabaseData;
      } else {
        // 3. OFFLINE: Načti z localStorage
        const localData = this.loadFromLocalStorage(userId);
        console.log('📱 OFFLINE: Data načtena z localStorage:', localData.length, 'zakázek');
        return localData;
      }
    } catch (error) {
      console.error('❌ Chyba při načítání dat ze Supabase:', error);
      console.log('📱 Fallback na localStorage...');
      // FALLBACK: localStorage v případě chyby
      return this.loadFromLocalStorage(userId);
    }
  }

  // NOVÁ METODA PRO VYNUCENOU SYNCHRONIZACI
  async forceSyncFromSupabase(userId) {
    try {
      console.log('🔄 Vynucená synchronizace ze Supabase...');
      
      const supabaseData = await this.loadFromSupabase(userId);
      console.log('📊 Supabase má:', supabaseData.length, 'zakázek');
      
      // Přepsat localStorage kompletně
      this.saveToLocalStorage(userId, supabaseData);
      console.log('✅ localStorage přepsán daty ze Supabase');
      
      return supabaseData;
    } catch (error) {
      console.error('❌ Chyba při vynucené synchronizaci:', error);
      throw error;
    }
  }

  // HLAVNÍ METODA PRO ULOŽENÍ DAT
  async saveUserOrder(userId, orderData) {
    const newOrder = {
      ...orderData,
      id: Date.now() + Math.random(),
      createdAt: new Date().toISOString(),
      zisk: (orderData.castka || 0) - (orderData.fee || 0) - (orderData.material || 0) - (orderData.pomocnik || 0) - (orderData.palivo || 0)
    };

    try {
      if (this.isOnline) {
        // 1. PRIMÁRNÍ: Ulož do Supabase
        const savedOrder = await this.saveToSupabase(userId, newOrder);
        
        // 2. ZÁLOHA: Ulož do localStorage
        this.appendToLocalStorage(userId, savedOrder);
        
        console.log('✅ Zakázka uložena do Supabase + localStorage');
        return savedOrder;
      } else {
        // 3. OFFLINE: Ulož do localStorage + fronty
        this.appendToLocalStorage(userId, newOrder);
        this.addToSyncQueue('create', userId, newOrder);
        
        console.log('📱 OFFLINE: Zakázka uložena do localStorage + fronty');
        return newOrder;
      }
    } catch (error) {
      console.error('❌ Chyba při ukládání:', error);
      // FALLBACK: localStorage
      this.appendToLocalStorage(userId, newOrder);
      this.addToSyncQueue('create', userId, newOrder);
      return newOrder;
    }
  }

  // HLAVNÍ METODA PRO EDITACI DAT
  async updateUserOrder(userId, orderId, updatedData) {
    const orderData = {
      ...updatedData,
      zisk: (updatedData.castka || 0) - (updatedData.fee || 0) - (updatedData.material || 0) - (updatedData.pomocnik || 0) - (updatedData.palivo || 0)
    };

    try {
      if (this.isOnline) {
        // 1. PRIMÁRNÍ: Aktualizuj v Supabase
        await this.updateInSupabase(userId, orderId, orderData);
        
        // 2. ZÁLOHA: Aktualizuj v localStorage
        this.updateInLocalStorage(userId, orderId, orderData);
        
        console.log('✅ Zakázka aktualizována v Supabase + localStorage');
        return orderData;
      } else {
        // 3. OFFLINE: Aktualizuj v localStorage + frontě
        this.updateInLocalStorage(userId, orderId, orderData);
        this.addToSyncQueue('update', userId, { id: orderId, ...orderData });
        
        console.log('📱 OFFLINE: Zakázka aktualizována v localStorage + frontě');
        return orderData;
      }
    } catch (error) {
      console.error('❌ Chyba při aktualizaci:', error);
      // FALLBACK: localStorage
      this.updateInLocalStorage(userId, orderId, orderData);
      this.addToSyncQueue('update', userId, { id: orderId, ...orderData });
      return orderData;
    }
  }

  // POMOCNÉ METODY - SUPABASE
  async loadFromSupabase(userId) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async saveToSupabase(userId, orderData) {
    const { data, error } = await supabase
      .from('orders')
      .insert([{
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
        zisk: orderData.zisk
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateInSupabase(userId, orderId, orderData) {
    const { error } = await supabase
      .from('orders')
      .update({
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
        zisk: orderData.zisk
      })
      .eq('id', orderId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  // POMOCNÉ METODY - LOCALSTORAGE
  loadFromLocalStorage(userId) {
    const key = userId === 'admin_1' ? 'paintpro_orders_admin_1' : `paintpro_orders_${userId}`;
    const data = JSON.parse(localStorage.getItem(key) || '[]');
    console.log('📊 localStorage obsahuje pro', userId, ':', data.length, 'zakázek');
    return data;
  }

  saveToLocalStorage(userId, data) {
    const key = userId === 'admin_1' ? 'paintpro_orders_admin_1' : `paintpro_orders_${userId}`;
    console.log('💾 Ukládám do localStorage klíč:', key, 'počet zakázek:', data.length);
    localStorage.setItem(key, JSON.stringify(data));
    
    // Verifikace uložení
    const verification = JSON.parse(localStorage.getItem(key) || '[]');
    console.log('✅ Verifikace uložení - localStorage nyní obsahuje:', verification.length, 'zakázek');
  }

  appendToLocalStorage(userId, newOrder) {
    const currentData = this.loadFromLocalStorage(userId);
    currentData.unshift(newOrder);
    this.saveToLocalStorage(userId, currentData);
  }

  updateInLocalStorage(userId, orderId, updatedData) {
    const currentData = this.loadFromLocalStorage(userId);
    const index = currentData.findIndex(order => order.id == orderId);
    if (index !== -1) {
      currentData[index] = { ...currentData[index], ...updatedData };
      this.saveToLocalStorage(userId, currentData);
    }
  }

  // SYNC FRONTA PRO OFFLINE REŽIM
  addToSyncQueue(operation, userId, data) {
    this.syncQueue.push({
      operation,
      userId,
      data,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem('paintpro_sync_queue', JSON.stringify(this.syncQueue));
  }

  async processSyncQueue() {
    if (this.syncQueue.length === 0) return;

    console.log('🔄 Zpracovávám sync frontu:', this.syncQueue.length, 'položek');

    const processedItems = [];
    for (const item of this.syncQueue) {
      try {
        if (item.operation === 'create') {
          await this.saveToSupabase(item.userId, item.data);
        } else if (item.operation === 'update') {
          await this.updateInSupabase(item.userId, item.data.id, item.data);
        }
        processedItems.push(item);
        console.log('✅ Synchronizováno:', item.operation, item.data.cislo);
      } catch (error) {
        console.error('❌ Chyba při synchronizaci:', error);
        break; // Zastav při první chybě
      }
    }

    // Odstraň zpracované položky
    this.syncQueue = this.syncQueue.filter(item => !processedItems.includes(item));
    localStorage.setItem('paintpro_sync_queue', JSON.stringify(this.syncQueue));
  }

  // VYČIŠTĚNÍ DUPLICIT
  async cleanDuplicates(userId) {
    if (!this.isOnline) return;

    try {
      console.log('🧹 Čistím duplicity...');
      
      const allOrders = await this.loadFromSupabase(userId);
      const seen = new Set();
      const toDelete = [];

      allOrders.forEach(order => {
        const key = `${order.cislo}_${order.datum}_${order.klient}`;
        if (seen.has(key)) {
          toDelete.push(order.id);
        } else {
          seen.add(key);
        }
      });

      if (toDelete.length > 0) {
        const { error } = await supabase
          .from('orders')
          .delete()
          .in('id', toDelete);

        if (error) throw error;
        console.log('✅ Vymazáno', toDelete.length, 'duplicit');
        
        // Po vyčištění aktualizuj localStorage
        await this.forceSyncFromSupabase(userId);
      }
    } catch (error) {
      console.error('❌ Chyba při čištění duplicit:', error);
    }
  }
}

export default new DataManager();
