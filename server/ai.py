from google.generativeai import configure, GenerativeModel
from dotenv import load_dotenv
import os

load_dotenv()

api_key = os.getenv("API_KEY")

configure(api_key=api_key)


def analyze_with_gemini(data: dict) -> str:
    """Analyze sustainability data using Gemini 2.0 Flash and return recommendations."""
    try:
        model = GenerativeModel("gemini-2.0-flash")
        
        # Format the data as a prompt
        prompt = f"""
        You are an AI assistant for the Sustainability Analysis Platform. Below is a sustainability report for a specific location. Analyze the data and provide actionable recommendations to improve sustainability in the areas of solar potential, afforestation, water harvesting, and windmill feasibility. Be concise, professional, and focus on practical steps. Format the response exactly as follows, with one recommendation per bullet point:

        **Solar Energy:**
        * Recommendation for solar energy
        **Afforestation:**
        * Recommendation for afforestation
        **Water Harvesting:**
        * Recommendation for water harvesting
        **Wind Energy:**
        * Recommendation for wind energy

        Data:
        - Solar Potential:
          - Average Radiation: {data['solar_potential']['average_radiation']} kWh/m²/day
          - Result: {data['solar_potential']['result']}
        - Afforestation Feasibility:
          - Green Cover: {data['afforestation_feasibility']['green_cover_percent']}%
          - Barren Land: {data['afforestation_feasibility']['barren_land_percent']}%
          - Afforestation Potential: {data['afforestation_feasibility']['afforestation_potential_percent']}%
          - Feasibility: {data['afforestation_feasibility']['feasibility']}
        - Water Harvesting:
          - Rainfall Score: {data['water_harvesting']['rainfall_score']}
          - Soil Score: {data['water_harvesting']['soil_score']}
          - Slope Score: {data['water_harvesting']['slope_score']}
          - Water Harvesting Score: {data['water_harvesting']['water_harvesting_score']}
          - Feasibility: {data['water_harvesting']['feasibility']}
        - Windmill Feasibility:
          - Wind Score: {data['windmill_feasibility']['wind_score']}
          - Slope Score: {data['windmill_feasibility']['slope_score']}
          - Land Score: {data['windmill_feasibility']['land_score']}
          - Windmill Feasibility Score: {data['windmill_feasibility']['windmill_feasibility_score']}
          - Feasibility: {data['windmill_feasibility']['feasibility']}
        """
        
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"Error analyzing data with Gemini: {str(e)}"