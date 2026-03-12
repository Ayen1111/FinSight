"""
FinSight — Flask Backend API
AI-Powered Personal Finance Analyzer
"""

import os
import traceback
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

from data_processor import load_and_clean, get_overview, monthly_summary, weekly_summary
from ml_models import cluster_spending, detect_anomalies, forecast_next_month
from subscription_detector import find_subscriptions
from savings_planner import create_savings_plan
from ai_advisor import get_advice

app = Flask(__name__)
CORS(app)

# In-memory data store (single-user demo)
store = {
    'df': None,
    'overview': None,
    'monthly': None,
    'cluster': None,
    'anomalies': None,
    'forecast': None,
    'subscriptions': None,
}

SAMPLE_DATA_PATH = os.path.join(
    os.path.dirname(__file__), 'sample_data', 'Personal_Finance_Dataset.csv.xlsx'
)

DIST_DIR = os.path.join(os.path.dirname(__file__), 'dist')


def process_data(df):
    """Run all ML models and store results."""
    store['df'] = df
    store['overview'] = get_overview(df)
    store['monthly'] = monthly_summary(df)
    store['cluster'] = cluster_spending(df)
    store['anomalies'] = detect_anomalies(df)
    store['forecast'] = forecast_next_month(df)
    store['subscriptions'] = find_subscriptions(df)


@app.route('/api/upload', methods=['POST'])
def upload_file():
    """Upload and process a CSV/XLSX file."""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        allowed = file.filename.lower().endswith(('.csv', '.xlsx', '.xls'))
        if not allowed:
            return jsonify({'error': 'Only CSV and XLSX files are supported'}), 400

        file_data = file.read()
        df = load_and_clean(file_data, filename=file.filename)
        process_data(df)

        return jsonify({
            'success': True,
            'message': f'Processed {len(df)} transactions successfully',
            'overview': store['overview'],
            'cluster': store['cluster'],
        })

    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': f'Processing error: {str(e)}'}), 500


@app.route('/api/load-sample', methods=['POST'])
def load_sample():
    """Load the bundled sample dataset."""
    try:
        if not os.path.exists(SAMPLE_DATA_PATH):
            return jsonify({'error': 'Sample data not found'}), 404

        df = load_and_clean(SAMPLE_DATA_PATH)
        process_data(df)

        return jsonify({
            'success': True,
            'message': f'Loaded {len(df)} sample transactions',
            'overview': store['overview'],
            'cluster': store['cluster'],
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': f'Error loading sample data: {str(e)}'}), 500


@app.route('/api/overview', methods=['GET'])
def api_overview():
    """Get overview summary."""
    if store['overview'] is None:
        return jsonify({'error': 'No data loaded. Please upload a file first.'}), 400
    return jsonify(store['overview'])


@app.route('/api/monthly-summary', methods=['GET'])
def api_monthly():
    """Get monthly breakdown data."""
    if store['monthly'] is None:
        return jsonify({'error': 'No data loaded. Please upload a file first.'}), 400
    return jsonify({'months': store['monthly']})


@app.route('/api/weekly-summary', methods=['GET'])
def api_weekly():
    """Get weekly breakdown for a specific month."""
    if store['df'] is None:
        return jsonify({'error': 'No data loaded. Please upload a file first.'}), 400

    month = request.args.get('month')
    result = weekly_summary(store['df'], month)
    return jsonify(result)


@app.route('/api/anomalies', methods=['GET'])
def api_anomalies():
    """Get anomaly-flagged transactions."""
    if store['anomalies'] is None:
        return jsonify({'error': 'No data loaded. Please upload a file first.'}), 400
    return jsonify(store['anomalies'])


@app.route('/api/forecast', methods=['GET'])
def api_forecast():
    """Get next month spending forecast."""
    if store['forecast'] is None:
        return jsonify({'error': 'No data loaded. Please upload a file first.'}), 400
    return jsonify(store['forecast'])


@app.route('/api/subscriptions', methods=['GET'])
def api_subscriptions():
    """Get detected recurring payments."""
    if store['subscriptions'] is None:
        return jsonify({'error': 'No data loaded. Please upload a file first.'}), 400
    return jsonify(store['subscriptions'])


@app.route('/api/advice', methods=['POST'])
def api_advice():
    """Generate personalized financial advice."""
    if store['overview'] is None:
        return jsonify({'error': 'No data loaded. Please upload a file first.'}), 400

    try:
        advice = get_advice(
            store['overview'],
            store['monthly'],
            store['anomalies'],
            store['subscriptions'],
        )
        return jsonify(advice)
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': f'Error generating advice: {str(e)}'}), 500


@app.route('/api/savings-goal', methods=['POST'])
def api_savings_goal():
    """Create a savings plan to meet a target."""
    if store['df'] is None:
        return jsonify({'error': 'No data loaded. Please upload a file first.'}), 400

    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Request body required'}), 400

        target = data.get('target')
        months = data.get('months')

        if not target or not months:
            return jsonify({'error': 'Both target amount and months are required'}), 400

        target = float(target)
        months = int(months)

        if target <= 0 or months <= 0:
            return jsonify({'error': 'Target and months must be positive'}), 400

        plan = create_savings_plan(store['df'], target, months)
        return jsonify(plan)

    except (ValueError, TypeError) as e:
        return jsonify({'error': f'Invalid input: {str(e)}'}), 400
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': f'Error creating plan: {str(e)}'}), 500


@app.route('/api/recent-transactions', methods=['GET'])
def api_recent_transactions():
    """Get the most recent transactions."""
    if store['df'] is None:
        return jsonify({'error': 'No data loaded. Please upload a file first.'}), 400

    df = store['df'].sort_values('Date', ascending=False).head(10)
    transactions = []
    for _, row in df.iterrows():
        transactions.append({
            'date': row['Date'].strftime('%Y-%m-%d') if hasattr(row['Date'], 'strftime') else str(row['Date']),
            'description': str(row.get('Description', '')),
            'category': str(row.get('Category', '')),
            'amount': float(row['Amount']),
            'type': str(row.get('Type', 'Expense')),
        })
    return jsonify({'transactions': transactions})


@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({
        'status': 'ok',
        'data_loaded': store['df'] is not None,
    })


@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    """Serve React frontend."""
    if path != "" and os.path.exists(os.path.join(DIST_DIR, path)):
        return send_from_directory(DIST_DIR, path)
    else:
        return send_from_directory(DIST_DIR, 'index.html')


if __name__ == '__main__':
    app.run(debug=True, port=5000)