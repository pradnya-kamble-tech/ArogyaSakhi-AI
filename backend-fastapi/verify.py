import traceback
import app.seed
try:
    app.seed.seed_database(True)
except Exception:
    with open('err2.txt', 'w') as f:
        traceback.print_exc(file=f)
