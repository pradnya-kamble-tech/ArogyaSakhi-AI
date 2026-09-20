import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Minimal translation resources for the App Shell display.
const resources = {
    en: {
        translation: {
            "Dashboard": "Dashboard",
            "Community": "Community Health",
            "Maternal": "Maternal Care",
            "Emergency": "Emergency SOS",
            "Settings": "Settings",
            "Dr. Priya Iyer": "Dr. Priya Iyer",
            "Primary Health": "Primary Health"
        }
    },
    hi: {
        translation: {
            "Dashboard": "डैशबोर्ड",
            "Community": "सामुदायिक स्वास्थ्य",
            "Maternal": "मातृत्व देखभाल",
            "Emergency": "आपातकालीन",
            "Settings": "सेटिंग्स",
            "Dr. Priya Iyer": "डॉ. प्रिया अय्यर",
            "Primary Health": "प्राथमिक स्वास्थ्य"
        }
    },
    mr: {
        translation: {
            "Dashboard": "डॅशबोर्ड",
            "Community": "सामुदायिक आरोग्य",
            "Maternal": "मातृत्व काळजी",
            "Emergency": "आपत्कालीन",
            "Settings": "सेटिंग्ज",
            "Dr. Priya Iyer": "डॉ. प्रिया अय्यर",
            "Primary Health": "प्राथमिक आरोग्य"
        }
    }
};

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: 'en', // default language
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false // react already safes from xss
        }
    });

export default i18n;
