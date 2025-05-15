import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';

// Fix default marker icon issue with Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function LocationMarker({ setPosition }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

// Component to update map center when position changes
function ChangeMapView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  
  return null;
}

function Map() {
  const [position, setPosition] = useState([12.971599, 77.594566]); // Bengaluru
  const [mapCenter, setMapCenter] = useState([12.971599, 77.594566]); // Separate state for map center
  const [mapZoom, setMapZoom] = useState(13);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // City coordinates for fallback
  const defaultCities = {
    'new york, usa': [40.7128, -74.0060],
    'london, uk': [51.5074, -0.1278],
    'delhi, india': [28.6139, 77.2090],
    'mumbai, india': [19.0760, 72.8777],
    'bangalore, india': [12.9716, 77.5946],
  };

  // Search for places using OpenStreetMap Nominatim API
  const searchPlaces = async (query) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }
    
    setSearchLoading(true);
    
    try {
      // Using OpenStreetMap Nominatim API
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search`,
        {
          params: {
            q: query,
            format: 'json',
            addressdetails: 1,
            limit: 10,
          },
          headers: {
            'User-Agent': 'ZerraSustainabilityAnalysis'
          }
        }
      );
      
      if (response.data && response.data.length > 0) {
        const formattedSuggestions = response.data.map(place => ({
          id: place.place_id,
          name: place.display_name,
          lat: parseFloat(place.lat),
          lon: parseFloat(place.lon),
          type: place.type,
          importance: place.importance
        }));
        
        setSuggestions(formattedSuggestions);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Error fetching place suggestions:', error);
      setSuggestions([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    
    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Debounce API calls to prevent excessive requests
    searchTimeoutRef.current = setTimeout(() => {
      if (value.length >= 2) {
        searchPlaces(value);
      } else {
        setSuggestions([]);
      }
    }, 300);
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchInput(suggestion.name);
    setSuggestions([]);
    
    // Update map position based on the selected place
    const coords = [suggestion.lat, suggestion.lon];
    setMapCenter(coords);
    setMapZoom(13); // Zoom level appropriate for the place
    setPosition(coords);
    setLatitude(coords[0].toFixed(4));
    setLongitude(coords[1].toFixed(4));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const lat = parseFloat(latitude || position[0]);
    const lng = parseFloat(longitude || position[1]);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setError('Please enter valid latitude (-90 to 90) and longitude (-180 to 180).');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        'http://localhost:8000/sustainability-result',
        { latitude: lat, longitude: lng },
        { headers: { 'Content-Type': 'application/json' } }
      );
      navigate('/result', { state: { data: response.data } });
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch sustainability report.');
      setLoading(false);
    }
  };

  const handleMapClick = (newPosition) => {
    setPosition(newPosition);
    setLatitude(newPosition[0].toFixed(4));
    setLongitude(newPosition[1].toFixed(4));
    
    // Clear search input when clicking on map
    setSearchInput('');
  };

  const scrollToMap = () => {
    document.getElementById('map-section').scrollIntoView({ behavior: 'smooth' });
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      {/* Fixed background */}
      <div className="cosmic-background"></div>
      <div className="cosmic-effects"></div>

      {/* Content that scrolls over the fixed background */}
      <div className="snap-container">
        {/* Navbar */}
        <nav className="fixed w-full z-20 bg-[#0f0617] bg-opacity-80 backdrop-blur-md border-b border-[#2d1b4e] p-4">
          <div className="container mx-auto relative">
            {/* Left side buttons */}
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2">
              <button className="px-4 py-2 text-sm rounded hover:bg-[#1e0a30] transition-colors">About Us</button>
            </div>
            
            {/* Perfectly centered title */}
            <div className="flex justify-center items-center py-1">
              <div className="text-xl font-bold animated-gradient-text">
                Zerra - Click Scan Sustain
              </div>
            </div>
            
            {/* Right side buttons */}
            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 flex space-x-4">
              <button className="px-4 py-2 text-sm rounded hover:bg-[#1e0a30] transition-colors">Sign In</button>
              <button className="px-4 py-2 text-sm bg-[#1e0a30] text-white rounded hover:bg-[#2d1b4e] transition-colors">Sign Up</button>
            </div>
          </div>
        </nav>
        
        {/* Section 1: Full-screen intro */}
        <section className="h-screen w-full flex flex-col items-center justify-center px-4 relative snap-section">
          <div className="text-center max-w-5xl z-10">
            <h1 
              className="font-light mb-7 leading-tight glow-subtle"
              style={{ 
                fontFamily: 'Google Sans, sans-serif', 
                fontSize: '40px',
                color: 'white',
                letterSpacing: '0.01em'
              }}
            >
              Select Your Area for Analysis
            </h1>
            <p 
              className="text-xl md:text-2xl mb-10 text-gray-300 font-extralight"
              style={{ letterSpacing: '0.02em' }}
            >
              Draw a rectangle or pin on the map to analyze the area's sustainability
            </p>
            <div className="flex flex-col items-center">
              <button
                onClick={scrollToMap}
                className="px-8 py-4 bg-[#7c3aed] text-white font-light text-lg rounded-md shadow-md hover:bg-[#6d28d9] transition-colors"
              >
                Start Analysis
              </button>
              
              {/* Down arrow below the button */}
              <div className="mt-10 animate-scroll-down">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-7 w-7" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="#a78bfa"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={1.5} 
                    d="M19 14l-7 7m0 0l-7-7m7 7V3" 
                  />
                </svg>
              </div>
            </div>
          </div>
        </section>
        
        {/* Section 2: Map and form */}
        <section id="map-section" className="min-h-screen py-20 px-4 relative z-[1] snap-section">
          <div className="flex flex-col items-center justify-center pt-8 max-w-6xl mx-auto">
            <div className="w-full bg-[#0f0617] bg-opacity-90 backdrop-blur-md rounded-lg shadow-xl p-6 border border-[#2d1b4e]">
              {/* Two-column layout */}
              <div className="flex flex-col md:flex-row gap-6">
                {/* Left column - Map */}
                <div className="md:w-3/5 w-full">
                  <MapContainer
                    ref={mapRef}
                    center={mapCenter}
                    zoom={mapZoom}
                    style={{ height: '450px', width: '100%', zIndex: 10 }}
                    className="rounded-lg"
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <LocationMarker setPosition={handleMapClick} />
                    {position && (
                      <Marker position={position}>
                        <Popup>
                          Lat: {position[0].toFixed(4)}, Lng: {position[1].toFixed(4)}
                        </Popup>
                      </Marker>
                    )}
                    <ChangeMapView center={mapCenter} zoom={mapZoom} />
                  </MapContainer>
                  <div className="mt-4 text-center text-sm text-gray-300">
                    Click anywhere on the map to select a location for sustainability analysis
                  </div>
                </div>
                
                {/* Right column - Search and coordinates */}
                <div className="md:w-2/5 w-full">
                  <div className="mb-6">
                    <h3 className="text-xl font-light text-white mb-4">Search Location</h3>
                    <div className="relative">
                      <input
                        type="text"
                        value={searchInput}
                        onChange={handleSearchChange}
                        placeholder="Search for any place (city, landmark, address)..."
                        className="w-full p-3 rounded-md focus:ring-[#7c3aed] focus:border-[#7c3aed] text-white bg-[#170821] border border-[#2d1b4e] pr-10"
                      />
                      {searchLoading ? (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="h-4 w-4 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      ) : (
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          className="h-5 w-5 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      )}
                      
                      {/* Search suggestions */}
                      {suggestions.length > 0 && (
                        <div className="absolute w-full mt-1 bg-[#170821] border border-[#2d1b4e] rounded-md shadow-lg z-50 max-h-64 overflow-y-auto">
                          {suggestions.map((suggestion) => (
                            <div 
                              key={suggestion.id} 
                              className="p-3 hover:bg-[#2d1b4e] cursor-pointer text-gray-300 border-b border-[#2d1b4e] last:border-b-0"
                              onClick={() => handleSuggestionClick(suggestion)}
                            >
                              <div className="text-white font-medium line-clamp-1">
                                {suggestion.name.split(',')[0]}
                              </div>
                              <div className="text-xs text-gray-400 line-clamp-2 mt-1">
                                {suggestion.name}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-gray-400 mt-2">
                      Type to search any location worldwide
                    </div>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex space-x-4">
                      <div className="flex-1">
                        <label htmlFor="latitude" className="block text-sm font-medium text-gray-300">
                          Latitude
                        </label>
                        <input
                          id="latitude"
                          type="number"
                          step="any"
                          value={latitude}
                          onChange={(e) => setLatitude(e.target.value)}
                          placeholder="e.g., 34.0522"
                          className="mt-1 w-full p-2 rounded-md focus:ring-[#7c3aed] focus:border-[#7c3aed] text-white bg-[#170821] border border-[#2d1b4e]"
                        />
                      </div>
                      <div className="flex-1">
                        <label htmlFor="longitude" className="block text-sm font-medium text-gray-300">
                          Longitude
                        </label>
                        <input
                          id="longitude"
                          type="number"
                          step="any"
                          value={longitude}
                          onChange={(e) => setLongitude(e.target.value)}
                          placeholder="e.g., -118.2437"
                          className="mt-1 w-full p-2 rounded-md focus:ring-[#7c3aed] focus:border-[#7c3aed] text-white bg-[#170821] border border-[#2d1b4e]"
                        />
                      </div>
                    </div>
                    {error && <p className="text-red-400 text-sm">{error}</p>}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[#7c3aed] text-white py-3 px-4 rounded-md hover:bg-[#6d28d9] disabled:opacity-50 transition-colors"
                    >
                      {loading ? 'Loading...' : 'Get Sustainability Report'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
          {loading && (
            <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[1000]">
              <div className="bg-[#0f0617] bg-opacity-90 backdrop-blur-md p-8 rounded-lg shadow-2xl flex flex-col items-center max-w-md border border-[#2d1b4e]">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-t-4 border-[#7c3aed] mb-4"></div>
                <p className="text-gray-300 text-lg text-center">
                  Data is being fetched and calculated. This may take approximately 1 to 3 minutes. Please do not refresh the page.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </>
  );
}

export default Map;