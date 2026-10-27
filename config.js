"use strict";

window.MOSTAQBALI_CONFIG = Object.freeze({
  appName: "المستقبلي",
  appNameEnglish: "MOSTAQBALI",
  language: "ar",
  direction: "rtl",

  environment: "development",

  features: Object.freeze({
    publicLandingPage: true,

    authentication: false,
    studentDashboard: false,
    teacherDashboard: false,
    parentDashboard: false,
    adminDashboard: false,

    realPayments: false,
    realNotifications: false,
    realAttendance: false
  }),

  backend: Object.freeze({
    provider: "supabase",
    configured: false
  })
});
