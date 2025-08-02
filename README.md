Here’s a **# Asteroid Visualization Tool

A web-based 3D visualization tool for viewing Near-Earth Objects (NEOs) using NASA's API data. This project converts asteroid data into an interactive 3D space environment where you can explore asteroids, their orbits, and detailed information.

## Features

- **3D Visualization**: Interactive 3D space environment with Sun, Earth, and asteroids
- **Real NASA Data**: Fetches real-time asteroid data from NASA's NEO API
- **Interactive Controls**: 
  - Mouse controls for camera movement (zoom, pan, rotate)
  - Click on asteroids to view detailed information
  - Search functionality to find specific asteroids
  - Animation controls (pause, speed up, slow down)
- **Filtering Options**: Filter asteroids by size range
- **Responsive Design**: Works on desktop and mobile devices

## Setup Instructions

### Prerequisites
- A modern web browser with WebGL support
- Internet connection for NASA API access

### Getting Started

1. **Get NASA API Key** (Optional but recommended):
   - Visit [NASA API Portal](https://api.nasa.gov/)
   - Sign up for a free API key
   - The application will work with the demo key but has rate limits

2. **Configure API Key**:
   - Open `script.js`
   - Find the line: `const NASA_API_KEY = 'DEMO_KEY';`
   - Replace `'DEMO_KEY'` with your actual API key

3. **Run the Application**:
   - Open `index.html` in your web browser
   - Or serve it through a local web server for best performance

### Using a Local Server (Recommended)

For better performance and to avoid CORS issues, serve the files through a local web server:

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js (if you have http-server installed)
npx http-server

# Using PHP
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

## How to Use

1. **Select Date Range**: Use the date pickers to choose a start and end date for asteroid data
2. **Apply Filters** (Optional): Enable size filtering to focus on asteroids within specific size ranges
3. **Fetch Data**: Click "Fetch Asteroids" to retrieve data from NASA's API
4. **Explore**: 
   - Use mouse to navigate the 3D space
   - Click on asteroids to view detailed information
   - Use the search box to find specific asteroids
   - Control animation speed and pause/resume
5. **Reset View**: Click "Reset View" to return to the default camera position

## Controls

- **Mouse**: 
  - Left click + drag: Rotate view
  - Right click + drag: Pan view
  - Scroll wheel: Zoom in/out
  - Click on asteroid: Select and view info
- **Buttons**:
  - Pause/Resume: Toggle animation
  - Speed Up/Slow Down: Control animation speed
  - Reset View: Return to default camera position

## Technical Details

### Technologies Used
- **HTML5**: Structure and layout
- **CSS3**: Styling and responsive design
- **JavaScript (ES6+)**: Application logic
- **Three.js**: 3D graphics and rendering
- **NASA NEO API**: Real asteroid data

### File Structure
```
asteroid-visualization-tool/
├── index.html          # Main HTML file
├── style.css           # Styling and layout
├── script.js           # JavaScript logic and Three.js code
├── .env.example        # Environment variables template
└── README.md           # This file
```

### API Information
- **NASA NEO API**: https://api.nasa.gov/neo/rest/v1/feed
- **Rate Limits**: 1000 requests per hour with API key, 30 per hour with demo key
- **Data Coverage**: Near-Earth Objects for specified date ranges

## Customization

### Asteroid Colors
Asteroids are color-coded by size:
- **Green**: Small asteroids (< 100m diameter)
- **Blue**: Medium asteroids (100m - 500m diameter)  
- **Red**: Large asteroids (> 500m diameter)

### Scale Factors
The visualization uses scale factors to make the data visible:
- Distance scale: 0.00001 (distances are scaled down)
- Size scale: 100 (asteroid sizes are scaled up)
- Earth distance: 150 units from the Sun

## Troubleshooting

### Common Issues

1. **"Error fetching data"**: 
   - Check your internet connection
   - Verify your API key if using a custom one
   - Try with demo data (automatic fallback)

2. **3D scene not appearing**:
   - Ensure your browser supports WebGL
   - Try using a different browser
   - Check browser console for errors

3. **Performance issues**:
   - Reduce the date range to fetch fewer asteroids
   - Use size filtering to limit the number of objects
   - Close other browser tabs to free up memory

### Browser Compatibility
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Future Enhancements

- Asteroid trajectory predictions
- Real-time tracking mode
- VR/AR support
- Advanced filtering options
- Export functionality
- Historical data visualization

## Contributing

Feel free to fork this project and submit pull requests for improvements!

## License

This project is open source and available under the [MIT License](LICENSE).** file template for your **Asteroid Visualization Tool** GitHub repository:

---

# **Asteroid Visualization Tool**

An interactive tool for visualizing the orbits and properties of near-Earth objects (NEOs) using NASA’s NEO API. The tool allows users to explore asteroid data, select a date range, filter objects based on characteristics like size, and visualize their orbits in 3D.

---

## **Table of Contents**
- [Introduction](#introduction)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Usage](#usage)
- [Future Enhancements](#future-enhancements)
- [Contributors](#contributors)
- [License](#license)

---

## **Introduction**
The **Asteroid Visualization Tool** aims to educate users about the risks and characteristics of near-Earth objects (NEOs). By leveraging NASA's Near Earth Object Web Service (NeoWs) API, this project provides real-time data and interactive 3D visualization to help users explore and understand asteroids in a more engaging way.

---

## **Features**
- **Fetch Real-Time Asteroid Data**: Retrieves NEO data from NASA’s NEO API based on user-defined date ranges.
- **Interactive 3D Visualization**: Visualize asteroid orbits in a 3D space using VPython.
- **Filter Asteroids**: Filter asteroids by size, close approach date, or minimum distance from Earth.
- **User-Friendly Interface**: Simple, intuitive interface built with Tkinter for easy navigation and interaction.
- **Educational Content**: Inform users about the characteristics and potential risks of various asteroids.

---

## **Tech Stack**
- **Programming Languages**: Python
- **API**: NASA’s Near Earth Object (NEO) API
- **Libraries**:
  - **VPython**: For 3D orbital visualization.
  - **Tkinter**: For creating the graphical user interface (GUI).
  - **Requests**: For handling API calls to NASA’s NEO API.
- **Database** (optional): MySQL for saving user preferences or search history.

---

## **Installation**

### **Prerequisites**
- Python 3.x
- VPython library
- Tkinter library
- Requests library

### **Step-by-Step Setup**
1. **Clone the Repository**:
    ```bash
    git clone https://github.com/NexionisJake/Asteroid-Visualization-Tool.git
    cd Asteroid-Visualization-Tool
    ```

2. **Install Required Libraries**:
    ```bash
    pip install vpython tkinter requests
    ```

3. **Run the Application**:
    ```bash
    python main.py
    ```

---

## **Usage**

1. **Open the Application**: Launch the program by running the `main.py` file.
2. **Select Date Range**: Use the GUI to input a specific date range for fetching NEO data.
3. **Filter Asteroids**: Filter the data by asteroid size, distance from Earth, or other characteristics.
4. **View in 3D**: Visualize the orbits of selected asteroids in a 3D environment.
5. **Educational Insights**: Explore additional information on each asteroid, including potential risks and their significance.

---






