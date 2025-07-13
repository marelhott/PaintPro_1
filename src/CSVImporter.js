
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://lseqrqmtjymukewnejdd.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzZXFycW10anltdWtld25lamRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyNjQ2MjcsImV4cCI6MjA2Nzg0MDYyN30.SgWjc-GETZ_D0tJNtErxXhUaH6z_MgRJtxc94RsUXPw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

class CSVImporter {
  // Načtení a zpracování CSV dat
  async importFromCSV(csvContent) {
    try {
      console.log('🔄 Zpracovávám CSV data...');
      
      // Parsování CSV
      const lines = csvContent.trim().split('\n');
      const headers = lines[0].split(',');
      const data = [];

      for (let i = 1; i < lines.length; i++) {
        const values = this.parseCSVLine(lines[i]);
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });
        data.push(row);
      }

      console.log('📊 Nalezeno', data.length, 'zakázek v CSV');

      // Skupina podle user_id
      const userGroups = {};
      data.forEach(order => {
        const userId = order.user_id;
        if (!userGroups[userId]) {
          userGroups[userId] = [];
        }
        userGroups[userId].push(order);
      });

      console.log('👥 Skupiny uživatelů:', Object.keys(userGroups));
      Object.keys(userGroups).forEach(userId => {
        console.log(`📋 ${userId}: ${userGroups[userId].length} zakázek`);
      });

      // Import dat do Supabase
      let totalImported = 0;
      for (const [userId, orders] of Object.entries(userGroups)) {
        console.log(`🔄 Importuji data pro ${userId}...`);
        
        // Smaž existující data pro tohoto uživatele
        const { error: deleteError } = await supabase
          .from('orders')
          .delete()
          .eq('user_id', userId);

        if (deleteError) {
          console.error(`❌ Chyba při mazání dat pro ${userId}:`, deleteError);
          continue;
        }

        console.log(`🗑️ Smazána existující data pro ${userId}`);

        // Vložení nových dat
        const ordersToInsert = orders.map(order => ({
          user_id: order.user_id,
          datum: order.datum,
          druh: order.druh || '',
          klient: order.klient || '',
          cislo: order.cislo || '',
          castka: parseFloat(order.castka) || 0,
          fee: parseFloat(order.fee) || 0,
          material: parseFloat(order.material) || 0,
          pomocnik: parseFloat(order.pomocnik) || 0,
          palivo: parseFloat(order.palivo) || 0,
          adresa: order.adresa || '',
          typ: order.typ || 'byt',
          doba_realizace: parseInt(order.doba_realizace) || 1,
          poznamka: order.poznamka || '',
          soubory: order.soubory === '[]' ? [] : JSON.parse(order.soubory || '[]'),
          zisk: parseFloat(order.zisk) || 0
        }));

        const { data: insertedData, error: insertError } = await supabase
          .from('orders')
          .insert(ordersToInsert)
          .select();

        if (insertError) {
          console.error(`❌ Chyba při vkládání dat pro ${userId}:`, insertError);
          continue;
        }

        console.log(`✅ Vloženo ${insertedData.length} zakázek pro ${userId}`);
        totalImported += insertedData.length;

        // Aktualizuj localStorage pro tohoto uživatele
        this.updateLocalStorage(userId, insertedData);
      }

