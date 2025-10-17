import React, { useState, useEffect } from "react";

const logo = {
    "Limaru Metro": { src: "/transport/metro.svg" },
    "Mainlines": { src: "/transport/train.svg" },
    "Bus Services": { src: "/transport/bus.svg" },
    "Suburban Lines": { src: "/transport/suburban.svg" },
};

const Status = () => {
    const [statusData, setStatusData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        setIsLoading(true);
        fetch(
            "https://script.google.com/macros/s/AKfycbwwRXuVfw8rIlqiWcUV9LLnCXJdhypmyVCs-J4njJuRv5jZd3NOXegTbiZcjo3uYlLaug/exec"
        )
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then((data) => {
                const processedData = data.slice(1).reduce((acc, [, route, operator, status]) => {
                    let category = acc.find((cat) => cat.title === operator);
                    if (!category) {
                        category = { title: operator, items: [] };
                        acc.push(category);
                    }
                    category.items.push({ label: route, status });
                    return acc;
                }, []);
                setStatusData(processedData);
            })
            .catch((error) => {
                console.error("Error fetching data:", error);
                setError("Could not load service status. Please try again later.");
            })
            .finally(() => setIsLoading(false));
    }, []);

    const getStatusColor = (status) => {
        switch (status) {
            case "Closed":
                return "bg-red-500 text-white";
            case "Crowded":
            case "Busy":
                return "bg-yellow-500 text-black";
            case "Partially Open":
                return "bg-amber-500 text-black";
            case "Normal":
                return "bg-green-500 text-white";
            default:
                return "bg-gray-500 text-white";
        }
    };
    
    if (isLoading) {
        return <div className="text-center p-10">Loading service status...</div>
    }
    
    if (error) {
        return <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md text-center" role="alert">{error}</div>
    }

    return (
        <div className="p-4 font-sans">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {statusData.map((section) => (
                    <div key={section.title} className="bg-white text-black p-4 rounded-lg shadow-md border border-gray-200">
                        <div className="flex items-center mb-4 border-b pb-2">
                            {logo[section.title] && (
                                <img
                                    className="mr-3"
                                    src={logo[section.title].src}
                                    alt={`${section.title} logo`}
                                    width={24}
                                    height={24}
                                />
                            )}
                            <h3 className="text-lg font-bold text-gray-800">{section.title}</h3>
                        </div>
                        <ul className="list-none space-y-3">
                            {section.items.map((item) => (
                                <li key={item.label} className="flex flex-col p-2 bg-gray-50 rounded-md">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-gray-700">{item.label}</span>
                                        <span className={`px-2 py-1 text-xs font-bold rounded-full ${getStatusColor(item.status)}`}>
                                            {item.status}
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Status;

