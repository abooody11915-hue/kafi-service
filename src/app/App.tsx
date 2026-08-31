import { useEffect, useState } from "react";
import { ArrowLeft, BadgeCheck, Clock3, ShieldCheck, Wrench } from "lucide-react";
import { Link, Route, Routes } from "react-router-dom";
import { OwnerDashboard } from "../features/home/OwnerDashboard";
import { isBackendConfigured } from "../lib/env";
import { fallbackServices, getPublicServices } from "../features/home/service-catalog";

function Home() {
  const [services, setServices] = useState(fallbackServices);

  useEffect(() => {
    if (!isBackendConfigured || import.meta.env.MODE === "test") return;
    void getPublicServices().then(setServices).catch(() => setServices(fallbackServices));
  }, []);

  return (
    <main>
      <header className="topbar">
        <Link className="brand" to="/" aria-label="كافي سيرفس">
          <span className="brand-mark"><Wrench size={22} /></span>
          <span>كافي سيرفس</span>
        </Link>
        <Link className="ghost-button link-button" to="/owner">دخول الأونر</Link>
      </header>

      <section className="hero">
        <div className="eyebrow"><BadgeCheck size={18} /> مزودون موثقون وخدمة مضمونة</div>
        <h1>الصيانة التي تحتاجها،<br />بخطوات واضحة.</h1>
        <p>اختر الخدمة أولًا. نطلب تسجيلك فقط عند تأكيد الطلب، ونبقيك على اطلاع حتى اكتماله.</p>
        <button className="primary-button" type="button">
          اطلب خدمة <ArrowLeft size={20} />
        </button>
        {!isBackendConfigured && (
          <p className="environment-note">نسخة تأسيسية آمنة — لم تُربط بعد بقاعدة الإنتاج.</p>
        )}
      </section>

      <section className="section" aria-labelledby="services-title">
        <div className="section-heading">
          <div>
            <span>الخدمات</span>
            <h2 id="services-title">ماذا تحتاج اليوم؟</h2>
          </div>
          <button className="text-button" type="button">عرض الكل <ArrowLeft size={18} /></button>
        </div>
        <div className="service-grid">
          {services.map((service) => (
            <article className="service-card" key={service.code}>
              <span className="service-icon" aria-hidden>{service.icon}</span>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
              <button type="button" aria-label={`اختيار ${service.title}`}><ArrowLeft size={19} /></button>
            </article>
          ))}
        </div>
      </section>

      <section className="trust-strip">
        <div><ShieldCheck /><strong>حماية واضحة</strong><span>توثيق وصلاحيات محكمة</span></div>
        <div><Clock3 /><strong>تتبع مباشر</strong><span>سجل كامل لكل مرحلة</span></div>
        <div><BadgeCheck /><strong>ضمان الخدمة</strong><span>معالجة منظمة لإعادة العمل</span></div>
      </section>
    </main>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/owner" element={<OwnerDashboard />} />
      <Route path="*" element={<Home />} />
    </Routes>
  );
}
