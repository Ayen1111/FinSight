"""
ML models for FinSight.
K-Means clustering, Isolation Forest anomaly detection, Linear Regression forecasting.
"""

import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.ensemble import IsolationForest
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler


# Spending personality profiles
CLUSTER_PROFILES = {
    0: {
        'name': 'Lifestyle Spender',
        'emoji': '🛍️',
        'color': '#f97316',
        'description': 'You enjoy the finer things in life! Your spending is concentrated in lifestyle categories like food, shopping, and entertainment. Consider setting monthly limits for discretionary spending.',
    },
    1: {
        'name': 'Balanced Spender',
        'emoji': '⚖️',
        'color': '#3b82f6',
        'description': 'You maintain a healthy balance across spending categories. Your expenses are well-distributed without any single category dominating. Keep up the disciplined approach!',
    },
    2: {
        'name': 'Essentials-First Saver',
        'emoji': '💰',
        'color': '#10b981',
        'description': 'You prioritize essential spending and tend to save more. Most of your expenses go to necessities like rent, utilities, and health. You\'re on a great path to financial security!',
    },
}


def cluster_spending(df):
    """
    Uses K-Means clustering to assign the user a spending personality.
    Clusters based on proportion of spending across categories.
    """
    expenses = df[df['Type'] == 'Expense'].copy()

    if expenses.empty:
        return {
            'cluster': 1,
            'profile': CLUSTER_PROFILES[1],
            'category_proportions': {},
        }

    # Calculate spending proportion per category
    cat_totals = expenses.groupby('Category')['Amount'].sum()
    total = cat_totals.sum()
    proportions = (cat_totals / total).to_dict() if total > 0 else {}

    # Create feature vector from category proportions
    # We'll categorize into broad groups for clustering
    broad_groups = {
        'lifestyle': ['Food', 'Shopping', 'Entertainment', 'Dining', 'Food Delivery',
                       'Restaurants', 'Clothing', 'Personal Care'],
        'essentials': ['Rent', 'Utilities', 'Health', 'Insurance', 'Groceries',
                        'Transportation', 'Transport', 'Healthcare', 'Medical'],
        'discretionary': ['Travel', 'Subscriptions', 'Hobbies', 'Gifts',
                          'Education', 'Electronics', 'Sports'],
    }

    features = {}
    for group_name, keywords in broad_groups.items():
        group_total = 0
        for cat, prop in proportions.items():
            if any(kw.lower() in cat.lower() for kw in keywords):
                group_total += prop
        features[group_name] = group_total

    # Remaining goes to 'other'
    features['other'] = max(0, 1.0 - sum(features.values()))

    # Simple cluster assignment based on proportions
    lifestyle_ratio = features['lifestyle']
    essentials_ratio = features['essentials']

    if lifestyle_ratio > 0.45:
        cluster = 0  # Lifestyle Spender
    elif essentials_ratio > 0.45:
        cluster = 2  # Essentials-First Saver
    else:
        cluster = 1  # Balanced Spender

    # Also do actual K-Means on monthly category data for richer analysis
    monthly_cat = expenses.pivot_table(
        index=expenses['Date'].dt.to_period('M'),
        columns='Category',
        values='Amount',
        aggfunc='sum',
        fill_value=0
    )

    cluster_details = None
    if len(monthly_cat) >= 3:
        scaler = StandardScaler()
        scaled = scaler.fit_transform(monthly_cat)
        k = min(3, len(monthly_cat))
        kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
        kmeans.fit(scaled)

        # Find which cluster the most recent months belong to
        labels = kmeans.labels_
        recent_label = int(labels[-1])

        cluster_details = {
            'n_clusters': k,
            'labels': [int(l) for l in labels],
            'months': [str(p) for p in monthly_cat.index],
        }

    return {
        'cluster': cluster,
        'profile': CLUSTER_PROFILES[cluster],
        'category_proportions': {k: round(v, 4) for k, v in proportions.items()},
        'broad_groups': {k: round(v, 4) for k, v in features.items()},
        'cluster_details': cluster_details,
    }


