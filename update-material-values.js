
import { createClient } from '@supabase/supabase-js';

// Připoj se k Supabase
const supabase = createClient(
  'https://lseqrqmtjymukewnejdd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzZXFycW10anltdWtld25lamRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyNjQ2MjcsImV4cCI6MjA2Nzg0MDYyN30.SgWjc-GETZ_D0tJNtErxXhUaH6z_MgRJtxc94RsUXPw'
);

// Kompletní mapování všech hodnot podle fotky
const completeMapping = [
  // Leden
  { cislo: '#14347', datum: '27.1.2025', castka: 6700, fee: 4951.3, material: 300, pomocnik: 1000, brigadnik: 0 },
  { cislo: 'zakázka Vincent', datum: '15.3.2025', castka: 5750, fee: 4249.25, material: 300, pomocnik: 1000, brigadnik: 0 },
  
  // Únor  
  { cislo: '#14181', datum: '23.2.2025', castka: 6400, fee: 4729.6, material: 300, pomocnik: 400, brigadnik: 0 },
  { cislo: '#14674', datum: '25.2.2025', castka: 5800, fee: 4286.2, material: 300, pomocnik: 400, brigadnik: 0 },
  
  // Duben
  { cislo: '#15457', datum: '16.4.2025', castka: 8400, fee: 6165.6, material: 500, pomocnik: 1000, brigadnik: 1000 },
  { cislo: '#81913', datum: '19.4.2025', castka: 10500, fee: 7760.4, material: 200, pomocnik: 1000, brigadnik: 2500 },
  { cislo: '#67703', datum: '24.4.2025', castka: 10400, fee: 7653.6, material: 500, pomocnik: 1000, brigadnik: 2000 },
  { cislo: '#82187', datum: '22.4.2025', castka: 17800, fee: 13065.2, material: 300, pomocnik: 700, brigadnik: 0 },
  
  // Květen
  { cislo: '#95067', datum: '14.5.2025', castka: 7600, fee: 5578.4, material: 300, pomocnik: 700, brigadnik: 2000 },
  { cislo: '#95105', datum: '15.5.2025', castka: 11400, fee: 8367.6, material: 300, pomocnik: 700, brigadnik: 2000 },
  { cislo: '#67475', datum: '13.5.2025', castka: 8100, fee: 5945.4, material: 300, pomocnik: 700, brigadnik: 2000 },
  { cislo: '#95333', datum: '11.5.2025', castka: 24000, fee: 17616, material: 0, pomocnik: 2400, brigadnik: 0 },
  { cislo: '#104470', datum: '9.6.2025', castka: 7200, fee: 5284.8, material: 200, pomocnik: 700, brigadnik: 2000 },
  { cislo: '#68088', datum: '16.6.2025', castka: 27200, fee: 19964.8, material: 700, pomocnik: 2400, brigadnik: 7000 },
  { cislo: '#107239', datum: '5.7.2025', castka: 3380, fee: 2480.92, material: 0, pomocnik: 0, brigadnik: 0 }
];

async function updateAllValues() {
  try {
    console.log('🔍 Kompletní aktualizace všech hodnot podle fotky...');
    
    let updatedCount = 0;
    let notFoundCount = 0;
    
    for (const mapping of completeMapping) {
      // Nejdříve zkusíme najít podle přesného čísla
      let { data: existing, error: findError } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', 'lenka')
        .eq('cislo', mapping.cislo)
        .single();
        
      if (findError && findError.code === 'PGRST116') {
        // Pokud nenajdeme přesně, zkusíme najít podobné číslo
        console.log(`⚠️  Nenalezeno přesné číslo ${mapping.cislo}, hledám podobné...`);
        
        const { data: similarOrders } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', 'lenka');
          
        // Hledáme podobná čísla (například #81913 vs #91913)
        const similar = similarOrders?.find(order => {
          const orderNum = order.cislo.replace('#', '');
          const mappingNum = mapping.cislo.replace('#', '');
          return orderNum.slice(-4) === mappingNum.slice(-4); // Porovnání posledních 4 číslic
        });
        
        if (similar) {
          console.log(`🔄 Nalezeno podobné: ${similar.cislo} -> aktualizuji na ${mapping.cislo}`);
          existing = similar;
        } else {
          console.log(`❌ Nenalezeno žádné podobné číslo pro ${mapping.cislo}`);
          notFoundCount++;
          continue;
        }
      }
      
      if (existing) {
        // Aktualizujeme všechny hodnoty
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            cislo: mapping.cislo,
            datum: mapping.datum,
            castka: mapping.castka,
            fee: mapping.fee,
            material: mapping.material,
            pomocnik: mapping.pomocnik,
            // Brigadnik zatím neaktualizujeme, pokud není v databázi
          })
          .eq('id', existing.id);
          
        if (updateError) {
          console.error(`❌ Chyba při aktualizaci ${mapping.cislo}:`, updateError);
        } else {
          console.log(`✅ ${mapping.cislo} -> Tržba: ${mapping.castka}, Fee: ${mapping.fee}, Materiál: ${mapping.material}, Pomocník: ${mapping.pomocnik}`);
          updatedCount++;
        }
      }
    }
    
    console.log(`\n📊 Celkem aktualizováno: ${updatedCount} zakázek`);
    console.log(`❌ Nenalezeno: ${notFoundCount} zakázek`);
    
    // Kontrola finálního stavu
    console.log('\n🔍 Finální kontrola...');
    const { data: finalOrders } = await supabase
      .from('orders')
      .select('cislo, castka, fee, material, pomocnik')
      .eq('user_id', 'lenka')
      .order('cislo');
      
    finalOrders?.forEach(order => {
      console.log(`${order.cislo}: Tržba: ${order.castka}, Fee: ${order.fee}, Materiál: ${order.material}, Pomocník: ${order.pomocnik}`);
    });
    
  } catch (error) {
    console.error('❌ Chyba při aktualizaci:', error);
  }
}

// Spusť aktualizaci
updateAllValues();
