# Autonomous Operations Command Center

An advanced, AI-powered command center for monitoring and diagnosing issues in complex systems. This application uses a multi-agent architecture with a dynamic, streaming UI to provide real-time analysis of both physical and software assets.


## ✨ Features

- **Dynamic Event Feed:** The UI loads a live feed of potential anomalies for investigation.
- **Real-Time Intelligence:** A live weather widget provides external context, and a dynamic log system allows users to inject new information in real-time.
- **Agentic AI Core:** Powered by a **LangGraph** state machine, the AI agent can reason, use tools, and make intelligent decisions.
- **Intelligent Tool Routing:** The agent uses an LLM call to analyze an anomaly and select the most appropriate tool from its arsenal (`RAG`, `Calculator`, `System Health Monitor`).
- **Hybrid RAG System:** The agent's knowledge retrieval combines semantic search with a recency bias, ensuring it uses both relevant historical data and the latest user-submitted logs.
- **Streaming UI:** The agent's entire thought process is streamed to the frontend in real-time, with a polished, animated timeline that visualizes each step of the investigation.
- **Multi-Agent Architecture:** The system is designed as a "society of agents," where a supervisor agent (the LangGraph orchestrator) can delegate tasks to specialized agents (like the original Stack Trace Analyzer).

## 🛠️ Tech Stack

- **Frontend:** React (Vite), Tailwind CSS, Framer Motion
- **Backend:** Python, Flask
- **AI/Agent Framework:** LangChain, LangGraph
- **LLM:** Google Gemini Pro
- **Vector Database:** Faiss
- **Vector Embeddings:** Sentence-Transformers
- **Live Deployment:** Vercel (Frontend), Render (Backend)

## 🚀 How to Run Locally
```bash
**1. Clone the Repository:**

git clone [https://github.com/your-username/your-repo-name.git](https://github.com/your-username/your-repo-name.git)
cd your-repo-name

2. Setup the Backend:

Navigate to the backend folder: cd backend

Create and activate a Python virtual environment:

Bash

python -m venv venv
# On Windows PowerShell
.\venv\Scripts\Activate.ps1
Install all required packages:

Bash

pip install -r requirements.txt
Create your knowledge base files by running the builder scripts:

Bash

python build_log_kb.py
python 2_create_knowledge_base.py
Start the Flask server:

Bash

flask --app app run
3. Setup the Frontend:

Open a new terminal and navigate to the root project folder.

Install npm packages:

Bash

npm install
Start the React development server:

Bash

npm run dev
4. Configuration:

Add your API keys for Gemini and OpenWeatherMap in the agent_logic.py and App.jsx files, respectively.

Ensure your AWS credentials are set up for the data ingestion script.

Your Autonomous Operations Command Center will be running at http://localhost:5175
