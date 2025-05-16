import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios';

// Fix default marker icon issue with Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function Result() {
  const location = useLocation();
  const navigate = useNavigate();
  const data = location.state?.data;
  const selectedArea = location.state?.selectedArea || {};
  const [locationName, setLocationName] = useState('');
  const [nameLoading, setNameLoading] = useState(false);

  // Safely extract coordinates from navigation state first, then from API response
  let coords = {
    latitude: null,
    longitude: null
  };
  
  if (data) {
    const { report } = data;
    
    // Try to get coordinates from different possible locations, prioritizing the selected coordinates
    if (selectedArea?.latitude !== undefined && selectedArea?.longitude !== undefined) {
      coords = selectedArea;
    } else if (data.coordinates?.latitude !== undefined && data.coordinates?.longitude !== undefined) {
      coords = data.coordinates;
    } else if (report?.latitude !== undefined && report?.longitude !== undefined) {
      coords = {
        latitude: report.latitude,
        longitude: report.longitude
      };
    } else if (data.latitude !== undefined && data.longitude !== undefined) {
      coords = {
        latitude: data.latitude,
        longitude: data.longitude
      };
    }
  }
  
  // Function to perform reverse geocoding
  const getLocationNameFromCoordinates = async (lat, lng) => {
    if (!lat || !lng) return;
    
    setNameLoading(true);
    try {
      // Using OpenStreetMap Nominatim API for reverse geocoding
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse`,
        {
          params: {
            lat: lat,
            lon: lng,
            format: 'json',
            zoom: 14, // Higher zoom level means more detailed address
            addressdetails: 1
          },
          headers: {
            'User-Agent': 'ZerraSustainabilityAnalysis'
          }
        }
      );
      
      if (response.data) {
        // Extract relevant location info
        const address = response.data.address;
        let placeName = '';
        
        // Try to build a readable location name from address components
        if (address.neighbourhood) {
          placeName = address.neighbourhood;
        } else if (address.suburb) {
          placeName = address.suburb;
        } else if (address.town) {
          placeName = address.town;
        } else if (address.city) {
          placeName = address.city;
        } else if (address.county) {
          placeName = address.county;
        } else if (address.state) {
          placeName = address.state;
        }
        
        // Add city/state context if available
        if (placeName && address.city && placeName !== address.city) {
          placeName += `, ${address.city}`;
        } else if (placeName && address.state && placeName !== address.state) {
          placeName += `, ${address.state}`;
        }
        
        // If we couldn't extract a good name, use the display name
        if (!placeName && response.data.display_name) {
          // Take just the first part of the display name (usually the most specific)
          placeName = response.data.display_name.split(',')[0];
        }
        
        if (placeName) {
          setLocationName(placeName);
        }
      }
    } catch (error) {
      console.error('Error fetching location name:', error);
    } finally {
      setNameLoading(false);
    }
  };
  
  // Trigger reverse geocoding when component mounts if needed
  useEffect(() => {
    // Only do reverse geocoding if we have coordinates but no specific place name
    if (!data) return;
    
    const existingName = selectedArea?.placeName || data.place_name;
    if (!existingName || existingName === 'Selected Location') {
      if (coords.latitude && coords.longitude) {
        getLocationNameFromCoordinates(coords.latitude, coords.longitude);
      }
    }
  }, [coords.latitude, coords.longitude, selectedArea?.placeName, data]);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="cosmic-background"></div>
        <div className="cosmic-effects"></div>
        <div className="bg-[#0f0617] bg-opacity-90 backdrop-blur-md p-8 rounded-lg shadow-2xl border border-[#2d1b4e] max-w-md mx-auto">
          <p className="text-red-400 text-lg">No data available. Please try again.</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 bg-[#7c3aed] text-white py-2 px-6 rounded-md hover:bg-[#6d28d9] transition duration-200"
          >
            Back to Map
          </button>
        </div>
      </div>
    );
  }

  const { report, recommendations, place_name } = data;

  // Parse recommendations into sections
  const parseRecommendations = (text) => {
    const sections = [];
    let currentSection = null;
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);

    lines.forEach((line, index) => {
      // Skip the first line if it's the title 
      if (index === 0 && line.includes('AI Recommendations')) {
        return;
      }
      // Check for section headers (e.g., "**Solar Energy:**")
      if (line.startsWith('**') && line.endsWith(':**')) {
        if (currentSection && currentSection.items.length > 0) {
          sections.push(currentSection);
        }
        currentSection = {
          title: line.replace(/\*\*/g, '').replace(':', ''),
          items: [],
        };
      }
      // Treat non-header, non-empty lines as items under the current section
      else if (currentSection && line !== '') {
        // Remove leading bullet markers if present
        const itemText = line.startsWith('*') || line.startsWith('-') ? line.slice(2).trim() : line;
        if (itemText) {
          currentSection.items.push(itemText);
        }
      }
    });

    if (currentSection && currentSection.items.length > 0) {
      sections.push(currentSection);
    }
    return sections;
  };

  const recommendationSections = parseRecommendations(recommendations || '');

  // Format place name, using fetched location name as a fallback
  const fallbackName = locationName || "Selected Location";
  const displayPlace = selectedArea?.placeName && selectedArea.placeName !== 'Selected Location' 
    ? selectedArea.placeName 
    : (place_name || fallbackName);
  
  // Safely format coordinates with fallbacks
  const displayCoordinates = (coords.latitude !== null && coords.longitude !== null) ? 
    `[${Number(coords.latitude).toFixed(4)}, ${Number(coords.longitude).toFixed(4)}]` : 
    '';

  // Map coordinates for Leaflet (ensure numbers and in correct order: [lat, lng])
  const mapPosition = (coords.latitude !== null && coords.longitude !== null) ? 
    [Number(coords.latitude), Number(coords.longitude)] : 
    [0, 0]; // Default to [0,0] if no coordinates are available

  return (
    <>
      {/* Fixed background */}
      <div className="cosmic-background"></div>
      <div className="cosmic-effects"></div>

      {/* Content that scrolls over the fixed background */}
      <div className="snap-container">
        <div className="min-h-screen pt-16 pb-16 px-4">
          <div className="max-w-6xl mx-auto">
            {/* Header section */}
            <div className="text-center mb-6">
              <h1 
                className="font-light mb-6 leading-tight glow-subtle"
                style={{ 
                  fontFamily: 'Google Sans, sans-serif', 
                  fontSize: '40px',
                  color: 'white',
                  letterSpacing: '0.01em'
                }}
              >
                Sustainability Analysis Report
              </h1>
              <div className="flex flex-col items-center gap-y-2">
                <div className="flex items-center gap-x-3">
                  <span className="text-gray-400">Selected Area:</span>
                  <span className="text-white text-xl">
                    {nameLoading ? (
                      <span className="flex items-center">
                        <div className="h-4 w-4 mr-2 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin"></div>
                        Fetching location...
                      </span>
                    ) : displayPlace}
                  </span>
                </div>
                {displayCoordinates && (
                  <div className="text-lg text-gray-300">
                    Coordinates: {displayCoordinates}
                  </div>
                )}
              </div>
            </div>
            
            {/* Static map showing the selected area */}
            {coords.latitude !== null && coords.longitude !== null && (
              <div className="mb-8 flex justify-center">
                <div className="bg-[#0f0617] bg-opacity-90 backdrop-blur-md rounded-lg shadow-lg p-4 border border-[#2d1b4e] w-full max-w-3xl">
                  <MapContainer
                    center={mapPosition}
                    zoom={13}
                    style={{ height: '300px', width: '100%', borderRadius: '0.5rem' }}
                    dragging={false}
                    scrollWheelZoom={false}
                    touchZoom={false}
                    doubleClickZoom={false}
                    zoomControl={false}
                    attributionControl={false}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={mapPosition} />
                  </MapContainer>
                </div>
              </div>
            )}

            {/* Analysis cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              {/* Solar Potential */}
              <div className="bg-[#0f0617] bg-opacity-90 backdrop-blur-md rounded-lg shadow-lg p-6 border border-[#2d1b4e] transition-all hover:shadow-xl">
                <h2 className="text-2xl font-light text-white mb-4 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-[#7c3aed]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Solar Potential
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Average Radiation</span>
                    <span className="text-white font-medium">{report?.solar_potential?.average_radiation || 'N/A'} kWh/m²/day</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Result</span>
                    <span className={`font-medium ${
                      report?.solar_potential?.result?.includes('High') ? 'text-green-400' : 
                      report?.solar_potential?.result?.includes('Medium') ? 'text-yellow-400' : 
                      'text-red-400'
                    }`}>
                      {report?.solar_potential?.result || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Afforestation Feasibility */}
              <div className="bg-[#0f0617] bg-opacity-90 backdrop-blur-md rounded-lg shadow-lg p-6 border border-[#2d1b4e] transition-all hover:shadow-xl">
                <h2 className="text-2xl font-light text-white mb-4 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-[#7c3aed]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  Afforestation Feasibility
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Green Cover</span>
                    <span className="text-white font-medium">{report?.afforestation_feasibility?.green_cover_percent || 'N/A'}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Barren Land</span>
                    <span className="text-white font-medium">{report?.afforestation_feasibility?.barren_land_percent || 'N/A'}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Afforestation Potential</span>
                    <span className="text-white font-medium">{report?.afforestation_feasibility?.afforestation_potential_percent || 'N/A'}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Feasibility</span>
                    <span className={`font-medium ${
                      report?.afforestation_feasibility?.feasibility?.includes('High') ? 'text-green-400' : 
                      report?.afforestation_feasibility?.feasibility?.includes('Medium') ? 'text-yellow-400' : 
                      'text-red-400'
                    }`}>
                      {report?.afforestation_feasibility?.feasibility || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Water Harvesting */}
              <div className="bg-[#0f0617] bg-opacity-90 backdrop-blur-md rounded-lg shadow-lg p-6 border border-[#2d1b4e] transition-all hover:shadow-xl">
                <h2 className="text-2xl font-light text-white mb-4 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-[#7c3aed]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                  Water Harvesting
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Rainfall Score</span>
                    <span className="text-white font-medium">{report?.water_harvesting?.rainfall_score || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Soil Score</span>
                    <span className="text-white font-medium">{report?.water_harvesting?.soil_score || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Slope Score</span>
                    <span className="text-white font-medium">{report?.water_harvesting?.slope_score || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Water Harvesting Score</span>
                    <span className="text-white font-medium">{report?.water_harvesting?.water_harvesting_score || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Feasibility</span>
                    <span className={`font-medium ${
                      report?.water_harvesting?.feasibility?.includes('High') ? 'text-green-400' : 
                      report?.water_harvesting?.feasibility?.includes('Medium') ? 'text-yellow-400' : 
                      'text-red-400'
                    }`}>
                      {report?.water_harvesting?.feasibility || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Windmill Feasibility */}
              <div className="bg-[#0f0617] bg-opacity-90 backdrop-blur-md rounded-lg shadow-lg p-6 border border-[#2d1b4e] transition-all hover:shadow-xl">
                <h2 className="text-2xl font-light text-white mb-4 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-[#7c3aed]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                  </svg>
                  Windmill Feasibility
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Wind Score</span>
                    <span className="text-white font-medium">{report?.windmill_feasibility?.wind_score || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Slope Score</span>
                    <span className="text-white font-medium">{report?.windmill_feasibility?.slope_score || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Land Score</span>
                    <span className="text-white font-medium">{report?.windmill_feasibility?.land_score || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Windmill Feasibility Score</span>
                    <span className="text-white font-medium">{report?.windmill_feasibility?.windmill_feasibility_score || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Feasibility</span>
                    <span className={`font-medium ${
                      report?.windmill_feasibility?.feasibility?.includes('High') ? 'text-green-400' : 
                      report?.windmill_feasibility?.feasibility?.includes('Medium') ? 'text-yellow-400' : 
                      'text-red-400'
                    }`}>
                      {report?.windmill_feasibility?.feasibility || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-[#0f0617] bg-opacity-90 backdrop-blur-md rounded-lg shadow-lg p-6 border border-[#2d1b4e] transition-all hover:shadow-xl mb-8">
              <h2 className="text-2xl font-light text-white mb-6 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-[#7c3aed]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                AI Recommendations
              </h2>
              {recommendationSections.length > 0 ? (
                <div className="space-y-6">
                  {recommendationSections.map((section, index) => (
                    <div key={index} className="bg-[#170821] bg-opacity-60 p-4 rounded-lg">
                      <h3 className="text-xl font-medium text-[#a78bfa] mb-3">{section.title}</h3>
                      <ul className="space-y-2 text-gray-300">
                        {section.items.map((item, itemIndex) => (
                          <li key={itemIndex} className="flex items-start">
                            <span className="text-[#7c3aed] mr-2 mt-1">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">No recommendations available.</p>
              )}
            </div>

            {/* Back Button */}
            <div className="text-center">
              <button
                onClick={() => navigate('/')}
                className="bg-[#7c3aed] text-white py-3 px-8 rounded-md hover:bg-[#6d28d9] transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Back to Map
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Result;