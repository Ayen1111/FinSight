import os
import json
import traceback
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables from .env if present
load_dotenv()

# Initialize Gemini
API_KEY = os.environ.get("GEMINI_API_KEY")

def format_financial_summary(store_data):
    """
    Extracts key information from the user's data store and formats it
    into a readable summary for the LLM context.
    """
    summary = []
    
    # Overview
    overview = store_data.get('overview', {})
    summary.append("--- FINANCIAL OVERVIEW ---")
    summary.append(f"Monthly Income: ₹{overview.get('total_income', 0):,.0f}")
    summary.append(f"Monthly Expenses: ₹{overview.get('total_expenses', 0):,.0f}")
    summary.append(f"Savings Rate: {overview.get('savings_rate', 0)}%")
    
    # Top Categories
    top_cats = overview.get('top_categories', [])
    if top_cats:
        summary.append("\nTop Spending Categories:")
        for cat in top_cats:
            summary.append(f"- {cat['category']}: ₹{cat['amount']:,.0f}")

    # Health Score
    health = store_data.get('health_score', {})
    if health:
        summary.append("\n--- FINANCIAL HEALTH ---")
        summary.append(f"Overall Score: {health.get('score', 0)} ({health.get('rating', '')})")
        summary.append("Strengths: " + ", ".join(health.get('strengths', [])))
        summary.append("Weaknesses: " + ", ".join(health.get('weaknesses', [])))
        
    # Personality
    personality = store_data.get('personality', {})
    if personality:
        summary.append("\n--- FINANCIAL PERSONALITY ---")
        summary.append(f"Persona: {personality.get('personality', 'Unknown')}")
        summary.append(f"Description: {personality.get('description', '')}")
        summary.append("Risks: " + ", ".join(personality.get('risks', [])))

    # Anomalies
    anomalies = store_data.get('anomalies', {})
    if anomalies:
        total_anomalies = anomalies.get('total_flagged', 0)
        summary.append(f"\n--- ANOMALIES ---")
        summary.append(f"Total unusual spending spikes detected: {total_anomalies}")

    # Subscriptions
    subs = store_data.get('subscriptions', {})
    if subs:
        summary.append(f"\n--- SUBSCRIPTIONS ---")
        summary.append(f"Total Subscriptions Found: {subs.get('total_found', 0)}")
        summary.append(f"Monthly Subscription Cost: ₹{subs.get('total_monthly_cost', 0):,.0f}")
        summary.append(f"Potential Savings (Inactive Subs): ₹{subs.get('potential_savings', 0):,.0f}")

    return "\n".join(summary)


def ask_financial_coach(question, store_data, history=None):
    """
    Sends the user's question and financial summary to the Gemini API.
    Returns the generated response.
    """
    if not API_KEY:
        return {
            "error": "missing_api_key",
            "message": "Please configure your GEMINI_API_KEY in the .env file to use the AI Financial Coach."
        }

    try:
        genai.configure(api_key=API_KEY)
        
        # System instructions setup
        financial_context = format_financial_summary(store_data)
        
        system_instruction = f"""You are the 'FinSight AI Financial Coach', an intelligent, professional, and friendly personal finance advisor.
Your goal is to answer the user's questions strictly based on their actual financial data provided below.

USER'S FINANCIAL SUMMARY:
{financial_context}

RULES:
1. ALWAYS use the user's actual numbers from the summary above.
2. Be concise, actionable, and friendly. Do not write extremely long paragraphs. Use bullet points where appropriate.
3. NEVER provide generic advice like "save money" without tying it specifically to their spending categories, health score, or personality.
4. If asked how to save money, suggest cutting back on their specific top categories or cancelling unused subscriptions if applicable.
5. If the user asks something completely unrelated to finance, politely steer them back to their finances.
"""

        # Using gemini-1.5-flash as requested for speed and cost-effectiveness
        model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            system_instruction=system_instruction,
            generation_config={"temperature": 0.5}
        )
        
        # Format history if provided (optional, for contextual chat)
        messages = []
        if history:
            for msg in history:
                messages.append({
                    "role": "user" if msg["sender"] == "user" else "model",
                    "parts": [msg["text"]]
                })
        
        messages.append({
            "role": "user",
            "parts": [question]
        })
        
        response = model.generate_content(messages)
        
        return {
            "answer": response.text.strip(),
            "status": "success"
        }
        
    except Exception as e:
        traceback.print_exc()
        return {
            "error": "api_error",
            "message": f"Sorry, I encountered an error while processing your request: {str(e)}"
        }
