
const { createClient } = require('@supabase/supabase-js');

// Připoj se k Supabase
const supabase = createClient(
  'https://lseqrqmtjymukewnejdd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzZXFycW10anltdWtld25lamRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyNjQ2MjcsImV4cCI6MjA2Nzg0MDYyN30.SgWjc-GETZ_D0tJNtErxXhUaH6z_MgRJtxc94RsUXPw'
);

// Kompletní mapování všech hodnot podle fotky - seřazeno podle data od nejnovějších
const completeMapping = [
  { datum: '5.7.2025', cislo: '#107239', castka: 3300, palivo: 300, material: 1000, pomocnik: 2000 },
  { datum: '16.6.2025', cislo: '#88368', castka: 27200, palivo: 700, material: 2400, pomocnik: 7000 },
  { datum: '9.6.2025', cislo: '#104470', castka: 7200, palivo: 200, material: 700, pomocnik: 2000 },
  { datum: '11.5.2025', cislo: '#95333', castka: 24000, palivo: 300, material: 700, pomocnik: 2000 },
  { datum: '13.5.2025', cislo: '#67475', castka: 8100, palivo: 300, material: 700, pomocnik: 2000 },
  { datum: '15.5.2025', cislo: '#95105', castka: 11400, palivo: 300, material: 700, pomocnik: 2000 },
  { datum: '14.5.2025', cislo: '#95067', castka: 7500, palivo: 300, material: 700, pomocnik: 2000 },
  { datum: '22.4.2025', cislo: '#82187', castka: 17800, palivo: 300, material: 700, pomocnik: 0 },
  { datum: '24.4.2025', cislo: '#67703', castka: 10400, palivo: 500, material: 1000, pomocnik: 2000 },
  { datum: '24.4.2025', cislo: '#82187', castka: 17800, palivo: 300, material: 700, pomocnik: 0 },
  { datum: '16.4.2025', cislo: '#15457', castka: 8400, palivo: 500, material: 1000, pomocnik: 1000 },
  { datum: 'Duben', cislo: '#81913', castka: 10500, palivo: 200, material: 1000, pomocnik: 2500 },
  { datum: '25.2.2025', cislo: '#14674', castka: 5800, palivo: 300, material: 400, pomocnik: 0 },
  { datum: '23.2.2025', cislo: '#14181', castka: 6400, palivo: 300, material: 400, pomocnik: 0 },
  { datum: '15.3.2025', cislo: 'zakázka Vincent', castka: 5750, palivo: 300, material: 1000, pomocnik: 0 },
  { datum: '27.1.2025', cislo: '#14347', castka: 6700, palivo: 300, material: 1000, pomocnik: 0 }
];

async function updateAllValues() {
  try {
    console.log('🔍 Kompletní aktualizace všech hodnot podle fotky...');
    console.log('📅 Řazení: od nejnovějších (červenec 2025) po nejstarší (leden 2025)');
    
    let updatedCount = 0;
    let notFoundCount = 0;
    
    for (const mapping of completeMapping) {
      // Najdi zakázku podle čísla nebo částky
      let { data: existing, error: findError } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', 'lenka')
        .eq('cislo', mapping.cislo)
        .single();
        
      if (findError && findError.code === 'PGRST116') {
        // Pokud nenajdeme podle čísla, zkus podle částky
        console.log(`⚠️  Nenalezeno číslo ${mapping.cislo}, hledám podle částky ${mapping.castka}...`);
        
        const { data: byAmount } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', 'lenka')
          .eq('castka', mapping.castka)
          .single();
          
        if (byAmount) {
          console.log(`🔄 Nalezeno podle částky: ${byAmount.cislo} (${byAmount.castka} Kč)`);
          existing = byAmount;
        } else {
          console.error(`❌ Nenalezena zakázka: ${mapping.cislo} (${mapping.castka} Kč)`);
          notFoundCount++;
          continue;
        }
      }

      if (existing) {
        // Spočítej fee (26,1% z tržby) a fee_off
        const fee = Math.round(mapping.castka * 0.261);
        const fee_off = mapping.castka - fee;
        const zisk = fee_off - mapping.palivo - mapping.material - mapping.pomocnik;

        console.log(`🔄 Aktualizuji: ${existing.cislo}`);
        console.log(`   📊 Tržba: ${mapping.castka} Kč`);
        console.log(`   💰 Fee (26,1%): ${fee} Kč`);
        console.log(`   💵 Fee OFF: ${fee_off} Kč`);
        console.log(`   ⛽ Palivo: ${mapping.palivo} Kč`);
        console.log(`   🔧 Materiál: ${mapping.material} Kč`);
        console.log(`   👷 Pomocník: ${mapping.pomocnik} Kč`);
        console.log(`   💚 Čistý zisk: ${zisk} Kč`);
        
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            datum: mapping.datum,
            cislo: mapping.cislo,
            castka: mapping.castka,
            fee: fee,
            fee_off: fee_off,
            palivo: mapping.palivo,
            material: mapping.material,
            pomocnik: mapping.pomocnik,
            zisk: zisk,
            doba_realizace: 1 // výchozí hodnota
          })
          .eq('id', existing.id);
          
        if (updateError) {
          console.error(`❌ Chyba při aktualizaci ${existing.cislo}:`, updateError);
        } else {
          console.log(`✅ ${existing.cislo} úspěšně aktualizováno`);
          updatedCount++;
        }
      }

      // Krátká pauza mezi operacemi
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\n📊 SHRNUTÍ:`);
    console.log(`✅ Úspěšně aktualizováno: ${updatedCount} zakázek`);
    console.log(`❌ Nenalezeno: ${notFoundCount} zakázek`);
    console.log(`📋 Celkem zpracováno: ${completeMapping.length} položek`);
    
    // Ověř výsledky
    console.log('\n🔍 Kontrola výsledků:');
    const { data: allOrders } = await supabase
      .from('orders')
      .select('cislo, datum, castka, fee, fee_off, palivo, material, pomocnik, zisk')
      .eq('user_id', 'lenka')
      .order('datum', { ascending: false });
      
    if (allOrders) {
      console.log('\n📋 Aktuální stav zakázek (seřazeno podle data):');
      allOrders.forEach(order => {
        console.log(`${order.cislo}: ${order.datum} | Tržba: ${order.castka} | Fee: ${order.fee} | Fee OFF: ${order.fee_off} | Zisk: ${order.zisk}`);
      });
    }

  } catch (error) {
    console.error('❌ Chyba při aktualizaci:', error);
  }
}

// Spusť aktualizaci
updateAllValues();
