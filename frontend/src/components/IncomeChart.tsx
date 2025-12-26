import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import './IncomeChart.css';

interface IncomeChartProps {
  percentile: number; // 0-100, where 1 = top 1%
  dailyIncome: number;
  medianIncome: number;
  top10Threshold: number;
  top1Threshold: number;
}

export const IncomeChart = ({
  percentile,
  dailyIncome,
  medianIncome,
  top10Threshold,
  top1Threshold,
}: IncomeChartProps) => {
  const { t } = useTranslation();

  // Convert percentile to position (0 = left/bottom, 100 = right/top)
  const position = 100 - percentile;

  // Define key markers on the distribution
  const markers = [
    { label: t('Bottom 20%'), position: 10, color: '#ef4444' },
    { label: t('Median (50th)'), position: 50, color: '#f59e0b' },
    { label: t('Top 10%'), position: 90, color: '#22c55e' },
    { label: t('Top 1%'), position: 99, color: '#3b82f6' },
  ];

  // Format currency for display
  const formatShort = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  return (
    <div className="income-chart">
      <div className="chart-title">{t('Your Position in Global Income Distribution')}</div>

      {/* Bell curve visualization */}
      <div className="chart-curve-container">
        <svg viewBox="0 0 400 120" className="chart-curve-svg">
          {/* Background gradient */}
          <defs>
            <linearGradient id="curveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.3" />
              <stop offset="90%" stopColor="#22c55e" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.3" />
            </linearGradient>
          </defs>

          {/* Simplified income distribution curve (right-skewed) */}
          <path
            d="M 0,100
               C 40,100 60,95 100,80
               C 140,65 160,40 200,30
               C 240,20 280,15 320,12
               C 360,10 380,8 400,8
               L 400,100 L 0,100 Z"
            fill="url(#curveGradient)"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="1"
          />

          {/* User position marker */}
          <motion.g
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <line
              x1={position * 4}
              y1="0"
              x2={position * 4}
              y2="100"
              stroke="#ff6b35"
              strokeWidth="2"
              strokeDasharray="4 2"
            />
            <circle
              cx={position * 4}
              cy={Math.max(10, 100 - (position * 0.9))}
              r="6"
              fill="#ff6b35"
              stroke="#fff"
              strokeWidth="2"
            />
          </motion.g>
        </svg>

        {/* Position label */}
        <motion.div
          className="chart-position-label"
          style={{ left: `${Math.min(85, Math.max(15, position))}%` }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {t('You are here')}
        </motion.div>
      </div>

      {/* Progress bar visualization */}
      <div className="chart-bar-container">
        <div className="chart-bar-labels">
          <span>{t('Bottom 20%')}</span>
          <span>{t('Top 1%')}</span>
        </div>
        <div className="chart-bar-track">
          <motion.div
            className="chart-bar-fill"
            initial={{ width: 0 }}
            animate={{ width: `${position}%` }}
            transition={{ delay: 0.2, duration: 0.8, ease: 'easeOut' }}
          />
          <div className="chart-bar-markers">
            {markers.map((marker) => (
              <div
                key={marker.label}
                className="chart-bar-marker"
                style={{ left: `${marker.position}%` }}
              >
                <div
                  className="chart-bar-marker-dot"
                  style={{ backgroundColor: marker.color }}
                />
              </div>
            ))}
          </div>
          <motion.div
            className="chart-bar-you"
            style={{ left: `${position}%` }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.8, type: 'spring' }}
          />
        </div>
      </div>

      {/* Key thresholds */}
      <div className="chart-thresholds">
        <div className="chart-threshold">
          <div className="threshold-label">{t('Global Median')}</div>
          <div className="threshold-value">{formatShort(medianIncome)}/yr</div>
        </div>
        <div className="chart-threshold">
          <div className="threshold-label">{t('Top 10% globally')}</div>
          <div className="threshold-value">{formatShort(top10Threshold)}/yr</div>
        </div>
        <div className="chart-threshold">
          <div className="threshold-label">{t('Top 1% globally')}</div>
          <div className="threshold-value">{formatShort(top1Threshold)}/yr</div>
        </div>
      </div>

      {/* Daily income comparison */}
      <div className="chart-daily">
        <div className="daily-label">{t('Your daily income')}</div>
        <div className="daily-bar-container">
          <div className="daily-bar-track">
            <motion.div
              className="daily-bar-fill"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (dailyIncome / 100) * 100)}%` }}
              transition={{ delay: 0.4, duration: 0.6 }}
            />
            {/* Poverty line marker at $2.15 */}
            <div className="daily-marker poverty" style={{ left: `${(2.15 / 100) * 100}%` }}>
              <span className="daily-marker-label">$2.15</span>
            </div>
            {/* Consumer class at $12 */}
            <div className="daily-marker consumer" style={{ left: `${(12 / 100) * 100}%` }}>
              <span className="daily-marker-label">$12</span>
            </div>
          </div>
          <div className="daily-value">${dailyIncome.toFixed(2)}/day</div>
        </div>
      </div>
    </div>
  );
};
