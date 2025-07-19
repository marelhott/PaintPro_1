
import React, { useRef, useEffect, memo } from 'react';
import { Chart } from 'chart.js';

// Stabilní Chart wrapper s úplným odpojením od React lifecycle
const StableChart = memo(({ data, options, type = 'bar', className = '' }) => {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const dataRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Porovnej data pomocí JSON stringify pro deep comparison
    const currentDataStr = JSON.stringify(data);
    const currentOptionsStr = JSON.stringify(options);
    
    if (
      dataRef.current && 
      dataRef.current.dataStr === currentDataStr && 
      dataRef.current.optionsStr === currentOptionsStr
    ) {
      // Data se nezměnila, neprovádej nic
      return;
    }

    // Znič existující chart
    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    // Vytvoř nový chart pouze když je potřeba
    const ctx = canvasRef.current.getContext('2d');
    
    try {
      chartRef.current = new Chart(ctx, {
        type,
        data: { ...data }, // Deep copy
        options: { ...options } // Deep copy
      });

      // Ulož referenci na aktuální data
      dataRef.current = {
        dataStr: currentDataStr,
        optionsStr: currentOptionsStr
      };
    } catch (error) {
      console.error('Error creating stable chart:', error);
    }

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [data, options, type]);

  return (
    <div className={`stable-chart-wrapper ${className}`}>
      <canvas 
        ref={canvasRef} 
        style={{ 
          maxWidth: '100%', 
          maxHeight: '100%',
          display: 'block'
        }} 
      />
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison pro memo - zabráníme zbytečným re-renderům
  const dataEqual = JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data);
  const optionsEqual = JSON.stringify(prevProps.options) === JSON.stringify(nextProps.options);
  const typeEqual = prevProps.type === nextProps.type;
  
  return dataEqual && optionsEqual && typeEqual;
});

StableChart.displayName = 'StableChart';

export default StableChart;
