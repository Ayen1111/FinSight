import numpy as np

def calculate_financial_health(df, overview, subscriptions, anomalies, monthly_data):
    """Calculate the 0-100 Financial Health Score."""
    if df is None or overview is None:
        return None

    strengths = []
    weaknesses = []
    recommendations = []

    # 1. Savings Score (30%)
    savings_rate = overview.get('savings_rate', 0)
    if savings_rate >= 0.30:
        savings_score = 100
        strengths.append("Excellent savings rate (over 30%).")
    elif savings_rate >= 0.20:
        savings_score = 85
        strengths.append("Good savings rate.")
    elif savings_rate >= 0.10:
        savings_score = 70
        recommendations.append("Try to increase your savings rate to 20% by cutting discretionary spending.")
    elif savings_rate > 0:
        savings_score = 50
        weaknesses.append("Low savings rate.")
        recommendations.append("Focus on increasing your monthly savings. Even small amounts add up.")
    else:
        savings_score = 20
        weaknesses.append("Negative savings rate (spending more than income).")
        recommendations.append("Urgent: You are spending more than you earn. Review essential vs non-essential expenses.")

    # 2. Spending Discipline Score (20%)
    discretionary_categories = ['Food & Drink', 'Entertainment', 'Shopping', 'Personal Care']
    expenses_df = df[df['Type'] == 'Expense']
    total_expenses = expenses_df['Amount'].sum()
    if total_expenses > 0:
        disc_spending = expenses_df[expenses_df['Category'].isin(discretionary_categories)]['Amount'].sum()
        disc_ratio = disc_spending / total_expenses
    else:
        disc_ratio = 0

    if disc_ratio <= 0.20:
        spending_score = 100
        strengths.append("Very disciplined spending on discretionary items.")
    elif disc_ratio <= 0.40:
        spending_score = 85
        strengths.append("Balanced spending habits.")
    elif disc_ratio <= 0.60:
        spending_score = 60
        weaknesses.append("High portion of income goes to discretionary spending.")
        recommendations.append(f"Reducing discretionary spending by 15% could noticeably improve your score.")
    else:
        spending_score = 40
        weaknesses.append("Excessive discretionary spending.")
        recommendations.append("Cut back on Shopping and Entertainment to improve your financial health.")

    # 3. Subscription Score (15%)
    subs_list = subscriptions.get('subscriptions', [])
    inactive_subs = [s for s in subs_list if s.get('status') in ['possibly_unused', 'inactive']]
    total_monthly_sub_cost = subscriptions.get('total_monthly_cost', 0)
    
    if len(subs_list) == 0:
        subscription_score = 100
        strengths.append("No subscription burden.")
    else:
        inactive_ratio = len(inactive_subs) / len(subs_list)
        if inactive_ratio == 0:
            subscription_score = 90
            strengths.append("All your subscriptions appear to be actively used.")
        elif inactive_ratio <= 0.25:
            subscription_score = 70
            recommendations.append(f"Review your subscriptions, you have {len(inactive_subs)} potentially unused ones.")
        else:
            subscription_score = 40
            weaknesses.append(f"High number of unused/inactive subscriptions ({len(inactive_subs)}).")
            recommendations.append(f"Cancelling inactive subscriptions could save you money.")

    # 4. Anomaly Score (15%)
    anomaly_count = len(anomalies) if anomalies else 0
    if anomaly_count == 0:
        anomaly_score = 100
        strengths.append("No unusual or unexpected transactions detected.")
    elif anomaly_count <= 2:
        anomaly_score = 85
    elif anomaly_count <= 5:
        anomaly_score = 60
        weaknesses.append(f"Detected {anomaly_count} unusual transactions.")
        recommendations.append("Review your recent large or unusual transactions to ensure they are accurate.")
    else:
        anomaly_score = 40
        weaknesses.append(f"High frequency of spending anomalies ({anomaly_count}).")
        recommendations.append("Your spending has many erratic spikes. Try to stick to a more predictable budget.")

    # 5. Expense Stability Score (10%) & Cash Flow Score (10%)
    if monthly_data and len(monthly_data) > 1:
        expenses_per_month = [m['expenses'] for m in monthly_data]
        income_per_month = [m['income'] for m in monthly_data]
        
        # Stability: Coefficient of Variation of expenses
        exp_mean = np.mean(expenses_per_month)
        if exp_mean > 0:
            exp_cv = np.std(expenses_per_month) / exp_mean
        else:
            exp_cv = 0

        if exp_cv <= 0.15:
            stability_score = 100
            strengths.append("Highly stable and predictable monthly expenses.")
        elif exp_cv <= 0.30:
            stability_score = 80
            strengths.append("Fairly consistent monthly spending.")
        else:
            stability_score = 50
            weaknesses.append("High variance in monthly spending.")
            recommendations.append("Try to smooth out your monthly expenses for better predictability.")

        # Cash Flow: Income vs Expense consistency
        inc_mean = np.mean(income_per_month)
        if inc_mean > 0:
            inc_cv = np.std(income_per_month) / inc_mean
        else:
            inc_cv = 0
            
        if inc_cv <= 0.10 and exp_cv <= 0.20:
            cashflow_score = 100
            strengths.append("Strong and consistent cash flow.")
        elif inc_cv > 0.30:
            cashflow_score = 50
            weaknesses.append("Irregular income streams.")
        else:
            cashflow_score = 75
    else:
        # Not enough data for variance
        stability_score = 80
        cashflow_score = 80

    # Calculate final weighted score
    final_score = (
        (savings_score * 0.30) +
        (spending_score * 0.20) +
        (subscription_score * 0.15) +
        (anomaly_score * 0.15) +
        (stability_score * 0.10) +
        (cashflow_score * 0.10)
    )
    final_score = int(round(final_score))

    # Rating Bucket
    if final_score >= 90:
        rating = "Excellent"
    elif final_score >= 75:
        rating = "Good"
    elif final_score >= 60:
        rating = "Average"
    elif final_score >= 40:
        rating = "Needs Improvement"
    else:
        rating = "Financial Risk Zone"

    # Deduplicate lists
    strengths = list(dict.fromkeys(strengths))[:4]
    weaknesses = list(dict.fromkeys(weaknesses))[:4]
    recommendations = list(dict.fromkeys(recommendations))[:4]

    return {
        'score': final_score,
        'rating': rating,
        'savings_score': savings_score,
        'spending_score': spending_score,
        'subscription_score': subscription_score,
        'anomaly_score': anomaly_score,
        'stability_score': stability_score,
        'cashflow_score': cashflow_score,
        'strengths': strengths,
        'weaknesses': weaknesses,
        'recommendations': recommendations
    }
