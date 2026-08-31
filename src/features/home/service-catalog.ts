import { supabase } from "../../lib/supabase";

export type PublicService = {
  code: string;
  title: string;
  description: string;
  icon: string;
};

export const fallbackServices: PublicService[] = [
  { code: "ac_inspection", title: "التكييف", description: "فحص وصيانة وإصلاح الأعطال", icon: "❄️" },
  { code: "water_leak", title: "السباكة", description: "التسربات والتركيبات والانسدادات", icon: "💧" },
  { code: "electrical_fault", title: "الكهرباء", description: "الأعطال والتركيبات والفحص", icon: "⚡️" },
];

const icons: Record<string, string> = {
  ac_inspection: "❄️",
  water_leak: "💧",
  electrical_fault: "⚡️",
};

export async function getPublicServices(): Promise<PublicService[]> {
  if (!supabase) return fallbackServices;

  const { data, error } = await supabase
    .from("service_catalog_items")
    .select("code,name_ar,description_ar")
    .eq("is_active", true)
    .order("code");

  if (error) throw error;
  return data.map((service) => ({
    code: service.code,
    title: service.name_ar,
    description: service.description_ar ?? "خدمة صيانة موثقة",
    icon: icons[service.code] ?? "🛠️",
  }));
}
