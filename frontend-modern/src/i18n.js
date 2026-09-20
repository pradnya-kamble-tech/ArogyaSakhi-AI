import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Simple translations for EN, HI, MR
const resources = {
    en: {
        translation: {
            "Dashboard": "Dashboard",
            "Patients": "Patients",
            "Assessments": "Assessments",
            "New Assessment": "New Assessment",
            "Sync": "Sync",
            "Profile": "Profile",
            "Risk Levels": {
                "Green": "Green",
                "Yellow": "Yellow",
                "Red": "Red"
            }
        }
    },
    hi: {
        translation: {
            "Dashboard": "डैशबोर्ड",
            "Patients": "मरीज़",
            "Assessments": "मूल्यांकन",
            "New Assessment": "नया मूल्यांकन",
            "Sync": "सिंक करें",
            "Profile": "प्रोफ़ाइल",
            "Risk Levels": {
                "Green": "हरा",
                "Yellow": "पीला",
                "Red": "लाल"
            }
        }
    },
    mr: {
        translation: {
            "Dashboard": "डॅशबोर्ड",
            "Patients": "रुग्ण",
            "Assessments": "मूल्यांकन",
            "New Assessment": "नवीन मूल्यांकन",
            "Sync": "सिंक",
            "Profile": "प्रोफाइल",
            "Risk Levels": {
                "Green": "हिरवा",
                "Yellow": "पिवळा",
                "Red": "लाल"
            }
        }
    }
};

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: localStorage.getItem('appLang') || 'en',
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false
        }
    });

export default i18n;
