"use strict";

/*
 * MOSTAQBALI — Platform Configuration
 * الملف الرابع: config.js
 *
 * يحتوي على الإعدادات العامة غير السرية.
 * لا تضع مفاتيح API السرية أو كلمات المرور هنا.
 */

(function (global) {
  const MOSTAQBALI_CONFIG = Object.freeze({
    // الهوية الأساسية
    app: Object.freeze({
      name: "المستقبلي",
      nameEn: "MOSTAQBALI",
      version: "1.0.0",
      language: "ar",
      direction: "rtl",
      defaultPage: "login",
      splashDuration: 5000
    }),

    // ألوان الهوية البصرية
    theme: Object.freeze({
      primary: "#2864F0",
      secondary: "#7957E8",
      navy: "#101B3D",
      background: "#F4F7FC",
      surface: "#FFFFFF",
      text: "#17233F",
      muted: "#78839B",
      success: "#159B69",
      warning: "#E5A323",
      danger: "#D94343"
    }),

    // إعدادات العرض
    ui: Object.freeze({
      direction: "rtl",
      responsive: true,
      enableAnimations: true,
      toastDuration: 3500,
      searchDebounce: 300,
      itemsPerPage: 12
    }),

    // إعدادات الحسابات
    accounts: Object.freeze({
      roles: Object.freeze([
        "student",
        "teacher",
        "parent",
        "owner"
      ]),

      defaultRole: "student",
      requireTeacherApproval: true,
      requireOwnerApprovalForPayments: true
    }),

    // إعدادات الاشتراكات
    subscriptions: Object.freeze({
      platformCommissionPercent: 20,
      teacherSharePercent: 80,
      teacherSubscriptionEnabled: true,
      studentCourseSubscriptionEnabled: true,
      paymentApprovalRequired: true
    }),

    // إعدادات الدفع اليدوي
    payments: Object.freeze({
      provider: "vodafone_cash",
      currency: "EGP",
      automaticActivation: false,
      requireTransferProof: true,
      requireOwnerApproval: true,

      // يحدده مالك المنصة عند تجهيز النظام.
      // لا تضع رقمًا تجريبيًا هنا.
      vodafoneCashNumber: ""
    }),

    // إعدادات الخدمات الخلفية
    backend: Object.freeze({
      enabled: false,

      /*
       * ضع عنوان خادمك الحقيقي بعد نشر الـ Backend.
       * مثال توضيحي فقط:
       * https://api.your-domain.com
       *
       * لا تستخدم عنوان المثال كما هو.
       */
      baseURL: "",

      requestTimeout: 15000,
      credentials: "include"
    }),

    // إعدادات التخزين المحلي
    storage: Object.freeze({
      prefix: "mostaqbali_",
      saveTheme: true,
      saveLanguage: true,
      saveDrafts: true
    }),

    // إعدادات الامتحانات
    exams: Object.freeze({
      options: ["A", "B", "C", "D"],
      allowQuestionImages: true,
      saveResults: true,
      showCorrectAnswersAfterSubmission: true
    }),

    // إعدادات الملفات
    uploads: Object.freeze({
      allowedImageTypes: [
        "image/jpeg",
        "image/png",
        "image/webp"
      ],

      allowedDocumentTypes: [
        "application/pdf"
      ],

      maxImageSizeMB: 5,
      maxDocumentSizeMB: 20
    }),

    // إعدادات الاتصال
    network: Object.freeze({
      onlineCheckEnabled: true,
      retryCount: 2,
      retryDelay: 1000
    }),

    // إعدادات التطوير
    development: Object.freeze({
      debug: false,
      showErrorDetails: false
    })
  });

  // إتاحة الإعدادات لبقية ملفات المشروع.
  global.MOSTAQBALI_CONFIG = MOSTAQBALI_CONFIG;

  // أدوات مساعدة لقراءة الإعدادات.
  global.MOSTAQBALI_SETTINGS = Object.freeze({
    get(path, fallback = undefined) {
      if (typeof path !== "string" || !path.trim()) {
        return fallback;
      }

      const value = path
        .split(".")
        .reduce((current, key) => {
          if (
            current === null ||
            current === undefined ||
            !Object.prototype.hasOwnProperty.call(current, key)
          ) {
            return undefined;
          }

          return current[key];
        }, MOSTAQBALI_CONFIG);

      return value === undefined ? fallback : value;
    },

    isBackendConfigured() {
      return Boolean(
        MOSTAQBALI_CONFIG.backend.enabled &&
        MOSTAQBALI_CONFIG.backend.baseURL
      );
    },

    getApiURL(path = "") {
      const baseURL = MOSTAQBALI_CONFIG.backend.baseURL;

      if (!baseURL) {
        return "";
      }

      return (
        baseURL.replace(/\/+$/, "") +
        "/" +
        String(path).replace(/^\/+/, "")
      );
    }
  });

  // تحقق من صحة نسب التوزيع.
  const commission =
    MOSTAQBALI_CONFIG.subscriptions.platformCommissionPercent;

  const teacherShare =
    MOSTAQBALI_CONFIG.subscriptions.teacherSharePercent;

  if (commission + teacherShare !== 100) {
    console.error(
      "[MOSTAQBALI] خطأ في إعدادات نسب توزيع الإيرادات."
    );
  }

  // لا نطبع معلومات حساسة في وحدة التحكم.
  if (MOSTAQBALI_CONFIG.development.debug) {
    console.info(
      "[MOSTAQBALI] تم تحميل إعدادات المنصة."
    );
  }
})(window);
