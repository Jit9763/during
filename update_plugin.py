import re

with open('script.js', 'r', encoding='utf-8') as f:
    c = f.read()

new_plugin = '''const valueLabelPlugin = {
    id: 'valueLabel',
    afterDraw: (chart) => {
        const ctx = chart.ctx;
        const leftPositions = [];
        const rightPositions = [];

        chart.data.datasets.forEach((dataset, i) => {
            const meta = chart.getDatasetMeta(i);
            meta.data.forEach((element, index) => {
                const value = dataset.data[index];
                if (!value || value === 0) return; // Don't show 0

                const center = element.getCenterPoint();
                const radius = element.outerRadius;
                const angle = (element.startAngle + element.endAngle) / 2;
                
                // Determine alignment based on side
                const isLeft = Math.cos(angle) < 0;
                const positions = isLeft ? leftPositions : rightPositions;
                
                // Line start (edge of pie)
                const startX = center.x + Math.cos(angle) * radius;
                const startY = center.y + Math.sin(angle) * radius;

                // Collision detection: adjust Y if overlapping
                // Alternate base distance to prevent line crossing on small slices
                const distanceMultiplier = (index % 2 === 0) ? 20 : 50;
                let textY = center.y + Math.sin(angle) * (radius + distanceMultiplier);
                let textX = center.x + Math.cos(angle) * (radius + distanceMultiplier);
                
                let overlap = true;
                let maxTries = 10;
                while (overlap && maxTries > 0) {
                    overlap = false;
                    for (let pos of positions) {
                        if (Math.abs(pos.y - textY) < 35 && Math.abs(pos.x - textX) < 80) { // 35px height buffer, 80px width
                            textY += (textY >= center.y ? 15 : -15);
                            textX += (isLeft ? -15 : 15); // Push outward horizontally too
                            overlap = true;
                            break;
                        }
                    }
                    maxTries--;
                }
                positions.push({x: textX, y: textY});

                // Line end (where the line stops)
                const endX = textX + (isLeft ? 10 : -10);
                const endY = textY;
                
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(endX, endY);
                
                ctx.strokeStyle = dataset.backgroundColor[index] || '#666';
                ctx.lineWidth = 1.5;
                ctx.stroke();

                const label = chart.data.labels[index];

                ctx.fillStyle = '#000';
                ctx.textAlign = isLeft ? 'right' : 'left';
                ctx.textBaseline = 'middle';
                
                // Draw Label Name
                ctx.font = '600 13px Inter';
                ctx.fillText(label, textX, textY - 8);
                
                // Draw Number Value (Bigger)
                ctx.font = '900 16px Inter';
                ctx.fillText(value, textX, textY + 8);
                ctx.restore();
            });
        });
    }
};'''

c = re.sub(r'const valueLabelPlugin = \{.*?\}\};\n', new_plugin + '\n', c, flags=re.DOTALL)

with open('script.js', 'w', encoding='utf-8') as f:
    f.write(c)

print('Updated valueLabelPlugin successfully.')
