import React, { useState, useEffect } from "react";
import EventShowdown from '../components/EventShowdown';
import axios from 'axios';

export default function Home() {
  const [eventData, setEventData] = useState(null);

  useEffect(() => {
    fetchEventData();
  }, []);

  const fetchEventData = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await axios.get(`${apiUrl}/api/superadmin/showdown-event`);
      setEventData(response.data);
    } catch (error) {
      console.error('Error fetching event data:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <EventShowdown eventData={eventData} />
      <div className="flex items-center justify-center py-20">
        <h1 className="text-white text-3xl md:text-5xl font-bold text-center">
          Welcome to the Quiz Zone!
        </h1>
      </div>
    </div>
  );
} 