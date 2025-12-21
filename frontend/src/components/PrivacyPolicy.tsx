import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import './PrivacyPolicy.css';

interface PrivacyPolicyProps {
  onClose: () => void;
}

export function PrivacyPolicy({ onClose }: PrivacyPolicyProps) {
  const { t } = useTranslation();

  return (
    <motion.div
      className="privacy-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="privacy-container"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
      >
        <div className="privacy-header">
          <h1>{t('Privacy Policy')}</h1>
          <button className="privacy-close" onClick={onClose} aria-label={t('Close')}>
            ✕
          </button>
        </div>

        <div className="privacy-content">
          <p className="privacy-updated">{t('Last updated')}: 2025-01-01</p>

          <section>
            <h2>{t('Introduction')}</h2>
            <p>{t('This privacy policy explains what information is collected, used, and protected when you use the Awesome Rank quiz application.')}</p>
          </section>

          <section>
            <h2>{t('Information We Collect')}</h2>
            <p>{t('We collect the following types of information:')}</p>
            <ul>
              <li><strong>{t('Demographic Information')}:</strong> {t('Age group and gender you optionally provide')}</li>
              <li><strong>{t('Quiz and Income Data')}:</strong> {t('Quiz responses, response times, and income entered in calculator')}</li>
              <li><strong>{t('Device Information')}:</strong> {t('Browser type, screen resolution, language settings')}</li>
              <li><strong>{t('Location Information')}:</strong> {t('Country and city derived from IP address')}</li>
            </ul>
          </section>

          <section>
            <h2>{t('How We Use Information')}</h2>
            <p>{t('The collected information is used for the following purposes:')}</p>
            <ul>
              <li>{t('Generate anonymized global statistics')}</li>
              <li>{t('Improve question quality and user experience')}</li>
              <li>{t('Academic research on global living standards')}</li>
            </ul>
          </section>

          <section>
            <h2>{t('Data Sharing')}</h2>
            <p>{t('We do not sell your personal information. Data may only be shared with research partners in anonymized and aggregated form. We may disclose information when required by law.')}</p>
          </section>

          <section>
            <h2>{t('Data Retention')}</h2>
            <p>{t('We retain data for up to 2 years for research purposes. After this period, data is automatically deleted or permanently anonymized.')}</p>
          </section>

          <section>
            <h2>{t('Your Rights')}</h2>
            <p>{t('Depending on your location, you may have the following rights:')}</p>
            <ul>
              <li>{t('Access your data')}</li>
              <li>{t('Request data deletion')}</li>
              <li>{t('Withdraw consent at any time')}</li>
              <li>{t('File a complaint with supervisory authority')}</li>
            </ul>
          </section>

          <section>
            <h2>{t('Security')}</h2>
            <p>{t('We implement appropriate technical and organizational measures to protect data from unauthorized access, alteration, or destruction.')}</p>
          </section>

          <section>
            <h2>{t('Policy Changes')}</h2>
            <p>{t('This privacy policy may be updated from time to time. We will notify you of significant changes by posting the new policy on this page.')}</p>
          </section>
        </div>

        <div className="privacy-footer">
          <button className="privacy-btn" onClick={onClose}>
            {t('Close')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
