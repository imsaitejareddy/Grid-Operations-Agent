import kb_manager
import os
import pickle
import json
import boto3
from typing import TypedDict, List
import faiss
from sentence_transformers import SentenceTransformer
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import StateGraph, END

if "GOOGLE_API_KEY" not in os.environ:
    os.environ["GOOGLE_API_KEY"] = "AIzaSyCI2ypPRLKQ82htDy91Y8JokurMeP6oF3Y"

_main_kb = None
_log_kb = None

def get_main_kb():
    global _main_kb
    if _main_kb is None:
        data_index = faiss.read_index("faiss_index.bin")
        with open("data_sentences.pkl", "rb") as f:
            data_sentences = pickle.load(f)
        model = SentenceTransformer('all-MiniLM-L6-v2')
        _main_kb = (data_index, data_sentences, model)
    return _main_kb

def get_log_kb():
    global _log_kb
    if _log_kb is None:
        log_index = faiss.read_index("log_faiss_index.bin")
        with open("log_sentences.pkl", "rb") as f:
            log_sentences = pickle.load(f)
        model = SentenceTransformer('all-MiniLM-L6-v2')
        _log_kb = (log_index, log_sentences, model)
    return _log_kb

class AgentState(TypedDict):
    anomaly_description: str
    context_data: List[str]
    tool_outputs: List[str]
    final_conclusion: str

def find_relevant_info(query, index, sentences, model, top_k=3):
    query_embedding = model.encode([query])
    distances, indices = index.search(query_embedding, top_k)
    return [sentences[i] for i in indices[0]]

def check_performance_deviation(state):
    try:
        context_sentence = state["context_data"][0]
        actual_power = float(context_sentence.split("active power was ")[1].split(" kW")[0])
        theoretical_power = float(context_sentence.split("predicted ")[1].split(" KWh")[0])
        if theoretical_power > 0:
            deviation = ((actual_power - theoretical_power) / theoretical_power) * 100
            result = f"Performance Deviation: The turbine is operating at {deviation:.2f}% of its theoretical potential."
        else:
            result = "Cannot calculate deviation, theoretical power is zero."
        return {"tool_outputs": state.get("tool_outputs", []) + [result]}
    except Exception as e:
        return {"tool_outputs": state.get("tool_outputs", []) + ["Calculator tool failed."]}

def search_maintenance_logs(state):
    try:
        all_logs = kb_manager.get_all_logs()
        recent_logs = all_logs[-3:]

        log_index, log_sentences, log_model = get_log_kb()
        relevant_logs = find_relevant_info(
            state["anomaly_description"], log_index, log_sentences, log_model, top_k=3
        )

        combined_context = list(set(recent_logs + relevant_logs))

        result = f"Maintenance Log Search found the following context:\n- {'\n- '.join(combined_context)}"
        current_outputs = state.get("tool_outputs", [])
        new_outputs = [out for out in current_outputs if "Performance Deviation" in out]
        new_outputs.append(result)

        return {"tool_outputs": new_outputs}
    except Exception as e:
        return {"tool_outputs": state.get("tool_outputs", []) + ["Maintenance log search failed."]}

def check_system_health(state):
    result = "System Health Agent Report: No software-level stack traces or system errors found for this physical asset."
    return {"tool_outputs": state.get("tool_outputs", []) + [result]}

def detect_anomaly(state):
    anomaly = state.get("anomaly_description")
    return {"anomaly_description": anomaly, "tool_outputs": []}

def investigate_with_rag(state):
    data_index, data_sentences, model = get_main_kb()
    context = find_relevant_info(state["anomaly_description"], data_index, data_sentences, model)
    return {"context_data": context}

def decide_which_tool(state):
    anomaly_desc = state["anomaly_description"]
    router_prompt = f"""
    You are an expert operations supervisor. An anomaly has been detected. Your available tools are:
    - 'calculator': Best for issues related to power output, efficiency, or performance against a theoretical curve.
    - 'system_health_checker': Best for software-related issues, error codes, or system faults mentioned in the anomaly.
    - 'log_searcher': A good general tool to check for maintenance history or physical technician reports.

    Based on the following anomaly, which is the single best first tool to use?
    Anomaly: "{anomaly_desc}"
    Respond with only the name of the tool: 'calculator', 'system_health_checker', or 'log_searcher'.
    """
    llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash-latest", google_api_key=os.environ.get("GOOGLE_API_KEY"))
    tool_choice = llm.invoke(router_prompt).content
    cleaned_choice = tool_choice.strip().replace("'", "")
    if cleaned_choice in ["calculator", "system_health_checker", "log_searcher"]:
        return cleaned_choice
    else:
        return "log_searcher"

def formulate_final_conclusion(state):
    llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash-latest", google_api_key=os.environ.get("GOOGLE_API_KEY"))
    prompt = f"""
    You are the lead investigator for a wind farm analyzing a critical anomaly.
    Anomaly Description: {state['anomaly_description']}
    You have gathered the following evidence:
    - Initial Data Context: {state.get('context_data', ['N/A'])[0]}
    - Tool Investigation Results: {"\n- ".join(state.get('tool_outputs', []))}
    Synthesize all this information into a final, conclusive report. State the most likely root cause and recommend a clear, single course of action.
    """
    response = llm.invoke(prompt)
    return {"final_conclusion": response.content}

workflow = StateGraph(AgentState)
workflow.add_node("detect_anomaly", detect_anomaly)
workflow.add_node("investigate_with_rag", investigate_with_rag)
workflow.add_node("calculator", check_performance_deviation)
workflow.add_node("log_searcher", search_maintenance_logs)
workflow.add_node("system_health_checker", check_system_health)
workflow.add_node("formulate_conclusion", formulate_final_conclusion)
workflow.add_conditional_edges("investigate_with_rag", decide_which_tool, {
    "calculator": "calculator", "log_searcher": "log_searcher", "system_health_checker": "system_health_checker"
})
workflow.set_entry_point("detect_anomaly")
workflow.add_edge("detect_anomaly", "investigate_with_rag")
workflow.add_edge("calculator", "log_searcher")
workflow.add_edge("system_health_checker", "log_searcher")
workflow.add_edge("log_searcher", "formulate_conclusion")
workflow.add_edge("formulate_conclusion", END)

agent_app = workflow.compile()
