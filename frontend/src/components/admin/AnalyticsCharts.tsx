"use client";
import React, { useState, useEffect } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { fetchWithAuth } from '@/utils/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const AnalyticsCharts = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await fetchWithAuth('/admin/stats');
        setStats(data);
      } catch (error) {
        console.error("Load Stats Error:", error);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  if (loading) return <div className="h-64 flex items-center justify-center text-fg-muted uppercase text-[10px] font-black tracking-widest">Aggregating Professional Data...</div>;

  const lineData = {
    labels: stats?.revenueLabels || ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
    datasets: [{
      label: 'Revenue Growth',
      data: stats?.revenueGrowth || [0, 0, 0, 0, 0, 0, 0],
      borderColor: '#2563EB',
      backgroundColor: 'rgba(37, 99, 235, 0.1)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#06B6D4',
      pointBorderColor: '#fff',
    }]
  };

  const barData = {
    labels: stats?.categoryLabels || ['Hardware'],
    datasets: [{
      label: 'Service Frequency',
      data: stats?.categoryDistribution || [0],
      backgroundColor: 'rgba(6, 182, 212, 0.8)',
      borderRadius: 10,
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1E293B',
        titleFont: { size: 10, weight: 'bold' as any },
        bodyFont: { size: 12 },
        padding: 15,
        borderRadius: 12,
        displayColors: false,
      }
    },
    scales: {
      y: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 10 } } },
      x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 10 } } }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
       <div className="glass-card p-10 rounded-[3rem] space-y-8">
          <div className="flex justify-between items-center">
             <h4 className="text-fg-primary font-black uppercase tracking-widest text-xs">Revenue Matrix</h4>
             <span className="text-green-500 text-[10px] font-black uppercase tracking-widest">+24% SECURED</span>
          </div>
          <div className="h-64">
             <Line data={lineData} options={chartOptions} />
          </div>
       </div>

       <div className="glass-card p-10 rounded-[3rem] space-y-8">
          <div className="flex justify-between items-center">
             <h4 className="text-fg-primary font-black uppercase tracking-widest text-xs">Node Distribution</h4>
             <span className="text-blue-500 text-[10px] font-black uppercase tracking-widest">Global Systems</span>
          </div>
          <div className="h-64">
             <Bar data={barData} options={chartOptions} />
          </div>
       </div>
    </div>
  );
};

export default AnalyticsCharts;
