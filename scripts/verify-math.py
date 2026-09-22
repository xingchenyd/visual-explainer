"""Independent Decimal reference; compare every term, partial sum and result."""
import json, sys
from pathlib import Path
from decimal import Decimal

root = Path(sys.argv[1] if len(sys.argv) > 1 else 'lessons/matrix-multiplication')
ir = json.loads((root / 'lesson.ir.json').read_text(encoding='utf-8-sig'))
actual = json.loads((root / 'data/calculations.json').read_text(encoding='utf-8'))
a, b = ir['objects']['A']['data'], ir['objects']['B']['data']
assert len(a[0]) == len(b), 'shape mismatch'
checks = 0
for i, row in enumerate(a):
    for j in range(len(b[0])):
        total = Decimal(0)
        for k, x in enumerate(row):
            product = Decimal(str(x)) * Decimal(str(b[k][j]))
            total += product
            for expected, value in [(product, actual[i][j]['terms'][k]['product']), (total, actual[i][j]['partials'][k])]:
                assert abs(expected - Decimal(str(value))) <= Decimal('1e-9'), f'mismatch C[{i},{j}] k={k}'
                checks += 1
        assert abs(total - Decimal(str(actual[i][j]['value']))) <= Decimal('1e-9')
        checks += 1
print(json.dumps({'passed': True, 'independentDecimalComparisons': checks}))
