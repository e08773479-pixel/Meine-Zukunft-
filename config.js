"use strict";

/*
 * MOSTAQBALI — Platform Configuration
 * الإصدار الأول: إعدادات الواجهة فقط.
 * لا تضع كلمات مرور أو مفاتيح API سرية في هذا الملف.
 */

window.MOSTAQBALI_CONFIG = Object.freeze({
  // بيانات المنصة
  app: Object.freeze({
    name: "المستقبلي",
    nameEnglish: "MOSTAQBALI",
    version: "1.0.0",
    language: "ar",
    direction: "rtl",
    country: "EG",
    currency: "EGP",
    currencySymbol: "ج.م",
    timezone: "Africa/Cairo"
  }),

  // الألوان الأساسية
  theme: Object.freeze({
    primary: "#2864F0",
    primaryDark: "#1749C5",
    secondary: "#7957E8",
    background: "#F4F7FC",
    surface: "#FFFFFF",
    text: "#101B3D",
    muted: "#71809C",
    border: "#E3E9F4",
    success: "#159B67",
    warning: "#E99A24",
    danger: "#D9485F"
  }),

  // أنواع الحسابات
  roles: Object.freeze({
    STUDENT: "student",
    TEACHER: "teacher",
    PARENT: "parent",
    ADMIN: "admin"
  }),

  // حالات الحساب ومراجعة الطلبات
  statuses: Object.freeze({
    ACTIVE: "active",
    PENDING: "pending",
    REJECTED: "rejected",
    SUSPENDED: "suspended",
    INACTIVE: "inactive"
  }),

  // بيانات المقررات الدراسية
  education: Object.freeze({
    stages: Object.freeze([
      { id: "primary", label: "المرحلة الابتدائية" },
      { id: "preparatory", label: "المرحلة الإعدادية" },
      { id: "secondary", label: "المرحلة الثانوية" }
    ]),

    secondaryBranches: Object.freeze([
      { id: "science_science", label: "علمي علوم" },
      { id: "science_math", label: "علمي رياضة" },
      { id: "literary", label: "أدبي" }
    ])
  }),

  // نظام الاشتراكات والدفع
  payments: Object.freeze({
    method: "vodafone_cash",
    providerLabel: "فودافون كاش",
    requiresProofReview: true,
    activateOnlyAfterApproval: true,
    platformSharePercent: 20,
    teacherSharePercent: 80
  }),

  // مفاتيح التخزين المحلي للبيانات التجريبية فقط.
  // لا تستخدم localStorage لتخزين كلمات المرور أو بيانات دفع حساسة.
  storageKeys: Object.freeze({
    theme: "mostaqbali_theme",
    language: "mostaqbali_language",
    onboardingSeen: "mostaqbali_onboarding_seen",
    draftRegistration: "mostaqbali_registration_draft"
  }),

  // إعدادات حالة المشروع الحالية
  runtime: Object.freeze({
    mode: "frontend",
    demoMode: true,
    authenticationEnabled: false,
    databaseEnabled: false,
    paymentsEnabled: false,
    teacherPayoutsEnabled: false,
    apiBaseUrl: ""
  })
});

// أدوات مساعدة بسيطة تستخدمها الصفحات القادمة.
window.MOSTAQBALI = Object.freeze({
  getConfig() {
    return window.MOSTAQBALI_CONFIG;
  },

  formatCurrency(amount) {
    const value = Number(amount);

    if (!Number.isFinite(value)) {
      return "—";
    }

    return new Intl.NumberFormat("ar-EG", {
      style: "currency",
      currency: window.MOSTAQBALI_CONFIG.app.currency,
      maximumFractionDigits: 2
    }).format(value);
  },

  isValidRole(role) {
    return Object.values(window.MOSTAQBALI_CONFIG.roles).includes(role);
  },

  isBackendReady() {
    const runtime = window.MOSTAQBALI_CONFIG.runtime;

    return Boolean(
      runtime.authenticationEnabled &&
      runtime.databaseEnabled &&
      runtime.apiBaseUrl
    );
  }
});
