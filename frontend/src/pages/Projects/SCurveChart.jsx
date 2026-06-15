import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function SCurveChart({ data = [] }) {
  const labels = data.map(d => d.week_label || `Minggu ${d.week}`);
  const planData = data.map(d => d.plan);
  const actualData = data.map(d => d.actual);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Progres Rencana (%)',
        data: planData,
        borderColor: '#60A5FA', // Biru muda
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        tension: 0.1,
      },
      {
        label: 'Progres Aktual (%)',
        data: actualData,
        borderColor: '#2563EB', // Biru tua
        backgroundColor: 'rgba(37, 99, 235, 0.1)', // Fill semi-transparan
        fill: true,
        borderWidth: 3,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.1,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            family: 'Outfit, sans-serif',
            size: 12
          },
          color: '#4B5563'
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return ` ${context.dataset.label.split(' ')[1]}: ${context.raw}%`;
          }
        }
      }
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: {
          callback: function(value) {
            return value + '%';
          },
          font: {
            size: 11
          },
          color: '#6B7280'
        },
        grid: {
          color: '#E5E7EB'
        }
      },
      x: {
        ticks: {
          font: {
            size: 11
          },
          color: '#6B7280'
        },
        grid: {
          display: false
        }
      }
    }
  };

  return (
    <div style={{ height: 320, width: '100%' }}>
      {data.length === 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-subtle)', fontSize: 13.5 }}>
          Belum ada data progres mingguan untuk ditampilkan pada grafik S-Curve.
        </div>
      ) : (
        <Line data={chartData} options={options} />
      )}
    </div>
  );
}
