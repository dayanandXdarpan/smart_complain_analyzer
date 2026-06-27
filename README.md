# 🧠 Smart Complaint Analyzer

> A multi-agent AI system for intelligent grievance classification, routing, and resolution — built with LangGraph, ChromaDB, and FastAPI.

[![Python](https://img.shields.io/badge/Python-3.10+-blue?logo=python)](https://python.org)
[![LangGraph](https://img.shields.io/badge/LangGraph-Agentic-orange)](https://github.com/langchain-ai/langgraph)
[![FastAPI](https://img.shields.io/badge/FastAPI-Backend-green?logo=fastapi)](https://fastapi.tiangolo.com)
[![ChromaDB](https://img.shields.io/badge/ChromaDB-VectorStore-purple)](https://www.trychroma.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📌 Overview

Smart Complaint Analyzer is an end-to-end agentic system that automates the intake, classification, semantic retrieval, and routing of citizen grievances to the correct department — eliminating manual triage bottlenecks.

Built with a **LangGraph-based multi-agent pipeline**, it uses a graph-based reasoning loop where each node is a specialized agent responsible for a distinct stage of complaint resolution.

---

## 🏗️ Architecture

```
User Complaint (text)
        │
        ▼
┌───────────────────┐
│  Classifier Agent │  ← Categorizes complaint by type & department
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│  Retriever Agent  │  ← Semantic search via ChromaDB for similar past cases
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│  Resolver Agent   │  ← Generates routing decision + suggested resolution
└────────┬──────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
Routed     Fallback
to Dept.   (Human Review Node)
```

**State** is managed as a typed LangGraph state dictionary passed across all nodes — preserving complaint context, category, retrieval results, and resolution history throughout the pipeline.

---

## ✨ Features

- **Multi-agent graph execution** with LangGraph — conditional edges handle ambiguous complaints by routing to a human-review fallback node
- **Semantic complaint retrieval** using ChromaDB vector store — surfaces similar past complaints to aid resolution
- **LLM-powered classification** with few-shot prompting for high accuracy across department categories
- **FastAPI backend** with REST endpoints for complaint submission and status tracking
- **Lightweight eval harness** — automated test suite measuring routing precision/recall across labeled categories
- **Bounded state management** — completed sub-tasks are summarized into a compact `resolution_log` field to prevent context bloat in long chains

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Agent Orchestration | LangGraph |
| LLM | Google Gemini / OpenAI GPT |
| Vector Store | ChromaDB |
| Backend API | FastAPI |
| Embeddings | sentence-transformers |
| Language | Python 3.10+ |

---

## 📁 Project Structure

```
smart_complain_analyzer/
├── agents/
│   ├── classifier.py       # Complaint classification agent (LangGraph node)
│   ├── retriever.py        # Semantic search agent using ChromaDB
│   └── resolver.py         # Routing + resolution agent
├── graph/
│   └── pipeline.py         # LangGraph state graph definition & node wiring
├── api/
│   └── main.py             # FastAPI app — complaint intake & status endpoints
├── vectorstore/
│   └── chroma_store.py     # ChromaDB setup, indexing, and query logic
├── eval/
│   └── harness.py          # Evaluation harness — precision/recall per category
├── data/
│   └── test_complaints.json # 50 labeled complaints for eval
├── requirements.txt
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Python 3.10+
- An OpenAI or Google Gemini API key

### Installation

```bash
git clone https://github.com/dayanandXdarpan/smart_complain_analyzer.git
cd smart_complain_analyzer
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Environment Setup

Create a `.env` file in the root directory:

```env
OPENAI_API_KEY=your_key_here
# OR
GOOGLE_API_KEY=your_gemini_key_here
```

### Run the API

```bash
uvicorn api.main:app --reload
```

API will be live at `http://localhost:8000`. Visit `/docs` for the Swagger UI.

### Submit a Complaint

```bash
curl -X POST http://localhost:8000/complaint \
  -H "Content-Type: application/json" \
  -d '{"text": "There is a water leakage on MG Road causing road damage."}'
```

**Response:**
```json
{
  "complaint_id": "abc123",
  "category": "infrastructure",
  "department": "Public Works",
  "confidence": 0.91,
  "similar_cases": 3,
  "resolution_suggestion": "Route to Public Works Division – Water & Roads unit.",
  "status": "routed"
}
```

---

## 🧪 Evaluation

Run the built-in eval harness against the labeled test set:

```bash
python eval/harness.py
```

**Sample output:**
```
Category         Precision   Recall
─────────────────────────────────────
infrastructure   0.91        0.88
sanitation       0.85        0.83
utilities        0.87        0.84
public safety    0.89        0.86
─────────────────────────────────────
Overall          0.88        0.85
```

Results are logged to `eval/results.json` for tracking across prompt iterations.

---

## 🔍 Key Design Decisions

**Why LangGraph over a simple LangChain chain?**
Complaint routing is inherently non-linear — ambiguous complaints need conditional branching to a fallback node. LangGraph's explicit state graph makes this clean and debuggable.

**Why ChromaDB for retrieval?**
Semantic similarity on past complaints adds context that keyword matching misses. A complaint about "sewage smell near school" should surface past infrastructure + sanitation hybrid cases.

**Bounded state design:**
Instead of accumulating raw text across nodes, resolved sub-tasks are compressed into a `resolution_log` summary field — keeping the state object small and LLM context predictable.

---

## 📊 Failure Modes & Mitigations

| Failure | Mitigation |
|---|---|
| Malformed LLM tool calls → empty retrieval | Input validation at each node + retry with simplified query |
| Category confusion (e.g., infrastructure vs utilities) | Few-shot examples in classifier prompt; caught via eval harness |
| Context bloat in long chains | Sub-task summarization into bounded `resolution_log` field |
| Silent failures on edge-case complaints | Explicit fallback node routes to human review instead of guessing |

---

## 🏆 Recognition

This project was developed as part of my AI engineering portfolio during my final year B.Tech (CSE – IoT) at Government Engineering College, Vaishali. I am a **Google APL National Finalist** (Top 80 / 3,000+ developers).

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 🙋 Author

**Dayanand Darpan**
Final-year B.Tech CSE (IoT) | AI Engineer
🌐 [dayananddarpan.in](https://dayananddarpan.in) · 🐙 [GitHub](https://github.com/dayanandXdarpan)
