import pandas as pd
import numpy as np

def run_simulation(df, store, params):
    """
    Run a What-If simulation.
    params: {
        'food_reduction': float (0-100),
        'shopping_reduction': float (0-100),
        'entertainment_reduction': float (0-100),
        'travel_reduction': float (0-100),
        'subscription_removals': list of names,
        'extra_savings': float
    }
    """
    if df is None or store.get('overview') is None:
        return {'error': 'No data available'}

    from financial_health import calculate_financial_health
    
    # 1. Base Metrics
    base_overview = store['overview']
    base_monthly_expense = base_overview.get('monthly_expense', 0)
    base_monthly_income = base_overview.get('monthly_income', 0)
    base_monthly_savings = max(0, base_monthly_income - base_monthly_expense)
    
    # 2. Extract Params
    food_red = params.get('food_reduction', 0) / 100.0
    shop_red = params.get('shopping_reduction', 0) / 100.0
    ent_red = params.get('entertainment_reduction', 0) / 100.0
    travel_red = params.get('travel_reduction', 0) / 100.0
    subs_removed = params.get('subscription_removals', [])
    extra_savings = float(params.get('extra_savings', 0))

    # 3. Simulate new DataFrame
    sim_df = df.copy()
    
    # Category mappings (handling common variations)
    food_cats = ['Food & Drink', 'Food', 'Dining', 'Restaurant']
    shop_cats = ['Shopping', 'Clothing', 'Electronics']
    ent_cats = ['Entertainment', 'Hobbies', 'Movies']
    travel_cats = ['Travel', 'Vacation', 'Transport', 'Transportation']

    def apply_reduction(row):
        if row['Type'] != 'Expense': return row['Amount']
        cat = str(row['Category'])
        amt = float(row['Amount'])
        
        # Check subscriptions first
        if row.get('Description') in subs_removed or cat in subs_removed:
            return 0  # 100% reduction for removed subscriptions
            
        if any(c.lower() in cat.lower() for c in food_cats):
            return amt * (1 - food_red)
        if any(c.lower() in cat.lower() for c in shop_cats):
            return amt * (1 - shop_red)
        if any(c.lower() in cat.lower() for c in ent_cats):
            return amt * (1 - ent_red)
        if any(c.lower() in cat.lower() for c in travel_cats):
            return amt * (1 - travel_red)
            
        return amt

    sim_df['Amount'] = sim_df.apply(apply_reduction, axis=1)

    # 4. Recalculate Overview
    total_sim_expense = sim_df[sim_df['Type'] == 'Expense']['Amount'].sum()
    months_count = len(sim_df['Date'].dt.to_period('M').unique())
    sim_monthly_expense = total_sim_expense / months_count if months_count > 0 else 0
    sim_monthly_savings = max(0, base_monthly_income - sim_monthly_expense) + extra_savings
    
    # Update sim_overview for health score calculation
    sim_overview = base_overview.copy()
    sim_overview['monthly_expense'] = sim_monthly_expense
    sim_overview['monthly_savings'] = sim_monthly_savings
    sim_overview['savings_rate'] = sim_monthly_savings / base_monthly_income if base_monthly_income > 0 else 0

    # 5. Recalculate Subscriptions for health score
    base_subs = store.get('subscriptions', {})
    sim_subs = {'subscriptions': [], 'total_monthly_cost': 0}
    if base_subs and 'subscriptions' in base_subs:
        for sub in base_subs['subscriptions']:
            if sub['name'] not in subs_removed:
                sim_subs['subscriptions'].append(sub)
                if sub.get('status') == 'active':
                    sim_subs['total_monthly_cost'] += sub.get('estimated_monthly_cost', 0)

    # 6. Recalculate Health Score
    # We use the existing anomalies and monthly data since we just changed magnitudes, not frequencies
    base_health = store.get('health_score', {})
    sim_health = calculate_financial_health(
        sim_df, 
        sim_overview, 
        sim_subs, 
        store.get('anomalies', []), 
        store.get('monthly', {})
    )

    health_score_before = base_health.get('score', 0) if base_health else 0
    health_score_after = sim_health.get('score', 0) if sim_health else 0

    # 7. Recalculate Goal Impact
    goal_completion_before = None
    goal_completion_after = None
    goal_name = "Goal"
    
    if store.get('goals') and len(store['goals']) > 0:
        goal = store['goals'][0] # Use top priority goal
        goal_name = goal.get('name', 'Goal')
        target = goal.get('target_amount', 0)
        current = goal.get('current_savings', 0)
        remaining = max(0, target - current)
        
        if base_monthly_savings > 0:
            goal_completion_before = remaining / base_monthly_savings
        
        if sim_monthly_savings > 0:
            goal_completion_after = remaining / sim_monthly_savings

    # Formatting responses
    res = {
        'health_score_before': health_score_before,
        'health_score_after': health_score_after,
        'annual_savings_before': round(base_monthly_savings * 12, 2),
        'annual_savings_after': round(sim_monthly_savings * 12, 2),
        'monthly_savings_before': round(base_monthly_savings, 2),
        'monthly_savings_after': round(sim_monthly_savings, 2),
    }

    if goal_completion_before is not None:
        res['goal_completion_before'] = round(goal_completion_before, 1)
    if goal_completion_after is not None:
        res['goal_completion_after'] = round(goal_completion_after, 1)
    if goal_completion_before is not None and goal_completion_after is not None:
        res['goal_time_saved'] = round(goal_completion_before - goal_completion_after, 1)
        res['goal_name'] = goal_name

    # Basic Recommendations / AI context
    recommendations = []
    if subs_removed:
        recommendations.append(f"Cancelling {len(subs_removed)} subscriptions.")
    if extra_savings > 0:
        recommendations.append(f"Directing an extra ₹{extra_savings} into savings.")
    
    res['recommendations'] = recommendations

    return res

def get_simulator_ai_explanation(params, sim_result):
    from financial_coach import get_gemini_client
    genai = get_gemini_client()
    if not genai:
        return "AI analysis unavailable (Missing API Key)."
        
    model = genai.GenerativeModel(
        model_name="gemini-2.5-flash",
        system_instruction="You are FinSight AI, a financial planning assistant."
    )
    
    prompt = f"""
    The user ran a What-If financial simulation.
    Changes made:
    - Food Reduced: {params.get('food_reduction', 0)}%
    - Shopping Reduced: {params.get('shopping_reduction', 0)}%
    - Entertainment Reduced: {params.get('entertainment_reduction', 0)}%
    - Subscriptions Cancelled: {', '.join(params.get('subscription_removals', [])) or 'None'}
    - Extra Monthly Savings: ₹{params.get('extra_savings', 0)}
    
    Results:
    - Health Score: {sim_result.get('health_score_before')} -> {sim_result.get('health_score_after')}
    - Annual Savings: ₹{sim_result.get('annual_savings_before')} -> ₹{sim_result.get('annual_savings_after')}
    """
    
    if 'goal_time_saved' in sim_result:
        prompt += f"- Goal ({sim_result.get('goal_name')}): Reached {sim_result.get('goal_time_saved')} months faster.\n"
        
    prompt += "\nWrite a concise (1-2 sentences), highly encouraging analysis of these results. Focus on the positive impact on their financial future. Do not use formatting like bold/italics. Just plain text."
    
    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        return "Your simulated changes have a positive impact on your financial trajectory."
