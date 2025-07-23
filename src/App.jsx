import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { CheckCircle2, LoaderCircle, Zap, TrendingDown, AlertTriangle } from 'lucide-react';
import { WiDaySunny, WiCloudy, WiRain, WiSnow, WiThunderstorm, WiFog } from 'react-icons/wi';
import AiIllustration from './assets/ai_illustration.svg';
import TexasImage from './assets/texas.jpg';

const getEventStyle = (eventType) => {
  switch (eventType) {
    case 'Performance Degradation':
      return {
        icon: <TrendingDown className="w-5 h-5" />,
        gradient: 'from-amber-500 to-orange-600',
      };
    case 'Grid Anomaly':
      return {
        icon: <Zap className="w-5 h-5" />,
        gradient: 'from-sky-500 to-blue-600',
      };
    case 'System Health Alert':
      return {
        icon: <AlertTriangle className="w-5 h-5" />,
        gradient: 'from-rose-500 to-red-600',
      };
    default:
      return {
        icon: <AlertTriangle className="w-5 h-5" />,
        gradient: 'from-slate-500 to-slate-600',
      };
  }
};

const EventCard = ({ event, onInvestigate }) => {
  const { icon, gradient } = getEventStyle(event.type);
  return (
    <motion.div
      onClick={() => onInvestigate(event.description)}
      className="relative p-4 rounded-xl text-white overflow-hidden cursor-pointer shadow-md hover:shadow-lg transition-shadow duration-300"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className={`absolute top-0 left-0 w-full h-full bg-gradient-to-br ${gradient}`}></div>
      <div className="relative z-10">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-full">{icon}</div>
          <p className="font-bold text-sm">{event.type}</p>
        </div>
        <p className="mt-2 text-xs opacity-90">{event.short_desc}</p>
      </div>
    </motion.div>
  );
};

const formatOutput = (output) => {
  if (output.final_conclusion) {
    return output.final_conclusion.split('\n').map((line, i) => (
      <p key={i} className="mb-2">{line.replace(/\*\*/g, '')}</p>
    ));
  }
  let content = [];
  for (const key in output) {
    const value = output[key];
    if (Array.isArray(value) && value.length > 0) {
      content.push(<div key={key}><span className="font-semibold capitalize">{key.replace(/_/g, ' ')}:</span> {value.join(', ')}</div>);
    } else if (typeof value === 'string') {
      content.push(<div key={key}><span className="font-semibold capitalize">{key.replace(/_/g, ' ')}:</span> {value}</div>);
    }
  }
  return content.length > 0 ? content : <p>Working on it...</p>;
};

const InvestigationStep = ({ step, isLast, isComplete }) => {
  const nodeName = Object.keys(step)[0];
  const nodeOutput = step[nodeName];
  return (
    <div className="relative pl-8">
      {!isLast && <div className="absolute top-5 left-[11px] w-0.5 h-full bg-slate-200"></div>}
      <div className="absolute top-2 left-0 w-6 h-6 flex items-center justify-center">
        <AnimatePresence>
          {isComplete ? (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}>
              <CheckCircle2 className="w-6 h-6 text-blue-600 bg-white" />
            </motion.div>
          ) : (
            <LoaderCircle className="w-5 h-5 text-slate-400 animate-spin" />
          )}
        </AnimatePresence>
      </div>
      <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-4 rounded-lg border border-slate-200">
        <p className="font-bold text-sm uppercase text-blue-600 tracking-wider">{nodeName.replace(/_/g, ' ')}</p>
        <div className="text-xs text-slate-600 mt-2 whitespace-pre-wrap font-sans">{formatOutput(nodeOutput)}</div>
      </motion.div>
    </div>
  );
};

const WeatherWidget = () => {
  const [weatherData, setWeatherData] = useState(null);
  const lat = 31.9686;
  const lon = -99.9018;
  const apiKey = 'ff8716450a6c3b1b8e175e73cef19569';

  useEffect(() => {
    const fetchWeather = async () => {
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Weather API call failed");
        const data = await response.json();
        setWeatherData(data);
      } catch (error) {
        console.error("Failed to fetch weather data:", error);
      }
    };
    fetchWeather();
  }, []);

  const getWeatherIcon = (weatherId) => {
    if (weatherId >= 200 && weatherId < 300) return <WiThunderstorm />;
    if (weatherId >= 300 && weatherId < 600) return <WiRain />;
    if (weatherId >= 600 && weatherId < 700) return <WiSnow />;
    if (weatherId >= 700 && weatherId < 800) return <WiFog />;
    if (weatherId === 800) return <WiDaySunny />;
    if (weatherId > 800) return <WiCloudy />;
    return <WiDaySunny />;
  };

  if (!weatherData) {
    return (
      <div className="bg-slate-100 p-4 rounded-lg border border-slate-200">
        <p className="font-semibold text-sm">Weather Status</p>
        <p className="text-xs text-slate-600">Fetching live data...</p>
      </div>
    );
  }

  return (
    <div className="relative p-4 rounded-lg text-white overflow-hidden shadow-lg">
      <img src={TexasImage} alt="Texas Landscape" className="absolute top-0 left-0 w-full h-full object-cover" />
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-blue-900/80 via-blue-800/70 to-sky-500/60"></div>
      <div className="relative z-10">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-bold text-lg">{weatherData.name}, TX</p>
            <p className="text-sm opacity-90">{weatherData.weather[0].description}</p>
          </div>
          <div className="text-5xl">{getWeatherIcon(weatherData.weather[0].id)}</div>
        </div>
        <div className="mt-4 text-right">
          <p className="text-4xl font-light">{Math.round(weatherData.main.temp)}°C</p>
          <p className="text-xs opacity-90">Wind: {weatherData.wind.speed} m/s</p>
        </div>
      </div>
    </div>
  );
};

