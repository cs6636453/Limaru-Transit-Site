import React, { useState, useRef, useEffect } from "react";

// Travel options updated
const travelOptions = [
  { value: "fastest", label: "Recommended" },
  { value: "minsta", label: "Minimum Stations" },
  { value: "mintrans", label: "Minimum Transfers" },
];

// Emoji Icon components for visual distinction in the suggestion list
const TrainIcon = () => (
    <span className="inline-block mr-3 text-xl flex-shrink-0" role="img" aria-label="Train">🚉</span>
);

const BusIcon = () => (
    <span className="inline-block mr-3 text-xl flex-shrink-0" role="img" aria-label="Bus">🚏</span>
);

const Pathfinder = () => {
  // State for fetched data and loading status
  const [allLocations, setAllLocations] = useState([]); // Will store { key, name, type }
  const [isLoading, setIsLoading] = useState(true);

  // Component state
  const [selectedTravelOption, setSelectedTravelOption] = useState("fastest");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [originSuggestions, setOriginSuggestions] = useState([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [error, setError] = useState("");

  const originRef = useRef(null);
  const destinationRef = useRef(null);
  
  // Custom sort function to prioritize trains, then sort alphabetically
  const sortLocations = (locations) => {
      return locations.sort((a, b) => {
          if (a.type === 'train' && b.type === 'bus') {
              return -1; // Trains come first
          }
          if (a.type === 'bus' && b.type === 'train') {
              return 1; // Buses come second
          }
          return a.name.localeCompare(b.name); // Sort alphabetically within type
      });
  };

  // Effect to fetch transit data from the URL on component mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError("");
      try {
        const response = await fetch('https://tjt.winsanmwtv.me/api/dataset.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        // Add a 'type' property to distinguish between trains and buses
        const stationsWithType = data.stations.map(s => ({ ...s, type: 'train' }));
        const busStopsWithType = data.bus_stops.map(b => ({ ...b, type: 'bus' }));

        const locations = [...stationsWithType, ...busStopsWithType];
        setAllLocations(locations);

      } catch (e) {
        console.error("Failed to fetch transit data:", e);
        setError("Could not load station data. Please try refreshing the page.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Effect to parse URL parameters and pre-fill the form
  useEffect(() => {
    // This effect runs once the location data is loaded
    if (allLocations.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const criteriaParam = params.get("criteria");
      const originKey = params.get("origin");
      const destKey = params.get("dest");

      // Set travel option from URL if it's a valid one
      if (criteriaParam && travelOptions.some(opt => opt.value === criteriaParam)) {
        setSelectedTravelOption(criteriaParam);
      }
      
      // Set origin from URL by finding the location name from its key
      if (originKey) {
        const originLocation = allLocations.find(loc => loc.key === originKey);
        if (originLocation) {
          setOrigin(originLocation.name);
        }
      }
      
      // Set destination from URL by finding the location name from its key
      if (destKey) {
        const destLocation = allLocations.find(loc => loc.key === destKey);
        if (destLocation) {
          setDestination(destLocation.name);
        }
      }
    }
  }, [allLocations]); // This dependency ensures the effect runs when allLocations is populated

  // Effect to handle clicks outside the suggestion boxes
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        originRef.current && !originRef.current.contains(event.target) &&
        destinationRef.current && !destinationRef.current.contains(event.target)
      ) {
        setOriginSuggestions([]);
        setDestinationSuggestions([]);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handlers for showing all suggestions on input focus
  const handleOriginFocus = () => {
    setOriginSuggestions(sortLocations([...allLocations]));
  };

  const handleDestinationFocus = () => {
    setDestinationSuggestions(sortLocations([...allLocations]));
  };

  // Handlers for filtering suggestions as user types
  const handleOriginChange = (event) => {
    const value = event.target.value;
    setOrigin(value);
    if (value) {
        const filtered = allLocations.filter((location) =>
          location.name.toLowerCase().includes(value.toLowerCase())
        );
        setOriginSuggestions(sortLocations(filtered));
    } else {
        setOriginSuggestions(sortLocations([...allLocations]));
    }
  };

  const handleDestinationChange = (event) => {
    const value = event.target.value;
    setDestination(value);
     if (value) {
        const filtered = allLocations.filter((location) =>
          location.name.toLowerCase().includes(value.toLowerCase())
        );
        setDestinationSuggestions(sortLocations(filtered));
    } else {
        setDestinationSuggestions(sortLocations([...allLocations]));
    }
  };

  // Handler for swapping origin and destination
  const handleSwap = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  // Main function to find route and redirect
  const handleFindRoute = () => {
    setError("");

    if (!origin || !destination) {
      setError("Please select both an origin and a destination.");
      return;
    }

    const originLocation = allLocations.find(loc => loc.name.toLowerCase() === origin.toLowerCase());
    const destinationLocation = allLocations.find(loc => loc.name.toLowerCase() === destination.toLowerCase());

    if (!originLocation) {
        setError("Invalid origin station. Please select a valid station from the list.");
        return;
    }
    if (!destinationLocation) {
        setError("Invalid destination station. Please select a valid station from the list.");
        return;
    }

    const baseUrl = "https://tjt.winsanmwtv.me/mytripquery/";
    const params = new URLSearchParams({
      criteria: selectedTravelOption,
      origin: originLocation.key,
      dest: destinationLocation.key,
      source: "https://limaru.net/transportation"
    });
    
    window.location.href = `${baseUrl}?${params.toString()}`;
  };
  
  if (isLoading) {
      return <div className="text-center p-10">Loading station data...</div>
  }

  return (
    <div className="bg-gray-100 p-6 rounded-lg shadow-lg w-full max-w-4xl mx-auto font-sans">
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-4" role="alert">{error}</div>}
      <div className="flex flex-col md:flex-row md:items-end gap-4">
        
        <div className="flex-shrink-0">
          <label htmlFor="travel-option" className="block text-sm font-medium text-gray-700 mb-1">Travel Option</label>
          <select id="travel-option" value={selectedTravelOption} onChange={(e) => setSelectedTravelOption(e.target.value)} className="border-gray-300 rounded-md shadow-sm p-2 w-full focus:ring-indigo-500 focus:border-indigo-500 transition">
            {travelOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="flex-grow flex items-end gap-2">
          <div className="relative flex-1" ref={originRef}>
            <label htmlFor="origin" className="block text-sm font-medium text-gray-700 mb-1">Origin</label>
            <input type="text" id="origin" className="border-gray-300 rounded-md shadow-sm p-2 w-full focus:ring-indigo-500 focus:border-indigo-500 transition" value={origin} onFocus={handleOriginFocus} onChange={handleOriginChange} placeholder="Enter origin station" autoComplete="off"/>
            {originSuggestions.length > 0 && (
              <ul className="absolute z-10 bg-white border border-gray-300 rounded-md mt-1 w-full max-h-60 overflow-y-auto shadow-lg">
                {originSuggestions.map((location) => (
                  <li key={`${location.type}-${location.key}`} className="p-2 hover:bg-indigo-50 cursor-pointer flex items-center" onClick={() => { setOrigin(location.name); setOriginSuggestions([]); }}>
                    {location.type === 'train' ? <TrainIcon /> : <BusIcon />}
                    {location.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button onClick={handleSwap} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-3 rounded-md self-end transition-colors" title="Swap origin and destination">&#x21C4;</button>

          <div className="relative flex-1" ref={destinationRef}>
            <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
            <input type="text" id="destination" className="border-gray-300 rounded-md shadow-sm p-2 w-full focus:ring-indigo-500 focus:border-indigo-500 transition" value={destination} onFocus={handleDestinationFocus} onChange={handleDestinationChange} placeholder="Enter destination station" autoComplete="off"/>
            {destinationSuggestions.length > 0 && (
              <ul className="absolute z-10 bg-white border border-gray-300 rounded-md mt-1 w-full max-h-60 overflow-y-auto shadow-lg">
                {destinationSuggestions.map((location) => (
                  <li key={`${location.type}-${location.key}`} className="p-2 hover:bg-indigo-50 cursor-pointer flex items-center" onClick={() => { setDestination(location.name); setDestinationSuggestions([]); }}>
                     {location.type === 'train' ? <TrainIcon /> : <BusIcon />}
                     {location.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="flex-shrink-0">
          <button onClick={handleFindRoute} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-md shadow-sm w-full md:w-auto transition-transform transform hover:scale-105">Find Route</button>
        </div>
      </div>
    </div>
  );
};

export default Pathfinder;

