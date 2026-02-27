import { I18n } from 'i18n-js';
import { getLocales } from 'expo-localization';
import { create } from 'zustand';

const i18n = new I18n({
  en: {
    common: {
      loading: 'Loading...',
      error: 'Something went wrong',
      retry: 'Retry',
      cancel: 'Cancel',
      save: 'Save',
      delete: 'Delete',
      confirm: 'Confirm',
      edit: 'Edit',
      add: 'Add',
      back: 'Back',
    },
    auth: {
      login: 'Log In',
      register: 'Sign Up',
      logout: 'Log Out',
      email: 'Email',
      password: 'Password',
      name: 'Full Name',
      forgotPassword: 'Forgot password?',
      noAccount: "Don't have an account?",
      haveAccount: 'Already have an account?',
    },
    home: {
      title: 'My Children',
      addChild: 'Add Child',
      noChildren: 'No children yet. Add your first child!',
    },
    child: {
      name: 'Name',
      dob: 'Date of Birth',
      gender: 'Gender',
      male: 'Male',
      female: 'Female',
      other: 'Other',
      age: 'Age',
    },
    events: {
      title: 'Events',
      logEvent: 'Log Event',
      sleep: 'Sleep',
      feed: 'Feed',
      diaper: 'Diaper',
      mood: 'Mood',
      startTime: 'Start Time',
      endTime: 'End Time',
      notes: 'Notes',
      noEvents: 'No events yet. Log your first event!',
    },
    analytics: {
      title: 'Analytics',
      sleep: 'Sleep',
      feeding: 'Feeding',
      wakeWindows: 'Wake Windows',
      last7Days: 'Last 7 Days',
      last30Days: 'Last 30 Days',
    },
    ai: {
      title: 'AI Insights',
      insights: 'Insights',
      recommendations: 'Recommendations',
      anomalies: 'Anomalies',
      chat: 'Chat',
      digest: 'Daily Digest',
      chatPlaceholder: 'Ask about your child...',
      send: 'Send',
    },
    growth: {
      title: 'Growth',
      weight: 'Weight (kg)',
      height: 'Height (cm)',
      headCircumference: 'Head Circumference (cm)',
      date: 'Date',
      addEntry: 'Add Entry',
    },
    billing: {
      title: 'Plan',
      free: 'Free',
      pro: 'Pro',
      trial: 'Trial',
      startTrial: 'Start Free 14-Day Trial',
      upgradePro: 'Upgrade to Pro',
      trialActive: 'Trial Active',
      trialExpires: 'Trial expires',
      proFeatures: 'Pro Features',
      manageSubscription: 'Manage Subscription',
      restorePurchases: 'Restore Purchases',
    },
    reminders: {
      title: 'Reminders',
      addReminder: 'Add Reminder',
      noReminders: 'No reminders set.',
      scheduledAt: 'Scheduled At',
      repeat: 'Repeat',
      none: 'None',
      daily: 'Daily',
      weekly: 'Weekly',
    },
    settings: {
      title: 'Settings',
      profile: 'Profile',
      language: 'Language',
      notifications: 'Notifications',
      changePassword: 'Change Password',
    },
  },
  fr: {
    common: { loading: 'Chargement...', error: 'Une erreur est survenue', retry: 'Réessayer', cancel: 'Annuler', save: 'Enregistrer', delete: 'Supprimer', confirm: 'Confirmer', edit: 'Modifier', add: 'Ajouter', back: 'Retour' },
    auth: { login: 'Se connecter', register: "S'inscrire", logout: 'Se déconnecter', email: 'Email', password: 'Mot de passe', name: 'Nom complet', forgotPassword: 'Mot de passe oublié ?', noAccount: "Pas de compte ?", haveAccount: 'Déjà un compte ?' },
    home: { title: 'Mes enfants', addChild: 'Ajouter un enfant', noChildren: "Aucun enfant. Ajoutez votre premier enfant !" },
    child: { name: 'Nom', dob: 'Date de naissance', gender: 'Genre', male: 'Garçon', female: 'Fille', other: 'Autre', age: 'Âge' },
    events: { title: 'Événements', logEvent: 'Enregistrer', sleep: 'Sommeil', feed: 'Repas', diaper: 'Couche', mood: 'Humeur', startTime: 'Début', endTime: 'Fin', notes: 'Notes', noEvents: "Aucun événement." },
    analytics: { title: 'Analyses', sleep: 'Sommeil', feeding: 'Alimentation', wakeWindows: "Fenêtres d'éveil", last7Days: '7 derniers jours', last30Days: '30 derniers jours' },
    ai: { title: 'IA & Insights', insights: 'Insights', recommendations: 'Recommandations', anomalies: 'Anomalies', chat: 'Chat', digest: 'Résumé quotidien', chatPlaceholder: 'Posez une question...', send: 'Envoyer' },
    growth: { title: 'Croissance', weight: 'Poids (kg)', height: 'Taille (cm)', headCircumference: 'Tour de tête (cm)', date: 'Date', addEntry: 'Ajouter' },
    billing: { title: 'Abonnement', free: 'Gratuit', pro: 'Pro', trial: 'Essai', startTrial: 'Essai gratuit 14 jours', upgradePro: 'Passer au Pro', trialActive: 'Essai en cours', trialExpires: 'Expire le', proFeatures: 'Fonctionnalités Pro', manageSubscription: "Gérer l'abonnement", restorePurchases: 'Restaurer les achats' },
    reminders: { title: 'Rappels', addReminder: 'Ajouter un rappel', noReminders: 'Aucun rappel.', scheduledAt: 'Planifié le', repeat: 'Répétition', none: 'Jamais', daily: 'Quotidien', weekly: 'Hebdomadaire' },
    settings: { title: 'Paramètres', profile: 'Profil', language: 'Langue', notifications: 'Notifications', changePassword: 'Changer le mot de passe' },
  },
  es: {
    common: { loading: 'Cargando...', error: 'Algo salió mal', retry: 'Reintentar', cancel: 'Cancelar', save: 'Guardar', delete: 'Eliminar', confirm: 'Confirmar', edit: 'Editar', add: 'Agregar', back: 'Atrás' },
    auth: { login: 'Iniciar sesión', register: 'Registrarse', logout: 'Cerrar sesión', email: 'Email', password: 'Contraseña', name: 'Nombre completo', forgotPassword: '¿Olvidaste tu contraseña?', noAccount: '¿No tienes cuenta?', haveAccount: '¿Ya tienes cuenta?' },
    home: { title: 'Mis hijos', addChild: 'Agregar hijo', noChildren: '¡Ningún niño aún!' },
    child: { name: 'Nombre', dob: 'Fecha de nacimiento', gender: 'Género', male: 'Niño', female: 'Niña', other: 'Otro', age: 'Edad' },
    events: { title: 'Eventos', logEvent: 'Registrar evento', sleep: 'Sueño', feed: 'Alimentación', diaper: 'Pañal', mood: 'Estado de ánimo', startTime: 'Hora de inicio', endTime: 'Hora de fin', notes: 'Notas', noEvents: '¡Ningún evento aún!' },
    analytics: { title: 'Análisis', sleep: 'Sueño', feeding: 'Alimentación', wakeWindows: 'Ventanas de vigilia', last7Days: 'Últimos 7 días', last30Days: 'Últimos 30 días' },
    ai: { title: 'IA & Perspectivas', insights: 'Perspectivas', recommendations: 'Recomendaciones', anomalies: 'Anomalías', chat: 'Chat', digest: 'Resumen diario', chatPlaceholder: 'Pregunta sobre tu hijo...', send: 'Enviar' },
    growth: { title: 'Crecimiento', weight: 'Peso (kg)', height: 'Altura (cm)', headCircumference: 'Circunferencia craneal (cm)', date: 'Fecha', addEntry: 'Agregar' },
    billing: { title: 'Plan', free: 'Gratis', pro: 'Pro', trial: 'Prueba', startTrial: 'Prueba gratuita 14 días', upgradePro: 'Mejorar a Pro', trialActive: 'Prueba activa', trialExpires: 'Expira el', proFeatures: 'Funciones Pro', manageSubscription: 'Administrar suscripción', restorePurchases: 'Restaurar compras' },
    reminders: { title: 'Recordatorios', addReminder: 'Agregar recordatorio', noReminders: 'Sin recordatorios.', scheduledAt: 'Programado el', repeat: 'Repetir', none: 'Nunca', daily: 'Diario', weekly: 'Semanal' },
    settings: { title: 'Configuración', profile: 'Perfil', language: 'Idioma', notifications: 'Notificaciones', changePassword: 'Cambiar contraseña' },
  },
  ar: {
    common: { loading: 'جار التحميل...', error: 'حدث خطأ', retry: 'إعادة المحاولة', cancel: 'إلغاء', save: 'حفظ', delete: 'حذف', confirm: 'تأكيد', edit: 'تعديل', add: 'إضافة', back: 'رجوع' },
    auth: { login: 'تسجيل الدخول', register: 'إنشاء حساب', logout: 'تسجيل الخروج', email: 'البريد الإلكتروني', password: 'كلمة المرور', name: 'الاسم الكامل', forgotPassword: 'نسيت كلمة المرور؟', noAccount: 'ليس لديك حساب؟', haveAccount: 'لديك حساب بالفعل؟' },
    home: { title: 'أطفالي', addChild: 'إضافة طفل', noChildren: 'لا أطفال بعد.' },
    child: { name: 'الاسم', dob: 'تاريخ الميلاد', gender: 'الجنس', male: 'ذكر', female: 'أنثى', other: 'آخر', age: 'العمر' },
    events: { title: 'الأحداث', logEvent: 'تسجيل حدث', sleep: 'نوم', feed: 'رضاعة', diaper: 'حفاضة', mood: 'مزاج', startTime: 'وقت البدء', endTime: 'وقت الانتهاء', notes: 'ملاحظات', noEvents: 'لا أحداث بعد.' },
    analytics: { title: 'التحليلات', sleep: 'النوم', feeding: 'التغذية', wakeWindows: 'فترات اليقظة', last7Days: 'آخر 7 أيام', last30Days: 'آخر 30 يوم' },
    ai: { title: 'رؤى الذكاء الاصطناعي', insights: 'رؤى', recommendations: 'توصيات', anomalies: 'شذوذات', chat: 'محادثة', digest: 'ملخص يومي', chatPlaceholder: 'اسأل عن طفلك...', send: 'إرسال' },
    growth: { title: 'النمو', weight: 'الوزن (كغ)', height: 'الطول (سم)', headCircumference: 'محيط الرأس (سم)', date: 'التاريخ', addEntry: 'إضافة' },
    billing: { title: 'الخطة', free: 'مجاني', pro: 'برو', trial: 'تجريبي', startTrial: 'ابدأ التجربة المجانية 14 يوم', upgradePro: 'الترقية إلى برو', trialActive: 'التجربة نشطة', trialExpires: 'تنتهي في', proFeatures: 'ميزات برو', manageSubscription: 'إدارة الاشتراك', restorePurchases: 'استعادة المشتريات' },
    reminders: { title: 'التذكيرات', addReminder: 'إضافة تذكير', noReminders: 'لا تذكيرات.', scheduledAt: 'مجدول في', repeat: 'تكرار', none: 'لا', daily: 'يومي', weekly: 'أسبوعي' },
    settings: { title: 'الإعدادات', profile: 'الملف الشخصي', language: 'اللغة', notifications: 'الإشعارات', changePassword: 'تغيير كلمة المرور' },
  },
});

i18n.locale = getLocales()[0]?.languageCode ?? 'en';
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

export default i18n;

// Zustand store so locale changes propagate via React re-renders
interface LocaleState {
  locale: string;
  setLocale: (locale: string) => void;
}

export const useLocaleStore = create<LocaleState>((set) => ({
  locale: i18n.locale,
  setLocale: (locale: string) => {
    i18n.locale = locale;
    set({ locale });
  },
}));

// Convenience hook — call in any component that renders translated strings
export function useI18n() {
  const { locale } = useLocaleStore();
  return { t: (key: string, opts?: object) => i18n.t(key, opts), locale };
}

export function setLocale(locale: string) {
  useLocaleStore.getState().setLocale(locale);
}
