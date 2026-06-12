with open('app.py', 'r') as f:
    content = f.read()

# Remove duplicate serve route - keep only one clean version
bad_duplicate = """
DIST_DIR = os.path.join(os.path.dirname(__file__), 'dist')
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != '' and os.path.exists(os.path.join(DIST_DIR, path)):
        return send_from_directory(DIST_DIR, path)
    else:
        return send_from_directory(DIST_DIR, 'index.html')
DIST_DIR = os.path.join(os.path.dirname(__file__), 'dist')
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != '' and os.path.exists(os.path.join(DIST_DIR, path)):
        return send_from_directory(DIST_DIR, path)
    else:
        return send_from_directory(DIST_DIR, 'index.html')
"""

good_single = """
DIST_DIR = os.path.join(os.path.dirname(__file__), 'dist')
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != '' and os.path.exists(os.path.join(DIST_DIR, path)):
        return send_from_directory(DIST_DIR, path)
    else:
        return send_from_directory(DIST_DIR, 'index.html')
"""

content = content.replace(bad_duplicate, good_single)

with open('app.py', 'w') as f:
    f.write(content)

print('Done! Duplicate removed.')