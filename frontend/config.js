"use strict";

window.MOSTAQBALI_CONFIG = Object.freeze({
APP_NAME: "المستقبلي",
APP_NAME_EN: "MOSTAQBALI",
TAGLINE: "مستقبلك يبدأ من هنا.",
VERSION: "1.0.0",

/*

* اترك API_BASE_URL فارغًا أثناء اختبار الواجهة فقط.
* عند تجهيز الخادم، ضع عنوان API الحقيقي هنا.
* 
* مثال توضيحي فقط:
* API_BASE_URL: "https://api.example.com"
  */
  API_BASE_URL: "",

/*

* الوضع المحلي للواجهة ليس مصادقة حقيقية.
* لا تضع مفاتيح API السرية داخل هذا الملف.
  */
  DEMO_MODE: true,

STORAGE_KEYS: Object.freeze({
PROFILE: "mostaqbali_profile_v1",
SETTINGS: "mostaqbali_settings_v1",
SUPPORT: "mostaqbali_support_v1",
NOTIFICATIONS: "mostaqbali_notifications_v1",
PROGRESS: "mostaqbali_progress_v1",
LOCAL_DRAFT: "mostaqbali_draft_v1"
}),

ROLES: Object.freeze({
STUDENT: "student",
TEACHER: "teacher",
PARENT: "parent",
ADMIN: "admin",
SUPPORT: "support"
}),

ROLE_LABELS: Object.freeze({
student: "طالب",
teacher: "مدرس",
parent: "ولي أمر",
admin: "مالك المنصة",
support: "خدمة العملاء"
}),

STAGES: Object.freeze([
{ value: "prep", label: "المرحلة الإعدادية" },
{ value: "secondary", label: "المرحلة الثانوية" },
{ value: "baccalaureate", label: "البكالوريا" }
]),

GRADES: Object.freeze([
{ value: "first-prep", label: "الأول الإعدادي", stage: "prep" },
{ value: "second-prep", label: "الثاني الإعدادي", stage: "prep" },
{ value: "third-prep", label: "الثالث الإعدادي", stage: "prep" },
{ value: "first-secondary", label: "الأول الثانوي", stage: "secondary" },
{ value: "second-secondary", label: "الثاني الثانوي", stage: "secondary" },
{ value: "third-secondary", label: "الثالث الثانوي", stage: "secondary" }
]),

TRACKS: Object.freeze([
{ value: "science", label: "علمي علوم" },
{ value: "math", label: "علمي رياضة" },
{ value: "literary", label: "أدبي" }
]),

SUBJECTS: Object.freeze([
{
id: "physics",
name: "الفيزياء",
icon: "∑",
color: "#2864f0",
tint: "#eaf0ff",
description: "القوانين والتطبيقات والمسائل الفيزيائية."
},
{
id: "chemistry",
name: "الكيمياء",
icon: "⚗",
color: "#7957e8",
tint: "#f0eaff",
description: "التفاعلات والمعادلات والمفاهيم الكيميائية."
},
{
id: "biology",
name: "الأحياء",
icon: "⌘",
color: "#19a974",
tint: "#e4f8ef",
description: "فهم الكائنات الحية وأجهزة الجسم والوراثة."
},
{
id: "arabic",
name: "اللغة العربية",
icon: "ع",
color: "#df8b30",
tint: "#fff0e0",
description: "النحو والبلاغة والأدب والقراءة."
},
{
id: "english",
name: "اللغة الإنجليزية",
icon: "A",
color: "#2779c7",
tint: "#e5f3ff",
description: "القواعد والقراءة والكتابة والمفردات."
},
{
id: "math",
name: "الرياضيات",
icon: "π",
color: "#d74e69",
tint: "#fff0f3",
description: "المفاهيم الرياضية والتدريبات."
},
{
id: "french",
name: "اللغة الفرنسية",
icon: "F",
color: "#7a5bbd",
tint: "#f0eaff",
description: "المفردات والقواعد والتدريبات."
},
{
id: "religion",
name: "التربية الدينية",
icon: "◈",
color: "#178b75",
tint: "#e4f8f1",
description: "دروس التربية الدينية والمراجعات."
}
]),

SUBSCRIPTION_STATUS: Object.freeze({
ACTIVE: "active",
PENDING: "pending",
EXPIRED: "expired",
CANCELLED: "cancelled"
}),

TEACHER_STATUS: Object.freeze({
PENDING: "pending",
APPROVED: "approved",
REJECTED: "rejected",
SUSPENDED: "suspended"
}),

SECURITY: Object.freeze({
MIN_PASSWORD_LENGTH: 8,
SESSION_HANDLING: "server_required",
PAYMENT_VERIFICATION: "server_required",
ROLE_AUTHORIZATION: "server_required"
})
});
