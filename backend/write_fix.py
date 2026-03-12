code = open("C:/Users/AYEN/Downloads/subscription_detector.py", "r").read()
with open("subscription_detector.py", "w") as f:
    f.write(code)
print("Done! File size:", len(code), "bytes")