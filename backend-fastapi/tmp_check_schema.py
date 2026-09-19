from sqlalchemy import create_engine, inspect
from app.core.config import get_settings

s = get_settings()
engine = create_engine(f"mysql+pymysql://{s.DB_USER}:{s.DB_PASSWORD}@{s.DB_HOST}:{s.DB_PORT}/{s.DB_NAME}")
ins = inspect(engine)
tables = ['emergency_alerts','patients','ai_predictions','patient_visits','uploaded_images','voice_logs','appointments','prescriptions','notifications']
for t in tables:
    if t in ins.get_table_names():
        print('TABLE', t)
        for c in ins.get_columns(t):
            print(' ', c['name'], c['type'], 'nullable', c['nullable'])
        for fk in ins.get_foreign_keys(t):
            print('   FK', fk['name'], fk['constrained_columns'], 'ref', fk['referred_table'], fk['referred_columns'], 'options', fk.get('options'))
        print()