def detect_anomalies(df):
    """
    Uses Isolation Forest to detect anomalous transactions.
    Returns flagged transactions with severity levels.
    """
    expenses = df[df['Type'] == 'Expense'].copy()

    if len(expenses) < 10:
        return {'anomalies': [], 'total_flagged': 0}

    anomalies = []

    # Run Isolation Forest per category for more meaningful detection
    categories = expenses['Category'].unique()

    for category in categories:
        cat_data = expenses[expenses['Category'] == category].copy()

        if len(cat_data) < 5:
            continue

        amounts = cat_data['Amount'].values.reshape(-1, 1)
        mean_amount = float(cat_data['Amount'].mean())
        std_amount = float(cat_data['Amount'].std())

        if std_amount == 0:
            continue

        # Isolation Forest
        iso_forest = IsolationForest(
            contamination=0.1,
            random_state=42,
            n_estimators=100
        )
        predictions = iso_forest.fit_predict(amounts)
        scores = iso_forest.decision_function(amounts)

        # Find anomalies (prediction == -1)
        anomaly_mask = predictions == -1

        for idx in cat_data.index[anomaly_mask]:
            row = cat_data.loc[idx]
            amount = float(row['Amount'])
            deviation = abs(amount - mean_amount) / std_amount if std_amount > 0 else 0

            # Determine severity
            if deviation > 3:
                severity = 'high'
            elif deviation > 2:
                severity = 'medium'
            else:
                severity = 'low'

            anomalies.append({
                'date': row['Date'].strftime('%Y-%m-%d'),
                'description': row['Description'],
                'category': category,
                'amount': round(amount, 2),
                'expected_range': f"₹{max(0, mean_amount - std_amount):,.0f} – ₹{mean_amount + std_amount:,.0f}",
                'mean_for_category': round(mean_amount, 2),
                'deviation': round(deviation, 2),
                'severity': severity,
            })

    # Sort by severity (high first) then by amount
    severity_order = {'high': 0, 'medium': 1, 'low': 2}
    anomalies.sort(key=lambda x: (severity_order.get(x['severity'], 3), -x['amount']))

    return {
        'anomalies': anomalies,
        'total_flagged': len(anomalies),
    }


def forecast_next_month(df):
    """
    Uses Linear Regression to predict next month's total spending.
    Returns prediction with confidence info.
    """
    expenses = df[df['Type'] == 'Expense'].copy()

    if expenses.empty:
        return {'predicted': 0, 'confidence': 'low', 'trend': 'stable'}

    # Monthly totals
    monthly = expenses.groupby(expenses['Date'].dt.to_period('M'))['Amount'].sum()

    if len(monthly) < 3:
        avg = float(monthly.mean())
        return {
            'predicted': round(avg, 2),
            'average': round(avg, 2),
            'confidence': 'low',
            'confidence_pct': 30,
            'trend': 'insufficient_data',
            'message': 'Not enough data for reliable prediction. Showing average.',
            'monthly_data': [
                {'month': str(p), 'amount': round(float(a), 2)}
                for p, a in monthly.items()
            ],
        }

    # Prepare data for regression
    X = np.arange(len(monthly)).reshape(-1, 1)
    y = monthly.values.astype(float)

    # Fit linear regression
    model = LinearRegression()
    model.fit(X, y)

    # Predict next month
    next_x = np.array([[len(monthly)]])
    predicted = float(model.predict(next_x)[0])
    predicted = max(0, predicted)  # Don't predict negative spending

    # Calculate metrics
    avg = float(y.mean())
    r_squared = float(model.score(X, y))

    # Confidence based on R² score
    if r_squared > 0.7:
        confidence = 'high'
        confidence_pct = 85
    elif r_squared > 0.4:
        confidence = 'medium'
        confidence_pct = 65
    else:
        confidence = 'low'
        confidence_pct = 40

    # Trend
    slope = float(model.coef_[0])
    if slope > avg * 0.02:
        trend = 'increasing'
        trend_msg = f'Your spending is trending upward by ~₹{abs(slope):,.0f}/month'
    elif slope < -avg * 0.02:
        trend = 'decreasing'
        trend_msg = f'Your spending is trending downward by ~₹{abs(slope):,.0f}/month'
    else:
        trend = 'stable'
        trend_msg = 'Your spending has been relatively stable'

    # Compare to average
    diff_from_avg = predicted - avg
    diff_pct = (diff_from_avg / avg * 100) if avg > 0 else 0

    message = f"Based on your pattern, you'll spend approximately ₹{predicted:,.0f} next month"
    if abs(diff_pct) > 5:
        if diff_pct > 0:
            message += f" ({diff_pct:+.1f}% above your average of ₹{avg:,.0f})"
        else:
            message += f" ({diff_pct:+.1f}% below your average of ₹{avg:,.0f})"

    alert = None
    if diff_pct > 15:
        alert = f"⚠️ Predicted spending exceeds your average by {diff_pct:.0f}%!"

    return {
        'predicted': round(predicted, 2),
        'average': round(avg, 2),
        'difference': round(diff_from_avg, 2),
        'difference_pct': round(diff_pct, 1),
        'confidence': confidence,
        'confidence_pct': confidence_pct,
        'r_squared': round(r_squared, 4),
        'trend': trend,
        'trend_message': trend_msg,
        'message': message,
        'alert': alert,
        'monthly_data': [
            {'month': str(p), 'amount': round(float(a), 2)}
            for p, a in monthly.items()
        ],
    }
