"""
Savings Goal Reverse Engineer for FinSight.
Creates personalized spending reduction plans to meet savings targets.
"""

import pandas as pd
import numpy as np


def create_savings_plan(df, target_amount, months):
    """
    Analyzes current spending and creates a plan to achieve the savings goal.
    
    Args:
        df: Transaction DataFrame
        target_amount: Target savings amount (e.g., 50000)
        months: Timeframe in months (e.g., 4)
    
    Returns:
        Detailed savings plan with category-by-category reductions
    """
    expenses = df[df['Type'] == 'Expense'].copy()
    income = df[df['Type'] == 'Income'].copy()

    if expenses.empty:
        return {
            'feasible': False,
            'message': 'No expense data available for analysis.',
            'plan': [],
        }

    # Calculate monthly averages
    monthly_expenses = expenses.groupby(expenses['Date'].dt.to_period('M'))['Amount'].sum()
    monthly_income = income.groupby(income['Date'].dt.to_period('M'))['Amount'].sum()

    avg_monthly_expense = float(monthly_expenses.mean())
    avg_monthly_income = float(monthly_income.mean()) if len(monthly_income) > 0 else 0

    # Current monthly surplus
    current_surplus = avg_monthly_income - avg_monthly_expense
    monthly_target = target_amount / months

    # How much more per month we need to save
    additional_savings_needed = monthly_target - max(0, current_surplus)

    # Category breakdown with reduction potential
    cat_monthly = expenses.groupby([expenses['Date'].dt.to_period('M'), 'Category'])['Amount'].sum()
    cat_avg = cat_monthly.groupby('Category').mean().sort_values(ascending=False)

    # Classify categories by how much they can be reduced
    essential_categories = ['rent', 'utilities', 'insurance', 'health', 'healthcare',
                           'medical', 'groceries', 'transportation', 'transport', 'emi']
    moderate_categories = ['education', 'fuel', 'phone', 'internet']
    flexible_categories = ['food', 'dining', 'restaurant', 'shopping', 'entertainment',
                          'travel', 'subscriptions', 'hobbies', 'gifts', 'personal care',
                          'clothing', 'electronics', 'food delivery', 'sports']

    plan = []
    total_achievable_savings = 0

    for category, avg_amount in cat_avg.items():
        cat_lower = category.lower()
        avg_amt = float(avg_amount)

        # Determine max reduction percentage based on category type
        if any(e in cat_lower for e in essential_categories):
            max_reduction_pct = 10
            priority = 'low'
            difficulty = 'Hard'
        elif any(m in cat_lower for m in moderate_categories):
            max_reduction_pct = 25
            priority = 'medium'
            difficulty = 'Medium'
        else:
            max_reduction_pct = 50
            priority = 'high'
            difficulty = 'Easy'

        # Suggested reduction (scaled by how much we need)
        if additional_savings_needed <= 0:
            suggested_pct = 0
        else:
            # More aggressive reductions on flexible categories
            ratio = min(1.0, additional_savings_needed / avg_monthly_expense)
            suggested_pct = min(max_reduction_pct, max_reduction_pct * ratio * 2)

        savings = avg_amt * (suggested_pct / 100)
        total_achievable_savings += savings

        if suggested_pct > 0:
            plan.append({
                'category': category,
                'current_monthly': round(avg_amt, 2),
                'reduction_pct': round(suggested_pct, 1),
                'monthly_savings': round(savings, 2),
                'new_budget': round(avg_amt - savings, 2),
                'priority': priority,
                'difficulty': difficulty,
            })

    # Sort by savings potential (highest first)
    plan.sort(key=lambda x: -x['monthly_savings'])

    # Calculate timeline
    effective_monthly_savings = max(0, current_surplus) + total_achievable_savings
    if effective_monthly_savings > 0:
        estimated_months = target_amount / effective_monthly_savings
        timeline_message = f"You'll hit ₹{target_amount:,.0f} in {estimated_months:.0f} months"
        if estimated_months <= months:
            diff = months - estimated_months
            if diff >= 1:
                timeline_message += f" ({diff:.0f} month{'s' if diff > 1 else ''} ahead of schedule!)"
            feasible = True
        else:
            extra = estimated_months - months
            timeline_message += f" ({extra:.0f} month{'s' if extra > 1 else ''} behind target)"
            feasible = estimated_months <= months * 1.5  # Within 50% of target timeline
    else:
        estimated_months = float('inf')
        timeline_message = "This goal isn't achievable with current income."
        feasible = False

    # Tips
    tips = []
    if plan:
        top = plan[0]
        tips.append(f"Focus on reducing {top['category']} spending by {top['reduction_pct']:.0f}% — this alone saves ₹{top['monthly_savings']:,.0f}/month")
    if len(plan) > 1:
        total_easy = sum(p['monthly_savings'] for p in plan if p['difficulty'] == 'Easy')
        tips.append(f"All easy reductions combined can save ₹{total_easy:,.0f}/month")
    if current_surplus > 0:
        tips.append(f"You're already saving ₹{current_surplus:,.0f}/month — great start!")

    return {
        'feasible': feasible,
        'target_amount': target_amount,
        'target_months': months,
        'monthly_target': round(monthly_target, 2),
        'current_monthly_surplus': round(max(0, current_surplus), 2),
        'additional_savings_needed': round(max(0, additional_savings_needed), 2),
        'total_achievable_savings': round(total_achievable_savings, 2),
        'effective_monthly_savings': round(effective_monthly_savings, 2),
        'estimated_months': round(estimated_months, 1) if estimated_months != float('inf') else None,
        'timeline_message': timeline_message,
        'plan': plan,
        'tips': tips,
    }
