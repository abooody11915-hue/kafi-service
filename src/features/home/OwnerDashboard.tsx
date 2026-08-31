import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Banknote,
  Clock3,
  FileCheck2,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Users,
  Wrench,
} from "lucide-react";
import { Link } from "react-router-dom";

const decisionQueue = [
  { id: "DEMO-101", title: "مراجعة توثيق مزود", detail: "شركة الحلول التجريبية · اكتملت 4 من 5 وثائق", age: "منذ 18 دقيقة", tone: "warning" },
  { id: "DEMO-102", title: "طلب متوقف قبل التنفيذ", detail: "طلب تجريبي #10021 · لم يُقبل خلال 25 دقيقة", age: "منذ 25 دقيقة", tone: "danger" },
  { id: "DEMO-103", title: "تسوية جاهزة للاعتماد", detail: "دفعة تجريبية · 2,840.00 ر.س · 12 قيدًا", age: "اليوم", tone: "success" },
];

const operations = [
  { label: "طلبات اليوم", value: "24", note: "+8% عن المتوسط", icon: Wrench },
  { label: "بانتظار مزود", value: "3", note: "أقدمها 25 دقيقة", icon: Clock3 },
  { label: "قيد التوثيق", value: "7", note: "2 تحتاج قرارًا", icon: FileCheck2 },
  { label: "صافي التسويات", value: "12,450", note: "ر.س · هذا الأسبوع", icon: Banknote },
];

export function OwnerDashboard() {
  return (
    <main className="owner-layout">
      <aside className="owner-sidebar">
        <Link className="brand owner-brand" to="/"><span className="brand-mark"><Wrench size={20} /></span><span>كافي سيرفس</span></Link>
        <nav aria-label="تنقل الأونر">
          <a className="active" href="#overview"><LayoutDashboard /> نظرة عامة</a>
          <a href="#requests"><Wrench /> التشغيل</a>
          <a href="#providers"><Users /> المزودون</a>
          <a href="#verification"><ShieldCheck /> التوثيق</a>
          <a href="#settlements"><Banknote /> التسويات</a>
        </nav>
        <Link className="owner-exit" to="/"><LogOut /> العودة للموقع</Link>
      </aside>

      <section className="owner-content" id="overview">
        <div className="owner-header">
          <div><span className="demo-pill">بيانات اصطناعية للمعاينة</span><h1>مركز قيادة المنصة</h1><p>ابدأ بالقرارات التي تعطل العميل أو المال، ثم راقب الأداء.</p></div>
          <button className="ghost-button" type="button">تحديث البيانات</button>
        </div>

        <div className="metric-grid">
          {operations.map(({ label, value, note, icon: Icon }) => (
            <article className="metric-card" key={label}><Icon /><span>{label}</span><strong>{value}</strong><small>{note}</small></article>
          ))}
        </div>

        <div className="owner-grid">
          <section className="decision-panel">
            <div className="panel-heading"><div><span>الأولوية الآن</span><h2>قرارات تحتاج تدخلك</h2></div><strong>{decisionQueue.length}</strong></div>
            <div className="decision-list">
              {decisionQueue.map((item) => (
                <button className="decision-row" type="button" key={item.id}>
                  <span className={`decision-icon ${item.tone}`}>
                    {item.tone === "warning" ? <FileCheck2 /> : item.tone === "danger" ? <AlertTriangle /> : <BadgeCheck />}
                  </span>
                  <span className="decision-copy"><strong>{item.title}</strong><small>{item.detail}</small></span>
                  <span className="decision-age">{item.age}</span><ArrowLeft />
                </button>
              ))}
            </div>
          </section>

          <aside className="health-panel">
            <span>صحة التشغيل</span><h2>ضمن المستوى المستهدف</h2>
            <div className="health-score"><strong>92</strong><span>/100</span></div>
            <dl>
              <div><dt>متوسط قبول الطلب</dt><dd>6 دقائق</dd></div>
              <div><dt>الوصول في الموعد</dt><dd>94%</dd></div>
              <div><dt>إعادة العمل</dt><dd>2.1%</dd></div>
            </dl>
          </aside>
        </div>
      </section>
    </main>
  );
}
