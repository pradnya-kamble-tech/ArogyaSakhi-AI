import { useState } from 'react';
import { fetchHospitalsNearby } from '../services/api';
import { MapPin, Phone, AlertTriangle, Search } from 'lucide-react';

export default function HospitalFinder() {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(false);

  const search = async (emergency = false) => {
    setLoading(true);
    try {
      const pos = await new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
          () => resolve({ lat: 18.52, lng: 73.85 })
        );
      });
      const data = await fetchHospitalsNearby(pos.lat, pos.lng, emergency);
      setHospitals(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="rounded-lg border border-medical-gray-200 bg-medical-white p-6 shadow-medical">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-medical-gray-900">Hospital Finder</h1>
          <p className="mt-1 text-sm text-medical-gray-600">Locate nearby equipped healthcare facilities.</p>
        </div>
        
        <div className="flex flex-wrap gap-4">
          <button 
            type="button" 
            onClick={() => search(false)} 
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-medical-blue-light px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-medical-blue-dark disabled:opacity-70"
          >
            <Search className="h-4 w-4" />
            {loading ? 'Searching...' : 'Find nearby hospitals'}
          </button>
          <button 
            type="button" 
            onClick={() => search(true)} 
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-medical-red px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600 disabled:opacity-70"
          >
            <AlertTriangle className="h-4 w-4" />
            Emergency routing
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {hospitals.map((h) => (
          <div key={h.id} className="rounded-lg border border-medical-gray-200 bg-medical-white p-6 shadow-medical transition hover:shadow-lg relative overflow-hidden">
            {h.recommend_ambulance && (
              <div className="absolute top-0 right-0 left-0 bg-medical-red py-1 text-center text-xs font-bold uppercase tracking-wider text-white">
                Ambulance Recommended
              </div>
            )}
            <div className={`pt-${h.recommend_ambulance ? '4' : '0'}`}>
              <h3 className="font-bold text-lg text-medical-gray-900 leading-tight">{h.name}</h3>
              
              <div className="mt-4 space-y-2">
                <div className="flex items-start gap-2 text-medical-gray-600 text-sm">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-medical-blue-light" />
                  <span>{h.city} • <span className="font-semibold text-medical-gray-900">{h.distance_km} km away</span></span>
                </div>
                <div className="flex items-start gap-2 text-medical-gray-600 text-sm">
                  <Phone className="h-4 w-4 mt-0.5 flex-shrink-0 text-medical-blue-light" />
                  <span>{h.phone}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {hospitals.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-medical-gray-300 bg-medical-soft-white py-16 text-center">
          <MapPin className="h-12 w-12 text-medical-gray-400 mb-4" />
          <p className="text-lg font-medium text-medical-gray-900">No hospitals currently listed</p>
          <p className="text-sm text-medical-gray-500 max-w-sm mt-2">Click the buttons above to search your vicinity using geolocation.</p>
        </div>
      )}
    </div>
  );
}
