/* =========================================================
   MOSTAQBALI | المستقبلي
   الملف الثالث: config.js
   الإعدادات العامة والثوابت الأساسية للمنصة
   ========================================================= */

(function () {
  "use strict";

  const MOSTAQBALI = window.MOSTAQBALI || {};

  /* =========================================================
     1. بيانات المنصة
     ========================================================= */

  MOSTAQBALI.config = {
    name: "المستقبلي",
    nameEn: "MOSTAQBALI",
    description: "منصتك التعليمية لمستقبل أفضل",
    version: "1.0.0",
    language: "ar",
    direction: "rtl",
    country: "EG",
    currency: "EGP",
    currencySymbol: "ج.م",

    // نسبة المنصة الافتراضية من قيمة الاشتراك.
    // يجب اعتمادها فعليًا في الخادم عند ربط قاعدة البيانات.
    platformCommissionPercent: 20,

    // النسبة الافتراضية للمدرس.
    teacherSharePercent: 80,

    // مدة شاشة البداية بالمللي ثانية.
    splashDuration: 5000,

    // لا تضع مفاتيح سرية أو مفاتيح إدارة الخادم هنا.
    // أي قيمة في ملفات الواجهة يمكن للمستخدم الاطلاع عليها.
    apiBaseUrl: "",

    // تظل المنصة في وضع الواجهة حتى يتم ربط خدمة خلفية حقيقية.
    backendEnabled: false,

    // لا يُفعّل هذا الخيار إلا بعد إعداد خدمة دفع حقيقية.
    onlinePaymentsEnabled: false,

    // الدفع اليدوي لا يُعتمد إلا بعد مراجعة الإدارة.
    manualPaymentRequiresApproval: true
  };

  /* =========================================================
     2. ألوان الهوية البصرية
     ========================================================= */

  MOSTAQBALI.theme = {
    colors: {
      navy: "#101B3D",
      blue: "#2864F0",
      purple: "#7957E8",
      background: "#F4F7FC",
      white: "#FFFFFF",
      text: "#17213A",
      muted: "#74809A",
      border: "#E4E9F2",
      success: "#159A67",
      warning: "#D99116",
      danger: "#D64545",
      info: "#2478C7"
    },

    fonts: {
      primary: "Cairo",
      fallback: "Tahoma, Arial, sans-serif"
    }
  };

  /* =========================================================
     3. المراحل والصفوف الدراسية
     ========================================================= */

  MOSTAQBALI.education = {
    stages: [
      {
        id: "primary",
        name: "المرحلة الابتدائية",
        grades: [
          { id: "primary_1", name: "الصف الأول الابتدائي", order: 1 },
          { id: "primary_2", name: "الصف الثاني الابتدائي", order: 2 },
          { id: "primary_3", name: "الصف الثالث الابتدائي", order: 3 },
          { id: "primary_4", name: "الصف الرابع الابتدائي", order: 4 },
          { id: "primary_5", name: "الصف الخامس الابتدائي", order: 5 },
          { id: "primary_6", name: "الصف السادس الابتدائي", order: 6 }
        ]
      },

      {
        id: "preparatory",
        name: "المرحلة الإعدادية",
        grades: [
          { id: "preparatory_1", name: "الصف الأول الإعدادي", order: 1 },
          { id: "preparatory_2", name: "الصف الثاني الإعدادي", order: 2 },
          { id: "preparatory_3", name: "الصف الثالث الإعدادي", order: 3 }
        ]
      },

      {
        id: "secondary",
        name: "المرحلة الثانوية",
        grades: [
          {
            id: "secondary_1",
            name: "الصف الأول الثانوي",
            order: 1,
            branches: []
          },
          {
            id: "secondary_2",
            name: "الصف الثاني الثانوي",
            order: 2,
            branches: [
              { id: "science", name: "علمي" },
              { id: "literary", name: "أدبي" }
            ]
          },
          {
            id: "secondary_3",
            name: "الصف الثالث الثانوي",
            order: 3,
            branches: [
              { id: "science_science", name: "علمي علوم" },
              { id: "science_math", name: "علمي رياضة" },
              { id: "literary", name: "أدبي" }
            ]
          }
        ]
      }
    ],

    /*
      الفروع هنا بيانات اختيارية بحسب الصف.
      لا يتم افتراض فرع لطالب أو مدرس تلقائيًا.
      الربط الفعلي يعتمد على الصف والفرع المحددين.
    */
    getStages() {
      return this.stages.map(stage => ({
        id: stage.id,
        name: stage.name
      }));
    },

    getGrades(stageId) {
      const stage = this.stages.find(item => item.id === stageId);
      return stage ? stage.grades.slice() : [];
    },

    getGrade(stageId, gradeId) {
      const stage = this.stages.find(item => item.id === stageId);

      if (!stage) {
        return null;
      }

      return stage.grades.find(grade => grade.id === gradeId) || null;
    },

    getBranches(stageId, gradeId) {
      const grade = this.getGrade(stageId, gradeId);
      return grade && Array.isArray(grade.branches)
        ? grade.branches.slice()
        : [];
    },

    getStageName(stageId) {
      const stage = this.stages.find(item => item.id === stageId);
      return stage ? stage.name : "";
    },

    getGradeName(stageId, gradeId) {
      const grade = this.getGrade(stageId, gradeId);
      return grade ? grade.name : "";
    },

    getBranchName(stageId, gradeId, branchId) {
      const branches = this.getBranches(stageId, gradeId);
      const branch = branches.find(item => item.id === branchId);
      return branch ? branch.name : "";
    }
  };

  /* =========================================================
     4. المواد الدراسية
     ========================================================= */

  MOSTAQBALI.subjects = {
    list: [
      {
        id: "arabic",
        name: "اللغة العربية",
        icon: "book",
        color: "#2864F0",
        stages: ["primary", "preparatory", "secondary"]
      },
      {
        id: "english",
        name: "اللغة الإنجليزية",
        icon: "language",
        color: "#7957E8",
        stages: ["primary", "preparatory", "secondary"]
      },
      {
        id: "french",
        name: "اللغة الفرنسية",
        icon: "languages",
        color: "#2478C7",
        stages: ["preparatory", "secondary"]
      },
      {
        id: "mathematics",
        name: "الرياضيات",
        icon: "calculator",
        color: "#159A67",
        stages: ["primary", "preparatory", "secondary"]
      },
      {
        id: "science",
        name: "العلوم",
        icon: "flask",
        color: "#0F9C9A",
        stages: ["primary", "preparatory"]
      },
      {
        id: "physics",
        name: "الفيزياء",
        icon: "atom",
        color: "#2864F0",
        stages: ["secondary"]
      },
      {
        id: "chemistry",
        name: "الكيمياء",
        icon: "flask",
        color: "#D99116",
        stages: ["secondary"]
      },
      {
        id: "biology",
        name: "الأحياء",
        icon: "leaf",
        color: "#159A67",
        stages: ["secondary"]
      },
      {
        id: "geology",
        name: "الجيولوجيا",
        icon: "mountain",
        color: "#A46A3F",
        stages: ["secondary"]
      },
      {
        id: "history",
        name: "التاريخ",
        icon: "landmark",
        color: "#B8752D",
        stages: ["preparatory", "secondary"]
      },
      {
        id: "geography",
        name: "الجغرافيا",
        icon: "globe",
        color: "#0F9C9A",
        stages: ["preparatory", "secondary"]
      },
      {
        id: "philosophy",
        name: "الفلسفة والمنطق",
        icon: "brain",
        color: "#7957E8",
        stages: ["secondary"]
      },
      {
        id: "psychology",
        name: "علم النفس والاجتماع",
        icon: "users",
        color: "#D64575",
        stages: ["secondary"]
      },
      {
        id: "religion",
        name: "التربية الدينية",
        icon: "book-open",
        color: "#159A67",
        stages: ["primary", "preparatory", "secondary"]
      },
      {
        id: "national",
        name: "التربية الوطنية",
        icon: "flag",
        color: "#D64545",
        stages: ["secondary"]
      }
    ],

    getAll() {
      return this.list.slice();
    },

    getById(subjectId) {
      return this.list.find(subject => subject.id === subjectId) || null;
    },

    getByStage(stageId) {
      return this.list.filter(subject => subject.stages.includes(stageId));
    },

    getName(subjectId) {
      const subject = this.getById(subjectId);
      return subject ? subject.name : "";
    }
  };

  /* =========================================================
     5. أنواع الحسابات والصلاحيات
     ========================================================= */

  MOSTAQBALI.roles = {
    STUDENT: "student",
    TEACHER: "teacher",
    PARENT: "parent",
    ADMIN: "admin"
  };

  MOSTAQBALI.permissions = {
    student: [
      "browse_teachers",
      "browse_courses",
      "view_enrolled_lessons",
      "take_available_exams",
      "view_own_results",
      "manage_own_profile"
    ],

    teacher: [
      "manage_own_profile",
      "manage_own_courses",
      "manage_own_lessons",
      "manage_own_exams",
      "view_own_students",
      "view_own_course_reports"
    ],

    parent: [
      "view_linked_students",
      "view_linked_student_progress",
      "view_linked_student_results",
      "view_linked_student_subscriptions"
    ],

    admin: [
      "manage_users",
      "review_teacher_applications",
      "manage_courses",
      "review_payment_proofs",
      "manage_subscriptions",
      "manage_notifications",
      "manage_support",
      "view_platform_reports",
      "manage_platform_settings"
    ]
  };

  /*
    هذه القواعد مرجعية للواجهة فقط.
    يجب التحقق من الصلاحيات داخل الخادم أيضًا.
  */
  MOSTAQBALI.access = {
    hasPermission(role, permission) {
      const list = MOSTAQBALI.permissions[role] || [];
      return list.includes(permission);
    },

    isValidRole(role) {
      return Object.values(MOSTAQBALI.roles).includes(role);
    }
  };

  /* =========================================================
     6. المدرسون والتقديم
     ========================================================= */

  MOSTAQBALI.teachers = {
    applicationStatuses: {
      DRAFT: "draft",
      PENDING: "pending",
      APPROVED: "approved",
      REJECTED: "rejected",
      SUSPENDED: "suspended"
    },

    /*
      المدرس يستطيع إضافة أكثر من تكليف تدريسي.
      كل تكليف يحدد المرحلة والصف والفرع والمادة.
      مثال:
      [
        {
          stageId: "secondary",
          gradeId: "secondary_2",
          branchId: "science",
          subjectId: "physics"
        },
        {
          stageId: "secondary",
          gradeId: "secondary_3",
          branchId: "science_science",
          subjectId: "physics"
        }
      ]
    */
    createTeachingAssignment({
      stageId,
      gradeId,
      branchId = "",
      subjectId
    }) {
      const grade = MOSTAQBALI.education.getGrade(stageId, gradeId);
      const subject = MOSTAQBALI.subjects.getById(subjectId);

      if (!grade) {
        throw new Error("الصف الدراسي المحدد غير صحيح.");
      }

      if (!subject || !subject.stages.includes(stageId)) {
        throw new Error("المادة غير متاحة في المرحلة المحددة.");
      }

      const branches = MOSTAQBALI.education.getBranches(stageId, gradeId);

      if (branches.length > 0 && !branches.some(branch => branch.id === branchId)) {
        throw new Error("يجب اختيار الفرع الدراسي الصحيح.");
      }

      if (branches.length === 0 && branchId) {
        throw new Error("لا يحتاج هذا الصف إلى تحديد فرع.");
      }

      return {
        stageId,
        gradeId,
        branchId: branchId || "",
        subjectId
      };
    },

    validateTeachingAssignment(assignment) {
      try {
        this.createTeachingAssignment(assignment);
        return { valid: true, error: "" };
      } catch (error) {
        return {
          valid: false,
          error: error.message || "بيانات التكليف التدريسي غير صحيحة."
        };
      }
    },

    matchesStudent(assignment, student) {
      if (!assignment || !student) {
        return false;
      }

      return (
        assignment.stageId === student.stageId &&
        assignment.gradeId === student.gradeId &&
        (assignment.branchId || "") === (student.branchId || "")
      );
    }
  };

  /* =========================================================
     7. الدورات والمحتوى التعليمي
     ========================================================= */

  MOSTAQBALI.courses = {
    statuses: {
      DRAFT: "draft",
      PENDING: "pending",
      PUBLISHED: "published",
      ARCHIVED: "archived"
    },

    lessonTypes: [
      { id: "video", name: "فيديو" },
      { id: "document", name: "ملف تعليمي" },
      { id: "text", name: "شرح مكتوب" },
      { id: "external", name: "رابط خارجي" }
    ],

    visibility: {
      PUBLIC: "public",
      ENROLLED: "enrolled",
      SUBSCRIBERS: "subscribers"
    }
  };

  /* =========================================================
     8. الاختبارات والنتائج
     ========================================================= */

  MOSTAQBALI.exams = {
    questionTypes: {
      MULTIPLE_CHOICE: "multiple_choice"
    },

    answerOptions: [
      { id: "A", label: "أ" },
      { id: "B", label: "ب" },
      { id: "C", label: "ج" },
      { id: "D", label: "د" }
    ],

    statuses: {
      DRAFT: "draft",
      PUBLISHED: "published",
      CLOSED: "closed"
    },

    /*
      يحسب النسبة المئوية فقط.
      حفظ الإجابات والنتائج الدائمة يحتاج إلى قاعدة بيانات.
    */
    calculateScore(correctAnswers, totalQuestions) {
      if (!Number.isFinite(correctAnswers) ||
          !Number.isFinite(totalQuestions) ||
          totalQuestions <= 0) {
        return 0;
      }

      const correct = Math.min(
        Math.max(0, correctAnswers),
        totalQuestions
      );

      return Math.round((correct / totalQuestions) * 100);
    }
  };

  /* =========================================================
     9. الاشتراكات والدفع
     ========================================================= */

  MOSTAQBALI.subscriptions = {
    statuses: {
      PENDING: "pending",
      ACTIVE: "active",
      EXPIRED: "expired",
      CANCELLED: "cancelled",
      REJECTED: "rejected"
    },

    defaultDurationDays: 30,

    calculateDistribution(amount) {
      const value = Number(amount);

      if (!Number.isFinite(value) || value < 0) {
        throw new Error("قيمة الاشتراك غير صحيحة.");
      }

      const platformAmount = Math.round(
        value * MOSTAQBALI.config.platformCommissionPercent
      ) / 100;

      const teacherAmount = Math.round(
        (value - platformAmount) * 100
      ) / 100;

      return {
        total: Math.round(value * 100) / 100,
        platformAmount,
        teacherAmount,
        currency: MOSTAQBALI.config.currency
      };
    }
  };

  MOSTAQBALI.payments = {
    methods: {
      VODAFONE_CASH: "vodafone_cash"
    },

    statuses: {
      PENDING: "pending",
      APPROVED: "approved",
      REJECTED: "rejected"
    },

    proofRequired: true,
    adminApprovalRequired: true,

    /*
      لا يوضع رقم محفظة افتراضي حتى لا يظهر رقم غير حقيقي.
      يضاف الرقم الحقيقي من إعدادات الإدارة بعد ربط النظام.
    */
    walletNumber: ""
  };

  /* =========================================================
     10. بيانات المحافظات والمواقع
     ========================================================= */

  MOSTAQBALI.locations = {
    country: "مصر",

    /*
      هذه قائمة أولية للمحافظات، وليست قاعدة بيانات كاملة
      للمراكز والقرى. لا تُعرض اختيارات محلية غير متاحة
      على أنها بيانات رسمية مكتملة.
    */
    governorates: [
      { id: "cairo", name: "القاهرة" },
      { id: "giza", name: "الجيزة" },
      { id: "alexandria", name: "الإسكندرية" },
      { id: "qalyubia", name: "القليوبية" },
      { id: "monufia", name: "المنوفية" },
      { id: "gharbia", name: "الغربية" },
      { id: "kafr_el_sheikh", name: "كفر الشيخ" },
      { id: "beheira", name: "البحيرة" },
      { id: "dakahlia", name: "الدقهلية" },
      { id: "damietta", name: "دمياط" },
      { id: "sharqia", name: "الشرقية" },
      { id: "ismailia", name: "الإسماعيلية" },
      { id: "port_said", name: "بورسعيد" },
      { id: "suez", name: "السويس" },
      { id: "north_sinai", name: "شمال سيناء" },
      { id: "south_sinai", name: "جنوب سيناء" },
      { id: "faiyum", name: "الفيوم" },
      { id: "beni_suef", name: "بني سويف" },
      { id: "minya", name: "المنيا" },
      { id: "asyut", name: "أسيوط" },
      { id: "sohag", name: "سوهاج" },
      { id: "qena", name: "قنا" },
      { id: "luxor", name: "الأقصر" },
      { id: "aswan", name: "أسوان" },
      { id: "red_sea", name: "البحر الأحمر" },
      { id: "new_valley", name: "الوادي الجديد" },
      { id: "matrouh", name: "مطروح" }
    ],

    getGovernorates() {
      return this.governorates.slice();
    },

    getGovernorateName(governorateId) {
      const item = this.governorates.find(
        governorate => governorate.id === governorateId
      );

      return item ? item.name : "";
    },

    /*
      تُستكمل هذه الدوال لاحقًا ببيانات موثوقة للمراكز
      والمدن والقرى، مع اختيار متدرج:
      محافظة ← مركز/مدينة ← قرية/منطقة.
    */
    getDistricts() {
      return [];
    },

    getLocalities() {
      return [];
    }
  };

  /* =========================================================
     11. الصور والملفات
     ========================================================= */

  MOSTAQBALI.media = {
    allowedImageTypes: [
      "image/jpeg",
      "image/png",
      "image/webp"
    ],

    allowedDocumentTypes: [
      "application/pdf"
    ],

    maxProfileImageSizeMB: 5,
    maxDocumentSizeMB: 20,

    isAllowedImage(file) {
      return Boolean(
        file &&
        this.allowedImageTypes.includes(file.type) &&
        file.size <= this.maxProfileImageSizeMB * 1024 * 1024
      );
    },

    isAllowedDocument(file) {
      return Boolean(
        file &&
        this.allowedDocumentTypes.includes(file.type) &&
        file.size <= this.maxDocumentSizeMB * 1024 * 1024
      );
    }
  };

  /* =========================================================
     12. الإشعارات والدعم
     ========================================================= */

  MOSTAQBALI.notifications = {
    types: {
      GENERAL: "general",
      COURSE: "course",
      EXAM: "exam",
      PAYMENT: "payment",
      SUBSCRIPTION: "subscription",
      SUPPORT: "support"
    }
  };

  MOSTAQBALI.support = {
    ticketStatuses: {
      OPEN: "open",
      IN_PROGRESS: "in_progress",
      WAITING: "waiting",
      RESOLVED: "resolved",
      CLOSED: "closed"
    },

    priorities: {
      LOW: "low",
      NORMAL: "normal",
      HIGH: "high",
      URGENT: "urgent"
    }
  };

  /* =========================================================
     13. التخزين المحلي المؤقت
     ========================================================= */

  MOSTAQBALI.storage = {
    keys: {
      theme: "mostaqbali_theme",
      language: "mostaqbali_language",
      onboardingSeen: "mostaqbali_onboarding_seen",
      lastRoute: "mostaqbali_last_route"
    },

    get(key, fallback = null) {
      try {
        const value = localStorage.getItem(key);
        return value === null ? fallback : value;
      } catch (error) {
        return fallback;
      }
    },

    set(key, value) {
      try {
        localStorage.setItem(key, String(value));
        return true;
      } catch (error) {
        return false;
      }
    },

    remove(key) {
      try {
        localStorage.removeItem(key);
        return true;
      } catch (error) {
        return false;
      }
    }
  };

  /* =========================================================
     14. رسائل النظام
     ========================================================= */

  MOSTAQBALI.messages = {
    loading: "جاري التحميل...",
    saved: "تم حفظ التغييرات على هذا الجهاز.",
    connectionRequired: "هذه الميزة تحتاج إلى ربط النظام بالخادم.",
    loginRequired: "سجّل الدخول أولًا للمتابعة.",
    permissionDenied: "ليس لديك صلاحية لتنفيذ هذا الإجراء.",
    invalidData: "راجع البيانات المدخلة وحاول مرة أخرى.",
    paymentPending: "تم تسجيل الطلب محليًا، ولم يتم تأكيد الدفع.",
    backendUnavailable: "الخدمة الخلفية غير متصلة حاليًا."
  };

  /* =========================================================
     15. أدوات مساعدة عامة
     ========================================================= */

  MOSTAQBALI.utils = {
    isNonEmptyString(value) {
      return typeof value === "string" && value.trim().length > 0;
    },

    escapeHTML(value) {
      return String(value ?? "").replace(/[&<>"']/g, character => {
        const entities = {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;"
        };

        return entities[character];
      });
    },

    formatCurrency(amount) {
      const value = Number(amount);

      if (!Number.isFinite(value)) {
        return "—";
      }

      return new Intl.NumberFormat("ar-EG", {
        style: "currency",
        currency: MOSTAQBALI.config.currency,
        maximumFractionDigits: 2
      }).format(value);
    },

    formatDate(dateValue) {
      const date = new Date(dateValue);

      if (Number.isNaN(date.getTime())) {
        return "—";
      }

      return new Intl.DateTimeFormat("ar-EG", {
        year: "numeric",
        month: "long",
        day: "numeric"
      }).format(date);
    },

    createId(prefix = "item") {
      if (window.crypto && typeof window.crypto.randomUUID === "function") {
        return `${prefix}_${window.crypto.randomUUID()}`;
      }

      return `${prefix}_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 10)}`;
    }
  };

  /* =========================================================
     16. حالة التطبيق
     ========================================================= */

  MOSTAQBALI.state = MOSTAQBALI.state || {
    initialized: false,
    currentUser: null,
    currentRoute: "home",
    connection: "offline",
    demoMode: true
  };

  /* =========================================================
     17. نشر الإعدادات للاستخدام في الملفات الأخرى
     ========================================================= */

  window.MOSTAQBALI = MOSTAQBALI;

})();
