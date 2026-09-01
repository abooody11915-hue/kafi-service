export type ServiceWorkflow = 'repair' | 'cleaning' | 'delivery' | 'moving' | 'installation' | 'general';
export type AfterServicePolicy = 'warranty' | 'quality_claim' | 'redelivery' | 'none';
export type LegacyMaintenanceCategory = 'plumbing' | 'electrical' | 'general' | 'elevator' | 'cleaning' | 'hvac' | 'other';

export interface ServiceFamilyDefinition {
  code: string;
  label: string;
  description: string;
  emoji: string;
}

export interface ServiceDefinition {
  code: string;
  label: string;
  description: string;
  emoji: string;
  family: string;
  legacyCategory: LegacyMaintenanceCategory;
  workflow: ServiceWorkflow;
  afterServicePolicy: AfterServicePolicy;
  supportsOffers: boolean;
  supportsFixedPrice: boolean;
  common?: boolean;
}

export const SERVICE_FAMILIES: ServiceFamilyDefinition[] = [
  { code: 'repair', label: 'إصلاح وصيانة', description: 'أعطال وإصلاحات المنزل والعقار', emoji: '🛠️' },
  { code: 'cleaning', label: 'تنظيف وعناية', description: 'تنظيف وعناية دورية أو حسب الطلب', emoji: '🧹' },
  { code: 'installation', label: 'تركيب وتجهيز', description: 'تركيب وتجهيز أجهزة ومستلزمات المنزل', emoji: '🪛' },
  { code: 'moving', label: 'نقل ومناولة', description: 'نقل أثاث وأجهزة وفك وتركيب', emoji: '🚚' },
  { code: 'delivery', label: 'توريد وتوصيل', description: 'احتياجات منزلية تصل إلى بابك', emoji: '📦' },
  { code: 'general', label: 'خدمات أخرى', description: 'أي خدمة منزلية لا تجدها ضمن الأقسام', emoji: '🏠' },
];

