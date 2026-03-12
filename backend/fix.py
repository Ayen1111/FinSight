with open('app.py', 'r') as f:
    content = f.read()

serve_code = """
DIST_DIR = os.path.join(os.path.dirname(__file__), 'dist')

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != '' and os.path.exists(os.path.join(DIST_DIR, path)):
        return send_from_directory(DIST_DIR, path)
    else:
        return send_from_directory(DIST_DIR, 'index.html')

"""

old = "if __name__ == '__main__':"
new = serve_code + old
content = content.replace(old, new)

with open('app.py', 'w') as f:
    f.write(content)

print('Done! Serve route added.')