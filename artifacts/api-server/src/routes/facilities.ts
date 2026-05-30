import { Router } from "express";

const router = Router();

export interface Facility {
  id: string;
  name: string;
  type: "hospital" | "police" | "fire" | "clinic" | "pharmacy";
  address: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  phone?: string;
}

const BACKEND_FACILITIES: Facility[] = [
  // Bangalore extra facilities
  { id: "fortis-blr", name: "Fortis Hospital Bannerghatta", type: "hospital", address: "154/9 Bannerghatta Road", city: "Bangalore", country: "IN", lat: 12.8954, lng: 77.5983, phone: "+918066214444" },
  { id: "apollo-blr", name: "Apollo Hospitals Jayanagar", type: "hospital", address: "21/2, 14th Cross Rd, 3rd Block", city: "Bangalore", country: "IN", lat: 12.9288, lng: 77.5843, phone: "+918046688888" },
  { id: "st-johns-blr", name: "St. John's Medical College", type: "hospital", address: "Sarjapur Road", city: "Bangalore", country: "IN", lat: 12.9333, lng: 77.6244, phone: "+918022065000" },
  { id: "hal-police-blr", name: "HAL Police Station", type: "police", address: "HAL Old Airport Rd", city: "Bangalore", country: "IN", lat: 12.9613, lng: 77.6499, phone: "+918022942263" },
  { id: "indiranagar-police-blr", name: "Indiranagar Police Station", type: "police", address: "100 Feet Rd, Indiranagar", city: "Bangalore", country: "IN", lat: 12.9719, lng: 77.6412, phone: "+918022948264" },

  // Los Angeles extra facilities
  { id: "ronald-reagan-la", name: "Ronald Reagan UCLA Medical Center", type: "hospital", address: "757 Westwood Plaza", city: "Los Angeles", country: "US", lat: 34.0671, lng: -118.4463, phone: "+13108259111" },
  { id: "keck-la", name: "Keck Hospital of USC", type: "hospital", address: "1500 San Pablo St", city: "Los Angeles", country: "US", lat: 34.0628, lng: -118.2045, phone: "+13234428500" },
  { id: "kaiser-la", name: "Kaiser Permanente Los Angeles Medical Center", type: "hospital", address: "4867 Sunset Blvd", city: "Los Angeles", country: "US", lat: 34.1017, lng: -118.2982, phone: "+13237834011" },
  { id: "lapd-hollywood", name: "LAPD Hollywood Division", type: "police", address: "1358 N Wilcox Ave", city: "Los Angeles", country: "US", lat: 34.0959, lng: -118.3312, phone: "+12139722971" },
  { id: "lafd-82", name: "LAFD Station 82", type: "fire", address: "5769 Hollywood Blvd", city: "Los Angeles", country: "US", lat: 34.1016, lng: -118.3150, phone: "+13234691931" }
];

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

router.get("/facilities/nearby", (req, res) => {
  const latStr = req.query.lat as string;
  const lngStr = req.query.lng as string;
  const radiusStr = req.query.radius as string;

  if (!latStr || !lngStr) {
    return res.status(400).json({ error: "Missing lat or lng" });
  }

  const lat = parseFloat(latStr);
  const lng = parseFloat(lngStr);
  const radius = radiusStr ? parseFloat(radiusStr) : 50; // default 50km

  if (isNaN(lat) || isNaN(lng) || isNaN(radius)) {
    return res.status(400).json({ error: "Invalid coordinate values" });
  }

  const nearby = BACKEND_FACILITIES.filter((f) => {
    const dist = haversineKm(lat, lng, f.lat, f.lng);
    return dist <= radius;
  });

  return res.json({ facilities: nearby });
});

export default router;
