import numpy as np
import pandas as pd
from collections import defaultdict

def detect_financial_personality(df, overview, subscriptions, anomalies, monthly_data):
    """
    Analyzes transaction data to assign a primary financial personality,
    secondary traits, and generate an engaging behavioral report.
    """
    if df is None or overview is None:
        return None

    # Calculate Behavioral Metrics
    total_income = overview.get('totalIncome', 0)
    total_expenses = overview.get('totalExpenses', 0)
    savings_rate = 0
    if total_income > 0:
        savings_rate = (total_income - total_expenses) / total_income
    
    # Category percentages
    expenses_only = df[df['Type'] == 'Expense']
    cat_totals = expenses_only.groupby('Category')['Amount'].sum()
    
    def get_pct(categories):
        total = 0
        for c in categories:
            total += cat_totals.get(c, 0)
        return total / total_expenses if total_expenses > 0 else 0

    shopping_pct = get_pct(['Shopping', 'Clothing', 'Electronics'])
    travel_pct = get_pct(['Travel', 'Transportation', 'Transport'])
    entertainment_pct = get_pct(['Entertainment', 'Dining', 'Restaurants', 'Food Delivery', 'Hobbies'])
    lifestyle_pct = shopping_pct + travel_pct + entertainment_pct
    
    # Anomaly metrics
    anomaly_count = anomalies.get('total_flagged', 0) if anomalies else 0
    
    # Subscription metrics
    sub_list = subscriptions.get('subscriptions', []) if subscriptions else []
    sub_count = len(sub_list)
    active_sub_cost = sum(s['amount'] for s in sub_list if s.get('status') == 'active')
    sub_burden = (active_sub_cost / total_income) if total_income > 0 else 0
    
    # Monthly variance (consistency)
    expense_variance = 0
    if monthly_data and len(monthly_data) > 1:
        amounts = [m['amount'] for m in monthly_data]
        expense_variance = np.std(amounts) / np.mean(amounts) if np.mean(amounts) > 0 else 0

    # Initialize Persona Scores
    scores = {
        'Disciplined Saver': 0,
        'Balanced Spender': 0,
        'Impulse Buyer': 0,
        'Subscription Heavy User': 0,
        'Lifestyle Spender': 0,
        'Goal-Oriented Planner': 0,
        'Financial Risk Taker': 0
    }

    # 1. Disciplined Saver
    if savings_rate > 0.2: scores['Disciplined Saver'] += 40
    if savings_rate > 0.4: scores['Disciplined Saver'] += 20
    if expense_variance < 0.15: scores['Disciplined Saver'] += 20
    if anomaly_count < 3: scores['Disciplined Saver'] += 20

    # 2. Balanced Spender
    if 0.05 <= savings_rate <= 0.25: scores['Balanced Spender'] += 30
    if expense_variance < 0.25: scores['Balanced Spender'] += 30
    if lifestyle_pct < 0.4: scores['Balanced Spender'] += 20
    if anomaly_count < 5: scores['Balanced Spender'] += 20

    # 3. Impulse Buyer
    if shopping_pct > 0.15: scores['Impulse Buyer'] += 30
    if shopping_pct > 0.25: scores['Impulse Buyer'] += 20
    if anomaly_count > 8: scores['Impulse Buyer'] += 30
    if expense_variance > 0.3: scores['Impulse Buyer'] += 20

    # 4. Subscription Heavy User
    if sub_count > 5: scores['Subscription Heavy User'] += 30
    if sub_count > 10: scores['Subscription Heavy User'] += 30
    if sub_burden > 0.05: scores['Subscription Heavy User'] += 40

    # 5. Lifestyle Spender
    if lifestyle_pct > 0.3: scores['Lifestyle Spender'] += 40
    if travel_pct > 0.15: scores['Lifestyle Spender'] += 30
    if entertainment_pct > 0.15: scores['Lifestyle Spender'] += 30

    # 6. Goal-Oriented Planner
    if savings_rate > 0.15: scores['Goal-Oriented Planner'] += 30
    if expense_variance < 0.2: scores['Goal-Oriented Planner'] += 30
    if sub_burden < 0.03: scores['Goal-Oriented Planner'] += 20
    if anomaly_count < 4: scores['Goal-Oriented Planner'] += 20

    # 7. Financial Risk Taker
    if savings_rate < 0: scores['Financial Risk Taker'] += 40
    if expense_variance > 0.4: scores['Financial Risk Taker'] += 30
    if anomaly_count > 10: scores['Financial Risk Taker'] += 30

    # Add a small baseline so nobody is entirely zero
    for k in scores:
        scores[k] += 5

    # Normalize scores to percentages
    total_score = sum(scores.values())
    traits = {k: round((v / total_score) * 100) for k, v in scores.items()}
    
    # Sort traits
    sorted_traits = sorted(traits.items(), key=lambda x: x[1], reverse=True)
    primary_name, primary_confidence = sorted_traits[0]
    
    # Ensure confidence looks realistic (cap at 98)
    primary_confidence = min(98, max(45, primary_confidence + 15)) 

    # Profile Data
    PROFILES = {
        'Disciplined Saver': {
            'description': "You prioritize financial stability and long-term security. Your spending habits are controlled and highly intentional.",
            'color': '#10b981',
            'icon': '🛡️'
        },
        'Balanced Spender': {
            'description': "You maintain a healthy balance between enjoying life today and managing finances responsibly for tomorrow.",
            'color': '#3b82f6',
            'icon': '⚖️'
        },
        'Impulse Buyer': {
            'description': "You enjoy spontaneous purchases and often let your emotions guide your spending decisions.",
            'color': '#f43f5e',
            'icon': '🛍️'
        },
        'Subscription Heavy User': {
            'description': "You love convenience and digital services, but you may be losing track of your recurring monthly payments.",
            'color': '#8b5cf6',
            'icon': '💳'
        },
        'Lifestyle Spender': {
            'description': "Experiences are everything to you! You prioritize dining, travel, and entertainment over aggressive saving.",
            'color': '#f59e0b',
            'icon': '✈️'
        },
        'Goal-Oriented Planner': {
            'description': "You actively manage your finances with clear future goals in mind. Every transaction has a purpose.",
            'color': '#0ea5e9',
            'icon': '🎯'
        },
        'Financial Risk Taker': {
            'description': "Your spending patterns fluctuate significantly. You are comfortable with risk, but may lack a safety net.",
            'color': '#ef4444',
            'icon': '🎲'
        }
    }

    # Dynamic Insights Generation
    strengths = []
    weaknesses = []
    risks = []
    recommendations = []

    if savings_rate > 0.15:
        strengths.append("Excellent savings discipline")
    elif savings_rate < 0:
        weaknesses.append("Negative savings rate (spending more than income)")
        risks.append("Declining financial stability")
        recommendations.append("Immediately review essential vs non-essential expenses.")
    
    if expense_variance < 0.2:
        strengths.append("Consistent and predictable monthly spending")
    elif expense_variance > 0.4:
        weaknesses.append("High volatility in monthly expenses")
        risks.append("Difficulty sticking to a long-term budget")
        recommendations.append("Try building a buffer fund for high-spending months.")
        
    if anomaly_count < 3:
        strengths.append("Low frequency of unexpected or impulse purchases")
    elif anomaly_count > 8:
        weaknesses.append("Frequent unusual spending spikes detected")
        risks.append("Impulse buying eroding potential savings")
        recommendations.append("Implement a 24-hour waiting rule for purchases over ₹2000.")

    if sub_count > 8:
        weaknesses.append(f"High subscription burden ({sub_count} detected)")
        risks.append("Subscription creep leading to passive wealth drain")
        recommendations.append("Cancel at least two inactive or low-value subscriptions this week.")
        
    if lifestyle_pct > 0.35:
        weaknesses.append("Disproportionate spending on lifestyle and entertainment")
        risks.append("Lifestyle inflation limiting investment potential")
        recommendations.append("Consider reducing dining and entertainment spending by 10-15%.")
    else:
        strengths.append("Well-balanced category distribution")

    # Ensure at least 1 item per list
    if not strengths: strengths.append("Shows basic financial awareness")
    if not weaknesses: weaknesses.append("Minor optimization opportunities exist")
    if not risks: risks.append("None currently detected")
    if not recommendations: recommendations.append("Maintain current financial habits to achieve your goals.")

    profile = PROFILES[primary_name]

    return {
        'personality': primary_name,
        'confidence': primary_confidence,
        'description': profile['description'],
        'color': profile['color'],
        'icon': profile['icon'],
        'strengths': strengths[:4],
        'weaknesses': weaknesses[:4],
        'risks': risks[:3],
        'recommendations': recommendations[:3],
        'traits': [{'name': k, 'percentage': v} for k, v in sorted_traits[:4]]  # Top 4 secondary traits
    }
