import os
import sys

# Put src/api on the import path so the tests can `import main` / `import weather`
# the same way uvicorn does when run from that directory.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
