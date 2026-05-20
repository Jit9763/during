import re

def update_html(filename):
    c = open(filename, encoding='utf-8').read()
    
    # 1. Update PDF Viewer HTML to make it full screen
    old_pdf_html = '''<div id="pdf-viewer-panel" style="display: none;" class="tab-panel">
            <div style="background: #fff; padding: 15px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); text-align: center;">
                <h3 style="margin-bottom: 15px; color: var(--primary);"><i class="fas fa-file-pdf"></i> नवीनतम जनगणना रिपोर्ट</h3>
                <iframe id="pdf-iframe" src="" style="width: 100%; height: 75vh; border: 1px solid #cbd5e1; border-radius: 8px;"></iframe>
                <p style="margin-top: 10px; font-size: 14px; color: #64748b;">यदि PDF नहीं दिख रहा है, तो <a id="pdf-download-link" href="#" target="_blank" style="color: var(--accent); font-weight: bold;">यहाँ क्लिक करके डाउनलोड करें</a></p>
            </div>
        </div>'''
        
    new_pdf_html = '''<div id="pdf-viewer-panel" style="display: none; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 9999; background: #fff; flex-direction: column;">
            <div style="padding: 10px 20px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
                <h3 style="margin: 0; color: var(--primary);"><i class="fas fa-file-pdf"></i> नवीनतम जनगणना रिपोर्ट</h3>
                <div>
                    <a id="pdf-download-link" href="#" target="_blank" style="margin-right: 15px; color: var(--accent); font-weight: bold; text-decoration: none;"><i class="fas fa-download"></i> डाउनलोड करें</a>
                    <button onclick="switchTab('progress')" style="background: #ef4444; color: white; border: none; padding: 8px 15px; border-radius: 6px; cursor: pointer; font-weight: bold;"><i class="fas fa-times"></i> बंद करें (Close)</button>
                </div>
            </div>
            <iframe id="pdf-iframe" src="" style="width: 100%; flex: 1; border: none;"></iframe>
        </div>'''
        
    c = c.replace(old_pdf_html, new_pdf_html)
    open(filename, 'w', encoding='utf-8').write(c)

update_html('index.html')
update_html('admin.html')

# 2. Update script.js for Chart.js datalabels plugin
c = open('script.js', encoding='utf-8').read()

# Register datalabels globally
global_plugin = "Chart.register(ChartDataLabels);"
if global_plugin not in c:
    c = "if (typeof ChartDataLabels !== 'undefined') { Chart.register(ChartDataLabels); }\n" + c

# For houseTypeChart
c = c.replace("labels: { font: { family: 'Inter', size: 11 }, boxWidth: 12, padding: 10 }", "labels: { font: { family: 'Inter', size: 11 }, boxWidth: 12, padding: 10 } }, datalabels: { color: '#000', anchor: 'end', align: 'end', offset: 5, font: { weight: 'bold', size: 12 }, formatter: (value) => value > 0 ? value : '' }")
c = c.replace("hoverOffset: 8", "hoverOffset: 8, clip: false") # ensure labels don't get cut off

# For hlbStatusChart
c = c.replace("boxWidth: 15\n                    }\n                }", "boxWidth: 15\n                    }\n                },\n                datalabels: { color: '#000', anchor: 'end', align: 'end', offset: 5, font: { weight: 'bold', size: 12 }, formatter: (value) => value > 0 ? value : '' }")
c = c.replace("hoverOffset: 12", "hoverOffset: 12, clip: false")

# Note: We need layout padding so labels fit outside the pie chart
if "layout: { padding: 20 }," not in c:
    c = c.replace("options: {\n            responsive: true,", "options: {\n            layout: { padding: 30 },\n            responsive: true,")

# Also fix the `display: block` in switchTab('pdf') because we changed it to flex-direction column in HTML!
c = c.replace("pdfPanel.style.display = 'block';", "pdfPanel.style.display = 'flex';")

open('script.js', 'w', encoding='utf-8').write(c)
