#!/usr/bin/env python3
"""Updated regression: v401 scan-ledger behavior under v402's new independent identity model.
The comprehensive fixture tests full/retry aggregates and Automatic 1 preservation.
"""
from pathlib import Path
from runpy import run_path
run_path(str(Path(__file__).with_name('test-v402-auto2-comprehensive.py')),run_name='__main__')
