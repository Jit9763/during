import re

with open('script.js', 'r', encoding='utf-8') as f:
    c = f.read()

insert_code = """
    // Generate Top 5 and Bottom 5 Villages for Report
    let villageHtml = '';
    const censusTask = taskData.flatMap(c => c.tasks).find(t => t.id === 'during_census_progress');
    const hlbProgress = (censusTask && censusTask.hlbProgress && censusTask.hlbProgress.length > 0) ? censusTask.hlbProgress : (typeof DEFAULT_CENSUS_PROGRESS !== 'undefined' ? DEFAULT_CENSUS_PROGRESS : []);
    
    if (hlbProgress.length > 0) {
        const villageData = hlbProgress.filter(v => v.expectedHouses > 0).map(v => {
            const percent = Math.round((v.completedHouses / v.expectedHouses) * 100) || 0;
            return {
                name: v.village.split(' - ')[1] || v.village,
                expected: v.expectedHouses,
                completed: v.completedHouses,
                percent: percent
            };
        });
        
        villageData.sort((a, b) => b.percent - a.percent);
        const top5 = villageData.slice(0, 5);
        const bottom5 = [...villageData].sort((a, b) => a.percent - b.percent).slice(0, 5);
        
        let expT = 0, compT = 0;
        hlbProgress.forEach(v => { expT += (v.expectedHouses||0); compT += (v.completedHouses||0); });
        const overPct = expT > 0 ? Math.round((compT / expT) * 100) : 0;

        villageHtml = `
            <div style="margin:20px 0; padding:15px; border:2px solid #4f46e5; border-radius:10px; background:#f8fafc; text-align:center;">
                <h3 style="margin-bottom:10px; color:#1e1e1e;">जनगणना मकान सर्वेक्षण (Census Live Data)</h3>
                <div style="font-size:20px; font-weight:bold; color:#4f46e5;">कुल प्रगति: ${compT.toLocaleString('hi-IN')} / ${expT.toLocaleString('hi-IN')} (${overPct}%)</div>
            </div>
            
            <div style="display:flex; justify-content:space-between; gap:20px; margin-bottom:20px;">
                <div style="width:48%;">
                    <h4 style="color:#10b981; margin-bottom:5px;">शीर्ष 5 गाँव (Top 5)</h4>
                    <table style="width:100%; border-collapse:collapse; font-size:12px;">
                        <tr style="background:#f1f5f9;"><th style="padding:5px; border:1px solid #ccc; text-align:left;">गाँव</th><th style="padding:5px; border:1px solid #ccc; text-align:left;">प्रगति</th></tr>
                        ${top5.map(v => `<tr><td style="padding:5px; border:1px solid #ccc;">${v.name}</td><td style="padding:5px; border:1px solid #ccc; font-weight:bold; color:#10b981;">${v.percent}%</td></tr>`).join('')}
                    </table>
                </div>
                <div style="width:48%;">
                    <h4 style="color:#ef4444; margin-bottom:5px;">निचले 5 गाँव (Bottom 5)</h4>
                    <table style="width:100%; border-collapse:collapse; font-size:12px;">
                        <tr style="background:#f1f5f9;"><th style="padding:5px; border:1px solid #ccc; text-align:left;">गाँव</th><th style="padding:5px; border:1px solid #ccc; text-align:left;">प्रगति</th></tr>
                        ${bottom5.map(v => `<tr><td style="padding:5px; border:1px solid #ccc;">${v.name}</td><td style="padding:5px; border:1px solid #ccc; font-weight:bold; color:#ef4444;">${v.percent}%</td></tr>`).join('')}
                    </table>
                </div>
            </div>
        `;
    }
"""

idx = c.find('    const reportHTML = `')
if idx != -1:
    c = c[:idx] + insert_code + '\n' + c[idx:]
    
    # inject villageHtml after progress-box
    target_html = '''<div class="progress-box">
            <div>समग्र प्रगति (Overall Progress)</div>
            <div class="pct">${overallPercent}%</div>
        </div>'''
    if target_html in c:
        c = c.replace(target_html, target_html + '\\n        ${villageHtml}\\n')

with open('script.js', 'w', encoding='utf-8') as f:
    f.write(c)

print('Updated script.js successfully.')
