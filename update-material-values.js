
import { createClient } from '@supabase/supabase-js';

// Připoj se k Supabase
const supabase = createClient(
  'https://lseqrqmtjymukewnejdd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzZXFycW10anltdWtld25lamRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyNjQ2MjcsImV4cCI6MjA2Nzg0MDYyN30.SgWjc-GETZ_D0tJNtErxXhUaH6z_MgRJtxc94RsUXPw'
);

// Mapování hodnot materiálu podle fotky
const materialMapping = [
  { cislo: '#14347', material: 300 },
  { cislo: 'zakázka Vincent', material: 300 },
  { cislo: '#14181', material: 300 },
  { cislo: '#14674', material: 300 },
  { cislo: '#15457', material: 500 },
  { cislo: '#81913', material: 200 },
  { cislo: '#67703', material: 500 },
  { cislo: '#82187', material: 300 },
  { cislo: '#95067', material: 300 },
  { cislo: '#95105', material: 300 },
  { cislo: '#67475', material: 300 },
  { cislo: '#95333', material: 0 },
  { cislo: '#104470', material: 200 },
  { cislo: '#68088', material: 700 },
  { cislo: '#107239', material: 0 }
];

async function updateMaterialValues() {
  try {
    console.log('🔍 Aktualizuji hodnoty materiálu...');
    
    let updatedCount = 0;
    
    for (const mapping of materialMapping) {
      const { error } = await supabase
        .from('orders')
        .update({ material: mapping.material })
        .eq('user_id', 'lenka')
        .eq('cislo', mapping.cislo);
        
      if (error) {
        console.error(`❌ Chyba při aktualizaci ${mapping.cislo}:`, error);
      } else {
        console.log(`✅ ${mapping.cislo} -> materiál: ${mapping.material} Kč`);
        updatedCount++;
      }
    }
    
    console.log(`\n📊 Celkem aktualizováno: ${updatedCount} hodnot materiálu`);
    
  } catch (error) {
    console.error('❌ Chyba při aktualizaci:', error);
  }
}

// Spusť aktualizaci
updateMaterialValues();
