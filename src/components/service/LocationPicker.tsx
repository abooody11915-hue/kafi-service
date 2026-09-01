import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { CheckCircle2, Crosshair, Loader2, MapPinned } from "lucide-react";
import { Button } from "@/components/ui/button";

export type SelectedLocation = {
  latitude: number;
  longitude: number;
  label: string;
  city: string;
  district: string;
  street: string;
};

type Props = {
  value: SelectedLocation | null;
  onChange: (location: SelectedLocation) => void;
};

const RIYADH: L.LatLngExpression = [24.7136, 46.6753];

function coordinateLabel(latitude: number, longitude: number) {
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
}

async function reverseGeocode(latitude: number, longitude: number, signal: AbortSignal): Promise<SelectedLocation> {
  const fallback: SelectedLocation = {
    latitude,
    longitude,
    label: coordinateLabel(latitude, longitude),
    city: "",
    district: "",
    street: "",
  };

  try {
    const params = new URLSearchParams({ format: "jsonv2", lat: String(latitude), lon: String(longitude), zoom: "18", addressdetails: "1", "accept-language": "ar" });
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, { signal, headers: { Accept: "application/json" } });
    if (!response.ok) return fallback;
    const result = await response.json() as { display_name?: string; address?: Record<string, string> };
    const address = result.address ?? {};
    return {
      latitude,
      longitude,
      label: result.display_name || fallback.label,
      city: address.city || address.town || address.village || address.municipality || address.state || "",
      district: address.suburb || address.neighbourhood || address.city_district || address.quarter || "",
      street: address.road || address.pedestrian || address.residential || "",
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    return fallback;
  }
}

export function LocationPicker({ value, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const geocodeAbortRef = useRef<AbortController | null>(null);
  const onChangeRef = useRef(onChange);
  const [isLocating, setIsLocating] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { zoomControl: true, attributionControl: true }).setView(value ? [value.latitude, value.longitude] : RIYADH, value ? 17 : 11);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    const markerIcon = L.divIcon({
      className: "service-location-marker",
      html: '<span aria-hidden="true"></span>',
      iconSize: [36, 46],
      iconAnchor: [18, 44],
    });

    const resolvePoint = async (point: L.LatLng) => {
      geocodeAbortRef.current?.abort();
      const controller = new AbortController();
      geocodeAbortRef.current = controller;
      setIsResolving(true);
      setError(null);
      try {
        const location = await reverseGeocode(point.lat, point.lng, controller.signal);
        onChangeRef.current(location);
      } catch (requestError) {
        if (!(requestError instanceof DOMException && requestError.name === "AbortError")) {
          onChangeRef.current({ latitude: point.lat, longitude: point.lng, label: coordinateLabel(point.lat, point.lng), city: "", district: "", street: "" });
        }
      } finally {
        if (!controller.signal.aborted) setIsResolving(false);
      }
    };

    const placeMarker = (point: L.LatLng, shouldResolve = true) => {
      if (!markerRef.current) {
        markerRef.current = L.marker(point, { draggable: true, icon: markerIcon }).addTo(map);
        markerRef.current.on("dragend", () => {
          const nextPoint = markerRef.current?.getLatLng();
          if (nextPoint) void resolvePoint(nextPoint);
        });
      } else {
        markerRef.current.setLatLng(point);
      }
      if (shouldResolve) void resolvePoint(point);
    };

    if (value) placeMarker(L.latLng(value.latitude, value.longitude), false);
    map.on("click", (event: L.LeafletMouseEvent) => placeMarker(event.latlng));
    mapRef.current = map;
    window.setTimeout(() => map.invalidateSize(), 100);

    return () => {
      geocodeAbortRef.current?.abort();
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  // The map owns its marker after initialization; later value changes are synchronized below.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!value || !mapRef.current) return;
    const point = L.latLng(value.latitude, value.longitude);
    markerRef.current?.setLatLng(point);
  }, [value]);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("تحديد الموقع غير مدعوم على هذا الجهاز. اختر الموقع بلمس الخريطة.");
      return;
    }
    setIsLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      const point = L.latLng(coords.latitude, coords.longitude);
      mapRef.current?.setView(point, 18, { animate: true });
      if (!markerRef.current && mapRef.current) {
        markerRef.current = L.marker(point, {
          draggable: true,
          icon: L.divIcon({ className: "service-location-marker", html: '<span aria-hidden="true"></span>', iconSize: [36, 46], iconAnchor: [18, 44] }),
        }).addTo(mapRef.current);
        markerRef.current.on("dragend", () => {
          const moved = markerRef.current?.getLatLng();
          if (moved) void selectPoint(moved);
        });
      } else {
        markerRef.current?.setLatLng(point);
      }
      await selectPoint(point);
      setIsLocating(false);
    }, () => {
      setIsLocating(false);
      setError("لم نتمكن من الوصول إلى موقعك. اسمح للموقع باستخدام GPS أو اختر النقطة يدويًا على الخريطة.");
    }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 });
  };

  const selectPoint = async (point: L.LatLng) => {
    geocodeAbortRef.current?.abort();
    const controller = new AbortController();
    geocodeAbortRef.current = controller;
    setIsResolving(true);
    setError(null);
    try {
      onChangeRef.current(await reverseGeocode(point.lat, point.lng, controller.signal));
    } catch (requestError) {
      if (!(requestError instanceof DOMException && requestError.name === "AbortError")) {
        onChangeRef.current({ latitude: point.lat, longitude: point.lng, label: coordinateLabel(point.lat, point.lng), city: "", district: "", street: "" });
      }
    } finally {
      if (!controller.signal.aborted) setIsResolving(false);
    }
  };

  return <div className="space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-sm font-black">حدد موقع الخدمة</h2>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">استخدم موقعك الحالي أو المس الخريطة، ويمكنك سحب الدبوس للدقة.</p>
      </div>
      <Button type="button" variant="outline" onClick={useCurrentLocation} disabled={isLocating} className="h-11 rounded-xl">
        {isLocating ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Crosshair className="ml-2 h-4 w-4" />}
        موقعي الحالي
      </Button>
    </div>
    <div ref={containerRef} className="service-location-map" role="application" aria-label="خريطة اختيار موقع الخدمة" />
    {isResolving && <p role="status" className="flex items-center gap-2 text-xs font-bold text-primary"><Loader2 className="h-4 w-4 animate-spin" />جارٍ التحقق من وصف الموقع…</p>}
    {value && !isResolving && <div className="flex items-start gap-3 rounded-2xl bg-primary/5 p-3 text-primary">
      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="min-w-0"><strong className="block text-xs">تم تثبيت الموقع</strong><p className="mt-1 line-clamp-2 text-xs leading-5 text-foreground/70">{value.label}</p></div>
    </div>}
    {!value && <div className="flex items-center gap-2 rounded-xl bg-amber-50 p-3 text-xs font-bold text-amber-800"><MapPinned className="h-4 w-4 shrink-0" />اختر نقطة على الخريطة للمتابعة.</div>}
    {error && <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-xs font-bold leading-5 text-destructive">{error}</p>}
  </div>;
}
