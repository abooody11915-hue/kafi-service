/**
 * Photographic assets for the KAFI service marketplace.
 * Each service_code maps to a real photo stored locally in /public/service-images.
 * `position` is the object-position crop point for the photo inside a card.
 */
export type ServiceImageAsset = {
  src: string;
  position: string;
};

const base = '/service-images';

export const SERVICE_IMAGES: Record<string, ServiceImageAsset> = {
  // repair
  plumbing: { src: `${base}/plumbing.webp`, position: '55% 45%' },
  electrical: { src: `${base}/electrical.webp`, position: '40% 50%' },
  hvac: { src: `${base}/hvac.webp`, position: '45% 45%' },
  appliance_repair: { src: `${base}/appliance_repair.webp`, position: '50% 45%' },
  elevator: { src: `${base}/elevator.webp`, position: '50% 45%' },
  carpentry: { src: `${base}/carpentry.webp`, position: '45% 45%' },
  locksmith: { src: `${base}/locksmith.webp`, position: '55% 50%' },
  painting: { src: `${base}/painting.webp`, position: '50% 45%' },
  leaks_insulation: { src: `${base}/leaks_insulation.webp`, position: '45% 50%' },
  smart_home: { src: `${base}/smart_home.webp`, position: '35% 45%' },

  // cleaning
  home_cleaning: { src: `${base}/home_cleaning.webp`, position: '55% 55%' },
  sofa_carpet_cleaning: { src: `${base}/sofa_carpet_cleaning.webp`, position: '45% 55%' },
  tank_cleaning: { src: `${base}/tank_cleaning.webp`, position: '45% 45%' },
  pest_control: { src: `${base}/pest_control.webp`, position: '55% 45%' },
  garden_pool: { src: `${base}/garden_pool.webp`, position: '50% 55%' },

  // installation
  tv_installation: { src: `${base}/tv_installation.webp`, position: '45% 45%' },
  curtain_installation: { src: `${base}/curtain_installation.webp`, position: '45% 45%' },
  furniture_assembly: { src: `${base}/furniture_assembly.webp`, position: '50% 60%' },
  filter_installation: { src: `${base}/filter_installation.webp`, position: '45% 50%' },

  // moving
  furniture_moving: { src: `${base}/furniture_moving.webp`, position: '50% 45%' },
  appliance_moving: { src: `${base}/appliance_moving.webp`, position: '50% 45%' },
  haul_away: { src: `${base}/haul_away.webp`, position: '50% 50%' },

  // delivery
  gas_cylinder: { src: `${base}/gas_cylinder.webp`, position: '50% 45%' },
  bottled_water: { src: `${base}/bottled_water.webp`, position: '45% 50%' },
  ice_delivery: { src: `${base}/ice_delivery.webp`, position: '50% 50%' },

  // general
  other_service: { src: `${base}/other_service.webp`, position: '50% 50%' },
};

export const FAMILY_IMAGES: Record<string, ServiceImageAsset> = {
  repair: { src: `${base}/family-repair.webp`, position: '45% 45%' },
  cleaning: { src: `${base}/family-cleaning.webp`, position: '50% 50%' },
  installation: { src: `${base}/family-installation.webp`, position: '45% 45%' },
  moving: { src: `${base}/family-moving.webp`, position: '50% 45%' },
  delivery: { src: `${base}/family-delivery.webp`, position: '50% 50%' },
  general: { src: `${base}/family-general.webp`, position: '50% 50%' },
};

export function resolveServiceImage(code?: string | null, family?: string | null): ServiceImageAsset {
  return (
    (code ? SERVICE_IMAGES[code] : undefined) ||
    (family ? FAMILY_IMAGES[family] : undefined) ||
    FAMILY_IMAGES.general
  );
}
