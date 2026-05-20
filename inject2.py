import re

c = open('script.js', encoding='utf-8').read()

new_table_html = '''
            <!-- Detailed Census Table -->
            <div style="margin-top: 30px;">
                <h3 style="margin-bottom: 15px; color: var(--primary);"><i class="fas fa-table"></i> विस्तृत जनगणना डेटा (Detailed Data)</h3>
                <div class="census-table-wrapper" style="overflow-x: auto;">
                    <table class="census-table" style="min-width: 1200px; font-size: 13px;">
                        <thead>
                            <tr>
                                <th>गाँव का नाम</th>
                                <th>Total HLBs</th>
                                <th>Expected Houses</th>
                                <th>Wholly Residential</th>
                                <th>Partly Residential</th>
                                <th>Vacant Houses</th>
                                <th>Locked Houses</th>
                                <th>Other Uses</th>
                                <th>Total Households</th>
                                <th>Verified By Supervisor</th>
                                <th>Total Population</th>
                                <th>SE ID Generated</th>
                            </tr>
                        </thead>
                        <tbody id="detailed-census-tbody">
                            <!-- Injected by JS -->
                        </tbody>
                    </table>
                </div>
            </div>
'''

target_str = '            </div>\n        </div>\n    `;\n    \n    // Draw Charts'
if target_str in c:
    c = c.replace(target_str, new_table_html + target_str)
else:
    print('Target not found')

open('script.js', 'w', encoding='utf-8').write(c)
