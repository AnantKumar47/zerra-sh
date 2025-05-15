from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from solar_predictor import predict_solar
from gee_afforestation import analyze_afforestation
from gee_water import calculate_water_harvesting_score
from windmill import calculate_windmill_feasibility
from ai import analyze_with_gemini
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Add CORS middleware to allow requests from React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["POST", "GET"],
    allow_headers=["Content-Type"],
)

class LocationInput(BaseModel):
    latitude: float
    longitude: float

@app.post("/sustainability-result")
async def get_feasibility_report(location: LocationInput):
    try:
        logger.info(f"Received request for sustainability report: latitude={location.latitude}, longitude={location.longitude}")
        # Generate sustainability report
        solar_data = predict_solar(location)
        afforestation_data = analyze_afforestation(location)
        water_data = calculate_water_harvesting_score(location)
        wind_data = calculate_windmill_feasibility(location)

        report_data = {
            "solar_potential": solar_data,
            "afforestation_feasibility": afforestation_data,
            "water_harvesting": water_data,
            "windmill_feasibility": wind_data
        }

        # Get Gemini recommendations
        gemini_recommendations = analyze_with_gemini(report_data)

        # Combine report data and recommendations
        response = {
            "report": report_data,
            "recommendations": gemini_recommendations
        }

        logger.info("Sustainability report and recommendations generated successfully")
        return response
    except Exception as e:
        logger.error(f"Error generating sustainability report: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/health")
async def health_check():
    return {"status": "healthy"}