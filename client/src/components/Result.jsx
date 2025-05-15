import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function Result() {
  const location = useLocation();
  const navigate = useNavigate();
  const data = location.state?.data;

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-red-500 text-lg">No data available. Please try again.</p>
      </div>
    );
  }

  const { report, recommendations } = data;


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

  const recommendationSections = parseRecommendations(recommendations);

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-green-700 text-center mb-8">
          Sustainability Analysis Report
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Solar Potential */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-green-600 mb-4">Solar Potential</h2>
            <div className="space-y-2">
              <p className="text-gray-700">
                <span className="font-medium">Average Radiation:</span>{' '}
                {report.solar_potential.average_radiation} kWh/m²/day
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Result:</span> {report.solar_potential.result}
              </p>
            </div>
          </div>

          {/* Afforestation Feasibility */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-green-600 mb-4">Afforestation Feasibility</h2>
            <div className="space-y-2">
              <p className="text-gray-700">
                <span className="font-medium">Green Cover:</span>{' '}
                {report.afforestation_feasibility.green_cover_percent}%
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Barren Land:</span>{' '}
                {report.afforestation_feasibility.barren_land_percent}%
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Afforestation Potential:</span>{' '}
                {report.afforestation_feasibility.afforestation_potential_percent}%
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Feasibility:</span>{' '}
                {report.afforestation_feasibility.feasibility}
              </p>
            </div>
          </div>

          {/* Water Harvesting */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-green-600 mb-4">Water Harvesting</h2>
            <div className="space-y-2">
              <p className="text-gray-700">
                <span className="font-medium">Rainfall Score:</span>{' '}
                {report.water_harvesting.rainfall_score}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Soil Score:</span> {report.water_harvesting.soil_score}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Slope Score:</span> {report.water_harvesting.slope_score}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Water Harvesting Score:</span>{' '}
                {report.water_harvesting.water_harvesting_score}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Feasibility:</span>{' '}
                {report.water_harvesting.feasibility}
              </p>
            </div>
          </div>

          {/* Windmill Feasibility */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-green-600 mb-4">Windmill Feasibility</h2>
            <div className="space-y-2">
              <p className="text-gray-700">
                <span className="font-medium">Wind Score:</span>{' '}
                {report.windmill_feasibility.wind_score}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Slope Score:</span>{' '}
                {report.windmill_feasibility.slope_score}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Land Score:</span>{' '}
                {report.windmill_feasibility.land_score}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Windmill Feasibility Score:</span>{' '}
                {report.windmill_feasibility.windmill_feasibility_score}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Feasibility:</span>{' '}
                {report.windmill_feasibility.feasibility}
              </p>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-green-600 mb-4">
            AI Recommendations
          </h2>
          {recommendationSections.length > 0 ? (
            <div className="space-y-6">
              {recommendationSections.map((section, index) => (
                <div key={index}>
                  <h3 className="text-xl font-medium text-gray-800 mb-2">{section.title}</h3>
                  <ul className="list-disc pl-5 space-y-2 text-gray-700">
                    {section.items.map((item, itemIndex) => (
                      <li key={itemIndex}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No recommendations available.</p>
          )}
        </div>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/')}
            className="bg-green-600 text-white py-2 px-6 rounded-md hover:bg-green-700 transition duration-200"
          >
            Back to Map
          </button>
        </div>
      </div>
    </div>
  );
}

export default Result;