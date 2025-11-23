import React from 'react';
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
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Chart options configuration
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
    },
  },
  scales: {
    y: {
      beginAtZero: true,
    },
  },
};

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right',
    },
  },
};

// Document Upload Trends Line Chart
export const DocumentTrendsChart = ({ data }) => {
  const chartData = {
    labels: data?.labels || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Documents Uploaded',
        data: data?.values || [65, 59, 80, 81, 56, 95],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      },
    ],
  };

  return (
    <div className="h-64">
      <Line data={chartData} options={chartOptions} />
    </div>
  );
};

// Department Distribution Doughnut Chart
export const DepartmentDistributionChart = ({ data }) => {
  const chartData = {
    labels: data?.labels || ['Operations', 'Engineering', 'Safety', 'Procurement', 'HR', 'Finance'],
    datasets: [
      {
        data: data?.values || [30, 25, 20, 15, 5, 5],
        backgroundColor: [
          '#3B82F6', // Blue
          '#10B981', // Green
          '#F59E0B', // Yellow
          '#EF4444', // Red
          '#8B5CF6', // Purple
          '#06B6D4', // Cyan
        ],
        borderColor: [
          '#2563EB',
          '#059669',
          '#D97706',
          '#DC2626',
          '#7C3AED',
          '#0891B2',
        ],
        borderWidth: 2,
      },
    ],
  };

  return (
    <div className="h-64">
      <Doughnut data={chartData} options={doughnutOptions} />
    </div>
  );
};

// Document Types Bar Chart
export const DocumentTypesChart = ({ data }) => {
  const chartData = {
    labels: data?.labels || ['Safety Circulars', 'Invoices', 'Engineering Drawings', 'Reports', 'Policies'],
    datasets: [
      {
        label: 'Number of Documents',
        data: data?.values || [45, 38, 32, 28, 15],
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="h-64">
      <Bar data={chartData} options={chartOptions} />
    </div>
  );
};

// Processing Time Trends Chart
export const ProcessingTimeChart = ({ data }) => {
  const chartData = {
    labels: data?.labels || ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        label: 'Average Processing Time (hours)',
        data: data?.values || [3.2, 2.8, 2.3, 2.1],
        borderColor: 'rgb(139, 92, 246)',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      },
    ],
  };

  return (
    <div className="h-64">
      <Line data={chartData} options={chartOptions} />
    </div>
  );
};