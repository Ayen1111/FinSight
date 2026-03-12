import pandas as pd
import numpy as np
from collections import defaultdict

def find_subscriptions(df):
    expenses = df[df['Type'] == 'Expense'].copy()
    if expenses.empty:
        return {'subscriptions': [], 'total_monthly_cost': 0, 'potential_savings': 0, 'total_found': 0}

    expenses['YearMonth'] = expenses['Date'].dt.to_period('M')
    expenses['DayOfMonth'] = expenses['Date'].dt.day
    subscriptions = []
    seen_keys = set()

    for category, cat_group in expenses.groupby('Category'):
        if len(cat_group) < 4:
            continue
        sorted_rows = cat_group.sort_values('Amount')
        amounts = sorted_rows['Amount'].values
        i = 0
        while i < len(amounts):
            cluster_rows = [sorted_rows.iloc[i]]
            base = amounts[i]
            j = i + 1
            while j < len(amounts) and abs(amounts[j] - base) / base < 0.08:
                cluster_rows.append(sorted_rows.iloc[j])
                j += 1
            if len(cluster_rows) >= 4:
                unique_months = set(str(r['YearMonth']) for r in cluster_rows)
                if len(unique_months) >= 4:
                    mean_amt = float(np.mean([float(r['Amount']) for r in cluster_rows]))
                    dedup = (category, round(mean_amt / 50) * 50)
                    if dedup not in seen_keys:
                        seen_keys.add(dedup)
                        sub = _build_sub(cluster_rows, expenses, category)
                        if sub:
                            subscriptions.append(sub)
            i = j if j > i else i + 1

    status_order = {'possibly_unused': 0, 'inactive': 1, 'active': 2}
    subscriptions.sort(key=lambda x: (status_order.get(x['status'], 3), -x['amount']))
    subscriptions = subscriptions[:15]
    total_monthly_cost = sum(s['amount'] for s in subscriptions)
    potential_savings = sum(s['amount'] for s in subscriptions if s['status'] in ('possibly_unused', 'inactive'))
    return {
        'subscriptions': subscriptions,
        'total_monthly_cost': round(total_monthly_cost, 2),
        'potential_savings': round(potential_savings, 2),
        'total_found': len(subscriptions)
    }


def _build_sub(rows, expenses_df, category):
    try:
        amounts = [float(r['Amount']) for r in rows]
        dates = [r['Date'] for r in rows]
        mean_amt = round(float(np.mean(amounts)), 2)
        last_occurrence = max(dates)
        first_occurrence = min(dates)
        unique_months = len(set(str(r['YearMonth']) for r in rows))
        most_recent = expenses_df['Date'].max().to_period('M')
        last_month = last_occurrence.to_period('M')
        try:
            months_since = (most_recent - last_month).n
        except Exception:
            months_since = 0
        if months_since <= 1:
            status, icon = 'active', '✓'
        elif months_since <= 4:
            status, icon = 'possibly_unused', '⚠️'
        else:
            status, icon = 'inactive', '❌'
        labels = {
            'Rent': 'Monthly Rent Payment',
            'Utilities': 'Utility Bills',
            'Health & Fitness': 'Gym / Health Subscription',
            'Entertainment': 'Entertainment Subscription',
            'Food & Drink': 'Recurring Food Delivery',
            'Shopping': 'Recurring Shopping',
            'Travel': 'Travel / Commute Pass',
            'Salary': 'Salary Credit',
            'Investment': 'Investment / SIP',
        }
        name = labels.get(category, 'Recurring ' + category + ' Payment')
        return {
            'name': name,
            'category': category,
            'amount': mean_amt,
            'frequency': 'Monthly',
            'months_active': unique_months,
            'first_seen': first_occurrence.strftime('%Y-%m-%d'),
            'last_seen': last_occurrence.strftime('%Y-%m-%d'),
            'status': status,
            'status_icon': icon,
            'status_color': 'green' if status == 'active' else ('yellow' if status == 'possibly_unused' else 'red'),
            'months_since_last': months_since,
        }
    except Exception:
        return None