export const SERVICE_CATALOG: ServiceDefinition[] = [
  { code: 'plumbing', label: 'سباكة', description: 'تسريب، انسداد، خلاطات، صرف وتمديدات مياه', emoji: '🚰', family: 'repair', legacyCategory: 'plumbing', workflow: 'repair', afterServicePolicy: 'warranty', supportsOffers: true, supportsFixedPrice: true, common: true },
  { code: 'electrical', label: 'كهرباء', description: 'أفياش، إنارة، قواطع وأعطال كهربائية', emoji: '⚡', family: 'repair', legacyCategory: 'electrical', workflow: 'repair', afterServicePolicy: 'warranty', supportsOffers: true, supportsFixedPrice: true, common: true },
  { code: 'hvac', label: 'تكييف', description: 'تبريد، تنظيف، تسريب وصيانة المكيفات', emoji: '❄️', family: 'repair', legacyCategory: 'hvac', workflow: 'repair', afterServicePolicy: 'warranty', supportsOffers: true, supportsFixedPrice: true, common: true },
  { code: 'appliance_repair', label: 'إصلاح أجهزة منزلية', description: 'غسالات، ثلاجات، أفران وأجهزة منزلية', emoji: '🔌', family: 'repair', legacyCategory: 'general', workflow: 'repair', afterServicePolicy: 'warranty', supportsOffers: true, supportsFixedPrice: true },
  { code: 'elevator', label: 'مصاعد', description: 'أعطال وصيانة المصاعد', emoji: '🛗', family: 'repair', legacyCategory: 'elevator', workflow: 'repair', afterServicePolicy: 'warranty', supportsOffers: true, supportsFixedPrice: true },
  { code: 'carpentry', label: 'نجارة وأبواب', description: 'أبواب، خزائن وأعمال نجارة منزلية', emoji: '🪚', family: 'repair', legacyCategory: 'general', workflow: 'repair', afterServicePolicy: 'warranty', supportsOffers: true, supportsFixedPrice: true },
  { code: 'locksmith', label: 'أقفال ومفاتيح', description: 'فتح أقفال، تغيير أقفال ومفاتيح', emoji: '🔐', family: 'repair', legacyCategory: 'general', workflow: 'repair', afterServicePolicy: 'warranty', supportsOffers: true, supportsFixedPrice: true },
  { code: 'painting', label: 'دهان وترميم', description: 'دهان، معجون وتشطيبات خفيفة', emoji: '🎨', family: 'repair', legacyCategory: 'general', workflow: 'repair', afterServicePolicy: 'warranty', supportsOffers: true, supportsFixedPrice: true },
  { code: 'leaks_insulation', label: 'تسربات وعزل', description: 'كشف تسربات وعزل أسطح وخزانات', emoji: '💧', family: 'repair', legacyCategory: 'plumbing', workflow: 'repair', afterServicePolicy: 'warranty', supportsOffers: true, supportsFixedPrice: true },
  { code: 'smart_home', label: 'سمارت هوم وشبكات', description: 'كاميرات، شبكات، أقفال وأجهزة منزل ذكي', emoji: '📡', family: 'repair', legacyCategory: 'electrical', workflow: 'installation', afterServicePolicy: 'warranty', supportsOffers: true, supportsFixedPrice: true },

  { code: 'home_cleaning', label: 'تنظيف منزل', description: 'تنظيف كامل أو جزئي للمنزل', emoji: '🧹', family: 'cleaning', legacyCategory: 'cleaning', workflow: 'cleaning', afterServicePolicy: 'quality_claim', supportsOffers: true, supportsFixedPrice: true, common: true },
  { code: 'sofa_carpet_cleaning', label: 'تنظيف كنب وسجاد', description: 'غسيل وتنظيف كنب وسجاد ومراتب', emoji: '🛋️', family: 'cleaning', legacyCategory: 'cleaning', workflow: 'cleaning', afterServicePolicy: 'quality_claim', supportsOffers: true, supportsFixedPrice: true },
  { code: 'tank_cleaning', label: 'تنظيف خزانات', description: 'تنظيف وتعقيم خزانات المياه', emoji: '🫧', family: 'cleaning', legacyCategory: 'cleaning', workflow: 'cleaning', afterServicePolicy: 'quality_claim', supportsOffers: true, supportsFixedPrice: true },
  { code: 'pest_control', label: 'مكافحة حشرات', description: 'رش ومكافحة الحشرات والقوارض', emoji: '🐜', family: 'cleaning', legacyCategory: 'cleaning', workflow: 'cleaning', afterServicePolicy: 'quality_claim', supportsOffers: true, supportsFixedPrice: true },
  { code: 'garden_pool', label: 'حدائق ومسابح', description: 'عناية بالحدائق والمسابح وتنظيفها', emoji: '🌿', family: 'cleaning', legacyCategory: 'cleaning', workflow: 'cleaning', afterServicePolicy: 'quality_claim', supportsOffers: true, supportsFixedPrice: true },

  { code: 'tv_installation', label: 'تركيب شاشة', description: 'تعليق وتركيب الشاشات وتجهيز التوصيلات', emoji: '📺', family: 'installation', legacyCategory: 'general', workflow: 'installation', afterServicePolicy: 'warranty', supportsOffers: true, supportsFixedPrice: true },
  { code: 'curtain_installation', label: 'تركيب ستائر', description: 'تركيب ستائر ومسارات وقضبان', emoji: '🪟', family: 'installation', legacyCategory: 'general', workflow: 'installation', afterServicePolicy: 'warranty', supportsOffers: true, supportsFixedPrice: true },
  { code: 'furniture_assembly', label: 'فك وتركيب أثاث', description: 'فك وتركيب وتجميع الأثاث', emoji: '🪑', family: 'installation', legacyCategory: 'general', workflow: 'installation', afterServicePolicy: 'warranty', supportsOffers: true, supportsFixedPrice: true },
  { code: 'filter_installation', label: 'تركيب فلاتر وأجهزة', description: 'فلاتر مياه وأجهزة منزلية بسيطة', emoji: '🔧', family: 'installation', legacyCategory: 'general', workflow: 'installation', afterServicePolicy: 'warranty', supportsOffers: true, supportsFixedPrice: true },

  { code: 'furniture_moving', label: 'نقل عفش', description: 'نقل أثاث بين المنازل مع تحميل وتنزيل', emoji: '🚚', family: 'moving', legacyCategory: 'general', workflow: 'moving', afterServicePolicy: 'quality_claim', supportsOffers: true, supportsFixedPrice: true, common: true },
  { code: 'appliance_moving', label: 'نقل أجهزة', description: 'نقل أجهزة كهربائية وأغراض ثقيلة', emoji: '📦', family: 'moving', legacyCategory: 'general', workflow: 'moving', afterServicePolicy: 'quality_claim', supportsOffers: true, supportsFixedPrice: true },
  { code: 'haul_away', label: 'رفع مخلفات وأثاث', description: 'إزالة أثاث قديم أو مخلفات منزلية', emoji: '🗑️', family: 'moving', legacyCategory: 'general', workflow: 'moving', afterServicePolicy: 'none', supportsOffers: true, supportsFixedPrice: true },

  { code: 'gas_cylinder', label: 'تغيير أسطوانة غاز', description: 'توصيل أو استبدال أسطوانة غاز', emoji: '🔥', family: 'delivery', legacyCategory: 'other', workflow: 'delivery', afterServicePolicy: 'redelivery', supportsOffers: true, supportsFixedPrice: true, common: true },
  { code: 'bottled_water', label: 'كراتين مياه', description: 'توصيل كراتين مياه للمنزل', emoji: '💧', family: 'delivery', legacyCategory: 'other', workflow: 'delivery', afterServicePolicy: 'redelivery', supportsOffers: true, supportsFixedPrice: true, common: true },
  { code: 'ice_delivery', label: 'ثلج ومستلزمات', description: 'توصيل ثلج ومستلزمات منزلية سريعة', emoji: '🧊', family: 'delivery', legacyCategory: 'other', workflow: 'delivery', afterServicePolicy: 'redelivery', supportsOffers: true, supportsFixedPrice: true },

  { code: 'other_service', label: 'خدمة أخرى', description: 'اكتب ما تحتاجه وسنوجه الطلب للمزود المناسب', emoji: '🏠', family: 'general', legacyCategory: 'other', workflow: 'general', afterServicePolicy: 'none', supportsOffers: true, supportsFixedPrice: true, common: true },
];

export const COMMON_SERVICES = SERVICE_CATALOG.filter((service) => service.common);

export function getServiceDefinition(code?: string | null) {
  return SERVICE_CATALOG.find((service) => service.code === code) ?? null;
}

export function getServicesByFamily(family: string) {
  return SERVICE_CATALOG.filter((service) => service.family === family);
}

export function legacyCategoryLabel(category?: string | null) {
  const labels: Record<string, string> = {
    plumbing: 'سباكة ومياه',
    electrical: 'كهرباء وتقنية',
    hvac: 'تكييف وتبريد',
    elevator: 'مصاعد',
    cleaning: 'تنظيف وعناية',
    general: 'خدمات منزل وتركيب ونقل',
    other: 'توريد وخدمات أخرى',
  };
  return category ? labels[category] || category : '—';
}
