import sqlite3
from pathlib import Path

# DB file lives at the TaxMate root, not inside backend/, so it's a stable 
# path regardless of which folder you run commands from later.
DB_PATH = Path(__file__).parent.parent.parent / "taxmate.db"

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row # lets you do row["vendor"] instead of row[0]
    return conn

def init_db():
    """
    Creates tables if they don't already exist. Safe to call on every 
    app startup - won't wipe existing data.
    """

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            vendor TEXT,
            amount REAL,
            date TEXT,
            category TEXT,
            source TEXT DEFAULT 'scan',
            receipt_id INTEGER,
            gst_rate REAL DEFAULT 18.0,
            itc_eligible INTEGER DEFAULT 1,
            itc_status TEXT DEFAULT 'Eligible',
            itc_explanation TEXT,
            is_anomaly INTEGER DEFAULT 0,
            anomaly_score REAL DEFAULT 0.0,
            anomaly_reason TEXT,
            confidence_status TEXT DEFAULT 'verified',
            items_json TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Ensure existing database files get any new columns safely
    new_columns = [
        ("gst_rate", "REAL DEFAULT 18.0"),
        ("itc_eligible", "INTEGER DEFAULT 1"),
        ("itc_status", "TEXT DEFAULT 'Eligible'"),
        ("itc_explanation", "TEXT"),
        ("is_anomaly", "INTEGER DEFAULT 0"),
        ("anomaly_score", "REAL DEFAULT 0.0"),
        ("anomaly_reason", "TEXT"),
        ("confidence_status", "TEXT DEFAULT 'verified'"),
        ("items_json", "TEXT")
    ]
    for col_name, col_type in new_columns:
        try:
            cursor.execute(f"ALTER TABLE transactions ADD COLUMN {col_name} {col_type}")
        except sqlite3.OperationalError:
            pass  # Column already exists

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS receipts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            image_path TEXT,
            raw_ocr_json TEXT,
            transaction_id INTEGER
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            doc_type TEXT,
            doc_number TEXT,
            party_name TEXT,
            date TEXT,
            total_amount REAL,
            status TEXT DEFAULT 'Draft',
            notes TEXT,
            items_json TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.commit()
    conn.close()

def insert_transaction(vendor, amount, date, category=None, receipt_id=None, 
                       gst_rate=18.0, itc_eligible=1, itc_status="Eligible", 
                       itc_explanation=None, is_anomaly=0, anomaly_score=0.0, 
                       anomaly_reason=None, confidence_status="verified", items_json=None):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        """INSERT INTO transactions 
           (vendor, amount, date, category, receipt_id, gst_rate, itc_eligible, 
            itc_status, itc_explanation, is_anomaly, anomaly_score, anomaly_reason, 
            confidence_status, items_json) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (vendor, amount, date, category, receipt_id, gst_rate, itc_eligible, 
         itc_status, itc_explanation, is_anomaly, anomaly_score, anomaly_reason, 
         confidence_status, items_json)
    )
    conn.commit()
    transaction_id = cursor.lastrowid
    conn.close()
    return transaction_id

# Alias for backwards compatibility with any existing code calling insert_Transaction
insert_Transaction = insert_transaction

def get_all_transactions():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM transactions ORDER BY date DESC, id DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_transaction_by_id(tx_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM transactions WHERE id = ?", (tx_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def update_transaction(tx_id: int, updates: dict):
    conn = get_connection()
    cursor = conn.cursor()
    fields = ", ".join([f"{k} = ?" for k in updates.keys()])
    values = list(updates.values()) + [tx_id]
    cursor.execute(f"UPDATE transactions SET {fields} WHERE id = ?", values)
    conn.commit()
    conn.close()

def insert_document(doc_type, doc_number, party_name, date, total_amount, status="Draft", notes=None, items_json=None):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        """INSERT INTO documents 
           (doc_type, doc_number, party_name, date, total_amount, status, notes, items_json) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        (doc_type, doc_number, party_name, date, total_amount, status, notes, items_json)
    )
    conn.commit()
    doc_id = cursor.lastrowid
    conn.close()
    return doc_id

def get_all_documents():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM documents ORDER BY date DESC, id DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_document_by_id(doc_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM documents WHERE id = ?", (doc_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None