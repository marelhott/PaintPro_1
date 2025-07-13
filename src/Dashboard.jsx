
import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const Dashboard = () => {
  const { currentUser, getUserData } = useAuth();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalProfit: 0,
    orderCount: 0,
    avgOrderValue: 0
  });

  useEffect(() => {
    const loadStats = async () => {
      if (!currentUser) return;

      try {
        const orders = await getUserData(currentUser.id);
        
        const totalRevenue = orders.reduce((sum, order) => sum + (order.castka || 0), 0);
        const totalProfit = orders.reduce((sum, order) => sum + (order.zisk || 0), 0);
        const orderCount = orders.length;
        const avgOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;

        setStats({
          totalRevenue,
          totalProfit,
          orderCount,
          avgOrderValue
        });

        console.log('=== DASHBOARD STATS ===');
        console.log('Celkové tržby:', totalRevenue);
        console.log('Celkový zisk:', totalProfit);
        console.log('Počet zakázek:', orderCount);
        console.log('Průměrná zakázka:', avgOrderValue);
      } catch (error) {
        console.error('Chyba při načítání statistik:', error);
      }
    };

    loadStats();
  }, [currentUser, getUserData]);

  if (!currentUser) return null;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>📊 Přehled</h2>
      </div>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalRevenue.toLocaleString()} Kč</div>
            <div className="stat-label">Celkové tržby</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalProfit.toLocaleString()} Kč</div>
            <div className="stat-label">Celkový zisk</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <div className="stat-value">{stats.orderCount}</div>
            <div className="stat-label">Počet zakázek</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <div className="stat-value">{Math.round(stats.avgOrderValue).toLocaleString()} Kč</div>
            <div className="stat-label">Průměrná zakázka</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
