"use strict";

(() => {
const CONFIG = window.MOSTAQBALI_CONFIG;

if (!CONFIG) {
document.body.innerHTML =
"<div style='padding:30px;font-family:Arial;text-align:center'>خطأ: ملف config.js غير موجود.</div>";
return;
}

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const state = {
user: null,
page: "overview",
authMode: "login",
sidebarOpen: false,
modalOpen: false,
searchQuery: "",
courses: [],
teachers: [],
exams: [],
groups: [],
notifications: [],
supportTickets: [],
progress: 0,
settings: {
notifications: true,
studyReminders: true
}
};

const PAGE_TITLES = {
overview: "الرئيسية",
subjects: "المواد الدراسية",
courses: "الكورسات والدروس",
exams: "الامتحانات",
teachers: "المدرسون",
groups: "المجموعات التعليمية",
progress: "مستواي الدراسي",
students: "إدارة الطلاب",
parents: "متابعة الأبناء",
subscriptions: "الاشتراكات",
notifications: "الإشعارات",
support: "خدمة العملاء",
profile: "الملف الشخصي",
settings: "الإعدادات",
admin: "إدارة المنصة"
};

const ROLE_PAGES = {
student: [
"overview", "subjects", "courses", "exams", "teachers",
"groups", "progress", "subscriptions", "notifications",
"support", "profile", "settings"
],
teacher: [
"overview", "courses", "exams", "groups", "students",
"subscriptions", "notifications", "support", "profile", "settings"
],
parent: [
"overview", "courses", "teachers", "progress", "parents",
"subscriptions", "notifications", "support", "profile", "settings"
],
admin: [
"overview", "subjects", "courses", "exams", "teachers",
"groups", "progress", "students", "parents", "subscriptions",
"notifications", "support", "profile", "settings", "admin"
],
support: [
"overview", "notifications", "support", "profile", "settings"
]
};

const ROLE_NOTICES = {
student: "يمكنك استكشاف المواد ومتابعة الدروس والامتحانات. لن يظهر المحتوى المدفوع إلا بعد التحقق من الاشتراك الفعلي.",
teacher: "حساب المدرس يحتاج إلى اعتماد الإدارة قبل نشر المحتوى. إدارة المحتوى الفعلية ستُربط بالخادم في مرحلة التنفيذ التالية.",
parent: "تحتاج متابعة الطالب إلى ربط موثّق بين حساب ولي الأمر وحساب الطالب.",
admin: "واجهة إدارة المنصة تحتاج إلى حساب مالك موثّق وصلاحيات خادمية قبل إجراء أي تغييرات فعلية.",
support: "تظهر تذاكر الدعم الحقيقية بعد ربط نظام خدمة العملاء بالخادم."
};

function escapeHTML(value) {
return String(value ?? "").replace(/[&<>"']/g, character => ({
"&": "&",
"<": "<",
">": ">",
'"': """,
"'": "'"
})[character]);
}

function readLocal(key, fallback) {
try {
const raw = localStorage.getItem(key);
return raw ? JSON.parse(raw) : fallback;
} catch {
return fallback;
}
}

function writeLocal(key, value) {
try {
localStorage.setItem(key, JSON.stringify(value));
return true;
} catch {
showToast("تعذر حفظ البيانات على هذا الجهاز.", "error");
return false;
}
}

function showToast(message, type = "info") {
const container = $("#toastContainer");
if (!container) return;

const toast = document.createElement("div");
toast.className = `toast ${type}`;
toast.textContent = message;
container.appendChild(toast);

window.setTimeout(() => {
  toast.remove();
}, 3600);

}

function showFormError(message) {
const box = $("#authError");
if (!box) return;
box.textContent = message;
box.classList.remove("hidden");
}

function clearFormError() {
const box = $("#authError");
if (!box) return;
box.textContent = "";
box.classList.add("hidden");
}

function getInitial(name) {
const normalized = String(name || "").trim();
return normalized ? normalized.charAt(0) : "م";
}

function getRoleLabel(role) {
return CONFIG.ROLE_LABELS[role] || "مستخدم";
}

function getStageLabel(stage) {
return CONFIG.STAGES.find(item => item.value === stage)?.label || "غير محددة";
}

function getGradeLabel(grade) {
return CONFIG.GRADES.find(item => item.value === grade)?.label || "غير محدد";
}

function getTrackLabel(track) {
return CONFIG.TRACKS.find(item => item.value === track)?.label || "غير محددة";
}

function currentUser() {
return state.user;
}

function userCanOpenPage(page) {
const user = currentUser();
if (!user) return false;
const allowedPages = ROLE_PAGES[user.role] || [];
return allowedPages.includes(page);
}

function setAuthMode(mode) {
state.authMode = mode === "register" ? "register" : "login";

const register = state.authMode === "register";

$$(".auth-tab").forEach(tab => {
  tab.classList.toggle("active", tab.dataset.authMode === state.authMode);
});

$("#authTitle").textContent = register ? "أنشئ حسابك" : "سجّل دخولك";
$("#authSubtitle").textContent = register
  ? "ابدأ رحلتك التعليمية مع المستقبلي."
  : "سجّل الدخول لمتابعة رحلتك التعليمية.";

$("#registerNameGroup").classList.toggle("hidden", !register);
$("#registerExtraFields").classList.toggle("hidden", !register);
$("#forgotPasswordButton").classList.toggle("hidden", register);
$("#authSubmit").textContent = register ? "إنشاء الحساب" : "تسجيل الدخول";

$("#authName").required = register;
$("#authName").disabled = !register;

const role = $("#authRole").value;
updateRoleFields(role);

$("#authPassword").autocomplete = register ? "new-password" : "current-password";
clearFormError();

}

function updateRoleFields(role) {
const register = state.authMode === "register";
const student = register && role === "student";
const teacher = register && role === "teacher";

$("#studentFields").classList.toggle("hidden", !student);
$("#teacherFields").classList.toggle("hidden", !teacher);

$("#authStage").required = student;
$("#authGrade").required = student;
$("#authTrack").required = false;
$("#authSpecialty").required = teacher;
$("#authPhone").required = false;

}

function showAuth() {
$("#mainApp").classList.add("hidden");
$("#authScreen").classList.remove("hidden");
closeSidebar();
setAuthMode(state.authMode);
}

function showApp() {
$("#authScreen").classList.add("hidden");
$("#mainApp").classList.remove("hidden");
renderUserIdentity();
renderDashboard();
navigateTo("overview");
}

function renderUserIdentity() {
const user = currentUser();
if (!user) return;

const name = escapeHTML(user.name || "مستخدم المستقبلي");
const initial = escapeHTML(getInitial(user.name));
const role = escapeHTML(getRoleLabel(user.role));

$("#sidebarUserName").textContent = name;
$("#sidebarUserRole").textContent = role;
$("#sidebarAvatar").textContent = initial;

$("#topbarUserName").textContent = name;
$("#topbarUserRole").textContent = role;
$("#topbarAvatar").textContent = initial;

$("#welcomeName").textContent = user.name || "بطل المستقبل";
$("#welcomeDescription").textContent = getWelcomeDescription(user.role);

$$(".nav-item[data-roles]").forEach(item => {
  const roles = item.dataset.roles.split(",");
  item.classList.toggle("hidden", !roles.includes(user.role));
});

$$(".admin-only").forEach(item => {
  item.classList.toggle("hidden", user.role !== "admin");
});

const notice = $("#roleNotice");
notice.textContent = ROLE_NOTICES[user.role] || "";
notice.classList.toggle("hidden", !notice.textContent);

}

function getWelcomeDescription(role) {
const descriptions = {
student: "نظّم وقتك، تابع دروسك، واجعل كل يوم خطوة جديدة نحو هدفك.",
teacher: "جهّز محتواك التعليمي، ونظّم دروسك، وتابع طلابك بعد اعتماد حسابك.",
parent: "تابع رحلة أبنائك التعليمية ونتائجهم بعد ربط حساباتهم بصورة موثّقة.",
admin: "من هنا ستتمكن من إدارة المنصة ومراجعة الحسابات والمحتوى والاشتراكات.",
support: "تابع طلبات المساعدة واعمل على تقديم تجربة أفضل لمستخدمي المنصة."
};

return descriptions[role] || descriptions.student;

}

function navigateTo(page) {
if (!PAGE_TITLES[page]) {
showToast("القسم المطلوب غير موجود.", "error");
return;
}

if (!currentUser()) {
  showAuth();
  return;
}

if (!userCanOpenPage(page)) {
  showToast("ليس لديك صلاحية للوصول إلى هذا القسم.", "error");
  return;
}

state.page = page;
closeSidebar();

$("#breadcrumbCurrent").textContent = PAGE_TITLES[page];

$$(".nav-item").forEach(item => {
  item.classList.toggle("active", item.dataset.page === page);
});

if (page === "overview") {
  renderDashboard();
} else {
  renderPage(page);
}

window.scrollTo({ top: 0, behavior: "smooth" });

}

function subjectCard(subject) {
return "<button class="subject-card" data-action="open-subject" data-subject="${escapeHTML(subject.id)}" style="--subject-color:${escapeHTML(subject.color)}; --subject-tint:${escapeHTML(subject.tint)}"> <span class="subject-icon">${escapeHTML(subject.icon)}</span> <span class="subject-copy"> <strong>${escapeHTML(subject.name)}</strong> <span>استكشف المادة ←</span> </span> </button>";
}

function renderSubjects(target, subjects = CONFIG.SUBJECTS) {
const container = $(target);
if (!container) return;

if (!subjects.length) {
  container.innerHTML = emptyState("لا توجد مواد", "ستظهر المواد بعد إضافتها من إدارة المنصة.", "▦");
  return;
}

container.innerHTML = subjects.map(subjectCard).join("");

}

function renderTeachers(target, teachers = state.teachers) {
const container = $(target);
if (!container) return;

if (!teachers.length) {
  container.innerHTML = emptyState(
    "لا توجد بيانات مدرسين متاحة حاليًا",
    "سيظهر هنا المدرسون المعتمدون عند ربط المنصة بمصدر بيانات حقيقي.",
    "♙"
  );
  return;
}

container.innerHTML = teachers.map(teacher => `
  <article class="teacher-card">
    <div class="teacher-avatar">${escapeHTML(getInitial(teacher.name))}</div>
    <h3>${escapeHTML(teacher.name)}</h3>
    <span class="teacher-specialty">${escapeHTML(teacher.specialty || "التخصص غير محدد")}</span>
    <button class="button button-secondary"
      data-action="view-teacher"
      data-id="${escapeHTML(teacher.id)}">عرض الملف</button>
  </article>
`).join("");

}

function renderDashboard() {
if (!currentUser()) return;

renderSubjects("#subjectsGrid");
renderTeachers("#teachersGrid");

$("#statCourses").textContent = String(state.courses.length);
$("#statExams").textContent = String(state.exams.length);
$("#statGroups").textContent = String(state.groups.length);
$("#statProgress").textContent = `${state.progress}%`;
$("#progressLine").style.width = `${Math.min(100, Math.max(0, state.progress))}%`;

renderUpcoming();

}

function renderUpcoming() {
const container = $("#upcomingList");
if (!container) return;

const items = [
  {
    icon: "▤",
    title: "الكورسات والدروس",
    description: "تصفح المحتوى التعليمي المتاح",
    page: "courses"
  },
  {
    icon: "✓",
    title: "الامتحانات",
    description: "راجع الامتحانات المنشورة",
    page: "exams"
  },
  {
    icon: "◇",
    title: "الاشتراكات",
    description: "اطلع على حالة اشتراكاتك",
    page: "subscriptions"
  }
];

container.innerHTML = items.map(item => `
  <div class="upcoming-item">
    <span class="upcoming-item-icon">${item.icon}</span>
    <span class="upcoming-item-copy">
      <strong>${escapeHTML(item.title)}</strong>
      <span>${escapeHTML(item.description)}</span>
    </span>
    <button data-action="navigate" data-page="${item.page}">فتح</button>
  </div>
`).join("");

}

function emptyState(title, description, icon = "▤") {
return "<div class="empty-state"> <div class="empty-state-icon">${escapeHTML(icon)}</div> <h3>${escapeHTML(title)}</h3> <p>${escapeHTML(description)}</p> </div>";
}

function pageHeading(title, description, action = "") {
return "<div class="page-heading"> <div> <span class="section-kicker">المستقبلي</span> <h1>${escapeHTML(title)}</h1> <p>${escapeHTML(description)}</p> </div> ${action} </div>";
}

function renderPage(page) {
const container = $("#pageContainer");
if (!container) return;

const renderers = {
  subjects: renderSubjectsPage,
  courses: renderCoursesPage,
  exams: renderExamsPage,
  teachers: renderTeachersPage,
  groups: renderGroupsPage,
  progress: renderProgressPage,
  students: renderStudentsPage,
  parents: renderParentsPage,
  subscriptions: renderSubscriptionsPage,
  notifications: renderNotificationsPage,
  support: renderSupportPage,
  profile: renderProfilePage,
  settings: renderSettingsPage,
  admin: renderAdminPage
};

const renderer = renderers[page];
if (!renderer) {
  container.innerHTML = pageHeading(PAGE_TITLES[page], "القسم غير متاح.");
  return;
}

renderer(container);

}

function renderSubjectsPage(container) {
container.innerHTML = "${pageHeading("المواد الدراسية", "تصفح المواد المتاحة في المنصة.")} <div class="page-toolbar"> <input id="subjectSearch" type="search" placeholder="ابحث عن مادة..."> </div> <div id="allSubjectsGrid" class="subjects-grid"></div>";

renderSubjects("#allSubjectsGrid");

$("#subjectSearch").addEventListener("input", event => {
  const query = event.target.value.trim().toLowerCase();
  const filtered = CONFIG.SUBJECTS.filter(subject =>
    subject.name.toLowerCase().includes(query) ||
    subject.description.toLowerCase().includes(query)
  );
  renderSubjects("#allSubjectsGrid", filtered);
});

}

function renderCoursesPage(container) {
container.innerHTML = "${pageHeading( state.user.role === "teacher" ? "إدارة الكورسات" : "الكورسات والدروس", state.user.role === "teacher" ? "سيتم ربط إنشاء الكورسات ونشرها بنظام اعتماد المدرسين." : "الكورسات المعروضة يجب أن تكون منشورة من مدرس معتمد." )} <div class="inline-notice"> لا توجد كورسات مستوردة من خادم حتى الآن. هذه الواجهة لا تنشئ اشتراكات أو محتوى مدفوعًا من تلقاء نفسها. </div> <div id="coursesGrid" class="card-grid"></div>";

$("#coursesGrid").innerHTML = state.courses.length
  ? state.courses.map(course => `
    <article class="course-card">
      <div class="course-cover"><span class="course-cover-icon">▤</span></div>
      <div class="course-body">
        <h3>${escapeHTML(course.title)}</h3>
        <p>${escapeHTML(course.description || "لا يوجد وصف.")}</p>
        <div class="course-meta">
          <span>${escapeHTML(course.subject || "غير محدد")}</span>
          <span>${escapeHTML(course.grade || "غير محدد")}</span>
        </div>
      </div>
    </article>
  `).join("")
  : emptyState(
    "لا توجد كورسات متاحة بعد",
    "عندما يُربط النظام بالخادم وينشر المدرسون المعتمدون كورساتهم، ستظهر هنا البيانات الحقيقية.",
    "▤"
  );

}

function renderExamsPage(container) {
container.innerHTML = "${pageHeading("الامتحانات", "تابع الامتحانات المنشورة والنتائج المسجلة لحسابك.")} <div class="inline-notice"> لا يمكن بدء امتحان أو تسجيل نتيجة حقيقية قبل بناء نظام الامتحانات وحفظ الإجابات على الخادم. </div> <div class="data-card"> ${emptyState("لا توجد امتحانات منشورة", "ستظهر الامتحانات بعد إضافتها ونشرها من خلال النظام الفعلي.", "✓")} </div>";
}

function renderTeachersPage(container) {
container.innerHTML = "${pageHeading("المدرسون", "تعرف على المدرسين المعتمدين وتخصصاتهم.")} <div class="inline-notice"> يعرض هذا القسم بيانات المدرسين التي ستصل من قاعدة البيانات، ولا يحتوي على مدرسين تجريبيين معروضين على أنهم حقيقيون. </div> <div id="allTeachersGrid" class="teachers-grid"></div>";

renderTeachers("#allTeachersGrid");

}

function renderGroupsPage(container) {
container.innerHTML = "${pageHeading("المجموعات التعليمية", "مساحات منظمة للتواصل المرتبط بالمواد والصفوف الدراسية.")} <div class="inline-notice"> الرسائل والمجموعات الفعلية تحتاج إلى قاعدة بيانات ونظام صلاحيات وإشراف وحماية من إساءة الاستخدام. </div> <div class="data-card"> ${emptyState("لا توجد مجموعات متاحة", "ستظهر المجموعات المنشأة والمعتمدة بعد ربط النظام بالخادم.", "▧")} </div>";
}

function renderProgressPage(container) {
const user = currentUser();

container.innerHTML = `
  ${pageHeading("مستواي الدراسي", "تابع تقدمك اعتمادًا على الدروس والنتائج المسجلة فعليًا.")}
  <div class="panel">
    <div class="panel-heading">
      <div>
        <h2>الملف الدراسي</h2>
        <p>البيانات المرتبطة بحسابك</p>
      </div>
    </div>
    <div class="profile-info">
      <div class="profile-info-item">
        <span>المرحلة الدراسية</span>
        <strong>${escapeHTML(getStageLabel(user.stage))}</strong>
      </div>
      <div class="profile-info-item">
        <span>الصف الدراسي</span>
        <strong>${escapeHTML(getGradeLabel(user.grade))}</strong>
      </div>
      <div class="profile-info-item">
        <span>الشعبة</span>
        <strong>${escapeHTML(getTrackLabel(user.track))}</strong>
      </div>
      <div class="profile-info-item">
        <span>التقدم المسجل</span>
        <strong>${state.progress}%</strong>
      </div>
    </div>
  </div>
  <div class="panel" style="margin-top:18px">
    ${emptyState("لا توجد نتائج مسجلة", "سيظهر تقدمك الحقيقي بعد تنفيذ نظام الدروس والامتحانات وحفظ النتائج.", "↗")}
  </div>
`;

}

function renderStudentsPage(container) {
container.innerHTML = "${pageHeading("إدارة الطلاب", "عرض الطلاب المسجلين المرتبطين بحساب المدرس أو الإدارة.")} <div class="inline-notice"> لا تُعرض بيانات الطلاب قبل وصولها من قاعدة البيانات والتحقق من صلاحية المستخدم للوصول إليها. </div> <div class="data-card"> ${emptyState("لا توجد بيانات طلاب", "سيتم عرض الطلاب المسموح لك بالوصول إلى بياناتهم بعد ربط الخادم.", "♧")} </div>";
}

function renderParentsPage(container) {
container.innerHTML = "${pageHeading("متابعة الأبناء", "تابع تقدم الطالب بعد ربط الحسابين بطريقة موثقة.")} <div class="panel"> <h2>ربط حساب الطالب</h2> <p class="modal-description"> ستحتاج النسخة النهائية إلى آلية ربط آمنة بموافقة الطالب أو ولي الأمر حسب السياسة المعتمدة، مع التحقق من هوية الحسابين من الخادم. </p> <div class="form-group"> <label for="parentLinkCode">رمز الربط</label> <input id="parentLinkCode" type="text" placeholder="أدخل الرمز الصادر من النظام"> </div> <button class="button button-primary" data-action="request-parent-link"> طلب الربط </button> </div>";
}

function renderSubscriptionsPage(container) {
container.innerHTML = "${pageHeading("الاشتراكات", "إدارة الاشتراك التعليمي واشتراك المدرس في المنصة.")} <div class="card-grid"> <article class="panel"> <span class="section-kicker">اشتراك الطالب</span> <h2>الكورسات التعليمية</h2> <p class="modal-description"> شراء الكورس أو الاشتراك مع مدرس يتطلب سعرًا معتمدًا وطلب دفع وتحققًا فعليًا من الخادم. </p> <span class="status-pill neutral">لا توجد بيانات دفع مرتبطة</span> </article> <article class="panel"> <span class="section-kicker">اشتراك المدرس</span> <h2>الاشتراك في المنصة</h2> <p class="modal-description"> تحدد الإدارة سعر الاشتراك ومدته ومزاياه. لا يُعتمد الاشتراك اعتمادًا على رسالة من المتصفح. </p> <span class="status-pill neutral">بانتظار ربط نظام الاشتراكات</span> </article> </div> <div class="inline-notice" style="margin-top:18px"> لا توجد هنا عملية دفع وهمية. تفعيل أي اشتراك مدفوع يجب أن يحدث بعد تأكيد الدفع من مزود الدفع على الخادم. </div>";
}

function renderNotificationsPage(container) {
container.innerHTML = "${pageHeading("الإشعارات", "تنبيهات الحساب والدروس والامتحانات والدعم.")} <div class="data-card"> ${emptyState( "لا توجد إشعارات", "ستظهر الإشعارات الحقيقية بعد ربط خدمة الإشعارات بالخادم.", "♧" )} </div>";
}

function renderSupportPage(container) {
const tickets = state.supportTickets.filter(ticket => ticket.owner === state.user.id);

container.innerHTML = `
  ${pageHeading("خدمة العملاء", "أرسل طلب مساعدة وتابع الردود من فريق الدعم.")}
  <div class="panel">
    <h2>إنشاء طلب دعم</h2>
    <p class="modal-description">
      النموذج التالي يحفظ مسودة محلية على هذا الجهاز فقط. إرسال تذكرة رسمية ومتابعتها بين الأجهزة يحتاج إلى الخادم.
    </p>
    <form id="supportForm">
      <div class="form-layout">
        <div class="form-group">
          <label for="supportSubject">موضوع الطلب</label>
          <select id="supportSubject" required>
            <option value="">اختر الموضوع</option>
            <option value="account">الحساب وتسجيل الدخول</option>
            <option value="course">الكورسات والدروس</option>
            <option value="payment">الاشتراكات والمدفوعات</option>
            <option value="technical">مشكلة تقنية</option>
            <option value="other">موضوع آخر</option>
          </select>
        </div>
        <div class="form-group">
          <label for="supportPriority">الأولوية</label>
          <select id="supportPriority">
            <option value="normal">عادية</option>
            <option value="high">مرتفعة</option>
          </select>
        </div>
        <div class="form-group full-width">
          <label for="supportMessage">تفاصيل المشكلة</label>
          <textarea id="supportMessage" placeholder="اشرح المشكلة بالتفصيل..." required minlength="10"></textarea>
        </div>
      </div>
      <button class="button button-primary" type="submit">حفظ مسودة الطلب</button>
    </form>
  </div>
  <div class="content-section">
    <div class="section-heading">
      <div><h2>طلباتي</h2><p>المسودات المحفوظة محليًا على هذا الجهاز.</p></div>
    </div>
    <div id="supportTicketsList"></div>
  </div>
`;

const list = $("#supportTicketsList");

list.innerHTML = tickets.length
  ? tickets.map(ticket => `
    <article class="panel" style="margin-bottom:12px">
      <strong>${escapeHTML(ticket.subjectLabel)}</strong>
      <p>${escapeHTML(ticket.message)}</p>
      <span class="status-pill pending">مسودة محلية</span>
    </article>
  `).join("")
  : emptyState("لا توجد طلبات محفوظة", "يمكنك إنشاء مسودة طلب دعم من النموذج أعلاه.", "?");

$("#supportForm").addEventListener("submit", event => {
  event.preventDefault();

  const subject = $("#supportSubject").value;
  const message = $("#supportMessage").value.trim();
  const priority = $("#supportPriority").value;

  if (!subject || message.length < 10) {
    showToast("اختر موضوع الطلب واكتب تفاصيل لا تقل عن 10 أحرف.", "error");
    return;
  }

  const subjectLabels = {
    account: "الحساب وتسجيل الدخول",
    course: "الكورسات والدروس",
    payment: "الاشتراكات والمدفوعات",
    technical: "مشكلة تقنية",
    other: "موضوع آخر"
  };

  state.supportTickets.push({
    id: createId(),
    owner: state.user.id,
    subject,
    subjectLabel: subjectLabels[subject],
    message,
    priority,
    status: "draft",
    createdAt: new Date().toISOString()
  });

  writeLocal(CONFIG.STORAGE_KEYS.SUPPORT, state.supportTickets);
  showToast("تم حفظ مسودة الطلب على هذا الجهاز.", "success");
  renderSupportPage($("#pageContainer"));
});

}

function renderProfilePage(container) {
const user = currentUser();
const profileImage = user.avatar
? "<img src="${escapeHTML(user.avatar)}" alt="الصورة الشخصية">"
: escapeHTML(getInitial(user.name));

container.innerHTML = `
  ${pageHeading("الملف الشخصي", "راجع البيانات الأساسية المرتبطة بالملف المحلي لهذا الجهاز.")}
  <div class="profile-layout">
    <section class="profile-summary">
      <div class="profile-avatar">${profileImage}</div>
      <h2>${escapeHTML(user.name)}</h2>
      <p>${escapeHTML(getRoleLabel(user.role))}</p>
      <span class="status-pill neutral">حساب الواجهة المحلية</span>
      <div style="margin-top:18px">
        <label class="button button-secondary" for="avatarUpload">تغيير الصورة</label>
        <input id="avatarUpload" type="file" accept="image/jpeg,image/png,image/webp" class="hidden">
      </div>
      <p style="font-size:9px;line-height:1.9">
        تُحفظ الصورة محليًا عند نجاح الحفظ. التخزين الدائم والآمن للصور يتطلب الخادم.
      </p>
    </section>

    <section class="panel">
      <h2>بيانات الحساب</h2>
      <form id="profileForm" style="margin-top:20px">
        <div class="form-layout">
          <div class="form-group full-width">
            <label for="profileName">الاسم بالكامل</label>
            <input id="profileName" value="${escapeHTML(user.name)}" required minlength="2">
          </div>
          <div class="form-group full-width">
            <label for="profileEmail">البريد الإلكتروني</label>
            <input id="profileEmail" value="${escapeHTML(user.email)}" type="email" readonly>
          </div>
          ${user.role === "student" ? `
            <div class="form-group">
              <label for="profileStage">المرحلة</label>
              <input id="profileStage" value="${escapeHTML(getStageLabel(user.stage))}" readonly>
            </div>
            <div class="form-group">
              <label for="profileGrade">الصف</label>
              <input id="profileGrade" value="${escapeHTML(getGradeLabel(user.grade))}" readonly>
            </div>
            <div class="form-group full-width">
              <label for="profileTrack">الشعبة</label>
              <input id="profileTrack" value="${escapeHTML(getTrackLabel(user.track))}" readonly>
            </div>
          ` : ""}
          ${user.role === "teacher" ? `
            <div class="form-group full-width">
              <label for="profileSpecialty">التخصص</label>
              <input id="profileSpecialty" value="${escapeHTML(user.specialty || "")}" readonly>
            </div>
          ` : ""}
        </div>
        <button class="button button-primary" type="submit">حفظ الاسم محليًا</button>
      </form>
    </section>
  </div>
`;

$("#profileForm").addEventListener("submit", event => {
  event.preventDefault();
  const name = $("#profileName").value.trim();

  if (name.length < 2) {
    showToast("اكتب اسمًا صحيحًا.", "error");
    return;
  }

  state.user.name = name;
  persistProfile();
  renderUserIdentity();
  renderProfilePage($("#pageContainer"));
  showToast("تم تحديث الاسم على هذا الجهاز.", "success");
});

$("#avatarUpload").addEventListener("change", event => {
  const file = event.target.files?.[0];
  if (!file) return;

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

  if (!allowedTypes.includes(file.type)) {
    showToast("اختر صورة بصيغة JPG أو PNG أو WebP.", "error");
    return;
  }

  if (file.size > 2 * 1024 * 1024) {
    showToast("حجم الصورة يجب ألا يتجاوز 2 ميجابايت.", "error");
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    if (typeof reader.result !== "string") {
      showToast("تعذر قراءة الصورة.", "error");
      return;
    }

    state.user.avatar = reader.result;

    if (persistProfile()) {
      renderUserIdentity();
      renderProfilePage($("#pageContainer"));
      showToast("تم تحديث الصورة على هذا الجهاز.", "success");
    }
  };

  reader.onerror = () => showToast("تعذر قراءة الصورة.", "error");
  reader.readAsDataURL(file);
});

}

function renderSettingsPage(container) {
container.innerHTML = "${pageHeading("الإعدادات", "إدارة تفضيلات الواجهة على هذا الجهاز.")} <div class="settings-list"> <div class="settings-row"> <div> <strong>الإشعارات</strong> <p>تفضيل عرض التنبيهات داخل الواجهة.</p> </div> <button class="simple-toggle ${state.settings.notifications ? "active" : ""}" data-action="toggle-setting" data-setting="notifications" aria-label="تغيير إعداد الإشعارات"></button> </div> <div class="settings-row"> <div> <strong>تذكيرات المذاكرة</strong> <p>تفضيل التذكيرات التعليمية داخل الواجهة.</p> </div> <button class="simple-toggle ${state.settings.studyReminders ? "active" : ""}" data-action="toggle-setting" data-setting="studyReminders" aria-label="تغيير تذكيرات المذاكرة"></button> </div> <div class="settings-row"> <div> <strong>البيانات المحلية</strong> <p>يمكنك مسح بيانات العرض المحفوظة على هذا الجهاز.</p> </div> <button class="button button-danger" data-action="clear-local-data">مسح البيانات المحلية</button> </div> </div> <div class="inline-notice" style="margin-top:18px"> هذه التفضيلات محلية. لا تمثل إعدادات إشعارات خادمية ولا تؤثر في الأجهزة الأخرى. </div>";
}

function renderAdminPage(container) {
container.innerHTML = "${pageHeading("إدارة المنصة", "لوحة مخصصة لمالك المنصة بعد التحقق من صلاحياته على الخادم.")} <div class="inline-notice"> لا تعتبر هذه الواجهة حساب مالك حقيقيًا، ولا تمنح صلاحيات إدارية فعلية. في النسخة النهائية ستُحمى جميع العمليات الإدارية على الخادم. </div> <div class="card-grid"> ${adminCard("إدارة المستخدمين", "مراجعة الحسابات والأدوار وحالات التفعيل.", "♙")} ${adminCard("اعتماد المدرسين", "مراجعة طلبات الانضمام والتحقق من بيانات المدرسين.", "✓")} ${adminCard("المراحل والمواد", "إدارة الصفوف الدراسية والمواد والتصنيفات.", "▦")} ${adminCard("الكورسات والمحتوى", "مراجعة المحتوى المنشور وإخفاؤه عند الحاجة.", "▤")} ${adminCard("الاشتراكات", "إدارة الخطط والأسعار ومدد الاشتراك.", "◇")} ${adminCard("المدفوعات", "عرض العمليات المؤكدة من مزود الدفع.", "↗")} ${adminCard("المجموعات", "إدارة مجموعات المواد والصلاحيات والإشراف.", "▧")} ${adminCard("خدمة العملاء", "متابعة تذاكر الدعم والردود والحالات.", "?")} ${adminCard("سجل العمليات", "تسجيل الإجراءات الإدارية المهمة ومراجعتها.", "≡")} </div>";
}

function adminCard(title, description, icon) {
return "<article class="panel"> <span class="panel-heading-icon">${escapeHTML(icon)}</span> <h2 style="margin-top:14px">${escapeHTML(title)}</h2> <p class="modal-description" style="margin-top:8px;margin-bottom:0">${escapeHTML(description)}</p> </article>";
}

function createId() {
if (window.crypto?.randomUUID) {
return window.crypto.randomUUID();
}

return `${Date.now()}-${Math.random().toString(36).slice(2)}`;

}

function persistProfile() {
if (!state.user) return false;

/*
 * بيانات ملف محلي للاختبار فقط.
 * لا تخزن كلمات المرور في localStorage.
 */
const safeProfile = {
  id: state.user.id,
  name: state.user.name,
  email: state.user.email,
  role: state.user.role,
  stage: state.user.stage || "",
  grade: state.user.grade || "",
  track: state.user.track || "",
  specialty: state.user.specialty || "",
  phone: state.user.phone || "",
  avatar: state.user.avatar || ""
};

return writeLocal(CONFIG.STORAGE_KEYS.PROFILE, safeProfile);

}

function validateEmail(email) {
return /^[^\s@]+@[^\s@]+.[^\s@]+$/.test(email);
}

function createLocalProfile(formData) {
const role = formData.get("role") || "student";

return {
  id: createId(),
  name: String(formData.get("name") || "").trim(),
  email: String(formData.get("email") || "").trim().toLowerCase(),
  role,
  stage: String(formData.get("stage") || ""),
  grade: String(formData.get("grade") || ""),
  track: String(formData.get("track") || ""),
  specialty: String(formData.get("specialty") || "").trim(),
  phone: String(formData.get("phone") || "").trim(),
  avatar: "",
  teacherStatus: role === "teacher" ? CONFIG.TEACHER_STATUS.PENDING : "",
  createdAt: new Date().toISOString()
};

}

async function handleAuthSubmit(event) {
event.preventDefault();
clearFormError();

const form = event.currentTarget;
const formData = new FormData(form);
const email = String(formData.get("email") || "").trim().toLowerCase();
const password = String(formData.get("password") || "");

if (!validateEmail(email)) {
  showFormError("اكتب بريدًا إلكترونيًا صحيحًا.");
  return;
}

if (password.length < CONFIG.SECURITY.MIN_PASSWORD_LENGTH) {
  showFormError("كلمة المرور يجب أن تتكون من 8 أحرف على الأقل.");
  return;
}

/*
 * الوضع المحلي ليس تسجيل دخول حقيقيًا.
 * لا نتحقق من كلمة مرور مخزنة، ولا ننشئ جلسة موثوقة هنا.
 */
if (CONFIG.DEMO_MODE) {
  if (state.authMode === "login") {
    showFormError(
      "تسجيل الدخول الحقيقي غير مفعّل حتى الآن. انتقل إلى «حساب جديد» لاختبار واجهة المشروع، ثم سنربط المصادقة بالخادم."
    );
    return;
  }

  const name = String(formData.get("name") || "").trim();

  if (name.length < 2) {
    showFormError("اكتب اسمك بالكامل.");
    return;
  }

  const role = String(formData.get("role") || "student");

  if (!CONFIG.ROLE_LABELS[role] || role === "admin" || role === "support") {
    showFormError("نوع الحساب غير صالح.");
    return;
  }

  if (role === "student") {
    if (!formData.get("stage") || !formData.get("grade")) {
      showFormError("اختر المرحلة والصف الدراسي.");
      return;
    }

    const grade = CONFIG.GRADES.find(item => item.value === formData.get("grade"));

    if (!grade || grade.stage !== formData.get("stage")) {
      showFormError("الصف الدراسي لا يتطابق مع المرحلة المحددة.");
      return;
    }
  }

  if (role === "teacher" && !String(formData.get("specialty") || "").trim()) {
    showFormError("اكتب تخصصك الدراسي.");
    return;
  }

  const localProfile = createLocalProfile(formData);
  state.user = localProfile;

  if (!persistProfile()) {
    state.user = null;
    showFormError("تعذر حفظ بيانات الحساب التجريبي على هذا الجهاز.");
    return;
  }

  if (role === "teacher") {
    showToast("تم فتح واجهة المدرس التجريبية. الاعتماد الحقيقي لم يُنفذ بعد.", "info");
  } else {
    showToast("تم فتح واجهة الاختبار المحلية. الحساب غير موثق على الخادم.", "success");
  }

  showApp();
  return;
}

/*
 * مسار المصادقة الحقيقي سيُضاف بعد تجهيز الخادم.
 * لا ترسل كلمة المرور إلى جهة غير موثوقة.
 */
if (!CONFIG.API_BASE_URL) {
  showFormError("عنوان الخادم غير مضبوط. لا يمكن تنفيذ تسجيل دخول حقيقي.");
  return;
}

showFormError("لم تتم إضافة نقطة اتصال المصادقة إلى الخادم بعد.");

}

function openModal(content) {
$("#modalContent").innerHTML = content;
$("#modalRoot").classList.remove("hidden");
state.modalOpen = true;
}

function closeModal() {
$("#modalRoot").classList.add("hidden");
$("#modalContent").innerHTML = "";
state.modalOpen = false;
}

function showLegalModal(type) {
const isTerms = type === "terms";

openModal(`
  <h2 id="modalTitle" class="modal-title">${isTerms ? "شروط الاستخدام" : "سياسة الخصوصية"}</h2>
  <p class="modal-description">
    ${isTerms
      ? "يجب استخدام المنصة وفق القوانين والسياسات التعليمية المعتمدة. يمنع إساءة استخدام الحسابات أو محاولة الوصول غير المصرح به إلى بيانات الآخرين."
      : "يجب أن يوضح الإصدار النهائي كيفية جمع البيانات التعليمية ومعالجتها والاحتفاظ بها، وكيفية حماية الحسابات والصور والنتائج وبيانات القاصرين."}
  </p>
  <div class="inline-notice">
    هذه صياغة أولية داخل واجهة التطوير، وليست بديلًا عن سياسة قانونية نهائية ومراجعة مناسبة قبل نشر المنصة.
  </div>
  <div class="modal-actions">
    <button class="button button-primary" data-action="close-modal">إغلاق</button>
  </div>
`);

}

function toggleSidebar() {
state.sidebarOpen = !state.sidebarOpen;
$("#sidebar").classList.toggle("open", state.sidebarOpen);
$("#sidebarOverlay").classList.toggle("active", state.sidebarOpen);
document.body.style.overflow = state.sidebarOpen ? "hidden" : "";
}

function closeSidebar() {
state.sidebarOpen = false;
$("#sidebar").classList.remove("open");
$("#sidebarOverlay").classList.remove("active");
document.body.style.overflow = "";
}

function togglePassword() {
const input = $("#authPassword");
const button = $('[data-action="toggle-password"]');

if (!input || !button) return;

const isPassword = input.type === "password";
input.type = isPassword ? "text" : "password";
button.textContent = isPassword ? "إخفاء" : "عرض";

}

function handleForgotPassword() {
showToast(
"استعادة كلمة المرور تحتاج إلى خادم بريد إلكتروني ورابط آمن أحادي الاستخدام.",
"info"
);
}

function handleClearLocalData() {
openModal("<h2 id="modalTitle" class="modal-title">مسح البيانات المحلية</h2> <p class="modal-description"> سيؤدي هذا إلى مسح الملف المحلي والتفضيلات ومسودات الدعم المحفوظة على هذا الجهاز. لن يؤدي ذلك إلى حذف أي بيانات من خادم خارجي. </p> <div class="modal-actions"> <button class="button button-danger" data-action="confirm-clear-local-data">مسح البيانات</button> <button class="button button-secondary" data-action="close-modal">إلغاء</button> </div>");
}

function confirmClearLocalData() {
Object.values(CONFIG.STORAGE_KEYS).forEach(key => {
try {
localStorage.removeItem(key);
} catch {
// قد يمنع المتصفح التخزين المحلي.
}
});

state.supportTickets = [];
state.progress = 0;
state.settings = {
  notifications: true,
  studyReminders: true
};

closeModal();
showToast("تم مسح البيانات المحلية الخاصة بالمشروع.", "success");
logout(false);

}

function logout(showMessage = true) {
/*
* في الوضع المحلي نزيل الملف التجريبي فقط.
* الجلسات الحقيقية يجب إبطالها من الخادم.
*/
state.user = null;
state.page = "overview";
showAuth();
setAuthMode("login");

if (showMessage) {
  showToast("تم الخروج من واجهة الاختبار المحلية.", "success");
}

}

function restoreLocalState() {
state.supportTickets = readLocal(CONFIG.STORAGE_KEYS.SUPPORT, []);
state.notifications = readLocal(CONFIG.STORAGE_KEYS.NOTIFICATIONS, []);
state.progress = Number(readLocal(CONFIG.STORAGE_KEYS.PROGRESS, 0)) || 0;
state.settings = {
...state.settings,
...readLocal(CONFIG.STORAGE_KEYS.SETTINGS, {})
};

/*
 * لا نستعيد جلسة مصادقة من localStorage.
 * الملف المخزن هنا مجرد بيانات واجهة محلية وليس دليل هوية.
 */

}

function handleSearch(query) {
state.searchQuery = query.trim();

if (!state.searchQuery) return;

const normalized = state.searchQuery.toLowerCase();

const subjects = CONFIG.SUBJECTS.filter(subject =>
  subject.name.toLowerCase().includes(normalized) ||
  subject.description.toLowerCase().includes(normalized)
);

const teachers = state.teachers.filter(teacher =>
  String(teacher.name || "").toLowerCase().includes(normalized) ||
  String(teacher.specialty || "").toLowerCase().includes(normalized)
);

const results = [
  ...subjects.map(subject => ({
    title: subject.name,
    description: subject.description,
    action: "open-subject",
    id: subject.id,
    kind: "مادة دراسية"
  })),
  ...teachers.map(teacher => ({
    title: teacher.name,
    description: teacher.specialty || "مدرس",
    action: "view-teacher",
    id: teacher.id,
    kind: "مدرس"
  }))
];

openModal(`
  <h2 id="modalTitle" class="modal-title">نتائج البحث</h2>
  <p class="modal-description">نتائج مطابقة لعبارة: ${escapeHTML(state.searchQuery)}</p>
  ${results.length ? `
    <div class="settings-list">
      ${results.map(result => `
        <button class="settings-row"
          data-action="${escapeHTML(result.action)}"
          data-subject="${escapeHTML(result.id)}"
          data-id="${escapeHTML(result.id)}">
          <div>
            <strong>${escapeHTML(result.title)}</strong>
            <p>${escapeHTML(result.kind)} · ${escapeHTML(result.description)}</p>
          </div>
          <span>←</span>
        </button>
      `).join("")}
    </div>
  ` : emptyState(
    "لا توجد نتائج مطابقة",
    "جرّب اسم مادة مختلفًا أو تحقق من اتصال المنصة ببيانات المدرسين.",
    "⌕"
  )}
`);

}

function openSubject(subjectId) {
const subject = CONFIG.SUBJECTS.find(item => item.id === subjectId);

if (!subject) {
  showToast("المادة المطلوبة غير موجودة.", "error");
  return;
}

closeModal();
state.searchQuery = "";
navigateTo("subjects");

openModal(`
  <h2 id="modalTitle" class="modal-title">${escapeHTML(subject.name)}</h2>
  <p class="modal-description">${escapeHTML(subject.description)}</p>
  <div class="inline-notice">
    هذه بطاقة تعريف بالمادة. لم يتم ربط دروس أو كورسات حقيقية بهذه المادة بعد.
  </div>
  <div class="modal-actions">
    <button class="button button-primary" data-action="close-modal">حسنًا</button>
  </div>
`);

}

function viewTeacher(teacherId) {
const teacher = state.teachers.find(item => String(item.id) === String(teacherId));

if (!teacher) {
  showToast("لا توجد بيانات مدرس مطابقة في المصدر الحالي.", "error");
  return;
}

openModal(`
  <h2 id="modalTitle" class="modal-title">${escapeHTML(teacher.name)}</h2>
  <p class="modal-description">${escapeHTML(teacher.specialty || "التخصص غير محدد")}</p>
  <div class="inline-notice">
    بيانات الملف والاشتراكات والمحتوى يجب تحميلها من الخادم بعد التحقق من صلاحية الوصول.
  </div>
  <div class="modal-actions">
    <button class="button button-secondary" data-action="close-modal">إغلاق</button>
  </div>
`);

}

function toggleSetting(setting) {
if (!(setting in state.settings)) return;

state.settings[setting] = !state.settings[setting];
writeLocal(CONFIG.STORAGE_KEYS.SETTINGS, state.settings);
renderSettingsPage($("#pageContainer"));
showToast("تم تحديث التفضيل المحلي.", "success");

}

function handleParentLinkRequest() {
const input = $("#parentLinkCode");
const value = input?.value.trim();

if (!value) {
  showToast("أدخل رمز الربط أولًا.", "error");
  return;
}

showToast(
  "لم يتم إرسال طلب ربط. التحقق الآمن من الرموز يحتاج إلى خادم فعلي.",
  "info"
);

}

function handleAction(actionElement) {
const action = actionElement.dataset.action;
if (!action) return;

switch (action) {
  case "go-home":
    if (currentUser()) {
      navigateTo("overview");
    } else {
      showAuth();
    }
    break;

  case "navigate":
    navigateTo(actionElement.dataset.page);
    break;

  case "toggle-sidebar":
    toggleSidebar();
    break;

  case "close-sidebar":
    closeSidebar();
    break;

  case "toggle-password":
    togglePassword();
    break;

  case "forgot-password":
    handleForgotPassword();
    break;

  case "show-terms":
    showLegalModal("terms");
    break;

  case "show-privacy":
    showLegalModal("privacy");
    break;

  case "close-modal":
    closeModal();
    break;

  case "logout":
    logout();
    break;

  case "open-subject":
    openSubject(actionElement.dataset.subject);
    break;

  case "view-teacher":
    viewTeacher(actionElement.dataset.id);
    break;

  case "toggle-setting":
    toggleSetting(actionElement.dataset.setting);
    break;

  case "clear-local-data":
    handleClearLocalData();
    break;

  case "confirm-clear-local-data":
    confirmClearLocalData();
    break;

  case "request-parent-link":
    handleParentLinkRequest();
    break;

  default:
    showToast("هذا الإجراء لم يُربط بعد.", "info");
}

}

function bindEvents() {
$$(".auth-tab").forEach(tab => {
tab.addEventListener("click", () => setAuthMode(tab.dataset.authMode));
});

$("#authRole").addEventListener("change", event => {
  updateRoleFields(event.target.value);
});

$("#authForm").addEventListener("submit", handleAuthSubmit);

document.addEventListener("click", event => {
  const actionElement = event.target.closest("[data-action]");
  if (!actionElement) return;
  handleAction(actionElement);
});

$("#globalSearch").addEventListener("keydown", event => {
  if (event.key === "Enter") {
    event.preventDefault();

    if (!currentUser()) {
      showToast("سجّل الدخول إلى واجهة الاختبار أولًا.", "info");
      return;
    }

    handleSearch(event.target.value);
  }
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    if (state.modalOpen) closeModal();
    closeSidebar();
  }
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 760) closeSidebar();
});

}

function init() {
$("#currentYear").textContent = String(new Date().getFullYear());

restoreLocalState();
bindEvents();

window.setTimeout(() => {
  $("#appLoader").classList.add("is-done");

  /*
   * لا نفتح جلسة اعتمادًا على ملف محلي.
   * يبدأ المستخدم من شاشة الدخول أو إنشاء الحساب.
   */
  showAuth();
}, 650);

}

init();
})();