function App() {
  const [events, setEvents] = useState([]);
  const [logInput, setLogInput] = useState("");
  const [recentLogs, setRecentLogs] = useState([]);
  const [isInvestigating, setIsInvestigating] = useState(false);
  const [investigationSteps, setInvestigationSteps] = useState([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      const fetchEvents = async () => {
        try {
          const response = await fetch('http://127.0.0.1:5000/api/events');
          const data = await response.json();
          setEvents(data);
        } catch (error) {
          console.error("Failed to fetch events:", error);
        }
      };
      const fetchLogs = async () => {
        try {
          const response = await fetch('http://127.0.0.1:5000/api/logs');
          const data = await response.json();
          setRecentLogs(data);
        } catch (error) {
          console.error("Failed to fetch logs:", error);
        }
      };
      fetchEvents();
      fetchLogs();
    };
    fetchInitialData();
  }, []);

  const handleSubmitLog = async () => {
    if (!logInput.trim()) return;
    try {
      await fetch('http://127.0.0.1:5000/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ log_message: logInput }),
      });
      setLogInput("");
      const response = await fetch('http://127.0.0.1:5000/api/logs');
      const data = await response.json();
      setRecentLogs(data);
    } catch (error) {
      console.error("Failed to submit log:", error);
    }
  };

  const handleInvestigate = (eventDescription) => {
    setInvestigationSteps([]);
    setIsInvestigating(true);
    fetchEventSource('http://127.0.0.1:5000/api/investigate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: eventDescription }),
      onmessage(event) {
        const data = JSON.parse(event.data);
        if (Object.keys(data)[0] === '__end__') {
          setIsInvestigating(false);
        } else {
          setInvestigationSteps(prev => [...prev, data]);
          if (Object.keys(data)[0] === 'formulate_conclusion') {
            setIsInvestigating(false);
          }
        }
      },
      onerror(err) {
        console.error("EventSource failed:", err);
        setIsInvestigating(false);
        throw err;
      },
    });
  };

  return (
    <div className="bg-slate-50 text-slate-800 min-h-screen font-sans">
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-sm border-b border-slate-200 flex items-center justify-between px-6 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9.99999 12C9.99999 13.1046 10.8954 14 12 14C13.1046 14 14 13.1046 14 12C14 10.8954 13.1046 10 12 10C10.8954 10 9.99999 10.8954 9.99999 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 20C12 20 4 18 4 12C4 6 12 4 12 4C12 4 20 6 20 12C20 18 12 20 12 20Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 14V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 10V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M20 12H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6 12H4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="text-lg font-bold text-slate-900">Autonomous Operations</h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </div>
            <span className="text-xs font-semibold text-slate-600">All Systems Operational</span>
          </div>
          <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-sm font-bold text-slate-500">ST</div>
        </div>
      </header>
      <main className="grid grid-cols-12 pt-16 h-screen">
        <aside className="col-span-3 bg-white border-r border-slate-200 p-4 overflow-y-auto">
          <h2 className="font-semibold mb-4">Live Event Stream</h2>
          <div className="space-y-4">
            {events.length > 0 ? (
              events.map((event) => (
                <EventCard key={event.id} event={event} onInvestigate={handleInvestigate} />
              ))
            ) : (
              <p className="text-xs text-slate-400">Fetching events...</p>
            )}
          </div>
        </aside>
        <section className="col-span-6 p-6 overflow-y-auto">
          {investigationSteps.length === 0 ? (
            <div className="text-center text-slate-400 pt-20 flex flex-col items-center">
              <img src={AiIllustration} alt="AI Agent" className="w-64 h-64" />
              <p className="mt-4 font-semibold">Ready for Investigation</p>
              <p className="text-sm">Select an event from the stream to dispatch an agent.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {investigationSteps.map((step, index) => (
                <InvestigationStep
                  key={index}
                  step={step}
                  isLast={index === investigationSteps.length - 1 && !isInvestigating}
                  isComplete={index < investigationSteps.length - 1 || !isInvestigating}
                />
              ))}
            </div>
          )}
        </section>
        <aside className="col-span-3 bg-white border-l border-slate-200 p-4 flex flex-col">
          <h2 className="font-semibold mb-4">Intelligence Feed</h2>
          <WeatherWidget />
          <div className="mt-4">
            <label htmlFor="log-input" className="block text-sm font-medium text-slate-700 mb-1">Submit Field Report</label>
            <textarea id="log-input" rows="3" className="w-full p-2 border border-slate-300 rounded-md text-sm" placeholder="Technician reports..." value={logInput} onChange={(e) => setLogInput(e.target.value)}></textarea>
            <button className="mt-2 w-full bg-slate-800 text-white text-sm font-semibold py-2 rounded-md hover:bg-slate-900 transition" onClick={handleSubmitLog}>Submit Log</button>
          </div>
          <div className="mt-6 border-t border-slate-200 pt-4 flex-grow overflow-y-auto">
            <h3 className="font-semibold text-sm mb-2">Recent Logs</h3>
            <div className="space-y-2 text-xs text-slate-700">
              {recentLogs.length > 0 ? (
                recentLogs.map((log, index) => (
                  <p key={index} className="bg-slate-100 p-2 rounded-md border border-slate-200">{log}</p>
                ))
              ) : (
                <p className="text-slate-400">No logs submitted yet.</p>
              )}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

export default App;
