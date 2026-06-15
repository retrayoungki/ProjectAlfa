import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  Legend
);

export default function CashFlowChart({ data, year }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
        Tidak ada data cash flow untuk ditampilkan.
      </div>
    );
  }

  const now = new Date();
  const currentMonthIdx = now.getMonth();
  const currentYear = now.getFullYear();

  const labels = data.map((c, idx) => {
    const isCurrentMonth = idx === currentMonthIdx && year === currentYear;
    return isCurrentMonth ? `${c.month_label}*` : c.month_label;
  });

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Kas Masuk (Termin Paid)',
        data: data.map(c => c.kas_masuk),
        backgroundColor: data.map((c, idx) => {
          const isCurrentMonth = idx === currentMonthIdx && year === currentYear;
          return isCurrentMonth ? '#60A5FA' : '#3A7BFF'; // Lighter blue vs standard blue
        }),
        borderRadius: 4,
        barPercentage: 0.8,
        categoryPercentage: 0.7
      },
      {
        label: 'Kas Keluar (Realisasi Biaya)',
        data: data.map(c => c.kas_keluar),
        backgroundColor: data.map((c, idx) => {
          const isCurrentMonth = idx === currentMonthIdx && year === currentYear;
          return isCurrentMonth ? 'rgba(239, 68, 68, 0.4)' : 'rgba(239, 68, 68, 0.2)'; // Lighter red vs transparent red
        }),
        borderColor: '#EF4444',
        borderWidth: 1.5,
        borderRadius: 4,
        barPercentage: 0.8,
        categoryPercentage: 0.7
      }
    ]
  };

  const formatRupiahCompact = (value) => {
    if (value < 1000000) return `Rp ${value.toLocaleString('id-ID')}`;
    if (value >= 1000000000) return `Rp ${(value / 1000000000).toFixed(1)} M`;
    return `Rp ${(value / 1000000).toFixed(1)} Jt`;
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          boxWidth: 12,
          usePointStyle: true,
          pointStyle: 'circle',
          font: {
            family: 'Inter, sans-serif',
            size: 11,
            weight: '500'
          },
          color: 'var(--text-muted)'
        }
      },
      tooltip: {
        backgroundColor: 'var(--surface)',
        titleColor: 'var(--text)',
        bodyColor: 'var(--text-muted)',
        borderColor: 'var(--border)',
        borderWidth: 1,
        titleFont: {
          family: 'Inter, sans-serif',
          weight: '700',
          size: 12
        },
        bodyFont: {
          family: 'Inter, sans-serif',
          size: 11
        },
        padding: 10,
        boxPadding: 4,
        callbacks: {
          label: (context) => {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: 'var(--text-subtle)',
          font: {
            family: 'Inter, sans-serif',
            size: 10
          }
        }
      },
      y: {
        grid: {
          color: 'var(--border)',
          drawBorder: false
        },
        ticks: {
          color: 'var(--text-subtle)',
          font: {
            family: 'Inter, sans-serif',
            size: 10
          },
          callback: (value) => formatRupiahCompact(value)
        }
      }
    }
  };

  return (
    <div style={{ height: 260, width: '100%' }}>
      <Bar data={chartData} options={options} />
    </div>
  );
}