      console.log(`🎉 DOKONČENO: Celkem importováno ${totalImported} zakázek`);
      return {
        success: true,
        totalImported,
        userGroups: Object.keys(userGroups).map(userId => ({
          userId,
          count: userGroups[userId].length
        }))
      };

    } catch (error) {
      console.error('❌ Chyba při importu CSV:', error);
      return { success: false, error: error.message };
    }
  }

  // Parsování CSV řádku (respektuje uvozovky)
  parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  // Aktualizace localStorage
  updateLocalStorage(userId, data) {
    try {
      const key = userId === 'admin_1' ? 'paintpro_orders_admin_1' : `paintpro_orders_${userId}`;
      
      // Převod Supabase formátu na localStorage formát
      const localData = data.map(order => ({
        id: order.id,
        datum: order.datum,
        druh: order.druh,
        klient: order.klient,
        cislo: order.cislo,
        castka: order.castka,
        fee: order.fee,
        material: order.material,
        pomocnik: order.pomocnik,
        palivo: order.palivo,
        adresa: order.adresa,
        typ: order.typ,
        doba_realizace: order.doba_realizace,
        poznamka: order.poznamka,
        soubory: order.soubory,
        zisk: order.zisk,
        createdAt: order.created_at
      }));

      localStorage.setItem(key, JSON.stringify(localData));
      console.log(`💾 localStorage aktualizován pro ${userId}: ${localData.length} zakázek`);
    } catch (error) {
      console.error(`❌ Chyba při aktualizaci localStorage pro ${userId}:`, error);
    }
  }

  // Hlavní funkce pro import ze souboru
  async importFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const csvContent = e.target.result;
          const result = await this.importFromCSV(csvContent);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Chyba při čtení souboru'));
      reader.readAsText(file);
    });
  }

  // Import z přiloženého CSV obsahu
  async importFromAttachedCSV() {
    const csvContent = `id,user_id,datum,druh,klient,cislo,castka,fee,material,pomocnik,palivo,adresa,typ,doba_realizace,poznamka,soubory,zisk,created_at,updated_at
49,user_1,11. 4. 2025,MVČ,Gabriela Hajduchová,MVČ-001,10000.00,2000.00,0.00,0.00,0.00,"Letohradská, Praha 7",byt,2,,[],8000.00,2025-07-12 15:37:11.459928+00,2025-07-12 15:37:11.459928+00
50,user_1,14. 4. 2025,Adam - minutost,Tereza Pochobradská,ADM-001,14000.00,2000.00,0.00,0.00,0.00,"Cimburkova 9, Praha 3",byt,2,,[],12000.00,2025-07-12 15:37:11.459928+00,2025-07-12 15:37:11.459928+00
51,user_1,17. 4. 2025,MVČ,Katka Szczepaniková,MVČ-002,15000.00,2000.00,0.00,0.00,0.00,"Nad aleji 23, Praha 6",byt,2,,[],13000.00,2025-07-12 15:37:11.459928+00,2025-07-12 15:37:11.459928+00
52,user_1,18. 4. 2025,Adam - Albert,Jan Novák,ADM-002,3000.00,0.00,0.00,0.00,0.00,"U Průhonu, Praha 7",byt,1,,[],3000.00,2025-07-12 15:37:11.459928+00,2025-07-12 15:37:11.459928+00
53,user_1,21. 4. 2025,MVČ,Marek Rucki,MVČ-003,25000.00,4000.00,0.00,0.00,0.00,"Národní obrany 49, Praha 6",byt,2,,[],21000.00,2025-07-12 15:37:11.459928+00,2025-07-12 15:37:11.459928+00
54,user_1,26. 4. 2025,MVČ,Katka Szczepaniková,MVČ-004,10000.00,0.00,0.00,0.00,0.00,"Nad aleji 23, Praha 6",byt,2,dekor malba,[],10000.00,2025-07-12 15:37:11.459928+00,2025-07-12 15:37:11.459928+00
55,user_1,27. 4. 2025,poplavky,Augustin,POP-001,72000.00,20000.00,0.00,0.00,0.00,"Horní poluby, Křenov",pension,18,doplatek,[],52000.00,2025-07-12 15:37:11.459928+00,2025-07-12 15:37:11.459928+00
56,user_1,28. 4. 2025,MVČ,Zdeněk Fiedler,MVČ-005,24000.00,4000.00,0.00,0.00,0.00,"Pod jarovem 14, Praha 3",byt,3,,[],20000.00,2025-07-12 15:37:11.459928+00,2025-07-12 15:37:11.459928+00
57,user_1,2. 5. 2025,MVČ,Vojtěch Král,MVČ-006,15000.00,0.00,0.00,0.00,0.00,"Kaběšova 943/2, Praha 9",byt,2,,[],15000.00,2025-07-12 15:37:11.459928+00,2025-07-12 15:37:11.459928+00
58,user_1,5. 5. 2025,MVČ,Petr Dvořák,MVČ-007,30000.00,6000.00,0.00,0.00,0.00,"Za Mlýnem 1746, Hostivice",byt,2,,[],24000.00,2025-07-12 15:37:11.459928+00,2025-07-12 15:37:11.459928+00
59,user_1,7. 5. 2025,Adam - Albert,,ADM-003,4500.00,0.00,0.00,0.00,0.00,Beroun,dům,1,,[],4500.00,2025-07-12 15:37:11.459928+00,2025-07-12 15:37:11.459928+00
60,user_1,11. 5. 2025,Adam - Lenka,Andrej Vacík,ADM-004,17800.00,4000.00,0.00,0.00,0.00,"Na Pomezí 133/38, Praha 5",byt,2,,[],13800.00,2025-07-12 15:37:11.459928+00,2025-07-12 15:37:11.459928+00
61,user_1,13. 5. 2025,Adam - Lenka,,ADM-005,2000.00,0.00,0.00,0.00,0.00,,byt,1,,[],2000.00,2025-07-12 15:37:11.459928+00,2025-07-12 15:37:11.459928+00
62,user_1,14. 5. 2025,Adam - Lenka,,ADM-006,2000.00,0.00,0.00,0.00,0.00,Beroun,byt,1,,[],2000.00,2025-07-12 15:37:11.459928+00,2025-07-12 15:37:11.459928+00
63,user_1,15. 5. 2025,Adam - Lenka,,ADM-007,2000.00,0.00,0.00,0.00,0.00,Říčany,dům,1,,[],2000.00,2025-07-12 15:37:11.459928+00,2025-07-12 15:37:11.459928+00
64,user_1,16. 5. 2025,MVČ,Tomáš Patria,MVČ-008,9000.00,1000.00,0.00,0.00,0.00,"V Dolině 1515/1c, Praha Michle",byt,2,,[],8000.00,2025-07-12 15:37:11.459928+00,2025-07-12 15:37:11.459928+00
65,user_1,17. 5. 2025,Adam - Martin,,ADM-008,11300.00,4000.00,0.00,0.00,0.00,Tuchoměřice,byt,2,,[],7300.00,2025-07-12 15:37:11.459928+00,2025-07-12 15:37:11.459928+00
66,user_1,20. 5. 2025,Adam - Albert,,ADM-009,2800.00,0.00,0.00,0.00,0.00,Praha Kamýk,dveře,1,,[],2800.00,2025-07-12 15:37:11.459928+00,2025-07-12 15:37:11.459928+00
67,user_1,20. 5. 2025,dohoz,Josef Švejda,DOH-001,4000.00,0.00,0.00,0.00,0.00,"Ortenovo náměstí, Praha 7",podlaha,1,,[],4000.00,2025-07-12 15:37:11.459928+00,2025-07-12 15:37:11.459928+00
68,user_1,22. 5. 2025,Adam - Albert,,ADM-010,3500.00,0.00,0.00,0.00,0.00,Všovice,byt,1,,[],3500.00,2025-07-12 15:37:11.459928+00,2025-07-12 15:37:11.459928+00
69,user_1,23. 5. 2025,Adam - Vincent,,ADM-011,8000.00,2000.00,0.00,0.00,0.00,Říčany,dům,3,,[],6000.00,2025-07-12 15:37:11.459928+00,2025-07-12 15:37:11.459928+00
70,user_1,26. 5. 2025,Adam - Vincent,,ADM-012,4000.00,0.00,0.00,0.00,0.00,Zbraslav,dům,1,,[],4000.00,2025-07-12 15:37:11.459928+00,2025-07-12 15:37:11.459928+00
71,user_1,27. 5. 2025,MVČ,Hanzlík,MVČ-009,8000.00,0.00,0.00,0.00,0.00,Praha Řepy,byt,1,,[],8000.00,2025-07-12 15:37:11.459928+00,2025-07-12 15:37:11.459928+00
72,user_1,28. 5. 2025,MVČ,Kolínský - Mc Donalds,MVČ-010,6000.00,0.00,0.00,0.00,0.00,Benátky na Jizerou,provozovna,1,,[],6000.00,2025-07-12 15:37:11.459928+00,2025-07-12 15:37:11.459928+00`;

    return await this.importFromCSV(csvContent);
  }
}

export default new CSVImporter();
