import React, { createContext, useContext, useState, useEffect } from 'react';

const translations = {
  en: {
    dashboard: 'Dashboard',
    appointments: 'Appointments',
    patients: 'Patients',
    prescriptions: 'Prescriptions',
    pharmacy: 'Pharmacy',
    laboratory: 'Laboratory',
    radiology: 'Radiology',
    billing: 'Billing & Finance',
    settings: 'Settings',
    login: 'Login',
    logout: 'Logout',
    register: 'Register',
    submit: 'Submit',
    cancel: 'Cancel',
    save: 'Save',
    search: 'Search',
    actions: 'Actions',
    status: 'Status',
    date: 'Date',
    name: 'Name',
    phone: 'Phone',
    email: 'Email',
    welcome: 'Welcome to Healthcare Portal',
    bookAppointment: 'Book Appointment',
    patientName: 'Patient Name',
    doctorName: 'Doctor Name',
    language: 'Language',
    selectLanguage: 'Select Language'
  },
  ta: {
    dashboard: 'முகப்புப்பலகை',
    appointments: 'முன்பதிவுகள்',
    patients: 'நோயாளிகள்',
    prescriptions: 'மருந்து சீட்டுகள்',
    pharmacy: 'மருந்தகம்',
    laboratory: 'ஆய்வகம்',
    radiology: 'எக்ஸ்ரே / ஸ்கேன்',
    billing: 'கட்டணம் மற்றும் நிதி',
    settings: 'அமைப்புகள்',
    login: 'உள்நுழை',
    logout: 'வெளியேறு',
    register: 'பதிவுசெய்',
    submit: 'சமர்ப்பி',
    cancel: 'ரத்துசெய்',
    save: 'சேமி',
    search: 'தேடு',
    actions: 'செயல்கள்',
    status: 'நிலை',
    date: 'தேதி',
    name: 'பெயர்',
    phone: 'தொலைபேசி',
    email: 'மின்னஞ்சல்',
    welcome: 'நல்வரவு - மருத்துவ சேவை தளம்',
    bookAppointment: 'முன்பதிவு செய்',
    patientName: 'நோயாளி பெயர்',
    doctorName: 'மருத்துவர் பெயர்',
    language: 'மொழி',
    selectLanguage: 'மொழியைத் தேர்ந்தெடு'
  }
};

const I18nContext = createContext();

export const I18nProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage && typeof window.localStorage.getItem === 'function') {
        return window.localStorage.getItem('app_language') || 'en';
      }
    } catch (e) {}
    return 'en';
  });

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage && typeof window.localStorage.setItem === 'function') {
        window.localStorage.setItem('app_language', language);
      }
    } catch (e) {}
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.lang = language;
    }
  }, [language]);

  const t = (key) => {
    if (!translations[language]) return key;
    return translations[language][key] || translations['en'][key] || key;
  };

  const changeLanguage = (lang) => {
    if (translations[lang]) {
      setLanguage(lang);
    }
  };

  return (
    <I18nContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(I18nContext);
  if (!context) {
    // Fallback if rendered outside provider
    return {
      language: 'en',
      changeLanguage: () => {},
      t: (key) => key
    };
  }
  return context;
};
