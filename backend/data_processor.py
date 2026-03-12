"""
Data processing module for FinSight.
Handles CSV/XLSX loading, cleaning, and aggregation.
"""

import pandas as pd
import numpy as np
from io import BytesIO


def load_and_clean(file_path_or_buffer, filename="data.csv"):
    """
    Load transaction data from CSV or XLSX file and clean it.
    Returns a clean DataFrame ready for analysis.
    """
    # Determine file type and load
    if isinstance(file_path_or_buffer, str):
        if file_path_or_buffer.endswith('.xlsx') or file_path_or_buffer.endswith('.xls'):
            df = pd.read_excel(file_path_or_buffer)
        else:
            df = pd.read_csv(file_path_or_buffer)
    else:
        if filename.endswith('.xlsx') or filename.endswith('.xls'):
            df = pd.read_excel(BytesIO(file_path_or_buffer))
        else:
            df = pd.read_csv(BytesIO(file_path_or_buffer))

    # Standardize column names
    df.columns = df.columns.str.strip()

    # Map possible column name variations
    col_map = {}
    for col in df.columns:
        cl = col.lower().replace('_', ' ').strip()
        if 'date' in cl:
            col_map[col] = 'Date'
        elif 'desc' in cl or 'transaction' in cl:
            col_map[col] = 'Description'
        elif 'categ' in cl:
            col_map[col] = 'Category'
        elif 'amount' in cl or 'value' in cl:
            col_map[col] = 'Amount'
        elif 'type' in cl or 'kind' in cl:
            col_map[col] = 'Type'

    df = df.rename(columns=col_map)

    # Ensure required columns exist
    required = ['Date', 'Amount']
    for col in required:
        if col not in df.columns:
            raise ValueError(f"Missing required column: {col}")

    # Add default columns if missing
    if 'Category' not in df.columns:
        df['Category'] = 'Uncategorized'
    if 'Type' not in df.columns:
        df['Type'] = 'Expense'
    if 'Description' not in df.columns:
        df['Description'] = ''

    # Parse dates
    df['Date'] = pd.to_datetime(df['Date'], errors='coerce')
    df = df.dropna(subset=['Date'])

    # Clean amounts - ensure numeric
    df['Amount'] = pd.to_numeric(df['Amount'], errors='coerce')
    df = df.dropna(subset=['Amount'])
    df['Amount'] = df['Amount'].abs()  # Ensure positive amounts

    # Standardize categories
    df['Category'] = df['Category'].astype(str).str.strip().str.title()

    # Standardize type
    df['Type'] = df['Type'].astype(str).str.strip().str.title()
    df['Type'] = df['Type'].apply(lambda x: x if x in ['Income', 'Expense'] else 'Expense')

    # Fill missing descriptions
    df['Description'] = df['Description'].fillna('').astype(str).str.strip()

    # Remove exact duplicates
    df = df.drop_duplicates()

    # Sort by date
    df = df.sort_values('Date').reset_index(drop=True)

    return df


def get_overview(df):
    """
    Returns an overview summary of the transaction data.
    """
    expenses = df[df['Type'] == 'Expense']
    income = df[df['Type'] == 'Income']

    total_income = float(income['Amount'].sum())
    total_expenses = float(expenses['Amount'].sum())
    savings = total_income - total_expenses
    savings_rate = (savings / total_income * 100) if total_income > 0 else 0

    # Top categories by expense
    category_totals = (
        expenses.groupby('Category')['Amount']
        .sum()
        .sort_values(ascending=False)
    )
    top_categories = [
        {'category': cat, 'amount': float(amt)}
        for cat, amt in category_totals.head(5).items()
    ]

    # Date range
    date_min = df['Date'].min().strftime('%Y-%m-%d')
    date_max = df['Date'].max().strftime('%Y-%m-%d')

    # Monthly average expense
    expenses_by_month = expenses.groupby(expenses['Date'].dt.to_period('M'))['Amount'].sum()
    avg_monthly = float(expenses_by_month.mean()) if len(expenses_by_month) > 0 else 0

    return {
        'total_income': round(total_income, 2),
        'total_expenses': round(total_expenses, 2),
        'savings': round(savings, 2),
        'savings_rate': round(savings_rate, 1),
        'transaction_count': len(df),
        'expense_count': len(expenses),
        'income_count': len(income),
        'top_categories': top_categories,
        'date_range': {'start': date_min, 'end': date_max},
        'avg_monthly_expense': round(avg_monthly, 2),
        'months_of_data': len(expenses_by_month),
    }


def monthly_summary(df):
    """
    Groups transactions by month and returns spending data.
    """
    expenses = df[df['Type'] == 'Expense'].copy()
    expenses['YearMonth'] = expenses['Date'].dt.to_period('M')

    result = []
    for period, group in expenses.groupby('YearMonth'):
        # Category breakdown
        cat_breakdown = (
            group.groupby('Category')['Amount']
            .sum()
            .sort_values(ascending=False)
        )
        categories = [
            {'category': cat, 'amount': round(float(amt), 2)}
            for cat, amt in cat_breakdown.items()
        ]

        result.append({
            'month': str(period),
            'label': period.strftime('%b %Y'),
            'total': round(float(group['Amount'].sum()), 2),
            'count': len(group),
            'categories': categories,
        })

    # Sort by month
    result.sort(key=lambda x: x['month'])
    return result


def weekly_summary(df, year_month=None):
    """
    Groups transactions by week within a month.
    If year_month is provided (e.g., '2024-01'), filters to that month.
    Returns weekly breakdown with burn rate.
    """
    expenses = df[df['Type'] == 'Expense'].copy()

    if year_month:
        period = pd.Period(year_month, freq='M')
        mask = expenses['Date'].dt.to_period('M') == period
        expenses = expenses[mask]

    if expenses.empty:
        return {'weeks': [], 'month': year_month or 'all', 'total': 0}

    # Determine which week of the month each transaction falls in
    expenses['DayOfMonth'] = expenses['Date'].dt.day
    expenses['Week'] = expenses['DayOfMonth'].apply(
        lambda d: min((d - 1) // 7 + 1, 5)
    )

    month_total = float(expenses['Amount'].sum())
    weeks = []
    cumulative = 0

    for week_num in sorted(expenses['Week'].unique()):
        week_group = expenses[expenses['Week'] == week_num]
        week_total = float(week_group['Amount'].sum())
        cumulative += week_total

        # Category breakdown for this week
        cat_breakdown = (
            week_group.groupby('Category')['Amount']
            .sum()
            .sort_values(ascending=False)
        )
        categories = [
            {'category': cat, 'amount': round(float(amt), 2)}
            for cat, amt in cat_breakdown.items()
        ]

        # Transactions list
        transactions = []
        for _, row in week_group.iterrows():
            transactions.append({
                'date': row['Date'].strftime('%Y-%m-%d'),
                'description': row['Description'],
                'category': row['Category'],
                'amount': round(float(row['Amount']), 2),
            })

        weeks.append({
            'week': int(week_num),
            'label': f'Week {int(week_num)}',
            'total': round(week_total, 2),
            'count': len(week_group),
            'burn_rate': round(cumulative / month_total * 100, 1) if month_total > 0 else 0,
            'categories': categories,
            'transactions': transactions,
        })

    return {
        'weeks': weeks,
        'month': year_month or 'all',
        'total': round(month_total, 2),
    }
