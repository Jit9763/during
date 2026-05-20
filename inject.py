import re

c = open('script.js', encoding='utf-8').read()

# 1. Add new pie chart to charts grid
new_chart_html = '''
                <div class="census-chart-card">
                    <div class="ccc-title"><i class="fas fa-home"></i> मकान प्रकार विभाजन (House Types)</div>
                    <div class="census-chart-container">
                        <canvas id="houseTypeChart"></canvas>
                    </div>
                </div>
'''
c = c.replace('<div class="census-charts-grid">', '<div class="census-charts-grid" style="grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));">' + new_chart_html)

# 2. Add detailed table below the existing table
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
c = c.replace('</div>\n        </div>`;\n    \n    // Draw Charts', new_table_html + '</div>\n        </div>`;\n    \n    // Draw Charts')

# 3. Inject house type chart and detailed table rendering
render_detailed_js = '''
    // Render Detailed Table
    const detailedTbody = document.getElementById('detailed-census-tbody');
    if (detailedTbody && typeof DETAILED_CENSUS_DATA !== 'undefined') {
        let rowsHtml = '';
        DETAILED_CENSUS_DATA.forEach((row, i) => {
            if (i === 0) return; // skip total
            rowsHtml += `<tr>
                <td style="font-weight:bold;">${row['Village/Town']}</td>
                <td>${row['Total HLBs'] || 0}</td>
                <td>${row['Total Expected Census Houses'] || 0}</td>
                <td>${row['Wholly Residential'] || 0}</td>
                <td>${row['Partly Residential'] || 0}</td>
                <td>${row['Vacant Census Houses'] || 0}</td>
                <td>${row['Total Locked Census Houses'] || 0}</td>
                <td>${row['Census Houses put to other uses'] || 0}</td>
                <td>${row['Total number of Households'] || 0}</td>
                <td>${row['Households Verified By Supervisor'] || 0}</td>
                <td>${row['Total Population'] || 0}</td>
                <td>${row['Total SE ID Generated'] || 0}</td>
            </tr>`;
        });
        detailedTbody.innerHTML = rowsHtml;
        drawHouseTypeChart();
    }
'''
c = c.replace('drawTopVillagesChart(hlbProgress);\n}', 'drawTopVillagesChart(hlbProgress);\n' + render_detailed_js + '\n}')

# 4. Add drawHouseTypeChart function
draw_house_js = '''
let houseTypeChart = null;
function drawHouseTypeChart() {
    if (houseTypeChart) houseTypeChart.destroy();
    if (typeof DETAILED_CENSUS_DATA === 'undefined') return;
    const totalRow = DETAILED_CENSUS_DATA[0];
    if (!totalRow) return;

    const ctx = document.getElementById('houseTypeChart');
    if (!ctx) return;

    houseTypeChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Wholly Residential', 'Partly Residential', 'Vacant', 'Locked', 'Other Uses'],
            datasets: [{
                data: [
                    totalRow['Wholly Residential'] || 0,
                    totalRow['Partly Residential'] || 0,
                    totalRow['Vacant Census Houses'] || 0,
                    totalRow['Total Locked Census Houses'] || 0,
                    totalRow['Census Houses put to other uses'] || 0
                ],
                backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'],
                borderWidth: 0,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { font: { family: 'Inter', size: 11 }, boxWidth: 12, padding: 10 }
                }
            }
        }
    });
}
'''
if 'function drawHouseTypeChart' not in c:
    c = c + '\n' + draw_house_js

open('script.js', 'w', encoding='utf-8').write(c)
