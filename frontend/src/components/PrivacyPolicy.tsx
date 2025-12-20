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
            <h2>{t('privacy_section_1_title')}</h2>
            <p>{t('privacy_section_1_content')}</p>
          </section>

          <section>
            <h2>{t('privacy_section_2_title')}</h2>
            <p>{t('privacy_section_2_intro')}</p>
            <ul>
              <li><strong>{t('privacy_data_demographics')}:</strong> {t('privacy_data_demographics_desc')}</li>
              <li><strong>{t('privacy_data_responses')}:</strong> {t('privacy_data_responses_desc')}</li>
              <li><strong>{t('privacy_data_device')}:</strong> {t('privacy_data_device_desc')}</li>
              <li><strong>{t('privacy_data_location')}:</strong> {t('privacy_data_location_desc')}</li>
            </ul>
          </section>

          <section>
            <h2>{t('privacy_section_3_title')}</h2>
            <p>{t('privacy_section_3_content')}</p>
            <ul>
              <li>{t('privacy_purpose_1')}</li>
              <li>{t('privacy_purpose_2')}</li>
              <li>{t('privacy_purpose_3')}</li>
            </ul>
          </section>

          <section>
            <h2>{t('privacy_section_4_title')}</h2>
            <p>{t('privacy_section_4_content')}</p>
          </section>

          <section>
            <h2>{t('privacy_section_5_title')}</h2>
            <p>{t('privacy_section_5_content')}</p>
          </section>

          <section>
            <h2>{t('privacy_section_6_title')}</h2>
            <p>{t('privacy_section_6_content')}</p>
            <ul>
              <li>{t('privacy_right_1')}</li>
              <li>{t('privacy_right_2')}</li>
              <li>{t('privacy_right_3')}</li>
              <li>{t('privacy_right_4')}</li>
            </ul>
          </section>

          <section>
            <h2>{t('privacy_section_7_title')}</h2>
            <p>{t('privacy_section_7_content')}</p>
          </section>

          <section>
            <h2>{t('privacy_section_8_title')}</h2>
            <p>{t('privacy_section_8_content')}</p>
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
