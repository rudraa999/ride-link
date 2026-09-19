import React, { useState, useEffect, useRef } from 'react';
import { X, Search, Building, Clock, MapPin, Loader2, ChevronDown } from 'lucide-react';
import MapPicker from './MapPicker';
import { searchLocations, reverseGeocode } from '../services/geoapify';
import { availabilityAPI, collegeAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function SetAvailabilityModal({ isOpen, onClose, onAvailabilityStarted }) {
  const { user } = useAuth();
  const [campusList, setCampusList] = useState([]);
  const [selectedCampus, setSelectedCampus] = useState(user?.activeCampus || 'MIT-WPU Pune (Kothrud)');

  const getSavedLocation = () => {
    try {
      const key = user?.id ? `ridelink_last_location_${user.id}` : 'ridelink_last_location';
      const saved = localStorage.getItem(key) || localStorage.getItem('ridelink_last_location');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error reading saved location:', e);
    }
    return null;
  };

  const getInitialTimeState = () => {
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const formattedHours = hours < 10 ? `0${hours}` : `${hours}`;
    const formattedMins = minutes < 10 ? `0${minutes}` : `${minutes}`;
    return {
      time: `${formattedHours}:${formattedMins}`,
      period: period,
    };
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [timeValue, setTimeValue] = useState('06:30');
  const [timePeriod, setTimePeriod] = useState('PM');
  const [loading, setLoading] = useState(false);
  const searchInputRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Sync saved address and default time when opening or user changes
  useEffect(() => {
    if (isOpen) {
      const savedLoc = getSavedLocation();
      if (savedLoc) {
        setSelectedLocation(savedLoc);
        setSearchQuery(savedLoc.name || '');
      } else {
        setSelectedLocation(null);
        setSearchQuery('');
      }

      const initialTime = getInitialTimeState();
      setTimeValue(initialTime.time);
      setTimePeriod(initialTime.period);
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (user?.activeCampus) {
      setSelectedCampus(user.activeCampus);
    }
  }, [user]);

  useEffect(() => {
    collegeAPI.getAll().then((res) => {
      if (res.data && res.data.length > 0) {
        setCampusList(res.data.map((c) => `${c.name} (${c.city})`));
      }
    }).catch(err => console.log('Load colleges:', err));
  }, []);

  const saveLastLocation = (loc) => {
    try {
      if (loc) {
        const key = user?.id ? `ridelink_last_location_${user.id}` : 'ridelink_last_location';
        localStorage.setItem(key, JSON.stringify(loc));
        localStorage.setItem('ridelink_last_location', JSON.stringify(loc));
      }
    } catch (e) {
      console.error('Error saving last location:', e);
    }
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!val || val.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setShowSuggestions(true);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchLocations(val);
        setSuggestions(results);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 200);
  };

  const handleSelectLocation = (loc) => {
    setSelectedLocation(loc);
    setSearchQuery(loc.name);
    setShowSuggestions(false);
    setSuggestions([]);
    saveLastLocation(loc);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSelectedLocation(null);
    setSuggestions([]);
    setShowSuggestions(false);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const handleMapClick = async (lat, lon) => {
    setShowSuggestions(false);
    setSuggestions([]);
    
    // Reverse geocode clicked location via Geoapify
    const loc = await reverseGeocode(lat, lon);
    setSelectedLocation(loc);
    setSearchQuery(loc.name);
    saveLastLocation(loc);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLocation || !selectedLocation.lat) {
      alert('Please search and select a destination on the map');
      return;
    }

    if (!timeValue.trim()) {
      alert('Please enter a valid departure time');
      return;
    }

    const departureTimeFormatted = `${timeValue.trim()} ${timePeriod}`;

    setLoading(true);
    try {
      const payload = {
        campusName: selectedCampus,
        destinationName: selectedLocation.name.split(',')[0].trim(),
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lon,
        departureTime: departureTimeFormatted,
      };
      const res = await availabilityAPI.start(payload);
      saveLastLocation(selectedLocation);
      if (onAvailabilityStarted) {
        onAvailabilityStarted(res.data);
      }
      onClose();
    } catch (err) {
      console.error('Failed to set availability', err);
      alert(err.response?.data?.message || 'Failed to set availability');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto p-5 sm:p-7 relative border border-slate-100">
        {/* Header with Close X */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Set Your Availability</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left Column: Form Controls */}
          <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
            {/* Departure Campus */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">Departure Campus</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Building className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <select
                  value={selectedCampus}
                  onChange={(e) => setSelectedCampus(e.target.value)}
                  className="w-full pl-10 sm:pl-11 pr-4 py-2.5 sm:py-3 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none cursor-pointer truncate"
                >
                  <option value="MIT-WPU Pune (Kothrud)">MIT-WPU Pune (Kothrud)</option>
                  <option value="COEP Technological University (Shivajinagar)">COEP Technological University (Shivajinagar)</option>
                  <option value="Pune Institute of Computer Technology (Dhankawadi)">Pune Institute of Computer Technology (Dhankawadi)</option>
                  <option value="Vishwakarma Institute of Technology (Bibwewadi)">Vishwakarma Institute of Technology (Bibwewadi)</option>
                  <option value="Symbiosis International University (Viman Nagar)">Symbiosis International University (Viman Nagar)</option>
                  <option value="Bharati Vidyapeeth (Katraj)">Bharati Vidyapeeth (Katraj)</option>
                  {campusList.map((c, idx) => (
                    <option key={idx} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Destination Search Box */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">Destination</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  {isSearching ? (
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
                  )}
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => {
                    if (suggestions.length > 0) setShowSuggestions(true);
                  }}
                  placeholder="Type address or click map..."
                  className="w-full pl-10 sm:pl-11 pr-10 py-2.5 sm:py-3 bg-white border-2 border-blue-500 rounded-xl text-slate-800 text-xs sm:text-sm font-medium focus:outline-none shadow-xs"
                  required
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Dynamic Suggestions List: Only appears when searching */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="mt-2 bg-[#f0f6ff]/90 border border-blue-200 rounded-2xl p-1.5 space-y-1 shadow-sm animate-in fade-in slide-in-from-top-1 duration-150 max-h-48 overflow-y-auto">
                  {suggestions.map((loc, i) => {
                    const isSelected = selectedLocation?.lat === loc.lat && selectedLocation?.lon === loc.lon;
                    return (
                      <div
                        key={i}
                        onClick={() => handleSelectLocation(loc)}
                        className={`p-2.5 rounded-xl cursor-pointer flex items-center gap-3 transition-all ${
                          isSelected
                            ? 'bg-blue-200/80 text-blue-950 font-bold shadow-xs'
                            : 'hover:bg-white text-slate-800'
                        }`}
                      >
                        <div className="p-1.5 rounded-lg bg-white text-slate-700 shadow-xs flex-shrink-0">
                          <MapPin className="w-3.5 h-3.5 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-bold truncate leading-snug">{loc.name}</p>
                          <p className="text-[10px] sm:text-xs text-slate-500 truncate leading-normal">{loc.address}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Departure Time */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">Departure Time</label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <input
                    type="text"
                    value={timeValue}
                    onChange={(e) => setTimeValue(e.target.value)}
                    placeholder="06:30"
                    className="w-full pl-10 sm:pl-11 pr-3 py-2.5 sm:py-3 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    required
                  />
                </div>
                <div className="relative w-24 sm:w-28 flex-shrink-0">
                  <select
                    value={timePeriod}
                    onChange={(e) => setTimePeriod(e.target.value)}
                    className="w-full pl-3 pr-8 py-2.5 sm:py-3 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs sm:text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none cursor-pointer text-center"
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-500">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>

            {/* Start Searching Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 sm:py-3.5 px-4 bg-[#2563eb] hover:bg-blue-700 active:scale-[0.99] text-white font-bold rounded-xl text-sm sm:text-base shadow-lg shadow-blue-500/25 transition-all duration-150 disabled:opacity-50 mt-2 cursor-pointer"
            >
              {loading ? 'Setting Availability...' : 'Start Searching'}
            </button>
          </form>

          {/* Right Column: Leaflet Map */}
          <div className="h-[280px] sm:h-[400px] w-full rounded-2xl overflow-hidden shadow-inner">
            <MapPicker
              lat={selectedLocation?.lat}
              lon={selectedLocation?.lon}
              title={selectedLocation?.name}
              subtitle={selectedLocation?.address}
              onLocationSelect={handleMapClick}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
