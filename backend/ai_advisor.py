"""
AI Advisor for FinSight.
Generates personalized spending advice using rule-based analysis.
(No external API required)
"""


def get_advice(overview, monthly_data, anomalies=None, subscriptions=None):
    """
    Generates 3-5 personalized, actionable money-saving recommendations
    based on spending patterns.
    """
    tips = []

    total_expenses = overview.get('total_expenses', 0)
    total_income = overview.get('total_income', 0)
    savings_rate = overview.get('savings_rate', 0)
    top_categories = overview.get('top_categories', [])
    avg_monthly = overview.get('avg_monthly_expense', 0)

    # Tip 1: Savings rate analysis
    if savings_rate < 10:
        tips.append({
            'title': '🚨 Emergency: Very Low Savings Rate',
            'description': f'Your savings rate is only {savings_rate:.1f}%. Financial experts recommend saving at least 20% of income. You\'re spending ₹{total_expenses:,.0f} out of ₹{total_income:,.0f}.',
            'action': 'Set up an automatic transfer of 10% of income to a savings account on payday.',
            'potential_savings': round(total_income * 0.1 / max(1, overview.get("months_of_data", 1)), 2),
            'priority': 'critical',
            'icon': '🚨',
        })
    elif savings_rate < 20:
        tips.append({
            'title': '⚠️ Improve Your Savings Rate',
            'description': f'Your savings rate is {savings_rate:.1f}%. Good start, but aim for 20%+ by reducing discretionary spending.',
            'action': 'Review your top 2 spending categories and set strict monthly limits.',
            'potential_savings': round((0.2 - savings_rate / 100) * total_income / max(1, overview.get("months_of_data", 1)), 2),
            'priority': 'high',
            'icon': '⚠️',
        })
    else:
        tips.append({
            'title': '✅ Great Savings Discipline!',
            'description': f'Your savings rate is {savings_rate:.1f}% — above the recommended 20%. Keep it up!',
            'action': 'Consider investing your surplus in SIPs or fixed deposits for better returns.',
            'potential_savings': 0,
            'priority': 'info',
            'icon': '✅',
        })

    # Tip 2: Analyze top spending category
    if top_categories:
        top_cat = top_categories[0]
        cat_name = top_cat['category']
        cat_amount = top_cat['amount']
        cat_pct = (cat_amount / total_expenses * 100) if total_expenses > 0 else 0
        monthly_cat = cat_amount / max(1, overview.get('months_of_data', 1))

        # Category-specific advice
        food_keywords = ['food', 'dining', 'restaurant', 'delivery']
        shopping_keywords = ['shopping', 'clothing', 'electronics']
        entertainment_keywords = ['entertainment', 'streaming', 'movies']

        cat_lower = cat_name.lower()
        if any(k in cat_lower for k in food_keywords):
            tips.append({
                'title': f'🍔 High Food Spending: ₹{monthly_cat:,.0f}/month',
                'description': f'{cat_name} is your #1 expense at {cat_pct:.0f}% of total spending (₹{monthly_cat:,.0f}/month).',
                'action': f'Cook at home 3 days/week to save ~₹{monthly_cat * 0.3:,.0f}/month. Use meal prep on Sundays.',
                'potential_savings': round(monthly_cat * 0.3, 2),
                'priority': 'high',
                'icon': '🍔',
            })
        elif any(k in cat_lower for k in shopping_keywords):
            tips.append({
                'title': f'🛍️ Shopping Habit: ₹{monthly_cat:,.0f}/month',
                'description': f'{cat_name} takes up {cat_pct:.0f}% of your total spending.',
                'action': f'Try the 48-hour rule: wait 2 days before any purchase over ₹500. Expected savings: ₹{monthly_cat * 0.25:,.0f}/month.',
                'potential_savings': round(monthly_cat * 0.25, 2),
                'priority': 'high',
                'icon': '🛍️',
            })
        elif any(k in cat_lower for k in entertainment_keywords):
            tips.append({
                'title': f'🎬 Entertainment Costs: ₹{monthly_cat:,.0f}/month',
                'description': f'You spend {cat_pct:.0f}% on {cat_name}. While fun is important, consider free alternatives.',
                'action': f'Switch 2 paid outings/month to free activities (parks, home movie nights). Save ~₹{monthly_cat * 0.2:,.0f}/month.',
                'potential_savings': round(monthly_cat * 0.2, 2),
                'priority': 'medium',
                'icon': '🎬',
            })
        else:
            if cat_pct > 30:
                tips.append({
                    'title': f'📊 {cat_name} Dominates Spending ({cat_pct:.0f}%)',
                    'description': f'₹{monthly_cat:,.0f}/month on {cat_name} is very high. Review if all transactions are necessary.',
                    'action': f'Audit this month\'s {cat_name} transactions and cut 20% of non-essential ones.',
                    'potential_savings': round(monthly_cat * 0.2, 2),
                    'priority': 'high',
                    'icon': '📊',
                })

    # Tip 3: Month-over-month trend
    if monthly_data and len(monthly_data) >= 3:
        recent_3 = [m['total'] for m in monthly_data[-3:]]
        older_3 = [m['total'] for m in monthly_data[-6:-3]] if len(monthly_data) >= 6 else []

        if older_3:
            recent_avg = sum(recent_3) / len(recent_3)
            older_avg = sum(older_3) / len(older_3)
            change_pct = ((recent_avg - older_avg) / older_avg * 100) if older_avg > 0 else 0

            if change_pct > 15:
                tips.append({
                    'title': f'📈 Spending Increasing ({change_pct:.0f}% Up)',
                    'description': f'Your recent 3-month average (₹{recent_avg:,.0f}) is {change_pct:.0f}% higher than the prior 3 months (₹{older_avg:,.0f}).',
                    'action': 'Identify which categories grew the most and set spending alerts.',
                    'potential_savings': round((recent_avg - older_avg), 2),
                    'priority': 'high',
                    'icon': '📈',
                })
            elif change_pct < -10:
                tips.append({
                    'title': f'📉 Great Job Cutting Spending!',
                    'description': f'Your recent spending is down {abs(change_pct):.0f}% from 3 months ago. Keep this momentum!',
                    'action': 'Redirect the savings to an emergency fund or investment.',
                    'potential_savings': 0,
                    'priority': 'info',
                    'icon': '📉',
                })

    # Tip 4: Multiple small category optimization
    if len(top_categories) >= 3:
        small_cats = top_categories[2:]
        small_total = sum(c['amount'] for c in small_cats)
        small_monthly = small_total / max(1, overview.get('months_of_data', 1))

        if small_monthly > avg_monthly * 0.2:
            tips.append({
                'title': '💡 Death by a Thousand Cuts',
                'description': f'Your smaller categories ({", ".join(c["category"] for c in small_cats[:3])}) collectively cost ₹{small_monthly:,.0f}/month.',
                'action': 'Small expenses add up! Review recurring small purchases and eliminate 2-3 unnecessary ones.',
                'potential_savings': round(small_monthly * 0.15, 2),
                'priority': 'medium',
                'icon': '💡',
            })

    # Tip 5: Subscription-based advice
    if subscriptions and subscriptions.get('potential_savings', 0) > 0:
        tips.append({
            'title': f'👻 Zombie Subscriptions Detected!',
            'description': f'We found {subscriptions["total_found"]} recurring payments totaling ₹{subscriptions["total_monthly_cost"]:,.0f}/month. Some appear unused.',
            'action': f'Cancel unused subscriptions to save ₹{subscriptions["potential_savings"]:,.0f}/month instantly.',
            'potential_savings': subscriptions['potential_savings'],
            'priority': 'high',
            'icon': '👻',
        })

    # Tip: Anomaly awareness
    if anomalies and anomalies.get('total_flagged', 0) > 0:
        high_severity = [a for a in anomalies.get('anomalies', []) if a['severity'] == 'high']
        if high_severity:
            total_anomaly = sum(a['amount'] for a in high_severity)
            tips.append({
                'title': f'🔍 {len(high_severity)} Unusual Large Transactions',
                'description': f'We detected {len(high_severity)} high-severity anomalies totaling ₹{total_anomaly:,.0f}. These are significantly above your normal spending patterns.',
                'action': 'Review these transactions — they may be one-time expenses, but verify none are errors or fraud.',
                'potential_savings': 0,
                'priority': 'medium',
                'icon': '🔍',
            })

    # Ensure we have at least 3 tips
    if len(tips) < 3:
        if avg_monthly > 0:
            tips.append({
                'title': '🎯 The 50/30/20 Rule',
                'description': f'With ₹{avg_monthly:,.0f}/month in expenses, aim for: 50% needs, 30% wants, 20% savings.',
                'action': 'Categorize your spending into needs/wants and see where you stand against this rule.',
                'potential_savings': 0,
                'priority': 'info',
                'icon': '🎯',
            })

    # Calculate total potential savings
    total_potential = sum(t.get('potential_savings', 0) for t in tips)

    return {
        'tips': tips[:6],  # Max 6 tips
        'total_potential_savings': round(total_potential, 2),
        'generated_at': 'rule-based',
    }
