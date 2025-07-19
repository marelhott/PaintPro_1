
import { useMemo } from 'react';
import { filterMainOrdersOnly } from '../utils/dataFilters';

export const useZakazkyStatistics = (zakazkyData, workCategories) => {
  // Stabilní hash pro data
  const stableDataHash = useMemo(() => {
    const filtered = Array.isArray(zakazkyData) ? zakazkyData : [];
    const dataHash = filtered.map(z => `${z.id}-${z.datum}-${z.castka}-${z.zisk}-${z.druh}`).join('|');
    const categoriesHash = (workCategories || []).map(c => `${c.name}-${c.color}`).join('|');
    return `${dataHash}::${categoriesHash}`;
  }, [zakazkyData, workCategories]);

  // OPRAVENO: Dashboard data - plně memoizováno s hash kontrolou
  const dashboardData = useMemo(() => {
    const safeZakazkyData = Array.isArray(zakazkyData) ? zakazkyData : [];
    const mainOrdersOnly = filterMainOrdersOnly(safeZakazkyData);
    const safeWorkCategories = Array.isArray(workCategories) ? workCategories : [];

    const celkoveTrzby = mainOrdersOnly.reduce((sum, z) => sum + z.castka, 0);
    const celkovyZisk = mainOrdersOnly.reduce((sum, z) => sum + z.zisk, 0);
    const pocetZakazek = mainOrdersOnly.length;
    const prumernyZisk = pocetZakazek > 0 ? Math.round(celkovyZisk / pocetZakazek) : 0;

    // Kategorie statistiky
    const categoryStats = {};
    const availableCategories = safeWorkCategories.map(cat => cat.name) || [];

    availableCategories.forEach(category => {
      categoryStats[category] = 0;
    });

    mainOrdersOnly.forEach(zakazka => {
      if (categoryStats.hasOwnProperty(zakazka.druh)) {
        categoryStats[zakazka.druh] += zakazka.zisk;
      } else {
        categoryStats[zakazka.druh] = zakazka.zisk;
      }
    });

    // Měsíční data
    const monthlyDataMap = {};
    mainOrdersOnly.forEach(zakazka => {
      let parsedDate, month, year;
      
      if (zakazka.datum.includes('.')) {
        const cleanDatum = zakazka.datum.replace(/\s+/g, '');
        const dateParts = cleanDatum.split('.');
        
        if (dateParts.length >= 3) {
          const day = parseInt(dateParts[0]) || 1;
          month = parseInt(dateParts[1]) - 1;
          year = parseInt(dateParts[2]) || 2025;
          parsedDate = new Date(year, month, day);
        } else if (dateParts.length === 2) {
          const day = 1;
          month = parseInt(dateParts[0]) - 1;
          year = parseInt(dateParts[1]) || 2025;
          parsedDate = new Date(year, month, day);
        } else {
          month = 0;
          year = 2025;
          parsedDate = new Date(year, month, 1);
        }
      } else {
        const monthNames = ['Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen', 'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'];
        month = monthNames.indexOf(zakazka.datum);
        if (month === -1) month = 0;
        year = 2025;
        parsedDate = new Date(year, month, 1);
      }

      const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;

      if (!monthlyDataMap[monthKey]) {
        monthlyDataMap[monthKey] = {
          revenue: 0,
          month: month,
          year: year,
          datum: parsedDate
        };
      }
      monthlyDataMap[monthKey].revenue += zakazka.zisk;
    });

    const sortedMonthsData = Object.values(monthlyDataMap)
      .sort((a, b) => a.datum - b.datum);

    const monthNames = ['Led', 'Úno', 'Bře', 'Dub', 'Kvě', 'Čer', 'Čvc', 'Srp', 'Zář', 'Říj', 'Lis', 'Pro'];
    const mesicniLabels = sortedMonthsData.map(data => monthNames[data.month]);
    const mesicniValues = sortedMonthsData.map(data => data.revenue);

    // Rozložení dat podle kategorií - stabilní zpracování
    const rozlozeniLabels = Object.keys(categoryStats).filter(key => categoryStats[key] > 0);
    const rozlozeniValues = rozlozeniLabels.map(key => categoryStats[key]);
    const rozlozeniColors = rozlozeniLabels.map(label => {
      const category = safeWorkCategories.find(cat => cat.name === label);
      return category ? category.color : '#6B7280';
    });

    // Fallback pro prázdná data
    const hasData = rozlozeniLabels.length > 0;
    const finalLabels = hasData ? rozlozeniLabels : ['Žádná data'];
    const finalValues = hasData ? rozlozeniValues : [1];
    const finalColors = hasData ? rozlozeniColors : ['#E5E7EB'];

    return {
      celkoveTrzby: celkoveTrzby.toLocaleString(),
      celkovyZisk: celkovyZisk.toLocaleString(),
      pocetZakazek: pocetZakazek.toString(),
      prumernyZisk: prumernyZisk.toLocaleString(),
      mesicniData: {
        labels: mesicniLabels,
        values: mesicniValues
      },
      rozlozeniData: {
        labels: finalLabels,
        values: finalValues,
        colors: finalColors
      }
    };
  }, [stableDataHash]); // Závislost pouze na hash

  return { dashboardData };
};
