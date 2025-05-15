# Sustainability Analysis Platform

This is a **Sustainability Analysis Platform** built with **Python, FastAPI, React, Tailwind CSS, NASA Power API and Google Earth Engine**.  
It helps users evaluate **solar power, water harvesting, windmill and afforestation feasibility** using NASA Power API and Google Earth Engine data.

## Features 🚀

- ✅ **Predict Solar Power Potential** – Using CatBoost ML model to predict solar radiation using all-sky radiation, clear-sky radiation, temperature at 2m, and seasonal patterns.
- ✅ **Analyze Water Harvesting** – Calculate feasibility based on rainfall, soil texture, and slope.
- ✅ **Evaluate Windmill Feasibility** – Assess wind speed, slope, and barren land for windmill installation.
- ✅ **Assess Afforestation** – Determine planting potential using NDVI-based green and barren land cover.
- ✅ **AI Recommendations** – Gemini API provides smart suggestions based on the results.
- ✅ **Interactive UI** – Built with React and Tailwind CSS for a map-based, user-friendly experience.
- ✅ **Secure API Integration** – RESTful API for seamless backend-frontend interaction.

## Tech Stack 🛠️

- **Frontend**: React.js, Tailwind CSS
- **Backend**: Python, FastAPI, CatBoost, Gemini API
- **Data Sources**: NASA Power API, Google Earth Engine

## THIS IS HOW THE PROJECT LOOKS AFTER RUNNING:  

### Screenshot 1  
![Screenshot 1](Images/Screenshot%20(1).png)  

### Screenshot 2  
![Screenshot 2](Images/Screenshot%20(2).png)  

### Screenshot 3  
![Screenshot 3](Images/Screenshot%20(3).png)  

### Screenshot 4  
![Screenshot 4](Images/Screenshot%20(4).png)  

### Screenshot 5  
![Screenshot 5](Images/Screenshot%20(5).png)  

## Getting Started  

### Setup Instructions  

**Clone the repository:**  
```bash
git clone https://github.com/Mahi014/SUSTAINABILITY-ANALYSIS-PLATFORM.git
cd SUSTAINABILITY-ANALYSIS-PLATFORM
```

**Navigate to the server directory and install dependencies:**  
```bash
cd server
pip install fastapi uvicorn pandas numpy catboost google-cloud-aiplatform requests python-dotenv
```

**Create a `.env` file in the server directory with your configuration:**  
```bash
API_KEY='YOUR_GEMINI_API_KEY'
Google_Project='YOUR_GOOGLE_PROJECT_NAME'
```

**Start the backend server:**  
```bash
uvicorn main:app --reload
```

**Navigate to the client directory and install dependencies:**  
```bash
cd ../client
npm install
```

**Start the client:**  
```bash
npm start
```

**Google Earth Engine Setup:**  
1. Sign up for Google Earth Engine.
2. Authenticate GEE

## Developed By
Mahender Singh