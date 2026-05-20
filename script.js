
let taskData = [];
// Custom plugin to display data values on doughnut chart slices
const valueLabelPlugin = {
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
                let textY = center.y + Math.sin(angle) * (radius + 20);
                let overlap = true;
                while (overlap) {
                    overlap = false;
                    for (let pos of positions) {
                        if (Math.abs(pos - textY) < 35) { // 35px height buffer
                            textY += (textY >= center.y ? 15 : -15);
                            overlap = true;
                            break;
                        }
                    }
                }
                positions.push(textY);

                // Line end (where the line stops)
                const endX = center.x + Math.cos(angle) * (radius + 15);
                const endY = textY;

                // Text position (a bit further out from line end)
                const textX = center.x + Math.cos(angle) * (radius + 20);
                
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
};
Chart.register(valueLabelPlugin);
const DEFAULT_API_URL = 'https://script.google.com/macros/s/AKfycbwWC2cm-O_0B5VGoX6V_vZvV9DEwS3AsKuS8AQ7tV5fPaRfpmux_8MN_cviXSAetQmX1w/exec';
const isAdminPage = window.location.pathname.includes('admin.html');

let activeCensusTab = 'progress'; // 'progress' | 'directory'
let personnelData = [];
let directorySearchTerm = "";
let directoryFilter = "all"; // 'all' | 'supervisor' | 'enumerator'

const DEFAULT_PERSONNEL_DIRECTORY = [
    {"role": "Supervisor", "name": "Trilok Chand Bhambhi", "mobile": "8233559209", "supervisor_circle": 1, "supervisor_name": "Trilok Chand Bhambhi", "hlb_new": null, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Shimbhu Dayal Gurjar", "mobile": "9887845200", "supervisor_circle": 1, "supervisor_name": "Trilok Chand Bhambhi", "hlb_new": 1, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Sheela Chaudhary", "mobile": "9680525376", "supervisor_circle": 1, "supervisor_name": "Trilok Chand Bhambhi", "hlb_new": 2, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Rajesh Kumar Rajput", "mobile": "7891997521", "supervisor_circle": 1, "supervisor_name": "Trilok Chand Bhambhi", "hlb_new": 25, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Satyanarayan Bairwa", "mobile": "7742356796", "supervisor_circle": 1, "supervisor_name": "Trilok Chand Bhambhi", "hlb_new": 26, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "VINOD KUMAR SARWAL", "mobile": "9829121678", "supervisor_circle": 1, "supervisor_name": "Trilok Chand Bhambhi", "hlb_new": 37, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "SHRAVAN LAL GURJAR", "mobile": "9784067462", "supervisor_circle": 1, "supervisor_name": "Trilok Chand Bhambhi", "hlb_new": 38, "village_en": null, "village_hi": null},
    {"role": "Supervisor", "name": "Sanjay Vyas", "mobile": "8504884191", "supervisor_circle": 2, "supervisor_name": "Sanjay Vyas", "hlb_new": null, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Ram Singh Chaudhary", "mobile": "9784935705", "supervisor_circle": 2, "supervisor_name": "Sanjay Vyas", "hlb_new": 39, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Kumawat Pratishtha", "mobile": "7725988808", "supervisor_circle": 2, "supervisor_name": "Sanjay Vyas", "hlb_new": 40, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Hanuman Prasad Jat", "mobile": "9928668009", "supervisor_circle": 2, "supervisor_name": "Sanjay Vyas", "hlb_new": 41, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "PRITAM KUMAR JAIN", "mobile": "9251006751", "supervisor_circle": 2, "supervisor_name": "Sanjay Vyas", "hlb_new": 42, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Hanuman Prasad Jat", "mobile": "9928668009", "supervisor_circle": 2, "supervisor_name": "Sanjay Vyas", "hlb_new": 43, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Ramprasad Lakshkar", "mobile": "9602372311", "supervisor_circle": 2, "supervisor_name": "Sanjay Vyas", "hlb_new": 44, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Babu Lal Regar", "mobile": "9929486062", "supervisor_circle": 2, "supervisor_name": "Sanjay Vyas", "hlb_new": 45, "village_en": null, "village_hi": null},
    {"role": "Supervisor", "name": "Mahavir Prasad Jangid", "mobile": "9799312619", "supervisor_circle": 3, "supervisor_name": "Mahavir Prasad Jangid", "hlb_new": null, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Vaibhav Raj Mehra", "mobile": "8209227928", "supervisor_circle": 3, "supervisor_name": "Mahavir Prasad Jangid", "hlb_new": 19, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Roshan Sharma", "mobile": "9649597272", "supervisor_circle": 3, "supervisor_name": "Mahavir Prasad Jangid", "hlb_new": 21, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Chhotu Lal Bairwa", "mobile": "9001622734", "supervisor_circle": 3, "supervisor_name": "Mahavir Prasad Jangid", "hlb_new": 27, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Santosh Kumar", "mobile": "9602216973", "supervisor_circle": 3, "supervisor_name": "Mahavir Prasad Jangid", "hlb_new": 28, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Anurag Ranwa", "mobile": "9772777032", "supervisor_circle": 3, "supervisor_name": "Mahavir Prasad Jangid", "hlb_new": 29, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Ashish Kumar Sharma", "mobile": "8094834260", "supervisor_circle": 3, "supervisor_name": "Mahavir Prasad Jangid", "hlb_new": 30, "village_en": null, "village_hi": null},
    {"role": "Supervisor", "name": "Shivprakash Lunia", "mobile": "9772270806", "supervisor_circle": 4, "supervisor_name": "Shivprakash Lunia", "hlb_new": null, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Dharmendra Yadav", "mobile": "9057193493", "supervisor_circle": 4, "supervisor_name": "Shivprakash Lunia", "hlb_new": 3, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Anil Kumar Sankhla", "mobile": "9982277858", "supervisor_circle": 4, "supervisor_name": "Shivprakash Lunia", "hlb_new": 4, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Kishan gopal chhipa", "mobile": "9460546296", "supervisor_circle": 4, "supervisor_name": "Shivprakash Lunia", "hlb_new": 5, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "SHREEBALLABH PAREEK", "mobile": "8890774112", "supervisor_circle": 4, "supervisor_name": "Shivprakash Lunia", "hlb_new": 6, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Anil Kumar Joshi", "mobile": "9602089382", "supervisor_circle": 4, "supervisor_name": "Shivprakash Lunia", "hlb_new": 7, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Arjun Kumar Jangid", "mobile": "7737190405", "supervisor_circle": 4, "supervisor_name": "Shivprakash Lunia", "hlb_new": 8, "village_en": null, "village_hi": null},
    {"role": "Supervisor", "name": "Mukesh Kumar Rawat", "mobile": "9799203204", "supervisor_circle": 5, "supervisor_name": "Mukesh Kumar Rawat", "hlb_new": null, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Deepak", "mobile": "8696090350", "supervisor_circle": 5, "supervisor_name": "Mukesh Rawat", "hlb_new": 9, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Surender Kumar", "mobile": "7726874490", "supervisor_circle": 5, "supervisor_name": "Mukesh Rawat", "hlb_new": 10, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Dashrath Vaishnav", "mobile": "9602719043", "supervisor_circle": 5, "supervisor_name": "Mukesh Rawat", "hlb_new": 11, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Surendra Kumar Kharol", "mobile": "9829947871", "supervisor_circle": 5, "supervisor_name": "Mukesh Rawat", "hlb_new": 12, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Satyanarayan Khatik", "mobile": "9929947564", "supervisor_circle": 5, "supervisor_name": "Mukesh Rawat", "hlb_new": 13, "village_en": null, "village_hi": null},
    {"role": "Supervisor", "name": "Gangavishan Prajapat", "mobile": "7742549519", "supervisor_circle": 6, "supervisor_name": "Gangavishan Prajapat", "hlb_new": null, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Dharmichand Mali", "mobile": "9928849417", "supervisor_circle": 6, "supervisor_name": "Gangavishan Prajapat", "hlb_new": 31, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Pawan Kumar Dhumas", "mobile": "9887882133", "supervisor_circle": 6, "supervisor_name": "Gangavishan Prajapat", "hlb_new": 32, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Vimal Kumar Jangid", "mobile": "9602727316", "supervisor_circle": 6, "supervisor_name": "Gangavishan Prajapat", "hlb_new": 33, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Manoj Kumar", "mobile": "9785225734", "supervisor_circle": 6, "supervisor_name": "Gangavishan Prajapat", "hlb_new": 34, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Murlidhar Vaishnav", "mobile": "9829649846", "supervisor_circle": 6, "supervisor_name": "Gangavishan Prajapat", "hlb_new": 35, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Bhupendra Singh Rathore", "mobile": "9649173100", "supervisor_circle": 6, "supervisor_name": "Gangavishan Prajapat", "hlb_new": 36, "village_en": null, "village_hi": null},
    {"role": "Supervisor", "name": "Sandeep Bagrani", "mobile": "9602564649", "supervisor_circle": 7, "supervisor_name": "Sandeep Bagrani", "hlb_new": null, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Ram Prasad Bhambhi", "mobile": "9784344547", "supervisor_circle": 7, "supervisor_name": "Sandeep Bagrani", "hlb_new": 18, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Shivraj", "mobile": "7737880781", "supervisor_circle": 7, "supervisor_name": "Sandeep Bagrani", "hlb_new": 20, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Giriraj Chaudhary", "mobile": "7597685500", "supervisor_circle": 7, "supervisor_name": "Sandeep Bagrani", "hlb_new": 55, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Abdul Halim Kha", "mobile": "9214540786", "supervisor_circle": 7, "supervisor_name": "Sandeep Bagrani", "hlb_new": 56, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Rangalal Gurjar", "mobile": "9829014609", "supervisor_circle": 7, "supervisor_name": "Sandeep Bagrani", "hlb_new": 57, "village_en": null, "village_hi": null},
    {"role": "Supervisor", "name": "Chotu Lal Jat", "mobile": "9571857537", "supervisor_circle": 8, "supervisor_name": "Chotu Lal Jat", "hlb_new": null, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Ram Dayal", "mobile": "8432781245", "supervisor_circle": 8, "supervisor_name": "Chhotu Lal Jat", "hlb_new": 22, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Hans Raj Gurjar", "mobile": "9649918501", "supervisor_circle": 8, "supervisor_name": "Chhotu Lal Jat", "hlb_new": 23, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Rohit Kumar Jangid", "mobile": "9530141501", "supervisor_circle": 8, "supervisor_name": "Chhotu Lal Jat", "hlb_new": 24, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Bhanwar Lal Regar", "mobile": "9001077090", "supervisor_circle": 8, "supervisor_name": "Chhotu Lal Jat", "hlb_new": 46, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Kana Ram", "mobile": "9887322580", "supervisor_circle": 8, "supervisor_name": "Chhotu Lal Jat", "hlb_new": 53, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Mumtaz Ali Khan", "mobile": "9587868688", "supervisor_circle": 8, "supervisor_name": "Chhotu Lal Jat", "hlb_new": 54, "village_en": null, "village_hi": null},
    {"role": "Supervisor", "name": "Dharmendra Singh Rathore", "mobile": "9414550823", "supervisor_circle": 9, "supervisor_name": "Dharmendra Singh Rathore", "hlb_new": null, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Bhanwar Lal", "mobile": "9602067373", "supervisor_circle": 9, "supervisor_name": "Dharmendra Singh Rathore", "hlb_new": 47, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Avinash Prasad Vaishnava", "mobile": "8769453569", "supervisor_circle": 9, "supervisor_name": "Dharmendra Singh Rathore", "hlb_new": 48, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Lakhan Vaishnav", "mobile": "7229982532", "supervisor_circle": 9, "supervisor_name": "Dharmendra Singh Rathore", "hlb_new": 49, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Harish Kumar Vaishnav", "mobile": "9799266968", "supervisor_circle": 9, "supervisor_name": "Dharmendra Singh Rathore", "hlb_new": 50, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Hansraj Lalria", "mobile": "9950323099", "supervisor_circle": 9, "supervisor_name": "Dharmendra Singh Rathore", "hlb_new": 51, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Ashok Kumar Jat", "mobile": "9799013052", "supervisor_circle": 9, "supervisor_name": "Dharmendra Singh Rathore", "hlb_new": 52, "village_en": null, "village_hi": null},
    {"role": "Supervisor", "name": "LALIT KISHORE PAREEK", "mobile": "9414550520", "supervisor_circle": 10, "supervisor_name": "LALIT KISHORE PAREEK", "hlb_new": null, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Lokendra Singh Chauhan", "mobile": "7727077125", "supervisor_circle": 10, "supervisor_name": "Lalit Kishore Pareek", "hlb_new": 114, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Pushpakant Parik", "mobile": "9784206585", "supervisor_circle": 10, "supervisor_name": "Lalit Kishore Pareek", "hlb_new": 115, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Rameshwar Lal Danga", "mobile": "9828036988", "supervisor_circle": 10, "supervisor_name": "Lalit Kishore Pareek", "hlb_new": 116, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Ankur Ojha", "mobile": "9413379419", "supervisor_circle": 10, "supervisor_name": "Lalit Kishore Pareek", "hlb_new": 117, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Raghuveer Jangid", "mobile": "9829709525", "supervisor_circle": 10, "supervisor_name": "Lalit Kishore Pareek", "hlb_new": 118, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Mohammad Rafiq", "mobile": "9928168738", "supervisor_circle": 10, "supervisor_name": "Lalit Kishore Pareek", "hlb_new": 119, "village_en": null, "village_hi": null},
    {"role": "Supervisor", "name": "Muralidhar Sadhu", "mobile": "9680315441", "supervisor_circle": 11, "supervisor_name": "Muralidhar Sadhu", "hlb_new": null, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Rajendra kumar", "mobile": "7891442527", "supervisor_circle": 11, "supervisor_name": "Muralidhar Sadhu", "hlb_new": 58, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Akshay Kumar Sukariya", "mobile": "7737672857", "supervisor_circle": 11, "supervisor_name": "Muralidhar Sadhu", "hlb_new": 59, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Ramswaroop Jangid", "mobile": "9667881532", "supervisor_circle": 11, "supervisor_name": "Muralidhar Sadhu", "hlb_new": 60, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Devendra Prajapat", "mobile": "9929681065", "supervisor_circle": 11, "supervisor_name": "Muralidhar Sadhu", "hlb_new": 61, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Jitendra Kumar Sharma", "mobile": "8107848825", "supervisor_circle": 11, "supervisor_name": "Muralidhar Sadhu", "hlb_new": 65, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Omprakash Sharma", "mobile": "9829663748", "supervisor_circle": 11, "supervisor_name": "Muralidhar Sadhu", "hlb_new": 112, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Devendra Prajapat", "mobile": "9929681065", "supervisor_circle": 11, "supervisor_name": "Muralidhar Sadhu", "hlb_new": 113, "village_en": null, "village_hi": null},
    {"role": "Supervisor", "name": "Mukesh Chandra Gurjar", "mobile": "9413457331", "supervisor_circle": 12, "supervisor_name": "Mukesh Chandra Gurjar", "hlb_new": null, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Ramniwas Bairwa", "mobile": "9001649861", "supervisor_circle": 12, "supervisor_name": "Mukesh Chandra Gurjar", "hlb_new": 14, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Deepak Kumar Sen", "mobile": "9414551356", "supervisor_circle": 12, "supervisor_name": "Mukesh Chandra Gurjar", "hlb_new": 15, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "SUKHA SINGH RAWAT", "mobile": "9784359031", "supervisor_circle": 12, "supervisor_name": "Mukesh Chandra Gurjar", "hlb_new": 16, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Debi Singh Shekhawat", "mobile": "9829964771", "supervisor_circle": 12, "supervisor_name": "Mukesh Chandra Gurjar", "hlb_new": 17, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Jeetram Jat", "mobile": "7690984985", "supervisor_circle": 12, "supervisor_name": "Mukesh Chandra Gurjar", "hlb_new": 62, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "SULTAN LAL MEENA", "mobile": "9511502151", "supervisor_circle": 12, "supervisor_name": "Mukesh Chandra Gurjar", "hlb_new": 63, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "SULTAN LAL MEENA", "mobile": "9511502151", "supervisor_circle": 12, "supervisor_name": "Mukesh Chandra Gurjar", "hlb_new": 64, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Ramniwas Bairwa", "mobile": "9001649861", "supervisor_circle": 12, "supervisor_name": "Mukesh Chandra Gurjar", "hlb_new": 66, "village_en": null, "village_hi": null},
    {"role": "Supervisor", "name": "Dilip Singh Rathore", "mobile": "9414348489", "supervisor_circle": 13, "supervisor_name": "Dilip Singh Rathore", "hlb_new": null, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Pukhraj Bairwa", "mobile": "9799624820", "supervisor_circle": 13, "supervisor_name": "Dilip Singh Rathore", "hlb_new": 84, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Sunil Kumar Meghwanshi", "mobile": "9571478807", "supervisor_circle": 13, "supervisor_name": "Dilip Singh Rathore", "hlb_new": 85, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Azharuddin mansuri", "mobile": "9887941433", "supervisor_circle": 13, "supervisor_name": "Dilip Singh Rathore", "hlb_new": 86, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Chetan Hinduniya", "mobile": "8003774404", "supervisor_circle": 13, "supervisor_name": "Dilip Singh Rathore", "hlb_new": 87, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Ramesh chand Kahar", "mobile": "9784736253", "supervisor_circle": 13, "supervisor_name": "Dilip Singh Rathore", "hlb_new": 88, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Omprakash choudhary", "mobile": "8955082954", "supervisor_circle": 13, "supervisor_name": "Dilip Singh Rathore", "hlb_new": 89, "village_en": null, "village_hi": null},
    {"role": "Supervisor", "name": "Dilip Singh Rathore", "mobile": "9667718413", "supervisor_circle": 14, "supervisor_name": "Dilip Singh Rathore", "hlb_new": null, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Prem Chand", "mobile": "7597814008", "supervisor_circle": 14, "supervisor_name": "Dilip Singh Rathore", "hlb_new": 92, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Raghunath Choudhary", "mobile": "9799295594", "supervisor_circle": 14, "supervisor_name": "Dilip Singh Rathore", "hlb_new": 93, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Anand Kumar Udai", "mobile": "9462070865", "supervisor_circle": 14, "supervisor_name": "Dilip Singh Rathore", "hlb_new": 94, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "ROHIT MALAKAR", "mobile": "7073390819", "supervisor_circle": 14, "supervisor_name": "Dilip Singh Rathore", "hlb_new": 95, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Lalit Kishore Sharma", "mobile": "8104466893", "supervisor_circle": 14, "supervisor_name": "Dilip Singh Rathore", "hlb_new": 96, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Shanti Lal Sadhu", "mobile": "9079123989", "supervisor_circle": 14, "supervisor_name": "Dilip Singh Rathore", "hlb_new": 97, "village_en": null, "village_hi": null},
    {"role": "Supervisor", "name": "Dinesh Kumar Kumawat", "mobile": "9829896189", "supervisor_circle": 15, "supervisor_name": "Dinesh Kumar Kumawat", "hlb_new": null, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Mohan Lal Sain", "mobile": "9950228244", "supervisor_circle": 15, "supervisor_name": "Dinesh Kumar Kumawat", "hlb_new": 90, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Pramod Kumar Sharma", "mobile": "9784206704", "supervisor_circle": 15, "supervisor_name": "Dinesh Kumar Kumawat", "hlb_new": 91, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Ishwar Lal Vaishnav", "mobile": "9982831441", "supervisor_circle": 15, "supervisor_name": "Dinesh Kumar Kumawat", "hlb_new": 98, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Jasraj Gurjar", "mobile": "9664187494", "supervisor_circle": 15, "supervisor_name": "Dinesh Kumar Kumawat", "hlb_new": 99, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Jamnalal jat", "mobile": "9636070167", "supervisor_circle": 15, "supervisor_name": "Dinesh Kumar Kumawat", "hlb_new": 100, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Kavita Kumari Meena", "mobile": "8003047045", "supervisor_circle": 15, "supervisor_name": "Dinesh Kumar Kumawat", "hlb_new": 101, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Jamnalal jat", "mobile": "9636070167", "supervisor_circle": 15, "supervisor_name": "Dinesh Kumar Kumawat", "hlb_new": 103, "village_en": null, "village_hi": null},
    {"role": "Supervisor", "name": "Arvind Kumar Sen", "mobile": "9799250075", "supervisor_circle": 16, "supervisor_name": "Arvind Kumar Sen", "hlb_new": null, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Mohammad Ilyas", "mobile": "8890363439", "supervisor_circle": 16, "supervisor_name": "Arvind Kumar Sen", "hlb_new": 79, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "ABDUL MOHSIN KHAN", "mobile": "9269313486", "supervisor_circle": 16, "supervisor_name": "Arvind Kumar Sen", "hlb_new": 80, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Chandmal Chandel", "mobile": "8290291038", "supervisor_circle": 16, "supervisor_name": "Arvind Kumar Sen", "hlb_new": 81, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Arjun Khatik", "mobile": "9414550655", "supervisor_circle": 16, "supervisor_name": "Arvind Kumar Sen", "hlb_new": 82, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Paras Mal Vaishav", "mobile": "9660070722", "supervisor_circle": 16, "supervisor_name": "Arvind Kumar Sen", "hlb_new": 83, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Nisar Ahmad", "mobile": "9660514516", "supervisor_circle": 16, "supervisor_name": "Arvind Kumar Sen", "hlb_new": 102, "village_en": null, "village_hi": null},
    {"role": "Supervisor", "name": "Ramdayal Regar", "mobile": "9928748496", "supervisor_circle": 17, "supervisor_name": "Ramdayal Regar", "hlb_new": null, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Ajay Singh Devra", "mobile": "9571189634", "supervisor_circle": 17, "supervisor_name": "Ramdayal Regar", "hlb_new": 67, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Ram Gopal Bairwa", "mobile": "9928278227", "supervisor_circle": 17, "supervisor_name": "Ramdayal Regar", "hlb_new": 68, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Sandeep Bokoliya", "mobile": "9256821687", "supervisor_circle": 17, "supervisor_name": "Ramdayal Regar", "hlb_new": 69, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Dharmendra Kumar Vaishnav", "mobile": "9079219657", "supervisor_circle": 17, "supervisor_name": "Ramdayal Regar", "hlb_new": 70, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Rinku Jat", "mobile": "8440066025", "supervisor_circle": 17, "supervisor_name": "Ramdayal Regar", "hlb_new": 71, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Devendra Kumawat", "mobile": "7413064396", "supervisor_circle": 17, "supervisor_name": "Ramdayal Regar", "hlb_new": 72, "village_en": null, "village_hi": null},
    {"role": "Supervisor", "name": "Omvrat", "mobile": "7597732890", "supervisor_circle": 18, "supervisor_name": "Omvrat", "hlb_new": null, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Akash Saini", "mobile": "7976385935", "supervisor_circle": 18, "supervisor_name": "Omvrat", "hlb_new": 73, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Dhanraj Bairwa", "mobile": "9414749131", "supervisor_circle": 18, "supervisor_name": "Omvrat", "hlb_new": 74, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Sajjan Singh Gaur", "mobile": "8619276061", "supervisor_circle": 18, "supervisor_name": "Omvrat", "hlb_new": 75, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Pawan Kumar Joshi", "mobile": "9928862564", "supervisor_circle": 18, "supervisor_name": "Omvrat", "hlb_new": 76, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Radheshyam Jangid", "mobile": "9829329326", "supervisor_circle": 18, "supervisor_name": "Omvrat", "hlb_new": 77, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Bhartaraj Meena", "mobile": "8504000948", "supervisor_circle": 18, "supervisor_name": "Omvrat", "hlb_new": 78, "village_en": null, "village_hi": null},
    {"role": "Supervisor", "name": "Rang Lal Bairwa", "mobile": "9252170173", "supervisor_circle": 19, "supervisor_name": "Rang Lal Bairwa", "hlb_new": null, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Vishnu Gurjar", "mobile": "9828772624", "supervisor_circle": 19, "supervisor_name": "Rang Lal Bairwa", "hlb_new": 110, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "vinod bhambhi", "mobile": "9694930126", "supervisor_circle": 19, "supervisor_name": "Rang Lal Bairwa", "hlb_new": 111, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Surendra Kumar Lohiya", "mobile": "9079993404", "supervisor_circle": 19, "supervisor_name": "Rang Lal Bairwa", "hlb_new": 127, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "LAXMAN KUMAR BAIRWA", "mobile": "6378819934", "supervisor_circle": 19, "supervisor_name": "Rang Lal Bairwa", "hlb_new": 128, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "vinod bhambhi", "mobile": "9694930126", "supervisor_circle": 19, "supervisor_name": "Rang Lal Bairwa", "hlb_new": 129, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Kuldeep Mishra", "mobile": "7610000617", "supervisor_circle": 19, "supervisor_name": "Rang Lal Bairwa", "hlb_new": 175, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Abhishek Sharma", "mobile": "9983785241", "supervisor_circle": 19, "supervisor_name": "Rang Lal Bairwa", "hlb_new": 177, "village_en": null, "village_hi": null},
    {"role": "Supervisor", "name": "MANA LAL MALI", "mobile": "9680218716", "supervisor_circle": 20, "supervisor_name": "MANA LAL MALI", "hlb_new": null, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Sunil Kumar Gauttam", "mobile": "9680309694", "supervisor_circle": 20, "supervisor_name": "Mana Lal Mali", "hlb_new": 120, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Dileep Singh Kaviya", "mobile": "7976180461", "supervisor_circle": 20, "supervisor_name": "Mana Lal Mali", "hlb_new": 121, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Gopal Mali", "mobile": "9829839625", "supervisor_circle": 20, "supervisor_name": "Mana Lal Mali", "hlb_new": 122, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Balram Choudhary", "mobile": "8003754501", "supervisor_circle": 20, "supervisor_name": "Mana Lal Mali", "hlb_new": 123, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Surendra Singh Rathore", "mobile": "7300180369", "supervisor_circle": 20, "supervisor_name": "Mana Lal Mali", "hlb_new": 124, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Gopal Mali", "mobile": "9829839625", "supervisor_circle": 20, "supervisor_name": "Mana Lal Mali", "hlb_new": 125, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Bhanwar Lal Sharma", "mobile": "9829850973", "supervisor_circle": 20, "supervisor_name": "Mana Lal Mali", "hlb_new": 126, "village_en": null, "village_hi": null},
    {"role": "Supervisor", "name": "Nitish Kumar Sukaria", "mobile": "9783650727", "supervisor_circle": 21, "supervisor_name": "Nitish Kumar Sukaria", "hlb_new": null, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Mahender Kumar", "mobile": "9928078357", "supervisor_circle": 21, "supervisor_name": "Nitish Kumar Sukaria", "hlb_new": 173, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Hemraj Prajapat", "mobile": "9571042761", "supervisor_circle": 21, "supervisor_name": "Nitish Kumar Sukaria", "hlb_new": 174, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "lucky parwez", "mobile": "9214507135", "supervisor_circle": 21, "supervisor_name": "Nitish Kumar Sukaria", "hlb_new": 176, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Naresh Kumar Sharma", "mobile": "9784195646", "supervisor_circle": 21, "supervisor_name": "Nitish Kumar Sukaria", "hlb_new": 178, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Ahilya Sharma", "mobile": "9610976472", "supervisor_circle": 21, "supervisor_name": "Nitish Kumar Sukaria", "hlb_new": 179, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Rajendra nath Sidh", "mobile": "9783601902", "supervisor_circle": 21, "supervisor_name": "Nitish Kumar Sukaria", "hlb_new": 180, "village_en": null, "village_hi": null},
    {"role": "Supervisor", "name": "Mahesh Kumar Bunkar", "mobile": "9799859239", "supervisor_circle": 22, "supervisor_name": "Mahesh Kumar Bunkar", "hlb_new": null, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Shanker Lal Bhambi", "mobile": "9887143804", "supervisor_circle": 22, "supervisor_name": "Mahesh Kumar Bunkar", "hlb_new": 169, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Deepak Nakwal", "mobile": "9928808209", "supervisor_circle": 22, "supervisor_name": "Mahesh Kumar Bunkar", "hlb_new": 170, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Shyoji Ram Bairwa", "mobile": "9799983001", "supervisor_circle": 22, "supervisor_name": "Mahesh Kumar Bunkar", "hlb_new": 171, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Zahid Hussain Ansari", "mobile": "9460091286", "supervisor_circle": 22, "supervisor_name": "Mahesh Kumar Bunkar", "hlb_new": 182, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Panchu lal Meghvanshi", "mobile": "9929734317", "supervisor_circle": 22, "supervisor_name": "Mahesh Kumar Bunkar", "hlb_new": 183, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Abdul Hanan Ansari", "mobile": "9413743282", "supervisor_circle": 22, "supervisor_name": "Mahesh Kumar Bunkar", "hlb_new": 184, "village_en": null, "village_hi": null},
    {"role": "Supervisor", "name": "GOVIND RAM JANJGID", "mobile": "9982323026", "supervisor_circle": 23, "supervisor_name": "GOVIND RAM JANJGID", "hlb_new": null, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Gajraj Bairwa", "mobile": "8094138785", "supervisor_circle": 23, "supervisor_name": "Govind Ram Janjgid", "hlb_new": 132, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Shyam Singh Shekhawat", "mobile": "9929477912", "supervisor_circle": 23, "supervisor_name": "Govind Ram Janjgid", "hlb_new": 133, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "MAHAVEER PRASAD JANGID", "mobile": "9929753094", "supervisor_circle": 23, "supervisor_name": "Govind Ram Janjgid", "hlb_new": 134, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Sanwar Nath Yogi", "mobile": "9571067186", "supervisor_circle": 23, "supervisor_name": "Govind Ram Janjgid", "hlb_new": 166, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Satyanarayan Bairwa", "mobile": "8003824561", "supervisor_circle": 23, "supervisor_name": "Govind Ram Janjgid", "hlb_new": 167, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Tara Vyas", "mobile": "6376217543", "supervisor_circle": 23, "supervisor_name": "Govind Ram Janjgid", "hlb_new": 172, "village_en": null, "village_hi": null},
    {"role": "Supervisor", "name": "Mohammad Tayyab Khan", "mobile": "9414550787", "supervisor_circle": 24, "supervisor_name": "Mohammad Tayyab Khan", "hlb_new": null, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "BHARAT BHUSHAN PANWAR", "mobile": "9610834792", "supervisor_circle": 24, "supervisor_name": "Mohammad Tayyab Khan", "hlb_new": 105, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Hansraj Gurjar", "mobile": "9784277921", "supervisor_circle": 24, "supervisor_name": "Mohammad Tayyab Khan", "hlb_new": 106, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Dinesh Kumar Swarnkar", "mobile": "9587086986", "supervisor_circle": 24, "supervisor_name": "Mohammad Tayyab Khan", "hlb_new": 107, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Anil Kumar Rao", "mobile": "9001755517", "supervisor_circle": 24, "supervisor_name": "Mohammad Tayyab Khan", "hlb_new": 108, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Anil Kumar Rao", "mobile": "9001755517", "supervisor_circle": 24, "supervisor_name": "Mohammad Tayyab Khan", "hlb_new": 109, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Ummed Singh Dewra", "mobile": "9571744755", "supervisor_circle": 24, "supervisor_name": "Mohammad Tayyab Khan", "hlb_new": 130, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "BHARAT BHUSHAN PANWAR", "mobile": "9610834792", "supervisor_circle": 24, "supervisor_name": "Mohammad Tayyab Khan", "hlb_new": 131, "village_en": null, "village_hi": null},
    {"role": "Supervisor", "name": "Suresh Chandra Jangid", "mobile": "9950170522", "supervisor_circle": 25, "supervisor_name": "Suresh Chandra Jangid", "hlb_new": null, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Shanti Lal Jat", "mobile": "8003697585", "supervisor_circle": 25, "supervisor_name": "Suresh Chandra Jangid", "hlb_new": 104, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Rajveer Singh Rawat", "mobile": "8003682476", "supervisor_circle": 25, "supervisor_name": "Suresh Chandra Jangid", "hlb_new": 135, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Durgesh Kumar Prajapat", "mobile": "6367237759", "supervisor_circle": 25, "supervisor_name": "Suresh Chandra Jangid", "hlb_new": 136, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "vinod kumar meena", "mobile": "9828393814", "supervisor_circle": 25, "supervisor_name": "Suresh Chandra Jangid", "hlb_new": 137, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Harish Sagar", "mobile": "7014423429", "supervisor_circle": 25, "supervisor_name": "Suresh Chandra Jangid", "hlb_new": 138, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Dinesh Kumar Regar", "mobile": "8107193130", "supervisor_circle": 25, "supervisor_name": "Suresh Chandra Jangid", "hlb_new": 139, "village_en": null, "village_hi": null},
    {"role": "Supervisor", "name": "Murali Yadav", "mobile": "9602889079", "supervisor_circle": 26, "supervisor_name": "Murali Yadav", "hlb_new": null, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Omprakash Sen", "mobile": "9549934932", "supervisor_circle": 26, "supervisor_name": "Murali Yadav", "hlb_new": 141, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Badri Narayan Jat", "mobile": "9784080563", "supervisor_circle": 26, "supervisor_name": "Murali Yadav", "hlb_new": 142, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Khushi raj Saini", "mobile": "9694556275", "supervisor_circle": 26, "supervisor_name": "Murali Yadav", "hlb_new": 154, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Dilkhush Vaishnav", "mobile": "9602408532", "supervisor_circle": 26, "supervisor_name": "Murali Yadav", "hlb_new": 155, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Mukesh Bairwa", "mobile": "7340468728", "supervisor_circle": 26, "supervisor_name": "Murali Yadav", "hlb_new": 156, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Mahaveer Singh Devda", "mobile": "9982195997", "supervisor_circle": 26, "supervisor_name": "Murali Yadav", "hlb_new": 157, "village_en": null, "village_hi": null},
    {"role": "Supervisor", "name": "Chandraprakash Damami", "mobile": "9929455837", "supervisor_circle": 27, "supervisor_name": "Chandraprakash Damami", "hlb_new": null, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Ashish Chaudhary", "mobile": "9413408056", "supervisor_circle": 27, "supervisor_name": "Chandraprakash Damami", "hlb_new": 140, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Rakesh Choudhary", "mobile": "8769013299", "supervisor_circle": 27, "supervisor_name": "Chandraprakash Damami", "hlb_new": 143, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Ajay Kumar Pancholi", "mobile": "8107385858", "supervisor_circle": 27, "supervisor_name": "Chandraprakash Damami", "hlb_new": 144, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Bablu Lal Meena", "mobile": "7568008715", "supervisor_circle": 27, "supervisor_name": "Chandraprakash Damami", "hlb_new": 145, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Bhagchand Tank", "mobile": "9828803505", "supervisor_circle": 27, "supervisor_name": "Chandraprakash Damami", "hlb_new": 146, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Hari Narayan Yadav", "mobile": "9680508258", "supervisor_circle": 27, "supervisor_name": "Chandraprakash Damami", "hlb_new": 153, "village_en": null, "village_hi": null},
    {"role": "Supervisor", "name": "Balram Chaudhary", "mobile": "8432168368", "supervisor_circle": 28, "supervisor_name": "Balram Chaudhary", "hlb_new": null, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Ram prasad Kharol", "mobile": "9783038311", "supervisor_circle": 28, "supervisor_name": "Balram Chaudhary", "hlb_new": 160, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Ashok Kumar Mali", "mobile": "8955274942", "supervisor_circle": 28, "supervisor_name": "Balram Chaudhary", "hlb_new": 161, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Mukesh Singh", "mobile": "9799471652", "supervisor_circle": 28, "supervisor_name": "Balram Chaudhary", "hlb_new": 162, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Sanwar Lal Sharma", "mobile": "9929322995", "supervisor_circle": 28, "supervisor_name": "Balram Chaudhary", "hlb_new": 163, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Rakesh kumar Pareek", "mobile": "9001300873", "supervisor_circle": 28, "supervisor_name": "Balram Chaudhary", "hlb_new": 164, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Ashok Kumar Kamar", "mobile": "8440861258", "supervisor_circle": 28, "supervisor_name": "Balram Chaudhary", "hlb_new": 165, "village_en": null, "village_hi": null},
    {"role": "Supervisor", "name": "Mahaveer Bairwa", "mobile": "9571827858", "supervisor_circle": 29, "supervisor_name": "Mahaveer Bairwa", "hlb_new": null, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Rajkumar Bairwa", "mobile": "7611940017", "supervisor_circle": 29, "supervisor_name": "Mahaveer Bairwa", "hlb_new": 158, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Ramswaroop Choudhary", "mobile": "9829287705", "supervisor_circle": 29, "supervisor_name": "Mahaveer Bairwa", "hlb_new": 159, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Hansraj Jat", "mobile": "9001260330", "supervisor_circle": 29, "supervisor_name": "Mahaveer Bairwa", "hlb_new": 168, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Narayan Lal Bairwa", "mobile": "9664216064", "supervisor_circle": 29, "supervisor_name": "Mahaveer Bairwa", "hlb_new": 185, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Satyanarayan Meena", "mobile": "9785389333", "supervisor_circle": 29, "supervisor_name": "Mahaveer Bairwa", "hlb_new": 197, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Gyaneshwar Prasad Prajapat", "mobile": "9672862304", "supervisor_circle": 29, "supervisor_name": "Mahaveer Bairwa", "hlb_new": 234, "village_en": null, "village_hi": null},
    {"role": "Supervisor", "name": "Govind Narayan Tripathi", "mobile": "9982352925", "supervisor_circle": 30, "supervisor_name": "Govind Narayan Tripathi", "hlb_new": null, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "HEMANT KUMAR SUKARIYA", "mobile": "9001256573", "supervisor_circle": 30, "supervisor_name": "Govind Narayan Tripathi", "hlb_new": 191, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Ganesh Gurjar", "mobile": "9571732379", "supervisor_circle": 30, "supervisor_name": "Govind Narayan Tripathi", "hlb_new": 192, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Sajan Singh Chouhan", "mobile": "9079245438", "supervisor_circle": 30, "supervisor_name": "Govind Narayan Tripathi", "hlb_new": 193, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Omprakash Vyas", "mobile": "9602444210", "supervisor_circle": 30, "supervisor_name": "Govind Narayan Tripathi", "hlb_new": 194, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Kishan Lal Bairwa", "mobile": "9784970296", "supervisor_circle": 30, "supervisor_name": "Govind Narayan Tripathi", "hlb_new": 195, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Jitendra Yadav", "mobile": "9929827714", "supervisor_circle": 30, "supervisor_name": "Govind Narayan Tripathi", "hlb_new": 196, "village_en": null, "village_hi": null},
    {"role": "Supervisor", "name": "Kamal Kumar Bairwa", "mobile": "8", "supervisor_circle": 31, "supervisor_name": "Kamal Kumar Bairwa", "hlb_new": null, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "KRISHNA KUMAR TIWARI", "mobile": "9461532852", "supervisor_circle": 31, "supervisor_name": "Kamal Kumar Bairwa", "hlb_new": 181, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Vishnu Kumar Vaishnav", "mobile": "9983118699", "supervisor_circle": 31, "supervisor_name": "Kamal Kumar Bairwa", "hlb_new": 186, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Madan Lal Bairwa", "mobile": "9928347330", "supervisor_circle": 31, "supervisor_name": "Kamal Kumar Bairwa", "hlb_new": 187, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Ranjeet Bairwa", "mobile": "8890036667", "supervisor_circle": 31, "supervisor_name": "Kamal Kumar Bairwa", "hlb_new": 188, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Mahavir Prasad Bairwa", "mobile": "9784741256", "supervisor_circle": 31, "supervisor_name": "Kamal Kumar Bairwa", "hlb_new": 189, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Budh Raj Mali", "mobile": "9929542239", "supervisor_circle": 31, "supervisor_name": "Kamal Kumar Bairwa", "hlb_new": 190, "village_en": null, "village_hi": null},
    {"role": "Supervisor", "name": "Ratan Lal Jangir", "mobile": "9928884278", "supervisor_circle": 32, "supervisor_name": "Ratan Lal Jangir", "hlb_new": null, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Rajaram Sahu", "mobile": "9571940090", "supervisor_circle": 32, "supervisor_name": "Ratan Lal Jangir", "hlb_new": 231, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Bhupender Singh Charan", "mobile": "9929527319", "supervisor_circle": 32, "supervisor_name": "Ratan Lal Jangir", "hlb_new": 232, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Dashrath Bairwa", "mobile": "9116982528", "supervisor_circle": 32, "supervisor_name": "Ratan Lal Jangir", "hlb_new": 233, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Manoj Kumar Dadhich", "mobile": "9636459179", "supervisor_circle": 32, "supervisor_name": "Ratan Lal Jangir", "hlb_new": 235, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Vijay Singh", "mobile": "9799979051", "supervisor_circle": 32, "supervisor_name": "Ratan Lal Jangir", "hlb_new": 236, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Harish Kumar Sharma", "mobile": "8290707770", "supervisor_circle": 32, "supervisor_name": "Ratan Lal Jangir", "hlb_new": 237, "village_en": null, "village_hi": null},
    {"role": "Supervisor", "name": "Rajaneesh Kumar Jangid", "mobile": "9875119865", "supervisor_circle": 33, "supervisor_name": "Rajaneesh Kumar Jangid", "hlb_new": null, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Devaraj Gurjar", "mobile": "6367962727", "supervisor_circle": 33, "supervisor_name": "Rajaneesh Kumar Jangid", "hlb_new": 230, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Shivraj Choudhary", "mobile": "9257208826", "supervisor_circle": 33, "supervisor_name": "Rajaneesh Kumar Jangid", "hlb_new": 238, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Raghuveer Prasad Bhambi", "mobile": "9784738022", "supervisor_circle": 33, "supervisor_name": "Rajaneesh Kumar Jangid", "hlb_new": 239, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "UMRAO SINGH BARI", "mobile": "9636224810", "supervisor_circle": 33, "supervisor_name": "Rajaneesh Kumar Jangid", "hlb_new": 240, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "SUMAN PRAJAPAT", "mobile": "9828724951", "supervisor_circle": 33, "supervisor_name": "Rajaneesh Kumar Jangid", "hlb_new": 241, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Raju Rebari", "mobile": "8239249326", "supervisor_circle": 33, "supervisor_name": "Rajaneesh Kumar Jangid", "hlb_new": 242, "village_en": null, "village_hi": null},
    {"role": "Supervisor", "name": "Manoj Kumar Jain", "mobile": "9166605908", "supervisor_circle": 34, "supervisor_name": "Manoj Kumar Jain", "hlb_new": null, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Mahavir Prasad Prajapat", "mobile": "9680771065", "supervisor_circle": 34, "supervisor_name": "Manoj Kumar Jain", "hlb_new": 198, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Banwari Lal Goswami", "mobile": "9929447843", "supervisor_circle": 34, "supervisor_name": "Manoj Kumar Jain", "hlb_new": 199, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Vishnu Prasad Sharma", "mobile": "9001450390", "supervisor_circle": 34, "supervisor_name": "Manoj Kumar Jain", "hlb_new": 200, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Abdul Kalam", "mobile": "9549288805", "supervisor_circle": 34, "supervisor_name": "Manoj Kumar Jain", "hlb_new": 214, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Bablu Meghwal", "mobile": "8949510844", "supervisor_circle": 34, "supervisor_name": "Manoj Kumar Jain", "hlb_new": 217, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Bhupendra Singh Rathore", "mobile": "8875127688", "supervisor_circle": 34, "supervisor_name": "Manoj Kumar Jain", "hlb_new": 218, "village_en": null, "village_hi": null},
    {"role": "Supervisor", "name": "Bhagchand Jain", "mobile": "9166446266", "supervisor_circle": 35, "supervisor_name": "Bhagchand Jain", "hlb_new": null, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Murlidhar Kumawat", "mobile": "9660985979", "supervisor_circle": 35, "supervisor_name": "Bhagchand Jain", "hlb_new": 201, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Ram kunwar Kumhar", "mobile": "9829828478", "supervisor_circle": 35, "supervisor_name": "Bhagchand Jain", "hlb_new": 202, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Dhanraj Mochi", "mobile": "9252994550", "supervisor_circle": 35, "supervisor_name": "Bhagchand Jain", "hlb_new": 203, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Abhay Singh Panwar", "mobile": "9001986838", "supervisor_circle": 35, "supervisor_name": "Bhagchand Jain", "hlb_new": 204, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Bhagchand Bairwa", "mobile": "8696055731", "supervisor_circle": 35, "supervisor_name": "Bhagchand Jain", "hlb_new": 205, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Kaluram Soyal", "mobile": "9772826003", "supervisor_circle": 35, "supervisor_name": "Bhagchand Jain", "hlb_new": 215, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Dhanraj Mochi", "mobile": "9252994550", "supervisor_circle": 35, "supervisor_name": "Bhagchand Jain", "hlb_new": 216, "village_en": null, "village_hi": null},
    {"role": "Supervisor", "name": "RAMSINGH DHAKAR", "mobile": "8696546122", "supervisor_circle": 36, "supervisor_name": "RAMSINGH DHAKAR", "hlb_new": null, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Rajendra Prasad", "mobile": "7014562116", "supervisor_circle": 36, "supervisor_name": "Ramsingh Dhakar", "hlb_new": 147, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "MUKUT MANI DVIVEDI", "mobile": "9460966310", "supervisor_circle": 36, "supervisor_name": "Ramsingh Dhakar", "hlb_new": 148, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "RAMESH CHANDRA KHATI", "mobile": "9680772755", "supervisor_circle": 36, "supervisor_name": "Ramsingh Dhakar", "hlb_new": 149, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "GYARSI LAL BAIRWA", "mobile": "9694969961", "supervisor_circle": 36, "supervisor_name": "Ramsingh Dhakar", "hlb_new": 150, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Mohan Lal Jajoria", "mobile": "9950333800", "supervisor_circle": 36, "supervisor_name": "Ramsingh Dhakar", "hlb_new": 151, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Durgesh Kumar Meghwanshi", "mobile": "8824684055", "supervisor_circle": 36, "supervisor_name": "Ramsingh Dhakar", "hlb_new": 152, "village_en": null, "village_hi": null},
    {"role": "Supervisor", "name": "Kanwari Lal Soni", "mobile": "9252565387", "supervisor_circle": 37, "supervisor_name": "Kanwari Lal Soni", "hlb_new": null, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Yadveer Singh", "mobile": "9057099538", "supervisor_circle": 37, "supervisor_name": "Kanwari Lal Soni", "hlb_new": 206, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Dharmendra Choudhary", "mobile": "9799510830", "supervisor_circle": 37, "supervisor_name": "Kanwari Lal Soni", "hlb_new": 207, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Narendra Kumar Verma", "mobile": "9664434019", "supervisor_circle": 37, "supervisor_name": "Kanwari Lal Soni", "hlb_new": 208, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Ramswaroop Bairwa", "mobile": "9983360604", "supervisor_circle": 37, "supervisor_name": "Kanwari Lal Soni", "hlb_new": 209, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Ramswaroop Bairwa", "mobile": "9983360604", "supervisor_circle": 37, "supervisor_name": "Kanwari Lal Soni", "hlb_new": 210, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Dinesh Sad", "mobile": "9928956796", "supervisor_circle": 37, "supervisor_name": "Kanwari Lal Soni", "hlb_new": 211, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Gaourav Kumar", "mobile": "9875078999", "supervisor_circle": 37, "supervisor_name": "Kanwari Lal Soni", "hlb_new": 212, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Dharmendra Choudhary", "mobile": "9799510830", "supervisor_circle": 37, "supervisor_name": "Kanwari Lal Soni", "hlb_new": 213, "village_en": null, "village_hi": null},
    {"role": "Supervisor", "name": "Shankar Lal Saini", "mobile": "8233686098", "supervisor_circle": 38, "supervisor_name": "Shankar Lal Saini", "hlb_new": null, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Lokesh Jat", "mobile": "9829243359", "supervisor_circle": 38, "supervisor_name": "Shankar Lal Saini", "hlb_new": 219, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Hem Singh", "mobile": "9982674193", "supervisor_circle": 38, "supervisor_name": "Shankar Lal Saini", "hlb_new": 220, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Gangaram Regar", "mobile": "9929136369", "supervisor_circle": 38, "supervisor_name": "Shankar Lal Saini", "hlb_new": 221, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Shantilal Jain", "mobile": "9828874347", "supervisor_circle": 38, "supervisor_name": "Shankar Lal Saini", "hlb_new": 227, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Prithviraj meena", "mobile": "8696157366", "supervisor_circle": 38, "supervisor_name": "Shankar Lal Saini", "hlb_new": 228, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Om Prakash Doria", "mobile": "9928986712", "supervisor_circle": 38, "supervisor_name": "Shankar Lal Saini", "hlb_new": 229, "village_en": null, "village_hi": null},
    {"role": "Supervisor", "name": "Gajendra Saini", "mobile": "9772122272", "supervisor_circle": 39, "supervisor_name": "Gajendra Saini", "hlb_new": null, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Balmukand Khati", "mobile": "9784375452", "supervisor_circle": 39, "supervisor_name": "Gajendra Saini", "hlb_new": 222, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Avinash Sharma", "mobile": "9887786686", "supervisor_circle": 39, "supervisor_name": "Gajendra Saini", "hlb_new": 223, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Pankaj Tiwari", "mobile": "9928649547", "supervisor_circle": 39, "supervisor_name": "Gajendra Saini", "hlb_new": 224, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Shivraj Prajapat", "mobile": "8955208814", "supervisor_circle": 39, "supervisor_name": "Gajendra Saini", "hlb_new": 225, "village_en": null, "village_hi": null},
    {"role": "Enumerator", "name": "Norat Mal Balai", "mobile": "9461259946", "supervisor_circle": 39, "supervisor_name": "Gajendra Saini", "hlb_new": 226, "village_en": null, "village_hi": null}
];



const VILLAGE_SUPERVISORS = {"Bandanwara (0013)":[{"circle":1,"name":"trilok chand bhambi","mobile":"8233559209"},{"circle":3,"name":"Mahavir Prasad Jangid","mobile":"9799312619"},{"circle":6,"name":"Gangavishan Prajapat","mobile":"7742549519"}],"Amargarh (0001)":[{"circle":1,"name":"trilok chand bhambi","mobile":"8233559209"}],"Motipura (0002)":[{"circle":1,"name":"trilok chand bhambi","mobile":"8233559209"}],"Rooppura (0014)":[{"circle":2,"name":"Sanjay Vyas","mobile":"8504884191"}],"Rampura (0015)":[{"circle":2,"name":"Sanjay Vyas","mobile":"8504884191"}],"Devpura (0017)":[{"circle":2,"name":"Sanjay Vyas","mobile":"8504884191"}],"Gajjanadi (0016)":[{"circle":2,"name":"Sanjay Vyas","mobile":"8504884191"}],"Kheri (0011)":[{"circle":3,"name":"Mahavir Prasad Jangid","mobile":"9799312619"},{"circle":7,"name":"Sandeep Bagrani","mobile":"9602564649"}],"Kumhariya (0004)":[{"circle":4,"name":"Shivprakash Lunia","mobile":"9772270806"}],"Bagrai (0003)":[{"circle":4,"name":"Shivprakash Lunia","mobile":"9772270806"}],"Soorajpura (0005)":[{"circle":4,"name":"Shivprakash Lunia","mobile":"9772270806"}],"Keetap (0006)":[{"circle":5,"name":"Mukesh Rawat","mobile":"9799203204"}],"Sedariya (0007)":[{"circle":5,"name":"Mukesh Rawat","mobile":"9799203204"},{"circle":12,"name":"Mukesh Chandra Gurjar","mobile":"9413457331"}],"Pratappura (0010)":[{"circle":7,"name":"Sandeep Bagrani","mobile":"9602564649"}],"Gowaliya (0023)":[{"circle":7,"name":"Sandeep Bagrani","mobile":"9602564649"}],"Padanga (0012)":[{"circle":8,"name":"Chotu Lal Jat","mobile":"9571857537"}],"Mathaniya (0022)":[{"circle":8,"name":"Chotu Lal Jat","mobile":"9571857537"}],"Sawaipura (0021)":[{"circle":8,"name":"Chotu Lal Jat","mobile":"9571857537"}],"Arjunpura (0018)":[{"circle":8,"name":"Chotu Lal Jat","mobile":"9571857537"}],"Jheepiya (0019)":[{"circle":9,"name":"Dharmendra Singh Rathore","mobile":"9414550823"}],"Ratakot (0020)":[{"circle":9,"name":"Dharmendra Singh Rathore","mobile":"9414550823"}],"Singhawal (0046)":[{"circle":10,"name":"LALIT KISHORE PAREEK","mobile":"9414550520"}],"Khatanon Ka Khera (0047)":[{"circle":10,"name":"LALIT KISHORE PAREEK","mobile":"9414550520"}],"Jorawarpura (0027)":[{"circle":11,"name":"Muralidhar Sadhu","mobile":"9680315441"}],"Karati (0024)":[{"circle":11,"name":"Muralidhar Sadhu","mobile":"9680315441"}],"Gopalpura (0045)":[{"circle":11,"name":"Muralidhar Sadhu","mobile":"9680315441"}],"Ratanpura (0028)":[{"circle":12,"name":"Mukesh Chandra Gurjar","mobile":"9413457331"}],"Chhachhundra (0008)":[{"circle":12,"name":"Mukesh Chandra Gurjar","mobile":"9413457331"}],"Daulatpura (0009)":[{"circle":12,"name":"Mukesh Chandra Gurjar","mobile":"9413457331"}],"Sargaon (0025)":[{"circle":12,"name":"Mukesh Chandra Gurjar","mobile":"9413457331"}],"Gordhanpura (0026)":[{"circle":12,"name":"Mukesh Chandra Gurjar","mobile":"9413457331"}],"Udaigarh Khera (0030)":[{"circle":13,"name":"Dilip Singh Rathore","mobile":"9414348489"}],"Gujarwara (0031)":[{"circle":13,"name":"Dilip Singh Rathore","mobile":"9414348489"}],"Dhantol (0032)":[{"circle":13,"name":"Dilip Singh Rathore","mobile":"9414348489"}],"Raghunath Garh (0035)":[{"circle":14,"name":"Dilip Singh Rathore","mobile":"9667718413"}],"Rammaliya (0034)":[{"circle":14,"name":"Dilip Singh Rathore","mobile":"9667718413"}],"Peeloda (0037)":[{"circle":15,"name":"Dinesh Kumar Kumawat","mobile":"9829896189"}],"Heerapura (0033)":[{"circle":15,"name":"Dinesh Kumar Kumawat","mobile":"9829896189"}],"Boobkiya (0036)":[{"circle":15,"name":"Dinesh Kumar Kumawat","mobile":"9829896189"}],"Ren (0038)":[{"circle":15,"name":"Dinesh Kumar Kumawat","mobile":"9829896189"},{"circle":16,"name":"Arvind Kumar Sen","mobile":"9799250075"}],"Bhinay (0029)":[{"circle":16,"name":"Arvind Kumar Sen","mobile":"9799250075"},{"circle":17,"name":"Ramdayal Regar","mobile":"9928748496"},{"circle":18,"name":"Omvrat","mobile":"7597732890"}],"Barli (0071)":[{"circle":19,"name":"Rang Lal Bairwa","mobile":"9252170173"},{"circle":21,"name":"Nitish Kumar Sukaria","mobile":"9783650727"}],"Ekalseenga (0051)":[{"circle":19,"name":"Rang Lal Bairwa","mobile":"9252170173"},{"circle":20,"name":"MANA LAL MALI","mobile":"9680218716"}],"Chawandiya (0044)":[{"circle":19,"name":"Rang Lal Bairwa","mobile":"9252170173"}],"Dhani (0052)":[{"circle":19,"name":"Rang Lal Bairwa","mobile":"9252170173"}],"Balapura (0050)":[{"circle":20,"name":"MANA LAL MALI","mobile":"9680218716"}],"Baneriya (0049)":[{"circle":20,"name":"MANA LAL MALI","mobile":"9680218716"}],"Hiyaliya (0048)":[{"circle":20,"name":"MANA LAL MALI","mobile":"9680218716"}],"Lamgara (0074)":[{"circle":22,"name":"Mahesh Kumar Bunkar","mobile":"9799859239"},{"circle":29,"name":"Mahaveer Bairwa","mobile":"9571827858"}],"Neemera (0069)":[{"circle":22,"name":"Mahesh Kumar Bunkar","mobile":"9799859239"}],"Ganahera (0073)":[{"circle":22,"name":"Mahesh Kumar Bunkar","mobile":"9799859239"}],"Ghana (0054)":[{"circle":23,"name":"GOVIND RAM JANJGID","mobile":"9982323026"}],"Udaipura Khera (0066)":[{"circle":23,"name":"GOVIND RAM JANJGID","mobile":"9982323026"}],"Bhairoo Khera (0067)":[{"circle":23,"name":"GOVIND RAM JANJGID","mobile":"9982323026"}],"Jhanbarkiya (0070)":[{"circle":23,"name":"GOVIND RAM JANJGID","mobile":"9982323026"}],"Kumhariya Khera (0040)":[{"circle":24,"name":"Mohammad Tayyab Khan","mobile":"9414550787"}],"Pratappura (0042)":[{"circle":24,"name":"Mohammad Tayyab Khan","mobile":"9414550787"}],"Rooppura (0043)":[{"circle":24,"name":"Mohammad Tayyab Khan","mobile":"9414550787"}],"Telara (0053)":[{"circle":24,"name":"Mohammad Tayyab Khan","mobile":"9414550787"}],"Sobri (0041)":[{"circle":24,"name":"Mohammad Tayyab Khan","mobile":"9414550787"}],"Solkhurd (0039)":[{"circle":25,"name":"Suresh Chandra Jangid","mobile":"9950170522"}],"Khayra (0055)":[{"circle":25,"name":"Suresh Chandra Jangid","mobile":"9950170522"}],"Peepaliya (0056)":[{"circle":25,"name":"Suresh Chandra Jangid","mobile":"9950170522"}],"Sol Kalan (0057)":[{"circle":25,"name":"Suresh Chandra Jangid","mobile":"9950170522"}],"Barla @ Kala Talab (0058)":[{"circle":26,"name":"Murali Yadav","mobile":"9602889079"},{"circle":27,"name":"Chandraprakash Damami","mobile":"9929455837"}],"Nagola (0064)":[{"circle":26,"name":"Murali Yadav","mobile":"9602889079"}],"Keriya Khurd (0059)":[{"circle":27,"name":"Chandraprakash Damami","mobile":"9929455837"}],"Balapura (0063)":[{"circle":27,"name":"Chandraprakash Damami","mobile":"9929455837"}],"Sapnikhera (0060)":[{"circle":27,"name":"Chandraprakash Damami","mobile":"9929455837"}],"Chapaneri (0065)":[{"circle":28,"name":"Balram Chaudhary","mobile":"8432168368"},{"circle":29,"name":"Mahaveer Bairwa","mobile":"9571827858"}],"Moondiya Khera (0076)":[{"circle":29,"name":"Mahaveer Bairwa","mobile":"9571827858"}],"Barla Khera (0068)":[{"circle":29,"name":"Mahaveer Bairwa","mobile":"9571827858"}],"Bagrai (0094)":[{"circle":29,"name":"Mahaveer Bairwa","mobile":"9571827858"},{"circle":32,"name":"Ratan Lal Jangir","mobile":"9928884278"}],"Deoliya Kalan (0075)":[{"circle":30,"name":"Govind Narayan Tripathi","mobile":"9982352925"},{"circle":31,"name":"Kamal Kumar Bairwa","mobile":"8770000000"}],"Mataji Ka Khera (0072)":[{"circle":31,"name":"Kamal Kumar Bairwa","mobile":"8770000000"}],"Kheri (0095)":[{"circle":32,"name":"Ratan Lal Jangir","mobile":"9928884278"}],"Indrapura (0093)":[{"circle":32,"name":"Ratan Lal Jangir","mobile":"9928884278"}],"Gurha Khurd (0096)":[{"circle":32,"name":"Ratan Lal Jangir","mobile":"9928884278"},{"circle":33,"name":"Rajaneesh Kumar Jangid","mobile":"9875119865"}],"Pandonlai (0092)":[{"circle":33,"name":"Rajaneesh Kumar Jangid","mobile":"9875119865"}],"Gurha Kalan (0097)":[{"circle":33,"name":"Rajaneesh Kumar Jangid","mobile":"9875119865"}],"Kachariya (0087)":[{"circle":34,"name":"Manoj Kumar Jain","mobile":"9166605908"}],"Nandsi (0077)":[{"circle":34,"name":"Manoj Kumar Jain","mobile":"9166605908"}],"Laxmipura (0085)":[{"circle":34,"name":"Manoj Kumar Jain","mobile":"9166605908"}],"Gordhanpura (0079)":[{"circle":35,"name":"Bhagchand Jain","mobile":"9166446266"}],"Beeliya (0080)":[{"circle":35,"name":"Bhagchand Jain","mobile":"9166446266"}],"Padaliya (0078)":[{"circle":35,"name":"Bhagchand Jain","mobile":"9166446266"}],"Chawandiya (0086)":[{"circle":35,"name":"Bhagchand Jain","mobile":"9166446266"}],"Bargaon urf Surkhand (0061)":[{"circle":36,"name":"RAMSINGH DHAKAR","mobile":"8696546122"}],"Raghunathpura (0062)":[{"circle":36,"name":"RAMSINGH DHAKAR","mobile":"8696546122"}],"Nimeda (0084)":[{"circle":37,"name":"Kanwari Lal Soni","mobile":"9252565387"}],"Kanai Kalan (0081)":[{"circle":37,"name":"Kanwari Lal Soni","mobile":"9252565387"}],"Dhandhon Ka Khera (0083)":[{"circle":37,"name":"Kanwari Lal Soni","mobile":"9252565387"}],"Kanai Khurd (0082)":[{"circle":37,"name":"Kanwari Lal Soni","mobile":"9252565387"}],"Kurthal (0091)":[{"circle":38,"name":"Shankar Lal Saini","mobile":"8233686098"}],"Jetpura (0088)":[{"circle":38,"name":"Shankar Lal Saini","mobile":"8233686098"}],"Kadolai (0089)":[{"circle":39,"name":"Gajendra Saini","mobile":"9772122272"}],"Kerot (0090)":[{"circle":39,"name":"Gajendra Saini","mobile":"9772122272"}]};

// 1. Load Data
const TASK_STRUCTURE = [
    {
        category: "प्रशासनिक और मैपिंग (Administrative Mapping)",
        tasks: [
            { id: "1", name: "चार्ज प्रोफाइल और ऑफिस विवरण अपडेट करना", status: "purn", type: "simple", deadline: "2026-04-10" },
            { id: "info1", name: "हाउस लिस्टिंग ब्लॉक (HLB) विवरण", type: "info", content: "कुल: 242 | ग्रामीण: 242 | शहरी: 0", deadline: "2026-04-12" },
            { id: "2", name: "242 हाउस-लिस्टिंग ब्लॉक (HLB) का निर्माण", status: "purn", type: "simple", deadline: "2026-04-12" },
            { id: "3", name: "39 सुपरवाइजर सर्किलों का निर्माण", status: "purn", type: "simple", deadline: "2026-04-14" },
            { id: "cell1", name: "जनगणना सेल (Census Cell) विवरण", type: "cell-info", staffCount: 0, computers: 0, printers: 0, staffList: [], deadline: "2026-04-14" },
            { id: "6", name: "सभी 242 ब्लॉकों को पोर्टल पर 'Final Freeze' करना", status: "lambit", type: "simple", deadline: "2026-04-15" },
            { id: "4", name: "सभी 242 ब्लॉकों की जियो-टैगिंग (Geo-Tagging)", type: "counter", total: 242, completed: 150, deadline: "2026-04-20" },
            { id: "5", name: "सभी 242 ब्लॉकों का सीमांकन (Demarcation)", type: "counter", total: 242, completed: 120, deadline: "2026-04-22" },
            { id: "5b", name: "पोर्टल पर HLB विवरण (Description) भरना", status: "apurn", type: "simple", deadline: "2026-04-24" },
            { id: "m1", name: "हाउस लिस्टिंग मैप (97 Maps) की जांच", type: "map-stats", total: 97, checked: 0, correct: 0, incorrect: 0, deadline: "2026-04-27", status: "apurn" }
        ]
    },
    {
        category: "उपयोगकर्ता प्रबंधन (User Management)",
        tasks: [
            { id: "charge1", name: "चार्ज कार्मिक (Charge User) विवरण", type: "info", content: "चार्ज ऑफिसर और सहायक कर्मचारी", deadline: "2026-04-18" },
            { id: "sup1", name: "पर्यवेक्षक (Supervisors) प्रबंधन", type: "user-group", totalCount: 39, reserveCount: 4, uploadedCount: 0, reserveUploadedCount: 0, niyukti: "purn", circleAlloc: "purn", pragnakAlloc: "lambit", hlbAlloc: "lambit", idCard: "lambit", mapDistrib: "lambit", reserveId: "lambit", deadline: "2026-04-25" },
            { id: "enum1", name: "प्रगणक (Enumerators) प्रबंधन", type: "user-group", totalCount: 237, reserveCount: 24, uploadedCount: 0, reserveUploadedCount: 0, niyukti: "purn", alloc: "lambit", hlbAlloc: "lambit", idCard: "lambit", mapDistrib: "lambit", reserveId: "lambit", deadline: "2026-04-26" }
        ]
    },
    {
        category: "प्रशिक्षण प्रबंधन (Training Management)",
        tasks: [
            { id: "t-centers", name: "प्रशिक्षण केंद्र प्रबंधन (Center Management)", type: "training-centers", c1: "रा.उ.मा.वि. देवलिया कला सभागार", c2: "रा.उ.मा.वि. नगोला सभागार", c3: "भिनाय पंचायत सभागार", c4: "रा.उ.मा.वि. बांदनवाड़ा सभागार", deadline: "2026-04-20" },
            { id: "t-logis", name: "प्रशिक्षण रसद (Training Logistics)", type: "training-logistics", centerSelection: "lambit", permissionLetter: "lambit", deadline: "2026-04-25" },
            { id: "13", name: "FIELD Trainners (4) का पंजीकरण और प्रशिक्षण", status: "purn", type: "simple", deadline: "2026-04-15" },
            { id: "t-batch", name: "प्रशिक्षण बैच पोर्टल कार्य और उपस्थिति", type: "training-summary", totalBatches: 7, completedBatches: 0, totalAttended: 0, batchList: [{"id":1,"date":"1-3 May","venue":"रा.उ.मा.वि. देवलिया कला सभागार","time":"8:00 AM - 5:00 PM","nirm":"lambit","alloc":"lambit","down":"lambit","verify":"lambit","up":"lambit"},{"id":2,"date":"1-3 May","venue":"रा.उ.मा.वि. नगोला सभागार","time":"8:00 AM - 5:00 PM","nirm":"lambit","alloc":"lambit","down":"lambit","verify":"lambit","up":"lambit"},{"id":3,"date":"4-5 May","venue":"भिनाय पंचायत सभागार","time":"8:00 AM - 5:00 PM","nirm":"lambit","alloc":"lambit","down":"lambit","verify":"lambit","up":"lambit"},{"id":4,"date":"4-5 May","venue":"रा.उ.मा.वि. बांदनवाड़ा सभागार","time":"8:00 AM - 5:00 PM","nirm":"lambit","alloc":"lambit","down":"lambit","verify":"lambit","up":"lambit"},{"id":5,"date":"6-7 May","venue":"रा.उ.मा.वि. देवलिया कला सभागार","time":"8:00 AM - 5:00 PM","nirm":"lambit","alloc":"lambit","down":"lambit","verify":"lambit","up":"lambit"},{"id":6,"date":"6-7 May","venue":"रा.उ.मा.वि. नगोला सभागार","time":"8:00 AM - 5:00 PM","nirm":"lambit","alloc":"lambit","down":"lambit","verify":"lambit","up":"lambit"},{"id":7,"date":"8-10 May","venue":"भिनाय पंचायत सभागार","time":"8:00 AM - 5:00 PM","nirm":"lambit","alloc":"lambit","down":"lambit","verify":"lambit","up":"lambit"}], deadline: "2026-05-15" },
            { id: "16", name: "हस्ताक्षरित अटेंडेंस शीट पोर्टल पर अपलोड करना", status: "lambit", type: "simple", deadline: "2026-05-20" }
        ]
    },
    {
        category: "रसद और वित्त (Logistics & Finance)",
        tasks: [
            { id: "l-fac", name: "केंद्र व्यवस्थाएं (Facilities Readiness)", type: "logistics-checklist", internet: "lambit", sound: "purn", food: "apurn", water: "purn", deadline: "2026-04-27" }
        ]
    },
    {
        category: "FIELD SURVEY तैयारी (Field Survey Readiness)",
        tasks: [
            { id: "21", name: "HLO मोबाइल ऐप का सिंक और लॉगिन टेस्ट", status: "lambit", type: "simple", deadline: "2026-06-15" },
            { id: "22", name: "ब्लॉक क्यूआर कोड (QR Code) वितरण", status: "lambit", type: "simple", deadline: "2026-06-20" },
            { id: "23", name: "चार्ज रेडीनेस सर्टिफिकेट (CRC) अपलोड", status: "lambit", type: "simple", deadline: "2026-06-25" }
        ]
    },
    {
        category: "जनगणना कार्य प्रगति (During Census Progress)",
        tasks: [
            {
                id: "during_census_progress",
                name: "फ़ील्ड वर्क प्रोग्रेस ट्रैकर",
                type: "during-census-data",
                hlbProgress: [],
                lastUpdated: ""
            }
        ]
    }
];

async function loadPersonnelDirectory() {
    try {
        const response = await fetch('personnel_directory.json');
        if (!response.ok) throw new Error('Network response was not OK');
        personnelData = await response.json();
        console.log("Successfully loaded personnel directory from JSON file:", personnelData);
    } catch (e) {
        console.warn("Could not fetch personnel_directory.json, falling back to embedded list:", e);
        personnelData = JSON.parse(JSON.stringify(DEFAULT_PERSONNEL_DIRECTORY));
    }
}

// 1. Load Data
async function loadData() {
    let apiUrl = localStorage.getItem('census_api_url') || DEFAULT_API_URL;
    const apiInput = document.getElementById('api-url');
    if (apiInput) apiInput.value = apiUrl;

    // Use hardcoded structure as base
    taskData = JSON.parse(JSON.stringify(TASK_STRUCTURE));

    // Load Personnel Directory
    await loadPersonnelDirectory();

    try {
        let savedValues = null;

        // 1) Try cloud (Google Sheets)
        if (apiUrl) {
            try {
                const response = await fetch(apiUrl);
                const data = await response.json();
                if (data && data.values) {
                    savedValues = data.values;
                }
            } catch(e) {
                console.warn("Cloud sync failed, trying localStorage.");
            }
        }

        // 2) Check localStorage if cloud failed
        if (!savedValues) {
            const localData = localStorage.getItem('census_tasks_values');
            if (localData) {
                savedValues = JSON.parse(localData);
            }
        }

        // Merge: overlay saved values onto the structure
        if (savedValues) {
            taskData.forEach(cat => {
                cat.tasks.forEach(task => {
                    if (savedValues[task.id]) {
                        Object.assign(task, savedValues[task.id]);
                    }
                });
            });
        }

        calculateOverallProgress();
        renderPage();
        switchTab(activeCensusTab);
    } catch (error) {
        console.error("Error loading data:", error);
        calculateOverallProgress();
        renderPage();
        switchTab(activeCensusTab);
    }
}

// XML Parsing logic removed as we now use direct JS structure

// 2. Render Page
function renderPage() {
    const container = isAdminPage ? document.getElementById('admin-container') : document.getElementById('public-container');
    if (!container) return;
    
    container.innerHTML = '';

    taskData.forEach((cat, catIdx) => {
        const section = document.createElement('div');
        section.className = 'category-section';
        
        let headerHtml = `
            <div class="category-header">
                <h2 class="category-title" style="margin-bottom:0;">${cat.category}</h2>
                <div style="display:flex; align-items:center; gap:10px;">
                    <div class="category-progress-container">
                        <div class="category-progress-bar" style="width: ${cat.progress || 0}%"></div>
                    </div>
                    <span style="font-size:12px; font-weight:700; color:var(--success);">${cat.progress || 0}%</span>
                </div>
            </div>
        `;
        let taskHtml = headerHtml + `<div class="task-grid">`;
        
        cat.tasks.forEach((task, taskIdx) => {
            let taskWeight = 1;
            let taskPurnCount = 0;

            if (task.type === 'counter') {
                taskWeight = 1; // Treat one tracker as one unit of weight for overall progress
                taskPurnCount = task.completed / task.total;

                const percent = Math.round((task.completed / task.total) * 100);
                
                if (isAdminPage) {
                    taskHtml += `
                        <div class="task-card">
                            <span class="task-name">${task.name}</span>
                            ${getDeadlineTag(task.deadline, isTaskComplete(task) ? 'purn' : task.status, task.id)}
                            <div class="counter-info">
                                <span>प्रगति: ${task.completed} / ${task.total}</span>
                                <span>${percent}%</span>
                            </div>
                            <div class="mini-progress-track">
                                <div class="mini-bar" style="width: ${percent}%"></div>
                            </div>
                            <div class="counter-input-group">
                                <label style="font-size:12px;">पूर्ण ब्लॉक्स:</label>
                                <input type="number" class="counter-input" value="${task.completed}" min="0" max="${task.total}" onchange="updateCounterStatus('${task.id}', this.value)">
                            </div>
                        </div>
                    `;
                } else {
                    taskHtml += `
                        <div class="task-card">
                            <span class="task-name">${task.name}</span>
                            ${getDeadlineTag(task.deadline, isTaskComplete(task) ? 'purn' : task.status, task.id)}
                            <div class="counter-info">
                                <span>प्रगति: ${task.completed} / ${task.total}</span>
                                <span>${percent}%</span>
                            </div>
                            <div class="mini-progress-track">
                                <div class="mini-bar" style="width: ${percent}%"></div>
                            </div>
                        </div>
                    `;
                }
            } else if (task.type === 'info') {
                const parts = task.content.split('|');
                let pillsHtml = '<div class="info-btn-group">';
                parts.forEach(p => {
                    pillsHtml += `<span class="info-pill">${p.trim()}</span>`;
                });
                pillsHtml += '</div>';

                taskHtml += `
                    <div class="task-card" style="background: #e3f2fd; border: 1.5px solid var(--secondary);">
                        <span class="task-name" style="color: var(--primary); margin-bottom:5px;"><i class="fas fa-info-circle"></i> ${task.name}</span>
                        ${getDeadlineTag(task.deadline, 'purn', task.id)}
                        ${pillsHtml}
                    </div>
                `;
            } else if (task.type === 'user-group') {
                const subTasks = [
                    { label: 'नियुक्ति', key: 'niyukti' },
                    { label: 'HLB आवंटन', key: 'hlbAlloc' },
                    { label: 'ID वितरण', key: 'idCard' },
                    { label: 'मैप वितरण', key: 'mapDistrib' },
                    { label: 'Reserve ID', key: 'reserveId' }
                ];

                if (task.id === 'sup1') {
                    subTasks.splice(1, 0, { label: 'सर्किल आवंटन', key: 'circleAlloc' });
                    subTasks.splice(2, 0, { label: 'प्रगणक आवंटन', key: 'pragnakAlloc' });
                } else {
                    subTasks.splice(1, 0, { label: 'आवंटन', key: 'alloc' });
                }


                const portalPercent = Math.round((task.uploadedCount / task.totalCount) * 100) || 0;
                const reservePortalPercent = Math.round((task.reserveUploadedCount / task.reserveCount) * 100) || 0;
                let portalDeadlineHtml = task.portalDeadline ? `<div class="deadline-tag" style="margin-top:5px; background:#fff7ed; border-color:#fb923c; color:#ea580c;"><i class="fas fa-upload"></i> पोर्टल अपलोड तिथि: ${task.portalDeadline}</div>` : '';

                if (isAdminPage) {
                    let adminInputs = subTasks.map(st => `
                        <div class="admin-sub-status">
                            <label>${st.label}</label>
                            <select onchange="updateUserGroupStatus('${task.id}', '${st.key}', this.value)">
                                <option value="lambit" ${task[st.key] === 'lambit' ? 'selected' : ''}>लंबित (Pending)</option>
                                <option value="apurn" ${task[st.key] === 'apurn' ? 'selected' : ''}>अपूर्ण (Partial)</option>
                                <option value="purn" ${task[st.key] === 'purn' ? 'selected' : ''}>पूर्ण (Done)</option>
                            </select>
                        </div>
                    `).join('');

                    taskHtml += `
                        <div class="task-card" style="grid-column: 1 / -1;">
                             <span class="task-name">${task.name}</span>
                             ${getDeadlineTag(task.deadline, isTaskComplete(task) ? 'purn' : 'lambit', task.id)}
                             <div style="margin-bottom:15px; display:grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap:10px;">
                                <div class="counter-input-group">
                                    <label style="font-size:11px;">कुल संख्या:</label>
                                    <input type="number" class="counter-input" value="${task.totalCount}" onchange="updateUserGroupField('${task.id}', 'totalCount', this.value)">
                                </div>
                                <div class="counter-input-group">
                                    <label style="font-size:11px;">Reserve:</label>
                                    <input type="number" class="counter-input" value="${task.reserveCount}" onchange="updateUserGroupField('${task.id}', 'reserveCount', this.value)">
                                </div>
                                <div class="counter-input-group">
                                    <label style="font-size:11px;">पोर्टल अपलोड (Main):</label>
                                    <input type="number" class="counter-input" value="${task.uploadedCount}" onchange="updateUserGroupField('${task.id}', 'uploadedCount', this.value)">
                                </div>
                                <div class="counter-input-group">
                                    <label style="font-size:11px;">पोर्टल अपलोड (Reserve):</label>
                                    <input type="number" class="counter-input" value="${task.reserveUploadedCount}" onchange="updateUserGroupField('${task.id}', 'reserveUploadedCount', this.value)">
                                </div>
                                <div class="counter-input-group">
                                    <label style="font-size:11px;">अपलोड तिथि:</label>
                                    <input type="date" class="counter-input" value="${task.portalDeadline}" onchange="updateUserGroupField('${task.id}', 'portalDeadline', this.value)">
                                </div>
                            </div>
                            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px;">
                                ${adminInputs}
                            </div>
                        </div>
                    `;
                } else {
                    let statusGridHtml = subTasks.map(st => `
                        <div class="sub-status-item">
                            <span class="sub-status-label">${st.label}</span>
                            <span class="status-tag status-${task[st.key]}" style="padding: 2px 6px; font-size: 10px;">${getStatusLabel(task[st.key])}</span>
                        </div>
                    `).join('');

                    taskHtml += `
                        <div class="task-card" style="grid-column: 1 / -1;">
                            <span class="task-name">${task.name}</span>
                            ${getDeadlineTag(task.deadline, isTaskComplete(task) ? 'purn' : 'lambit', task.id)}
                            <div style="margin-bottom:10px; font-size:12px; font-weight:700; color:var(--secondary); display:flex; flex-wrap:wrap; gap:15px;">
                                <span><i class="fas fa-users"></i> कुल: ${task.totalCount}</span>
                                <span><i class="fas fa-users-cog"></i> Reserve: ${task.reserveCount}</span>
                                <span style="color:#ea580c;"><i class="fas fa-cloud-upload-alt"></i> पोर्टल अपलोड: ${task.uploadedCount}/${task.totalCount} (${portalPercent}%)</span>
                                <span style="color:#9c27b0;"><i class="fas fa-cloud-upload-alt"></i> Reserve अपलोड: ${task.reserveUploadedCount}/${task.reserveCount} (${reservePortalPercent}%)</span>
                            </div>
                            <div class="mini-progress-track" style="margin-bottom:10px; height:6px;">
                                <div class="mini-bar" style="width: ${portalPercent}%; background:#fb923c;"></div>
                            </div>
                            <div class="mini-progress-track" style="margin-bottom:15px; height:6px;">
                                <div class="mini-bar" style="width: ${reservePortalPercent}%; background:#9c27b0;"></div>
                            </div>
                            <div class="status-grid">
                                ${statusGridHtml}
                            </div>
                            ${portalDeadlineHtml}
                        </div>
                    `;
                }
            } else if (task.type === 'training-logistics') {
                const items = [
                    { label: 'केंद्र का चयन (Center Selection)', key: 'centerSelection' },
                    { label: 'अनुमति पत्र (Permission Letter)', key: 'permissionLetter' }
                ];
                
                if (isAdminPage) {
                    let adminInputs = items.map(it => `
                        <div class="task-card">
                            <span class="task-name" style="font-size:14px;">${it.label}</span>
                            ${getDeadlineTag(task.deadline, task[it.key], task.id)}
                            <div class="radio-group">
                                <div class="radio-option"><input type="radio" id="tl-purn-${task.id}-${it.key}" name="tl-${task.id}-${it.key}" value="purn" ${task[it.key] === 'purn' ? 'checked' : ''} onchange="updateGenericField('${task.id}', '${it.key}', this.value)"><label for="tl-purn-${task.id}-${it.key}">पूर्ण</label></div>
                                <div class="radio-option"><input type="radio" id="tl-apurn-${task.id}-${it.key}" name="tl-${task.id}-${it.key}" value="apurn" ${task[it.key] === 'apurn' ? 'checked' : ''} onchange="updateGenericField('${task.id}', '${it.key}', this.value)"><label for="tl-apurn-${task.id}-${it.key}">अपूर्ण</label></div>
                                <div class="radio-option"><input type="radio" id="tl-lambit-${task.id}-${it.key}" name="tl-${task.id}-${it.key}" value="lambit" ${task[it.key] === 'lambit' ? 'checked' : ''} onchange="updateGenericField('${task.id}', '${it.key}', this.value)"><label for="tl-lambit-${task.id}-${it.key}">लंबित</label></div>
                            </div>
                        </div>
                    `).join('');
                    taskHtml += `<div style="display:grid; grid-template-columns:1fr 1fr; gap:15px; grid-column:1/-1;">${adminInputs}</div>`;
                } else {
                    let logisHtml = items.map(it => `
                        <div class="task-card">
                            <span class="task-name">${it.label}</span>
                            ${getDeadlineTag(task.deadline, task[it.key], task.id)}
                            <span class="status-tag status-${task[it.key]}">${getStatusLabel(task[it.key])}</span>
                        </div>
                    `).join('');
                    taskHtml += `<div style="display:grid; grid-template-columns:1fr 1fr; gap:15px; grid-column:1/-1;">${logisHtml}</div>`;
                }
            } else if (task.type === 'training-centers') {
                if (isAdminPage) {
                    taskHtml += `
                        <div class="task-card" style="grid-column: 1 / -1; background: #fffde7; border: 1px dashed var(--accent);">
                            <span class="task-name"><i class="fas fa-building"></i> प्रशिक्षण केंद्र नाम प्रबंधन (Training Center Names)</span>
                            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:15px;">
                                <div class="counter-input-group"><label>केंद्र 1:</label><input type="text" class="batch-input" value="${task.c1}" onchange="updateGenericField('${task.id}', 'c1', this.value)"></div>
                                <div class="counter-input-group"><label>केंद्र 2:</label><input type="text" class="batch-input" value="${task.c2}" onchange="updateGenericField('${task.id}', 'c2', this.value)"></div>
                                <div class="counter-input-group"><label>केंद्र 3:</label><input type="text" class="batch-input" value="${task.c3}" onchange="updateGenericField('${task.id}', 'c3', this.value)"></div>
                                <div class="counter-input-group"><label>केंद्र 4:</label><input type="text" class="batch-input" value="${task.c4}" onchange="updateGenericField('${task.id}', 'c4', this.value)"></div>
                            </div>
                        </div>
                    `;
                }
            } else if (task.type === 'training-summary') {
                const batchPercent = Math.round((task.completedBatches / task.totalBatches) * 100);
                
                // Fetch dynamic total from User Management Section
                let totalExpected = 0;
                taskData.forEach(c => c.tasks.forEach(t => {
                    if (t.id === 'sup1' || t.id === 'enum1') totalExpected += (t.totalCount + t.reserveCount);
                }));
                if (totalExpected === 0) totalExpected = 276; // Fallback
                
                const attendPercent = Math.round((task.totalAttended / totalExpected) * 100);
                
                // Recalculate completedBatches from batchList
                const completedCount = task.batchList.filter(b => 
                    b.nirm === 'purn' && b.alloc === 'purn' && b.down === 'purn' && 
                    b.verify === 'purn' && b.up === 'purn'
                ).length;
                task.completedBatches = completedCount;
                

                const steps = [
                    { key: 'nirm', label: 'बैच निर्माण' },
                    { key: 'alloc', label: 'ट्रेनर अलॉटमेंट' },
                    { key: 'down', label: 'शीट डाउनलोड' },
                    { key: 'verify', label: 'डेटा वेरिफिकेशन' },
                    { key: 'up', label: 'शीट अपलोड' }
                ];

                let batchRows = task.batchList.map((b, bIdx) => {
                    const isFullyDone = b.nirm === 'purn' && b.alloc === 'purn' && b.down === 'purn' && b.verify === 'purn' && b.up === 'purn';
                    
                    if (isAdminPage) {
                        const stepControls = steps.map(s => `
                            <div style="margin-bottom:5px;">
                                <label style="font-size:9px; font-weight:700;">${s.label}:</label>
                                <select class="batch-status-select" style="font-size:10px;" onchange="updateBatchStepStatus('${task.id}', ${bIdx}, '${s.key}', this.value)">
                                    <option value="lambit" ${b[s.key] === 'lambit' ? 'selected' : ''}>Pending</option>
                                    <option value="purn" ${b[s.key] === 'purn' ? 'selected' : ''}>Done</option>
                                </select>
                            </div>
                        `).join('');

                        return `
                            <tr>
                                <td style="vertical-align:top;">
                                    <b>Batch ${b.id}</b>
                                    <button class="quick-btn" style="margin-top:10px; display:block;" onclick="quickFinishBatch('${task.id}', ${bIdx})">सब पूर्ण</button>
                                </td>
                                <td style="vertical-align:top;"><input type="text" class="batch-input" value="${b.date}" onchange="updateBatchField('${task.id}', ${bIdx}, 'date', this.value)"></td>
                                <td style="vertical-align:top;">
                                    <select class="batch-input" onchange="updateBatchField('${task.id}', ${bIdx}, 'venue', this.value)">
                                        <option value="${b.venue}">${b.venue}</option>
                                        ${(() => {
                                            const centers = taskData.find(c => c.category.includes('प्रशिक्षण')).tasks.find(t => t.type === 'training-centers');
                                            if (!centers) return '';
                                            return [centers.c1, centers.c2, centers.c3, centers.c4].map(cn => `<option value="${cn}" ${b.venue === cn ? 'selected' : ''}>${cn}</option>`).join('');
                                        })()}
                                    </select>
                                </td>
                                <td style="vertical-align:top;"><input type="text" class="batch-input" value="${b.time}" onchange="updateBatchField('${task.id}', ${bIdx}, 'time', this.value)"></td>
                                <td style="vertical-align:top; border-left:1px solid #ddd;">${stepControls}</td>
                            </tr>
                        `;
                    } else {
                        const stepDots = steps.map((s, idx) => `
                            <div class="step-dot ${b[s.key] === 'purn' ? 'done' : ''}" style="display:flex; align-items:center; justify-content:center; width:20px; height:20px;">
                                <span style="font-size:11px; font-weight:bold; color:${b[s.key] === 'purn' ? 'white' : '#666'};">${idx + 1}</span>
                                <div class="step-tool">${idx + 1}. ${s.label}</div>
                            </div>
                        `).join('');

                        return `
                            <tr>
                                <td style="font-weight:700;">Batch ${b.id}</td>
                                <td>${b.date}</td>
                                <td>${b.venue}</td>
                                <td>${b.time}</td>
                                <td>
                                    <div class="batch-progress-wrapper">${stepDots}</div>
                                    <div style="font-size:9px; margin-top:2px; color:${isFullyDone ? 'var(--success)' : '#666'};">
                                        ${isFullyDone ? '<b>पूर्ण (Completed)</b>' : 'प्रक्रिया जारी (In Progress)'}
                                    </div>
                                </td>
                            </tr>
                        `;
                    }
                }).join('');

                if (isAdminPage) {
                    taskHtml += `
                        <div class="task-card" style="grid-column: 1 / -1; border-left: 5px solid var(--secondary);">
                            <span class="task-name">${task.name}</span>
                            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; margin-top:10px;">
                                <div class="counter-info"><span>बैच पूर्ण: ${task.completedBatches} / ${task.totalBatches}</span></div>
                                <div class="counter-input-group">
                                    <label>कुल उपस्थिति (Expected: ${totalExpected}):</label>
                                    <input type="number" class="counter-input" value="${task.totalAttended}" onchange="updateGenericField('${task.id}', 'totalAttended', this.value)">
                                </div>
                            </div>
                            <div class="batch-schedule-container">
                                <table class="batch-schedule-table">
                                    <thead><tr><th>Batch</th><th>Date</th><th>Venue (जगह)</th><th>Time (समय)</th><th>Status</th></tr></thead>
                                    <tbody>${batchRows}</tbody>
                                </table>
                            </div>
                            <!-- Legend for dots -->
                            <div class="batch-legend" style="margin-top:12px; padding-top:10px; border-top:1px dashed #ddd; display:flex; flex-wrap:wrap; gap:12px; justify-content:center;">
                                ${steps.map((s, idx) => `<span style="font-size:12px; color:#444;"><b>${idx + 1}:</b> ${s.label}</span>`).join('')}
                            </div>
                        </div>
                    `;
                } else {
                    taskHtml += `
                        <div class="task-card" style="grid-column: 1 / -1; border-left: 5px solid var(--secondary);">
                            <span class="task-name">${task.name}</span>
                            <div class="counter-info" style="margin-top:10px;">
                                <span><i class="fas fa-chalkboard-teacher"></i> पूर्ण बैच: ${task.completedBatches} / ${task.totalBatches}</span>
                                <span>${batchPercent}%</span>
                            </div>
                            <div class="mini-progress-track"><div class="mini-bar" style="width: ${batchPercent}%"></div></div>
                            
                            <div class="counter-info" style="margin-top:15px;">
                                <span><i class="fas fa-user-check"></i> कुल उपस्थिति: ${task.totalAttended} / ${totalExpected}</span>
                                <span>${attendPercent}%</span>
                            </div>
                            <div class="mini-progress-track"><div class="mini-bar" style="width: ${attendPercent}%; background: #9c27b0;"></div></div>
                            
                            <div class="batch-schedule-container">
                                <table class="batch-schedule-table">
                                    <thead><tr><th>Batch</th><th>Date</th><th>Venue (जगह)</th><th>Time (समय)</th><th>Status</th></tr></thead>
                                    <tbody>${batchRows}</tbody>
                                </table>
                            </div>
                            <!-- Legend for dots -->
                            <div class="batch-legend" style="margin-top:12px; padding-top:10px; border-top:1px dashed #ddd; display:flex; flex-wrap:wrap; gap:12px; justify-content:center;">
                                ${steps.map((s, idx) => `<span style="font-size:12px; color:#444;"><b>${idx + 1}:</b> ${s.label}</span>`).join('')}
                            </div>
                        </div>
                    `;
                }
            } else if (task.type === 'logistics-checklist') {
                    const items = [
                        { label: 'WiFi (इंटरनेट)', key: 'internet', icon: 'fa-wifi' },
                        { label: 'Mic (साउंड)', key: 'sound', icon: 'fa-microphone' },
                        { label: 'Food (भोजन)', key: 'food', icon: 'fa-utensils' },
                        { label: 'Water (पानी)', key: 'water', icon: 'fa-tint' }
                    ];
                    
                    if (isAdminPage) {
                        let selects = items.map(it => `
                            <div class="admin-sub-status" style="cursor:pointer;" onclick="toggleUserGroupStep('${task.id}', '${it.key}')">
                                <label>${it.label}</label>
                                <span class="status-tag status-${task[it.key]}">${task[it.key] === 'purn' ? 'पूर्ण' : 'लंबित'}</span>
                            </div>
                        `).join('');
                        taskHtml += `
                            <div class="task-card" style="grid-column: 1 / -1;">
                                <span class="task-name">${task.name} (एडमिन व्यू: क्लिक करें)</span>
                                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px;">
                                    ${selects}
                                </div>
                            </div>
                        `;
                    } else {
                        let checklistHtml = items.map(it => `
                            <div class="logistics-item">
                                <i class="fas ${it.icon}"></i>
                                <span>${it.label}</span>
                                <div class="status-dot dot-${task[it.key]}"></div>
                            </div>
                        `).join('');
                        taskHtml += `<div class="task-card" style="grid-column: 1 / -1;"><span class="task-name">${task.name}</span><div class="logistics-grid">${checklistHtml}</div></div>`;
                    }
            } else if (task.type === 'cell-info') {
                // We don't weight cell info in overall progress if it's just info
                
                let staffRowsHtml = '';
                task.staffList.forEach((s, sIdx) => {
                    if (isAdminPage) {
                        staffRowsHtml += `
                            <tr>
                                <td><input type="text" class="staff-input" value="${s.name}" onchange="updateStaffDetail('${task.id}', ${sIdx}, 'name', this.value)"></td>
                                <td><input type="text" class="staff-input" value="${s.pad}" onchange="updateStaffDetail('${task.id}', ${sIdx}, 'pad', this.value)"></td>
                                <td><input type="text" class="staff-input" value="${s.role}" onchange="updateStaffDetail('${task.id}', ${sIdx}, 'role', this.value)"></td>
                                <td><input type="text" class="staff-input" value="${s.mobile || ''}" onchange="updateStaffDetail('${task.id}', ${sIdx}, 'mobile', this.value)"></td>
                                <td><button class="row-action-btn btn-remove" onclick="removeStaffRow('${task.id}', ${sIdx})"><i class="fas fa-trash"></i></button></td>
                            </tr>
                        `;
                    } else {
                        staffRowsHtml += `
                            <tr>
                                <td>${s.name}</td>
                                <td>${s.pad}</td>
                                <td>${s.role}</td>
                                <td>${s.mobile || ''}</td>
                            </tr>
                        `;
                    }
                });

                if (isAdminPage) {
                    taskHtml += `
                        <div class="task-card" style="grid-column: 1 / -1;">
                            <span class="task-name">${task.name}</span>
                            <div class="cell-stats">
                                <div class="stat-item">
                                    <i class="fas fa-users"></i>
                                    <input type="number" class="counter-input" value="${task.staffCount}" onchange="updateCellField('${task.id}', 'staffCount', this.value)">
                                    <p>कुल कार्मिक</p>
                                </div>
                                <div class="stat-item">
                                    <i class="fas fa-desktop"></i>
                                    <input type="number" class="counter-input" value="${task.computers}" onchange="updateCellField('${task.id}', 'computers', this.value)">
                                    <p>कंप्यूटर</p>
                                </div>
                                <div class="stat-item">
                                    <i class="fas fa-print"></i>
                                    <input type="number" class="counter-input" value="${task.printers}" onchange="updateCellField('${task.id}', 'printers', this.value)">
                                    <p>प्रिंटर</p>
                                </div>
                            </div>
                            <div class="staff-table-container">
                                <table class="staff-table">
                                    <thead>
                                        <tr>
                                            <th>नाम</th>
                                            <th>पद</th>
                                            <th>कार्य/भूमिका</th>
                                            <th>मोबाइल नंबर</th>
                                            ${isAdminPage ? '<th>Action</th>' : ''}
                                        </tr>
                                    </thead>
                                    <tbody id="staff-body-${task.id}">
                                        ${staffRowsHtml}
                                    </tbody>
                                </table>
                                <button class="row-action-btn btn-add" style="margin-top:10px;" onclick="addStaffRow('${task.id}')"><i class="fas fa-plus"></i> नया कार्मिक जोड़ें</button>
                            </div>
                        </div>
                    `;
                } else {
                    taskHtml += `
                        <div class="task-card" style="grid-column: 1 / -1;">
                             <span class="task-name">${task.name}</span>
                            <div class="cell-stats">
                                <div class="stat-item">
                                    <i class="fas fa-users"></i>
                                    <span>${task.staffCount}</span>
                                    <p>कुल कार्मिक</p>
                                </div>
                                <div class="stat-item">
                                    <i class="fas fa-desktop"></i>
                                    <span>${task.computers}</span>
                                    <p>कंप्यूटर</p>
                                </div>
                                <div class="stat-item">
                                    <i class="fas fa-print"></i>
                                    <span>${task.printers}</span>
                                    <p>प्रिंटर</p>
                                </div>
                            </div>
                            <div class="staff-table-container">
                                <table class="staff-table">
                                    <thead>
                                        <tr>
                                            <th>नाम</th>
                                            <th>पद</th>
                                            <th>कार्य/भूमिका</th>
                                            <th>मोबाइल नंबर</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${staffRowsHtml || '<tr><td colspan="4" style="text-align:center;">डेटा उपलब्ध नहीं</td></tr>'}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    `;
                }
            } else if (task.type === 'map-stats') {
                const checkedPercent = Math.round((task.checked / task.total) * 100);

                let deadlineHtml = getDeadlineTag(task.deadline, isTaskComplete(task) ? 'purn' : task.status, task.id);

                if (isAdminPage) {
                    taskHtml += `
                        <div class="task-card">
                            <span class="task-name">${task.name}</span>
                            <div class="counter-info">
                                <span>जांच की गई: ${task.checked} / ${task.total}</span>
                                <span>${checkedPercent}%</span>
                            </div>
                            <div class="mini-progress-track">
                                <div class="mini-bar" style="width: ${checkedPercent}%"></div>
                            </div>
                            <div class="stat-badges">
                                <span class="stat-pill shi">सही: ${task.correct}</span>
                                <span class="stat-pill galat">गलत: ${task.incorrect}</span>
                            </div>
                            <div style="margin-top:15px; display:grid; grid-template-columns: 1fr 1fr; gap:5px;">
                                <div class="counter-input-group"><label style="font-size:10px;">जांच:</label><input type="number" class="counter-input" value="${task.checked}" onchange="updateMapField('${task.id}', 'checked', this.value)"></div>
                                <div class="counter-input-group"><label style="font-size:10px;">सही:</label><input type="number" class="counter-input" value="${task.correct}" onchange="updateMapField('${task.id}', 'correct', this.value)"></div>
                                <div class="counter-input-group"><label style="font-size:10px;">गलत:</label><input type="number" class="counter-input" value="${task.incorrect}" onchange="updateMapField('${task.id}', 'incorrect', this.value)"></div>
                                <div class="counter-input-group"><label style="font-size:10px;">तारीख:</label><input type="date" class="counter-input" style="width:110px;" value="${task.deadline}" onchange="updateMapField('${task.id}', 'deadline', this.value)"></div>
                            </div>
                            <div class="radio-group" style="margin-top:10px;">
                                <div class="radio-option">
                                    <input type="radio" id="purn-${task.id}" name="status-${task.id}" value="purn" ${task.status === 'purn' ? 'checked' : ''} onchange="updateTaskStatus('${task.id}', 'purn')">
                                    <label for="purn-${task.id}">पूर्ण</label>
                                </div>
                                <div class="radio-option">
                                    <input type="radio" id="apurn-${task.id}" name="status-${task.id}" value="apurn" ${task.status === 'apurn' ? 'checked' : ''} onchange="updateTaskStatus('${task.id}', 'apurn')">
                                    <label for="apurn-${task.id}">अपूर्ण</label>
                                </div>
                            </div>
                        </div>
                    `;
                } else {
                    taskHtml += `
                        <div class="task-card">
                            <span class="task-name">${task.name}</span>
                            <div class="counter-info">
                                <span>जांच की गई: ${task.checked} / ${task.total}</span>
                                <span>${checkedPercent}%</span>
                            </div>
                            <div class="mini-progress-track">
                                <div class="mini-bar" style="width: ${checkedPercent}%"></div>
                            </div>
                            <div class="stat-badges">
                                <span class="stat-pill shi">सही: ${task.correct}</span>
                                <span class="stat-pill galat">गलत: ${task.incorrect}</span>
                            </div>
                            ${deadlineHtml}
                            <div style="margin-top:10px;">
                                <span class="status-tag status-${task.status}">${getStatusLabel(task.status)}</span>
                            </div>
                        </div>
                    `;
                }
            } else {
                
                if (isAdminPage) {
                    taskHtml += `
                        <div class="task-card">
                            <span class="task-name">${task.name}</span>
                            ${getDeadlineTag(task.deadline, isTaskComplete(task) ? 'purn' : task.status, task.id)}
                            <div class="radio-group">
                                <div class="radio-option">
                                    <input type="radio" id="purn-${task.id}" name="status-${task.id}" value="purn" ${task.status === 'purn' ? 'checked' : ''} onchange="updateTaskStatus('${task.id}', 'purn')">
                                    <label for="purn-${task.id}">पूर्ण</label>
                                </div>
                                <div class="radio-option">
                                    <input type="radio" id="apurn-${task.id}" name="status-${task.id}" value="apurn" ${task.status === 'apurn' ? 'checked' : ''} onchange="updateTaskStatus('${task.id}', 'apurn')">
                                    <label for="apurn-${task.id}">अपूर्ण</label>
                                </div>
                                <div class="radio-option">
                                    <input type="radio" id="lambit-${task.id}" name="status-${task.id}" value="lambit" ${task.status === 'lambit' ? 'checked' : ''} onchange="updateTaskStatus('${task.id}', 'lambit')">
                                    <label for="lambit-${task.id}">लंबित</label>
                                </div>
                            </div>
                        </div>
                    `;
                } else {
                    taskHtml += `
                        <div class="task-card">
                            <span class="task-name">${task.name}</span>
                            <span class="status-tag status-${task.status}">${getStatusLabel(task.status)}</span>
                        </div>
                    `;
                }
            }
        });

        taskHtml += `</div>`;
        section.innerHTML = taskHtml;
        container.appendChild(section);
    });

    renderDuringCensusDashboard();
}

function getStatusLabel(status) {
    if (status === 'purn') return 'पूर्ण (Completed)';
    if (status === 'apurn') return 'अपूर्ण (Incomplete)';
    return 'लंबित (Pending)';
}

// 3. Update Status (Admin Only)
function onDataChange() {
    calculateOverallProgress();
    renderPage();
}

function updateTaskStatus(id, newStatus) {
    taskData.forEach(cat => {
        cat.tasks.forEach(task => {
            if (task.id === id) {
                task.status = newStatus;
            }
        });
    });
    onDataChange();
}

function updateCounterStatus(id, newValue) {
    taskData.forEach(cat => {
        cat.tasks.forEach(task => {
            if (task.id === id) {
                task.completed = parseInt(newValue) || 0;
                if (task.completed > task.total) task.completed = task.total;
            }
        });
    });
    onDataChange();
}

function updateMapField(id, field, value) {
    taskData.forEach(cat => {
        cat.tasks.forEach(task => {
            if (task.id === id) {
                if (field === 'deadline') {
                    task.deadline = value;
                } else {
                    task[field] = parseInt(value) || 0;
                    if (task[field] > task.total) task[field] = task.total;
                }
            }
        });
    });
    onDataChange();
}

// Cell Data Functions
function updateCellField(id, field, value) {
    taskData.forEach(cat => {
        cat.tasks.forEach(task => {
            if (task.id === id) {
                task[field] = parseInt(value) || 0;
            }
        });
    });
    // No progress recalculation needed for info types
}

function addStaffRow(id) {
    taskData.forEach(cat => {
        cat.tasks.forEach(task => {
            if (task.id === id) {
                if (!task.staffList) task.staffList = [];
                task.staffList.push({ name: '', pad: '', role: '', mobile: '' });
            }
        });
    });
    renderPage();
}

function removeStaffRow(id, index) {
    taskData.forEach(cat => {
        cat.tasks.forEach(task => {
            if (task.id === id) {
                task.staffList.splice(index, 1);
            }
        });
    });
    renderPage();
}

function updateStaffDetail(id, index, field, value) {
    taskData.forEach(cat => {
        cat.tasks.forEach(task => {
            if (task.id === id) {
                task.staffList[index][field] = value;
            }
        });
    });
}

// User Group Functions
function updateUserGroupStatus(id, key, value) {
    taskData.forEach(cat => {
        cat.tasks.forEach(task => {
            if (task.id === id) {
                task[key] = value;
            }
        });
    });
    onDataChange();
}

function updateUserGroupField(id, key, value) {
    taskData.forEach(cat => {
        cat.tasks.forEach(task => {
            if (task.id === id) {
                if (key === 'portalDeadline') {
                    task.portalDeadline = value;
                } else {
                    task[key] = parseInt(value) || 0;
                }
            }
        });
    });
    onDataChange();
}

function updateGenericField(id, key, value) {
    taskData.forEach(cat => {
        cat.tasks.forEach(task => {
            if (task.id === id) {
                task[key] = isNaN(parseInt(value)) ? value : parseInt(value);
            }
        });
    });
    onDataChange();
}

function updateBatchField(id, index, field, value) {
    taskData.forEach(cat => {
        cat.tasks.forEach(task => {
            if (task.id === id) {
                task.batchList[index][field] = value;
            }
        });
    });
    onDataChange();
}

function updateBatchStatus(id, index, value) {
    taskData.forEach(cat => {
        cat.tasks.forEach(task => {
            if (task.id === id) {
                task.batchList[index].status = value;
            }
        });
    });
    onDataChange();
}

function updateBatchStepStatus(id, index, stepKey, value) {
    taskData.forEach(cat => {
        cat.tasks.forEach(task => {
            if (task.id === id) {
                task.batchList[index][stepKey] = value;
            }
        });
    });
    onDataChange();
}

function quickFinishBatch(id, index) {
    taskData.forEach(cat => {
        cat.tasks.forEach(task => {
            if (task.id === id) {
                const b = task.batchList[index];
                b.nirm = 'purn';
                b.alloc = 'purn';
                b.down = 'purn';
                b.verify = 'purn';
                b.up = 'purn';
            }
        });
    });
    onDataChange();
}

// 3. Progress Calculation (Category & Overall)
function getTaskProgress(t) {
    let purn = 0;
    let total = 0;

    if (t.type === 'counter') {
        total = 1;
        purn = (t.completed / t.total) || 0;
    } else if (t.type === 'map-stats') {
        total = 1;
        purn = (t.checked / t.total) || 0;
    } else if (t.type === 'user-group') {
        const subKeys = ['niyukti', 'hlbAlloc', 'idCard', 'mapDistrib', 'reserveId'];
        if (t.id === 'sup1') subKeys.push('circleAlloc', 'pragnakAlloc');
        else subKeys.push('alloc');
        
        total = subKeys.length + 2; 
        subKeys.forEach(k => { if (t[k] === 'purn') purn += 1; });
        purn += (t.uploadedCount / t.totalCount) || 0;
        purn += (t.reserveUploadedCount / t.reserveCount) || 0;
    } else if (t.type === 'training-summary') {
        // Recalculate completed batches on the fly
        const completedCount = t.batchList.filter(b => 
            b.nirm === 'purn' && b.alloc === 'purn' && b.down === 'purn' && 
            b.verify === 'purn' && b.up === 'purn'
        ).length;
        t.completedBatches = completedCount;
        
        total = 1;
        purn = (t.completedBatches / t.totalBatches) || 0;
    } else if (t.type === 'training-logistics') {
        const subKeys = ['centerSelection', 'permissionLetter'];
        total = subKeys.length;
        subKeys.forEach(k => { if (t[k] === 'purn') purn += 1; });
    } else if (t.type === 'logistics-checklist') {
        const subKeys = ['internet', 'sound', 'food', 'water'];
        total = subKeys.length;
        subKeys.forEach(k => { if (t[k] === 'purn') purn += 1; });
    } else if (t.type === 'during-census-data') {
        const list = t.hlbProgress && t.hlbProgress.length > 0 ? t.hlbProgress : DEFAULT_CENSUS_PROGRESS;
        let totalExpected = 0;
        let totalCompleted = 0;
        list.forEach(v => {
            totalExpected += v.expectedHouses;
            totalCompleted += v.completedHouses;
        });
        total = 1;
        purn = totalExpected > 0 ? (totalCompleted / totalExpected) : 0;
    } else if (t.type !== 'info' && t.type !== 'cell-info' && t.type !== 'training-centers') {
        total = 1;
        if (t.status === 'purn') purn = 1;
    }
    return { purn, total };
}

function isTaskComplete(t) {
    if (t.type === 'info' || t.type === 'cell-info' || t.type === 'training-centers') return true;
    const prog = getTaskProgress(t);
    return prog.total > 0 && prog.purn >= prog.total;
}

function calculateOverallProgress() {
    const task = taskData.flatMap(c => c.tasks).find(t => t.id === 'during_census_progress');
    const hlbProgress = (task && task.hlbProgress && task.hlbProgress.length > 0) ? task.hlbProgress : DEFAULT_CENSUS_PROGRESS;
    
    let expectedHouses = 0;
    let completedHouses = 0;
    hlbProgress.forEach(v => {
        expectedHouses += (v.expectedHouses || 0);
        completedHouses += (v.completedHouses || 0);
    });
    
    if (typeof CENSUS_OVERALL_STATS !== 'undefined') {
        expectedHouses = CENSUS_OVERALL_STATS.expectedHouses;
        completedHouses = CENSUS_OVERALL_STATS.completedHouses;
    }

    const percent = expectedHouses > 0 ? Math.round((completedHouses / expectedHouses) * 100) : 0;
    const bar = document.getElementById('overall-bar');
    const val = document.getElementById('progress-val');
    if (bar) bar.style.width = percent + '%';
    if (val) val.innerText = percent + '%';
    
    updateDailyScheduler();
}

function getDeadlineTag(deadline, status, taskId) {
    let editHtml = '';
    // Admin page: show editable date input
    if (isAdminPage && taskId) {
        editHtml = `<input type="date" class="counter-input" style="width:130px; font-size:11px; padding:3px 5px; margin-right:8px;" value="${deadline || ''}" onchange="updateDeadline('${taskId}', this.value)">`;
    }

    if (!deadline) return editHtml || '';
    
    let statusHtml = '';
    if (status === 'purn') {
        statusHtml = `<span style="color:var(--success); font-size:11px;"><i class="fas fa-check-circle"></i> समय पर पूर्ण</span>`;
    } else {
        const today = new Date();
        today.setHours(0,0,0,0);
        const dl = new Date(deadline);
        const diff = Math.ceil((dl - today) / (1000 * 60 * 60 * 24));
        
        if (diff < 0) statusHtml = `<span class="deadline-critical"><i class="fas fa-exclamation-triangle"></i> ${Math.abs(diff)} दिन विलंब</span>`;
        else if (diff <= 1) statusHtml = `<span class="deadline-warning"><i class="fas fa-clock"></i> केवल 1 दिन बचा!</span>`;
        else statusHtml = `<span class="deadline-normal"><i class="fas fa-calendar-alt"></i> ${diff} दिन शेष (${deadline})</span>`;
    }

    return `<div style="display:flex; align-items:center; flex-wrap:wrap; gap:5px; margin:4px 0;">${editHtml}${statusHtml}</div>`;
}

function updateDeadline(taskId, newDate) {
    taskData.forEach(cat => {
        cat.tasks.forEach(t => {
            if (t.id === taskId) {
                t.deadline = newDate;
            }
        });
    });
    onDataChange();
}

function isTaskPending(t) {
    // Exclude informational types from priority focus
    if (t.type === 'info' || t.type === 'cell-info' || t.type === 'training-centers') return false;
    
    // Check completion based on task type
    if (t.type === 'counter') return t.completed < t.total;
    if (t.type === 'map-stats') return t.checked < t.total;
    if (t.type === 'training-summary') return t.completedBatches < t.totalBatches;
    
    if (t.type === 'user-group') {
        const subKeys = ['niyukti', 'hlbAlloc', 'idCard', 'mapDistrib', 'reserveId'];
        if (t.id === 'sup1') subKeys.push('circleAlloc', 'pragnakAlloc');
        else subKeys.push('alloc');
        
        const allStepsDone = subKeys.every(k => t[k] === 'purn');
        const allUploadsDone = t.uploadedCount >= t.totalCount && (t.reserveUploadedCount || 0) >= (t.reserveCount || 0);
        return !allStepsDone || !allUploadsDone;
    }
    
    if (t.type === 'training-logistics') return t.centerSelection !== 'purn' || t.permissionLetter !== 'purn';
    if (t.type === 'logistics-checklist') return ['internet', 'sound', 'food', 'water'].some(k => t[k] !== 'purn');
    
    if (t.type === 'during-census-data') {
        const list = t.hlbProgress && t.hlbProgress.length > 0 ? t.hlbProgress : DEFAULT_CENSUS_PROGRESS;
        let totalExpected = 0;
        let totalCompleted = 0;
        list.forEach(v => {
            totalExpected += v.expectedHouses;
            totalCompleted += v.completedHouses;
        });
        return totalCompleted < totalExpected || totalExpected === 0;
    }
    
    // Default for simple and others
    return t.status !== 'purn';
}

function updateDailyScheduler() {
    const scheduler = document.getElementById('daily-scheduler');
    if (!scheduler) return;
    
    const now = new Date();
    const todayNum = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const urgentTasks = [];
    
    taskData.forEach(cat => {
        cat.tasks.forEach(t => {
            if (isTaskPending(t) && t.deadline) {
                const dlDate = new Date(t.deadline);
                // Ensure we compare only the date part
                const dlNum = new Date(dlDate.getFullYear(), dlDate.getMonth(), dlDate.getDate()).getTime();
                const diffDays = Math.round((dlNum - todayNum) / (1000 * 60 * 60 * 24));
                
                // Show tasks overdue, due today, or due in the next 10 days
                if (diffDays <= 10) {
                    urgentTasks.push({ name: t.name, days: diffDays });
                }
            }
        });
    });

    if (urgentTasks.length > 0) {
        // Sort by urgency: most overdue first, then closest deadline
        urgentTasks.sort((a,b) => a.days - b.days);
        
        const taskLabels = urgentTasks.slice(0, 5).map(ut => {
            let labelStyle = "";
            let text = ut.name;
            let icon = '<i class="fas fa-calendar-day"></i>';
            
            if (ut.days < 0) {
                labelStyle = "color: #ff4d4d; font-weight: bold;";
                text += ` (विलंब: ${Math.abs(ut.days)} दिन)`;
                icon = '<i class="fas fa-exclamation-circle"></i>';
            } else if (ut.days === 0) {
                labelStyle = "color: #ff9800; font-weight: bold;";
                text += ` (आज!)`;
                icon = '<i class="fas fa-clock"></i>';
            } else {
                text += ` (अगले ${ut.days} दिन)`;
            }
            
            return `<span style="display: inline-flex; align-items: center; gap: 5px; ${labelStyle}">${icon} ${text}</span>`;
        });

        scheduler.innerHTML = `
            <div class="scheduler-banner">
                <i class="fas fa-bullhorn fa-2x" style="color: var(--warning); animation: blink 2s infinite;"></i>
                <div style="flex:1;">
                    <strong style="display:block; font-size:16px; margin-bottom:5px;">आगामी और लंबित कार्य (Priority Focus):</strong>
                    <div style="display:flex; flex-wrap:wrap; gap:10px 20px; font-size:13px;">
                        ${taskLabels.join('<span style="color:rgba(255,255,255,0.3)">|</span>')}
                    </div>
                </div>
            </div>
        `;
    } else {
        scheduler.innerHTML = `
            <div class="scheduler-banner" style="border-color: var(--success); background: #f0fdf4; color: #166534;">
                <i class="fas fa-check-double fa-2x" style="color: var(--success);"></i>
                <div>
                    <strong style="display:block; font-size:16px;">सभी कार्य ट्रैक पर हैं!</strong>
                    <span style="font-size:13px;">आज के लिए कोई तत्काल लंबित कार्य नहीं है।</span>
                </div>
            </div>
        `;
    }
}

// 4. Save Changes
async function saveChanges() {
    const btn = document.querySelector('.btn-save');
    const originalHTML = btn.innerHTML;
    
    // 1) Always save values only to localStorage
    const valuesOnly = {};
    taskData.forEach(cat => {
        cat.tasks.forEach(t => {
            const { id, name, type, ...values } = t;
            valuesOnly[id] = values;
        });
    });
    localStorage.setItem('census_tasks_values', JSON.stringify(valuesOnly));
    
    // 2) Always try to sync values to Google Sheets (cloud)
    const apiUrl = localStorage.getItem('census_api_url') || DEFAULT_API_URL;
    if (apiUrl) {
        try {
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            btn.disabled = true;

            await fetch(apiUrl, {
                method: 'POST',
                mode: 'no-cors',
                body: JSON.stringify({ values: valuesOnly })
            });
            
            setTimeout(() => {
                btn.innerHTML = originalHTML;
                btn.disabled = false;
                alert("✅ बदलाव सुरक्षित हो गए!\n• लोकल मेमोरी: ✅\n• Google Sheets (Cloud): ✅ डेटा भेज दिया गया");
            }, 500);
        } catch (e) {
            console.error("Cloud sync error:", e);
            btn.innerHTML = originalHTML;
            btn.disabled = false;
            alert("⚠️ बदलाव लोकल मेमोरी में सुरक्षित हैं।\nCloud सिंक में समस्या: " + e.message);
        }
    } else {
        alert("✅ बदलाव लोकल मेमोरी में सुरक्षित कर लिए गए हैं।\nCloud sync के लिए API URL डालें।");
    }
}

function saveApiUrl() {
    const url = document.getElementById('api-url').value;
    if (url) {
        localStorage.setItem('census_api_url', url);
        alert("API लिंक सुरक्षित हो गया है। अब डेटा सिंक करें।");
    }
}

async function forceCloudSync() {
    const apiUrl = localStorage.getItem('census_api_url') || DEFAULT_API_URL;
    if (!apiUrl) {
        alert("पहले API लिंक डालें!");
        return;
    }

    const valuesOnly = {};
    taskData.forEach(cat => {
        cat.tasks.forEach(t => {
            const { id, name, type, ...values } = t;
            valuesOnly[id] = values;
        });
    });

    try {
        await fetch(apiUrl, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify({ values: valuesOnly })
        });
        alert("डेटा क्लाउड (Google Sheets) पर भेज दिया गया है!");
    } catch (e) {
        console.error(e);
        alert("सिंक करने में एरर आया। कृपया URL चेक करें।");
    }
}

// XML Generation logic removed

// 5. Reset Data
function resetData() {
    if (confirm("क्या आप डेटा को रीसेट करना चाहते हैं? (इससे आपकी लोकल प्रोग्रेस हट जाएगी)")) {
        localStorage.removeItem('census_tasks_values');
        location.reload();
    }
}

function exportToJSON() {
    const valuesOnly = {};
    taskData.forEach(cat => {
        cat.tasks.forEach(t => {
            const { id, name, type, ...values } = t;
            valuesOnly[id] = values;
        });
    });
    const blob = new Blob([JSON.stringify({ values: valuesOnly }, null, 4)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'census_backup.json';
    a.click();
    URL.revokeObjectURL(url);
    alert("डाटा बैकअप (JSON) जनरेट हो गया है।");
}

// Start sequence
// Toggle Handlers for Click-to-Update UI
function toggleUserGroupStep(id, key) {
    taskData.forEach(cat => {
        cat.tasks.forEach(t => {
            if (t.id === id) {
                t[key] = t[key] === 'purn' ? 'lambit' : 'purn';
            }
        });
    });
    onDataChange();
}

function toggleBatchStep(id, bIdx, step) {
    taskData.forEach(cat => {
        cat.tasks.forEach(t => {
            if (t.id === id) {
                t.batchList[bIdx][step] = t.batchList[bIdx][step] === 'purn' ? 'lambit' : 'purn';
            }
        });
    });
    onDataChange();
}

// 7. Generate Formal Report (प्रतिवेदन)
function getReportHTML() {
    const today = new Date();
    const dateStr = today.toLocaleDateString('hi-IN', { year: 'numeric', month: 'long', day: 'numeric' });
    
    // Calculate overall progress using unified logic
    let totalP = 0, totalT = 0;
    taskData.forEach(cat => {
        cat.tasks.forEach(t => {
            const prog = getTaskProgress(t);
            totalP += prog.purn;
            totalT += prog.total;
        });
    });
    const overallPercent = totalT > 0 ? Math.round((totalP / totalT) * 100) : 0;

    // Build category-wise report
    let categoryReports = '';
    let catIndex = 1;

    taskData.forEach(cat => {
        let catName = cat.category;
        let taskLines = '';
        let taskNum = 1;

        cat.tasks.forEach(t => {
            if (t.type === 'info' || t.type === 'training-centers') return;

            let statusText = '';
            if (t.type === 'counter') {
                const pct = Math.round((t.completed / t.total) * 100);
                statusText = `कुल ${t.total} में से ${t.completed} पूर्ण (${pct}%)`;
            } else if (t.type === 'map-stats') {
                statusText = `कुल ${t.total} में से ${t.checked} जांच पूर्ण। सही: ${t.correct}, गलत: ${t.incorrect}`;
            } else if (t.type === 'user-group') {
                const stepLabels = {
                    niyukti: "नियुक्ति",
                    circleAlloc: "सर्किल",
                    pragnakAlloc: "प्रगणक",
                    alloc: "आवंटन",
                    hlbAlloc: "HLB",
                    idCard: "ID कार्ड",
                    mapDistrib: "मैप",
                    reserveId: "रिजर्व"
                };
                const keys = t.id === 'sup1' 
                    ? ['niyukti','circleAlloc','pragnakAlloc','hlbAlloc','idCard','mapDistrib','reserveId']
                    : ['niyukti','alloc','hlbAlloc','idCard','mapDistrib','reserveId'];
                
                const stepsHtml = keys.map(k => {
                    const isDone = t[k] === 'purn';
                    return `<span style="white-space:nowrap; color:${isDone ? '#059669' : '#999'}; font-size:10px;">${isDone ? '●' : '○'} ${stepLabels[k] || k}</span>`;
                }).join(' ');

                statusText = `
                    <div style="font-weight:bold; margin-bottom:4px;">कुल: ${t.totalCount}, पोर्टल अपलोड: ${t.uploadedCount}/${t.totalCount}</div>
                    <div style="line-height:1.2;">${stepsHtml}</div>
                `;
            } else if (t.type === 'training-summary') {
                const stepLabels = ["निर्माण", "अलॉट", "शीट", "जांच", "अपलोड"];
                const batchDetails = t.batchList.map(b => {
                    const steps = ["nirm", "alloc", "down", "verify", "up"];
                    const stepsHtml = steps.map((s, idx) => {
                        const isDone = b[s] === 'purn';
                        return `<span style="color:${isDone ? '#059669' : '#999'}; margin-right:4px;">${isDone ? '●' : '○'}${stepLabels[idx]}</span>`;
                    }).join('');

                    const isFullyDone = b.nirm==='purn' && b.alloc==='purn' && b.down==='purn' && b.verify==='purn' && b.up==='purn';
                    return `
                        <div style="font-size:10px; margin-bottom:2px; border-bottom:1px solid #f0f0f0; padding-bottom:1px;">
                            <b>Batch ${b.id}:</b> ${stepsHtml} ${isFullyDone ? '<b style="color:#059669;">[पूर्ण]</b>' : ''}
                        </div>
                    `;
                }).join('');
                
                statusText = `
                    <div style="font-weight:bold; margin-bottom:4px;">बैच: ${t.totalBatches}, पूर्ण: ${t.completedBatches}, उपस्थिति: ${t.totalAttended}</div>
                    <div style="line-height:1.2;">${batchDetails}</div>
                `;
            } else if (t.type === 'training-logistics') {
                const s1 = t.centerSelection === 'purn' ? 'पूर्ण' : 'लंबित';
                const s2 = t.permissionLetter === 'purn' ? 'पूर्ण' : 'लंबित';
                statusText = `केंद्र चयन: ${s1}, अनुमति पत्र: ${s2}`;
            } else if (t.type === 'logistics-checklist') {
                const items = [
                    { label: 'इंटरनेट', key: 'internet' },
                    { label: 'साउंड/माइक', key: 'sound' },
                    { label: 'भोजन', key: 'food' },
                    { label: 'पेयजल', key: 'water' }
                ];
                statusText = items.map(i => `${i.label}: ${t[i.key] === 'purn' ? '✅ पूर्ण' : '⏳ लंबित'}`).join(', ');
            } else if (t.type === 'cell-info') {
                statusText = `कार्मिक: ${t.staffCount}, कंप्यूटर: ${t.computers}, प्रिंटर: ${t.printers}`;
            } else {
                const label = t.status === 'purn' ? '✅ पूर्ण' : t.status === 'apurn' ? '⚠️ अपूर्ण' : '⏳ लंबित';
                statusText = `स्थिति: ${label}`;
            }

            const dlText = t.deadline ? ` (समय सीमा: ${t.deadline})` : '';
            taskLines += `<tr><td style="padding:6px 10px; border:1px solid #ccc; text-align:center;">${catIndex}.${taskNum}</td><td style="padding:6px 10px; border:1px solid #ccc;">${t.name}${dlText}</td><td style="padding:6px 10px; border:1px solid #ccc;">${statusText}</td></tr>`;
            taskNum++;
        });

        if (taskLines) {
            categoryReports += `
                <tr style="background:#e8f0fe;">
                    <td colspan="3" style="padding:8px 10px; border:1px solid #ccc; font-weight:bold; font-size:14px;">
                        ${catIndex}. ${catName}
                    </td>
                </tr>
                ${taskLines}
            `;
            catIndex++;
        }
    });


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

    const reportHTML = `
    <!DOCTYPE html>
    <html lang="hi">
    <head>
        <meta charset="UTF-8">
        <title>प्रतिवेदन - जनगणना 2027</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700&display=swap');
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Noto Sans Devanagari', sans-serif; padding: 40px; color: #1a1a1a; font-size: 13px; line-height: 1.8; }
            .header { text-align: center; border-bottom: 3px double #1a1a1a; padding-bottom: 15px; margin-bottom: 20px; }
            .header h1 { font-size: 20px; color: #1a237e; }
            .header h2 { font-size: 16px; color: #333; margin-top: 5px; }
            .meta { display: flex; justify-content: space-between; margin-bottom: 20px; }
            .meta div { font-size: 13px; }
            .subject { text-align: center; font-weight: 700; font-size: 15px; margin: 15px 0; padding: 8px; background: #f5f5f5; border-radius: 5px; }
            .body-text { text-align: justify; margin-bottom: 15px; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 12px; }
            th { background: #1a237e; color: white; padding: 8px 10px; border: 1px solid #ccc; text-align: left; }
            .progress-box { text-align: center; margin: 20px 0; padding: 15px; background: linear-gradient(135deg, #e8f5e9, #f1f8e9); border-radius: 10px; border: 2px solid #4caf50; }
            .progress-box .pct { font-size: 36px; font-weight: 700; color: #2e7d32; }
            .signature { margin-top: 50px; display: flex; justify-content: space-between; }
            .signature div { text-align: center; min-width: 200px; }
            .signature .line { border-top: 1px solid #333; margin-top: 40px; padding-top: 5px; }
            @media print { body { padding: 20px; font-size: 12px; } .no-print { display: none; } }
        </style>
    </head>
    <body>
        <button class="no-print" onclick="window.print()" style="position:fixed; top:15px; right:15px; padding:10px 25px; background:#1a237e; color:white; border:none; border-radius:8px; font-size:14px; cursor:pointer; font-family:inherit; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">🖨️ प्रिंट करें</button>

        <div class="header">
            <h1>कार्यालय चार्ज अधिकारी, जनगणना 2027</h1>
            <h2>भिनाय ब्लॉक, जिला अजमेर (राजस्थान)</h2>
        </div>

        <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
            <div><strong>पत्रांक:</strong> भिनाय/जनगणना/2027/</div>
            <div style="text-align:right;"><strong>दिनांक:</strong> ${dateStr}</div>
        </div>

        <div class="meta">
            <div><strong>सेवा में,</strong><br>श्रीमान तहसीलदार महोदय,<br>तहसील भिनाय, जिला अजमेर</div>
        </div>

        <div class="subject">विषय: जनगणना 2027 की पूर्व तैयारी का प्रगति प्रतिवेदन</div>

        <div class="body-text">
            <p>महोदय,</p>
            <p>सविनय निवेदन है कि जनगणना 2027 की पूर्व तैयारी के संबंध में भिनाय ब्लॉक की वर्तमान प्रगति का विस्तृत प्रतिवेदन निम्नानुसार प्रस्तुत है:</p>
        </div>

        <div class="progress-box">
            <div>समग्र प्रगति (Overall Progress)</div>
            <div class="pct">${overallPercent}%</div>
        </div>\n        ${villageHtml}\n

        <h3 style="margin:15px 0 5px; color:#1a237e;">📋 श्रेणी-वार विस्तृत विवरण:</h3>
        <table>
            <thead>
                <tr>
                    <th style="width:60px;">क्र.सं.</th>
                    <th>कार्य विवरण</th>
                    <th style="width:35%;">स्थिति / प्रगति</th>
                </tr>
            </thead>
            <tbody>
                ${categoryReports}
            </tbody>
        </table>

        <div class="body-text" style="margin-top:20px;">
            <p>अतः उपरोक्त प्रतिवेदन आपकी सेवा में सादर प्रस्तुत है। कृपया अवलोकन कर आवश्यक दिशा-निर्देश प्रदान करने की कृपा करें।</p>
            <p>सधन्यवाद।</p>
        </div>

        <div class="signature">
            <div>
                <div class="line">चार्ज अधिकारी<br>जनगणना 2027, भिनाय ब्लॉक</div>
            </div>
            <div>
                <div class="line">तहसीलदार<br>तहसील भिनाय, जिला अजमेर</div>
            </div>
        </div>
    </body>
    </html>`;

    const reportWindow = window.open('', '_blank');
    reportWindow.document.write(reportHTML);
    reportWindow.document.close();
}

/* ==========================================================================
   DURING CENSUS DATA, UPLOADER, PARSER AND RENDERING LOGIC
   ========================================================================== */

const DEFAULT_CENSUS_PROGRESS = [
    { village: "0001 - Amargarh", totalHlbs: 1, inProgress: 1, completedHlbs: 0, yetToStart: 0, expectedHouses: 175, completedHouses: 65, whollyRes: 42, partlyRes: 0, vacant: 5, locked: 0, otherUse: 18, households: 42, verifiedHouseholds: 0, population: 279, seIdUsed: 6 },
    { village: "0002 - Motipura", totalHlbs: 1, inProgress: 0, completedHlbs: 0, yetToStart: 1, expectedHouses: 0, completedHouses: 0, whollyRes: 0, partlyRes: 0, vacant: 0, locked: 0, otherUse: 0, households: 0, verifiedHouseholds: 0, population: 0, seIdUsed: 0 },
    { village: "0003 - Bagrai", totalHlbs: 1, inProgress: 0, completedHlbs: 0, yetToStart: 1, expectedHouses: 0, completedHouses: 0, whollyRes: 0, partlyRes: 0, vacant: 0, locked: 0, otherUse: 0, households: 0, verifiedHouseholds: 0, population: 0, seIdUsed: 0 },
    { village: "0004 - Kumhariya", totalHlbs: 4, inProgress: 0, completedHlbs: 0, yetToStart: 4, expectedHouses: 0, completedHouses: 0, whollyRes: 0, partlyRes: 0, vacant: 0, locked: 0, otherUse: 0, households: 0, verifiedHouseholds: 0, population: 0, seIdUsed: 0 },
    { village: "0005 - Soorajpura", totalHlbs: 1, inProgress: 1, completedHlbs: 0, yetToStart: 0, expectedHouses: 135, completedHouses: 58, whollyRes: 45, partlyRes: 0, vacant: 6, locked: 0, otherUse: 7, households: 45, verifiedHouseholds: 0, population: 299, seIdUsed: 0 },
    { village: "0006 - Keetap", totalHlbs: 3, inProgress: 1, completedHlbs: 0, yetToStart: 2, expectedHouses: 510, completedHouses: 17, whollyRes: 6, partlyRes: 0, vacant: 1, locked: 0, otherUse: 10, households: 8, verifiedHouseholds: 0, population: 39, seIdUsed: 0 },
    { village: "0007 - Sedariya", totalHlbs: 3, inProgress: 1, completedHlbs: 0, yetToStart: 2, expectedHouses: 323, completedHouses: 16, whollyRes: 4, partlyRes: 0, vacant: 3, locked: 0, otherUse: 9, households: 7, verifiedHouseholds: 0, population: 28, seIdUsed: 0 },
    { village: "0008 - Chhachhundra", totalHlbs: 2, inProgress: 0, completedHlbs: 0, yetToStart: 2, expectedHouses: 0, completedHouses: 0, whollyRes: 0, partlyRes: 0, vacant: 0, locked: 0, otherUse: 0, households: 0, verifiedHouseholds: 0, population: 0, seIdUsed: 0 },
    { village: "0009 - Daulatpura", totalHlbs: 1, inProgress: 0, completedHlbs: 0, yetToStart: 1, expectedHouses: 0, completedHouses: 0, whollyRes: 0, partlyRes: 0, vacant: 0, locked: 0, otherUse: 0, households: 0, verifiedHouseholds: 0, population: 0, seIdUsed: 0 },
    { village: "0010 - Pratappura", totalHlbs: 1, inProgress: 0, completedHlbs: 0, yetToStart: 1, expectedHouses: 0, completedHouses: 0, whollyRes: 0, partlyRes: 0, vacant: 0, locked: 0, otherUse: 0, households: 0, verifiedHouseholds: 0, population: 0, seIdUsed: 0 },
    { village: "0011 - Kheri", totalHlbs: 3, inProgress: 1, completedHlbs: 0, yetToStart: 2, expectedHouses: 225, completedHouses: 18, whollyRes: 0, partlyRes: 0, vacant: 5, locked: 0, otherUse: 13, households: 0, verifiedHouseholds: 0, population: 0, seIdUsed: 0 },
    { village: "0012 - Padanga", totalHlbs: 3, inProgress: 3, completedHlbs: 0, yetToStart: 0, expectedHouses: 733, completedHouses: 139, whollyRes: 103, partlyRes: 0, vacant: 7, locked: 1, otherUse: 29, households: 104, verifiedHouseholds: 0, population: 561, seIdUsed: 0 },
    { village: "0013 - Bandanwara", totalHlbs: 14, inProgress: 7, completedHlbs: 0, yetToStart: 7, expectedHouses: 1399, completedHouses: 358, whollyRes: 163, partlyRes: 9, vacant: 31, locked: 11, otherUse: 155, households: 172, verifiedHouseholds: 0, population: 1012, seIdUsed: 2 },
    { village: "0014 - Rooppura", totalHlbs: 2, inProgress: 1, completedHlbs: 0, yetToStart: 1, expectedHouses: 110, completedHouses: 6, whollyRes: 6, partlyRes: 0, vacant: 0, locked: 0, otherUse: 0, households: 6, verifiedHouseholds: 0, population: 35, seIdUsed: 0 },
    { village: "0015 - Rampura", totalHlbs: 1, inProgress: 0, completedHlbs: 0, yetToStart: 1, expectedHouses: 0, completedHouses: 0, whollyRes: 0, partlyRes: 0, vacant: 0, locked: 0, otherUse: 0, households: 0, verifiedHouseholds: 0, population: 0, seIdUsed: 0 },
    { village: "0016 - Gajjanadi", totalHlbs: 2, inProgress: 0, completedHlbs: 0, yetToStart: 2, expectedHouses: 60, completedHouses: 0, whollyRes: 0, partlyRes: 0, vacant: 0, locked: 0, otherUse: 0, households: 0, verifiedHouseholds: 0, population: 0, seIdUsed: 0 },
    { village: "0017 - Devpura", totalHlbs: 2, inProgress: 0, completedHlbs: 0, yetToStart: 2, expectedHouses: 180, completedHouses: 0, whollyRes: 0, partlyRes: 0, vacant: 0, locked: 0, otherUse: 0, households: 0, verifiedHouseholds: 0, population: 0, seIdUsed: 0 },
    { village: "0018 - Arjunpura", totalHlbs: 1, inProgress: 1, completedHlbs: 0, yetToStart: 0, expectedHouses: 186, completedHouses: 12, whollyRes: 1, partlyRes: 0, vacant: 0, locked: 0, otherUse: 11, households: 1, verifiedHouseholds: 0, population: 2, seIdUsed: 0 },
    { village: "0019 - Jheepiya", totalHlbs: 2, inProgress: 2, completedHlbs: 0, yetToStart: 0, expectedHouses: 430, completedHouses: 5, whollyRes: 3, partlyRes: 0, vacant: 0, locked: 0, otherUse: 2, households: 3, verifiedHouseholds: 0, population: 12, seIdUsed: 0 },
    { village: "0020 - Ratakot", totalHlbs: 4, inProgress: 4, completedHlbs: 0, yetToStart: 0, expectedHouses: 753, completedHouses: 137, whollyRes: 97, partlyRes: 0, vacant: 10, locked: 0, otherUse: 30, households: 97, verifiedHouseholds: 25, population: 530, seIdUsed: 0 },
    { village: "0021 - Sawaipura", totalHlbs: 1, inProgress: 0, completedHlbs: 0, yetToStart: 1, expectedHouses: 0, completedHouses: 0, whollyRes: 0, partlyRes: 0, vacant: 0, locked: 0, otherUse: 0, households: 0, verifiedHouseholds: 0, population: 0, seIdUsed: 0 },
    { village: "0022 - Mathaniya", totalHlbs: 1, inProgress: 0, completedHlbs: 0, yetToStart: 1, expectedHouses: 196, completedHouses: 0, whollyRes: 0, partlyRes: 0, vacant: 0, locked: 0, otherUse: 0, households: 0, verifiedHouseholds: 0, population: 0, seIdUsed: 0 },
    { village: "0023 - Gowaliya", totalHlbs: 3, inProgress: 0, completedHlbs: 0, yetToStart: 3, expectedHouses: 0, completedHouses: 0, whollyRes: 0, partlyRes: 0, vacant: 0, locked: 0, otherUse: 0, households: 0, verifiedHouseholds: 0, population: 0, seIdUsed: 0 },
    { village: "0024 - Karati", totalHlbs: 4, inProgress: 1, completedHlbs: 0, yetToStart: 3, expectedHouses: 262, completedHouses: 7, whollyRes: 7, partlyRes: 0, vacant: 0, locked: 0, otherUse: 0, households: 8, verifiedHouseholds: 0, population: 37, seIdUsed: 0 },
    { village: "0025 - Sargaon", totalHlbs: 2, inProgress: 0, completedHlbs: 0, yetToStart: 2, expectedHouses: 80, completedHouses: 0, whollyRes: 0, partlyRes: 0, vacant: 0, locked: 0, otherUse: 0, households: 0, verifiedHouseholds: 0, population: 0, seIdUsed: 0 },
    { village: "0026 - Gordhanpura", totalHlbs: 1, inProgress: 0, completedHlbs: 0, yetToStart: 1, expectedHouses: 0, completedHouses: 0, whollyRes: 0, partlyRes: 0, vacant: 0, locked: 0, otherUse: 0, households: 0, verifiedHouseholds: 0, population: 0, seIdUsed: 0 },
    { village: "0027 - Jorawarpura", totalHlbs: 1, inProgress: 0, completedHlbs: 0, yetToStart: 1, expectedHouses: 0, completedHouses: 0, whollyRes: 0, partlyRes: 0, vacant: 0, locked: 0, otherUse: 0, households: 0, verifiedHouseholds: 0, population: 0, seIdUsed: 0 },
    { village: "0028 - Ratanpura", totalHlbs: 1, inProgress: 0, completedHlbs: 0, yetToStart: 1, expectedHouses: 0, completedHouses: 0, whollyRes: 0, partlyRes: 0, vacant: 0, locked: 0, otherUse: 0, households: 0, verifiedHouseholds: 0, population: 0, seIdUsed: 0 },
    { village: "0029 - Bhinay", totalHlbs: 17, inProgress: 7, completedHlbs: 0, yetToStart: 10, expectedHouses: 1639, completedHouses: 283, whollyRes: 161, partlyRes: 7, vacant: 58, locked: 0, otherUse: 57, households: 169, verifiedHouseholds: 75, population: 912, seIdUsed: 6 },
    { village: "0030 - Udaigarh Khera", totalHlbs: 3, inProgress: 0, completedHlbs: 0, yetToStart: 3, expectedHouses: 150, completedHouses: 0, whollyRes: 0, partlyRes: 0, vacant: 0, locked: 0, otherUse: 0, households: 0, verifiedHouseholds: 0, population: 0, seIdUsed: 0 },
    { village: "0031 - Gujarwara", totalHlbs: 1, inProgress: 0, completedHlbs: 0, yetToStart: 1, expectedHouses: 0, completedHouses: 0, whollyRes: 0, partlyRes: 0, vacant: 0, locked: 0, otherUse: 0, households: 0, verifiedHouseholds: 0, population: 0, seIdUsed: 0 },
    { village: "0032 - Dhantol", totalHlbs: 2, inProgress: 0, completedHlbs: 0, yetToStart: 2, expectedHouses: 0, completedHouses: 0, whollyRes: 0, partlyRes: 0, vacant: 0, locked: 0, otherUse: 0, households: 0, verifiedHouseholds: 0, population: 0, seIdUsed: 0 },
    { village: "0033 - Heerapura", totalHlbs: 2, inProgress: 0, completedHlbs: 0, yetToStart: 2, expectedHouses: 120, completedHouses: 0, whollyRes: 0, partlyRes: 0, vacant: 0, locked: 0, otherUse: 0, households: 0, verifiedHouseholds: 0, population: 0, seIdUsed: 0 },
    { village: "0034 - Rammaliya", totalHlbs: 3, inProgress: 2, completedHlbs: 0, yetToStart: 1, expectedHouses: 180, completedHouses: 38, whollyRes: 32, partlyRes: 0, vacant: 4, locked: 0, otherUse: 2, households: 32, verifiedHouseholds: 0, population: 200, seIdUsed: 2 },
    { village: "0035 - Raghunath Garh", totalHlbs: 3, inProgress: 3, completedHlbs: 0, yetToStart: 0, expectedHouses: 437, completedHouses: 111, whollyRes: 80, partlyRes: 0, vacant: 10, locked: 0, otherUse: 21, households: 81, verifiedHouseholds: 0, population: 476, seIdUsed: 0 },
    { village: "0036 - Boobkiya", totalHlbs: 3, inProgress: 0, completedHlbs: 0, yetToStart: 3, expectedHouses: 0, completedHouses: 0, whollyRes: 0, partlyRes: 0, vacant: 0, locked: 0, otherUse: 0, households: 0, verifiedHouseholds: 0, population: 0, seIdUsed: 0 },
    { village: "0037 - Peeloda", totalHlbs: 1, inProgress: 0, completedHlbs: 0, yetToStart: 1, expectedHouses: 0, completedHouses: 0, whollyRes: 0, partlyRes: 0, vacant: 0, locked: 0, otherUse: 0, households: 0, verifiedHouseholds: 0, population: 0, seIdUsed: 0 },
    { village: "0038 - Ren", totalHlbs: 2, inProgress: 0, completedHlbs: 0, yetToStart: 2, expectedHouses: 0, completedHouses: 0, whollyRes: 0, partlyRes: 0, vacant: 0, locked: 0, otherUse: 0, households: 0, verifiedHouseholds: 0, population: 0, seIdUsed: 0 },
    { village: "0039 - Solkhurd", totalHlbs: 1, inProgress: 1, completedHlbs: 0, yetToStart: 0, expectedHouses: 150, completedHouses: 26, whollyRes: 21, partlyRes: 0, vacant: 2, locked: 0, otherUse: 3, households: 21, verifiedHouseholds: 0, population: 186, seIdUsed: 0 },
    { village: "0040 - Kumhariya Khera", totalHlbs: 1, inProgress: 0, completedHlbs: 0, yetToStart: 1, expectedHouses: 84, completedHouses: 0, whollyRes: 0, partlyRes: 0, vacant: 0, locked: 0, otherUse: 0, households: 0, verifiedHouseholds: 0, population: 0, seIdUsed: 0 },
    { village: "0041 - Sobri", totalHlbs: 2, inProgress: 1, completedHlbs: 0, yetToStart: 1, expectedHouses: 431, completedHouses: 1, whollyRes: 0, partlyRes: 0, vacant: 0, locked: 0, otherUse: 1, households: 0, verifiedHouseholds: 0, population: 0, seIdUsed: 0 },
    { village: "0042 - Pratappura", totalHlbs: 1, inProgress: 1, completedHlbs: 0, yetToStart: 0, expectedHouses: 140, completedHouses: 15, whollyRes: 9, partlyRes: 0, vacant: 1, locked: 0, otherUse: 5, households: 9, verifiedHouseholds: 0, population: 55, seIdUsed: 0 },
    { village: "0043 - Rooppura", totalHlbs: 1, inProgress: 1, completedHlbs: 0, yetToStart: 0, expectedHouses: 30, completedHouses: 21, whollyRes: 16, partlyRes: 0, vacant: 0, locked: 0, otherUse: 5, households: 16, verifiedHouseholds: 0, population: 94, seIdUsed: 0 },
    { village: "0044 - Chawandiya", totalHlbs: 2, inProgress: 1, completedHlbs: 0, yetToStart: 1, expectedHouses: 315, completedHouses: 11, whollyRes: 4, partlyRes: 0, vacant: 1, locked: 0, otherUse: 6, households: 4, verifiedHouseholds: 0, population: 19, seIdUsed: 0 },
    { village: "0045 - Gopalpura", totalHlbs: 2, inProgress: 1, completedHlbs: 0, yetToStart: 1, expectedHouses: 155, completedHouses: 12, whollyRes: 3, partlyRes: 0, vacant: 3, locked: 0, otherUse: 6, households: 3, verifiedHouseholds: 0, population: 12, seIdUsed: 0 },
    { village: "0046 - Singhawal", totalHlbs: 5, inProgress: 4, completedHlbs: 0, yetToStart: 1, expectedHouses: 588, completedHouses: 52, whollyRes: 13, partlyRes: 0, vacant: 7, locked: 0, otherUse: 32, households: 14, verifiedHouseholds: 1, population: 60, seIdUsed: 0 },
    { village: "0047 - Khatanon Ka Khera", totalHlbs: 1, inProgress: 0, completedHlbs: 0, yetToStart: 1, expectedHouses: 0, completedHouses: 0, whollyRes: 0, partlyRes: 0, vacant: 0, locked: 0, otherUse: 0, households: 0, verifiedHouseholds: 0, population: 0, seIdUsed: 0 },
    { village: "0048 - Hiyaliya", totalHlbs: 3, inProgress: 1, completedHlbs: 0, yetToStart: 2, expectedHouses: 334, completedHouses: 10, whollyRes: 4, partlyRes: 0, vacant: 0, locked: 0, otherUse: 6, households: 4, verifiedHouseholds: 0, population: 25, seIdUsed: 1 },
    { village: "0049 - Baneriya", totalHlbs: 2, inProgress: 2, completedHlbs: 0, yetToStart: 0, expectedHouses: 248, completedHouses: 39, whollyRes: 29, partlyRes: 0, vacant: 0, locked: 4, otherUse: 10, households: 29, verifiedHouseholds: 0, population: 145, seIdUsed: 11 },
    { village: "0050 - Balapura", totalHlbs: 1, inProgress: 1, completedHlbs: 0, yetToStart: 0, expectedHouses: 172, completedHouses: 10, whollyRes: 9, partlyRes: 0, vacant: 0, locked: 0, otherUse: 1, households: 9, verifiedHouseholds: 0, population: 61, seIdUsed: 0 },
    { village: "0051 - Ekalseenga", totalHlbs: 3, inProgress: 3, completedHlbs: 0, yetToStart: 0, expectedHouses: 577, completedHouses: 74, whollyRes: 63, partlyRes: 1, vacant: 8, locked: 1, otherUse: 2, households: 65, verifiedHouseholds: 2, population: 327, seIdUsed: 0 },
    { village: "0052 - Dhani", totalHlbs: 1, inProgress: 0, completedHlbs: 0, yetToStart: 1, expectedHouses: 0, completedHouses: 0, whollyRes: 0, partlyRes: 0, vacant: 0, locked: 0, otherUse: 0, households: 0, verifiedHouseholds: 0, population: 0, seIdUsed: 0 },
    { village: "0053 - Telara", totalHlbs: 2, inProgress: 1, completedHlbs: 0, yetToStart: 1, expectedHouses: 113, completedHouses: 21, whollyRes: 18, partlyRes: 0, vacant: 0, locked: 2, otherUse: 3, households: 20, verifiedHouseholds: 0, population: 92, seIdUsed: 0 },
    { village: "0054 - Ghana", totalHlbs: 3, inProgress: 3, completedHlbs: 0, yetToStart: 0, expectedHouses: 435, completedHouses: 62, whollyRes: 39, partlyRes: 1, vacant: 2, locked: 0, otherUse: 20, households: 40, verifiedHouseholds: 0, population: 274, seIdUsed: 0 },
    { village: "0055 - Khayra", totalHlbs: 2, inProgress: 2, completedHlbs: 0, yetToStart: 0, expectedHouses: 290, completedHouses: 72, whollyRes: 56, partlyRes: 1, vacant: 2, locked: 0, otherUse: 13, households: 60, verifiedHouseholds: 0, population: 395, seIdUsed: 13 },
    { village: "0056 - Peepaliya", totalHlbs: 2, inProgress: 2, completedHlbs: 0, yetToStart: 0, expectedHouses: 214, completedHouses: 4, whollyRes: 2, partlyRes: 0, vacant: 0, locked: 0, otherUse: 2, households: 2, verifiedHouseholds: 0, population: 16, seIdUsed: 0 },
    { village: "0057 - Sol Kalan", totalHlbs: 1, inProgress: 1, completedHlbs: 0, yetToStart: 0, expectedHouses: 145, completedHouses: 45, whollyRes: 37, partlyRes: 1, vacant: 0, locked: 0, otherUse: 7, households: 39, verifiedHouseholds: 0, population: 209, seIdUsed: 0 },
    { village: "0058 - Barla @ Kala Talab", totalHlbs: 3, inProgress: 2, completedHlbs: 0, yetToStart: 1, expectedHouses: 1060, completedHouses: 23, whollyRes: 18, partlyRes: 0, vacant: 0, locked: 0, otherUse: 5, households: 21, verifiedHouseholds: 0, population: 119, seIdUsed: 0 },
    { village: "0059 - Keriya Khurd", totalHlbs: 3, inProgress: 0, completedHlbs: 0, yetToStart: 3, expectedHouses: 0, completedHouses: 0, whollyRes: 0, partlyRes: 0, vacant: 0, locked: 0, otherUse: 0, households: 0, verifiedHouseholds: 0, population: 0, seIdUsed: 0 },
    { village: "0060 - Sapnikhera", totalHlbs: 1, inProgress: 0, completedHlbs: 0, yetToStart: 1, expectedHouses: 0, completedHouses: 0, whollyRes: 0, partlyRes: 0, vacant: 0, locked: 0, otherUse: 0, households: 0, verifiedHouseholds: 0, population: 0, seIdUsed: 0 },
    { village: "0061 - Bargaon urf Surkhand", totalHlbs: 4, inProgress: 4, completedHlbs: 0, yetToStart: 0, expectedHouses: 661, completedHouses: 4, whollyRes: 2, partlyRes: 0, vacant: 0, locked: 0, otherUse: 2, households: 2, verifiedHouseholds: 2, population: 7, seIdUsed: 0 },
    { village: "0062 - Raghunathpura", totalHlbs: 2, inProgress: 2, completedHlbs: 0, yetToStart: 0, expectedHouses: 255, completedHouses: 54, whollyRes: 30, partlyRes: 0, vacant: 2, locked: 0, otherUse: 22, households: 30, verifiedHouseholds: 1, population: 187, seIdUsed: 0 },
    { village: "0063 - Balapura", totalHlbs: 1, inProgress: 0, completedHlbs: 0, yetToStart: 1, expectedHouses: 0, completedHouses: 0, whollyRes: 0, partlyRes: 0, vacant: 0, locked: 0, otherUse: 0, households: 0, verifiedHouseholds: 0, population: 0, seIdUsed: 0 },
    { village: "0064 - Nagola", totalHlbs: 4, inProgress: 3, completedHlbs: 0, yetToStart: 1, expectedHouses: 970, completedHouses: 8, whollyRes: 2, partlyRes: 0, vacant: 0, locked: 0, otherUse: 6, households: 2, verifiedHouseholds: 0, population: 17, seIdUsed: 0 },
    { village: "0065 - Chapaneri", totalHlbs: 8, inProgress: 6, completedHlbs: 0, yetToStart: 2, expectedHouses: 1237, completedHouses: 138, whollyRes: 83, partlyRes: 0, vacant: 7, locked: 5, otherUse: 48, households: 90, verifiedHouseholds: 4, population: 434, seIdUsed: 2 },
    { village: "0066 - Udaipura Khera", totalHlbs: 1, inProgress: 1, completedHlbs: 0, yetToStart: 0, expectedHouses: 158, completedHouses: 23, whollyRes: 11, partlyRes: 0, vacant: 0, locked: 0, otherUse: 12, households: 11, verifiedHouseholds: 0, population: 54, seIdUsed: 0 },
    { village: "0067 - Bhairoo Khera", totalHlbs: 1, inProgress: 1, completedHlbs: 0, yetToStart: 0, expectedHouses: 125, completedHouses: 39, whollyRes: 31, partlyRes: 0, vacant: 0, locked: 0, otherUse: 8, households: 31, verifiedHouseholds: 0, population: 134, seIdUsed: 0 },
    { village: "0068 - Barla Khera", totalHlbs: 1, inProgress: 1, completedHlbs: 0, yetToStart: 0, expectedHouses: 120, completedHouses: 60, whollyRes: 51, partlyRes: 0, vacant: 0, locked: 0, otherUse: 9, households: 51, verifiedHouseholds: 11, population: 303, seIdUsed: 0 },
    { village: "0069 - Neemera", totalHlbs: 3, inProgress: 3, completedHlbs: 0, yetToStart: 0, expectedHouses: 350, completedHouses: 67, whollyRes: 46, partlyRes: 1, vacant: 2, locked: 0, otherUse: 18, households: 47, verifiedHouseholds: 26, population: 279, seIdUsed: 0 },
    { village: "0070 - Jhanbarkiya", totalHlbs: 1, inProgress: 1, completedHlbs: 0, yetToStart: 0, expectedHouses: 170, completedHouses: 29, whollyRes: 21, partlyRes: 0, vacant: 0, locked: 0, otherUse: 8, households: 21, verifiedHouseholds: 0, population: 113, seIdUsed: 0 },
    { village: "0071 - Barli", totalHlbs: 8, inProgress: 4, completedHlbs: 0, yetToStart: 4, expectedHouses: 980, completedHouses: 97, whollyRes: 58, partlyRes: 1, vacant: 7, locked: 0, otherUse: 31, households: 67, verifiedHouseholds: 0, population: 446, seIdUsed: 0 },
    { village: "0072 - Mataji Ka Khera", totalHlbs: 1, inProgress: 0, completedHlbs: 0, yetToStart: 1, expectedHouses: 225, completedHouses: 0, whollyRes: 0, partlyRes: 0, vacant: 0, locked: 0, otherUse: 0, households: 0, verifiedHouseholds: 0, population: 0, seIdUsed: 0 },
    { village: "0073 - Ganahera", totalHlbs: 2, inProgress: 1, completedHlbs: 0, yetToStart: 1, expectedHouses: 174, completedHouses: 35, whollyRes: 27, partlyRes: 0, vacant: 4, locked: 0, otherUse: 4, households: 28, verifiedHouseholds: 12, population: 175, seIdUsed: 0 },
    { village: "0074 - Lamgara", totalHlbs: 2, inProgress: 2, completedHlbs: 0, yetToStart: 0, expectedHouses: 251, completedHouses: 6, whollyRes: 4, partlyRes: 0, vacant: 0, locked: 0, otherUse: 2, households: 4, verifiedHouseholds: 0, population: 32, seIdUsed: 0 },
    { village: "0075 - Deoliya Kalan", totalHlbs: 11, inProgress: 9, completedHlbs: 0, yetToStart: 2, expectedHouses: 1728, completedHouses: 241, whollyRes: 97, partlyRes: 3, vacant: 21, locked: 0, otherUse: 120, households: 104, verifiedHouseholds: 0, population: 611, seIdUsed: 2 },
    { village: "0076 - Moondiya Khera", totalHlbs: 1, inProgress: 0, completedHlbs: 0, yetToStart: 1, expectedHouses: 0, completedHouses: 0, whollyRes: 0, partlyRes: 0, vacant: 0, locked: 0, otherUse: 0, households: 0, verifiedHouseholds: 0, population: 0, seIdUsed: 0 },
    { village: "0077 - Nandsi", totalHlbs: 3, inProgress: 0, completedHlbs: 0, yetToStart: 3, expectedHouses: 0, completedHouses: 0, whollyRes: 0, partlyRes: 0, vacant: 0, locked: 0, otherUse: 0, households: 0, verifiedHouseholds: 0, population: 0, seIdUsed: 0 },
    { village: "0078 - Padaliya", totalHlbs: 3, inProgress: 3, completedHlbs: 0, yetToStart: 0, expectedHouses: 278, completedHouses: 13, whollyRes: 11, partlyRes: 0, vacant: 0, locked: 0, otherUse: 2, households: 11, verifiedHouseholds: 0, population: 62, seIdUsed: 0 },
    { village: "0079 - Gordhanpura", totalHlbs: 1, inProgress: 1, completedHlbs: 0, yetToStart: 0, expectedHouses: 130, completedHouses: 16, whollyRes: 12, partlyRes: 0, vacant: 0, locked: 0, otherUse: 4, households: 12, verifiedHouseholds: 0, population: 49, seIdUsed: 0 },
    { village: "0080 - Beeliya", totalHlbs: 1, inProgress: 1, completedHlbs: 0, yetToStart: 0, expectedHouses: 175, completedHouses: 2, whollyRes: 2, partlyRes: 0, vacant: 0, locked: 0, otherUse: 0, households: 2, verifiedHouseholds: 0, population: 6, seIdUsed: 0 },
    { village: "0081 - Kanai Kalan", totalHlbs: 2, inProgress: 0, completedHlbs: 0, yetToStart: 2, expectedHouses: 89, completedHouses: 0, whollyRes: 0, partlyRes: 0, vacant: 0, locked: 0, otherUse: 0, households: 0, verifiedHouseholds: 0, population: 0, seIdUsed: 0 },
    { village: "0082 - Kanai Khurd", totalHlbs: 2, inProgress: 1, completedHlbs: 0, yetToStart: 1, expectedHouses: 126, completedHouses: 38, whollyRes: 20, partlyRes: 0, vacant: 11, locked: 0, otherUse: 7, households: 20, verifiedHouseholds: 0, population: 106, seIdUsed: 0 },
    { village: "0083 - Dhandhon Ka Khera", totalHlbs: 1, inProgress: 0, completedHlbs: 0, yetToStart: 1, expectedHouses: 0, completedHouses: 0, whollyRes: 0, partlyRes: 0, vacant: 0, locked: 0, otherUse: 0, households: 0, verifiedHouseholds: 0, population: 0, seIdUsed: 0 },
    { village: "0084 - Nimeda", totalHlbs: 3, inProgress: 1, completedHlbs: 0, yetToStart: 2, expectedHouses: 246, completedHouses: 13, whollyRes: 8, partlyRes: 0, vacant: 1, locked: 0, otherUse: 4, households: 8, verifiedHouseholds: 0, population: 42, seIdUsed: 0 },
    { village: "0085 - Laxmipura", totalHlbs: 1, inProgress: 0, completedHlbs: 0, yetToStart: 1, expectedHouses: 0, completedHouses: 0, whollyRes: 0, partlyRes: 0, vacant: 0, locked: 0, otherUse: 0, households: 0, verifiedHouseholds: 0, population: 0, seIdUsed: 0 },
    { village: "0086 - Chawandiya", totalHlbs: 2, inProgress: 0, completedHlbs: 0, yetToStart: 2, expectedHouses: 0, completedHouses: 0, whollyRes: 0, partlyRes: 0, vacant: 0, locked: 0, otherUse: 0, households: 0, verifiedHouseholds: 0, population: 0, seIdUsed: 0 },
    { village: "0087 - Kachariya", totalHlbs: 2, inProgress: 0, completedHlbs: 0, yetToStart: 2, expectedHouses: 0, completedHouses: 0, whollyRes: 0, partlyRes: 0, vacant: 0, locked: 0, otherUse: 0, households: 0, verifiedHouseholds: 0, population: 0, seIdUsed: 0 },
    { village: "0088 - Jetpura", totalHlbs: 3, inProgress: 1, completedHlbs: 0, yetToStart: 2, expectedHouses: 180, completedHouses: 15, whollyRes: 12, partlyRes: 0, vacant: 0, locked: 0, otherUse: 3, households: 12, verifiedHouseholds: 0, population: 78, seIdUsed: 0 },
    { village: "0089 - Kadolai", totalHlbs: 1, inProgress: 1, completedHlbs: 0, yetToStart: 0, expectedHouses: 140, completedHouses: 5, whollyRes: 4, partlyRes: 0, vacant: 0, locked: 0, otherUse: 1, households: 4, verifiedHouseholds: 0, population: 24, seIdUsed: 0 },
    { village: "0090 - Kerot", totalHlbs: 4, inProgress: 4, completedHlbs: 0, yetToStart: 0, expectedHouses: 727, completedHouses: 20, whollyRes: 11, partlyRes: 0, vacant: 1, locked: 0, otherUse: 8, households: 11, verifiedHouseholds: 0, population: 73, seIdUsed: 0 },
    { village: "0091 - Kurthal", totalHlbs: 3, inProgress: 0, completedHlbs: 0, yetToStart: 3, expectedHouses: 0, completedHouses: 0, whollyRes: 0, partlyRes: 0, vacant: 0, locked: 0, otherUse: 0, households: 0, verifiedHouseholds: 0, population: 0, seIdUsed: 0 },
    { village: "0092 - Pandonlai", totalHlbs: 1, inProgress: 1, completedHlbs: 0, yetToStart: 0, expectedHouses: 171, completedHouses: 8, whollyRes: 2, partlyRes: 0, vacant: 0, locked: 0, otherUse: 6, households: 2, verifiedHouseholds: 0, population: 13, seIdUsed: 0 },
    { village: "0093 - Indrapura", totalHlbs: 1, inProgress: 0, completedHlbs: 0, yetToStart: 1, expectedHouses: 0, completedHouses: 0, whollyRes: 0, partlyRes: 0, vacant: 0, locked: 0, otherUse: 0, households: 0, verifiedHouseholds: 0, population: 0, seIdUsed: 0 },
    { village: "0094 - Bagrai", totalHlbs: 3, inProgress: 1, completedHlbs: 0, yetToStart: 2, expectedHouses: 142, completedHouses: 1, whollyRes: 0, partlyRes: 0, vacant: 0, locked: 0, otherUse: 1, households: 0, verifiedHouseholds: 0, population: 0, seIdUsed: 0 },
    { village: "0095 - Kheri", totalHlbs: 2, inProgress: 1, completedHlbs: 0, yetToStart: 1, expectedHouses: 136, completedHouses: 2, whollyRes: 1, partlyRes: 0, vacant: 0, locked: 0, otherUse: 1, households: 1, verifiedHouseholds: 0, population: 14, seIdUsed: 0 },
    { village: "0096 - Gurha Khurd", totalHlbs: 3, inProgress: 1, completedHlbs: 0, yetToStart: 2, expectedHouses: 276, completedHouses: 2, whollyRes: 0, partlyRes: 0, vacant: 0, locked: 0, otherUse: 2, households: 0, verifiedHouseholds: 0, population: 0, seIdUsed: 0 },
    { village: "0097 - Gurha Kalan", totalHlbs: 3, inProgress: 2, completedHlbs: 0, yetToStart: 1, expectedHouses: 230, completedHouses: 8, whollyRes: 7, partlyRes: 0, vacant: 0, locked: 0, otherUse: 1, households: 7, verifiedHouseholds: 0, population: 28, seIdUsed: 0 }
];

let censusSearchTerm = "";
let censusFilter = "all";
let censusSortKey = "percent";
let censusSortOrder = "desc";
let hlbDistributionChart = null;
let topVillagesChart = null;

let uploadedSheetData = null;
let sheetHeaders = [];

// Admin Uploader Handlers
function handleFileSelect(input) {
    const file = input.files[0];
    if (file) readExcelFile(file);
}

function handleFileDrop(e) {
    e.preventDefault();
    const dropZone = document.getElementById('hlb-drop-zone');
    if (dropZone) dropZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) readExcelFile(file);
}

function readExcelFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            if (jsonData.length < 2) {
                alert("चयनित फ़ाइल में कोई वैध डेटा नहीं है।");
                return;
            }
            
            sheetHeaders = jsonData[0];
            uploadedSheetData = jsonData.slice(1).filter(row => row.length > 0 && row[0] !== null && row[0] !== undefined);
            
            showColumnMapping(sheetHeaders);
        } catch (err) {
            console.error(err);
            alert("फ़ाइल पढ़ने में त्रुटि। कृपया सुनिश्चित करें कि यह एक वैध Excel (.xlsx, .xls) या CSV फ़ाइल है।");
        }
    };
    reader.readAsArrayBuffer(file);
}

function showColumnMapping(headers) {
    const colHlb = document.getElementById('col-hlb');
    const colTotal = document.getElementById('col-total');
    const colDone = document.getElementById('col-done');
    
    if (!colHlb || !colTotal || !colDone) return;
    
    colHlb.innerHTML = '';
    colTotal.innerHTML = '';
    colDone.innerHTML = '';
    
    headers.forEach((h, idx) => {
        const opt1 = new Option(h, idx);
        const opt2 = new Option(h, idx);
        const opt3 = new Option(h, idx);
        colHlb.add(opt1);
        colTotal.add(opt2);
        colDone.add(opt3);
    });
    
    headers.forEach((h, idx) => {
        const name = String(h).toLowerCase();
        if (name.includes('village') || name.includes('town') || name.includes('गाँव') || name.includes('कस्बा') || name.includes('नाम')) {
            colHlb.value = idx;
        }
        if (name.includes('expected') || name.includes('total expected') || name.includes('कुल अनुमानित') || name.includes('लक्ष्य')) {
            colTotal.value = idx;
        }
        if (name.includes('total number of census') || name.includes('completed') || name.includes('done') || name.includes('पूर्ण मकान') || name.includes('संख्या')) {
            colDone.value = idx;
        }
    });
    
    document.getElementById('hlb-col-map').style.display = 'block';
    
    const dropZone = document.getElementById('hlb-drop-zone');
    if (dropZone) {
        dropZone.innerHTML = `
            <i class="fas fa-file-excel" style="color:#10b981;"></i>
            <p style="color:#10b981; font-weight:800;">फ़ाइल लोड हो गई है!</p>
            <small>${uploadedSheetData.length} पंक्तियाँ मिलीं। कॉलम मैपिंग चेक करके 'प्रोसेस करें' दबाएं।</small>
        `;
    }
}

function processHlbSheet() {
    if (!uploadedSheetData || uploadedSheetData.length === 0) return;
    
    const hlbIdx = parseInt(document.getElementById('col-hlb').value);
    const totalIdx = parseInt(document.getElementById('col-total').value);
    const doneIdx = parseInt(document.getElementById('col-done').value);
    
    const findIndex = (keywords) => {
        return sheetHeaders.findIndex(h => keywords.some(k => String(h).toLowerCase().includes(k)));
    };
    
    const totalHlbsIdx = findIndex(['total hlb', 'total_hlb', 'कुल hlb', 'hlb']);
    const inProgressIdx = findIndex(['in progress', 'in_progress', 'प्रगतिरत', 'प्रगति पर']);
    const completedHlbsIdx = findIndex(['completed hlb', 'completed_hlb', 'पूर्ण hlb']);
    const yetToStartIdx = findIndex(['yet to start', 'yet_to_start', 'लंबित hlb', 'शुरू नहीं']);
    const whollyResIdx = findIndex(['wholly residential', 'wholly_res', 'पूर्ण आवासीय']);
    const partlyResIdx = findIndex(['partly residential', 'partly_res', 'आंशिक आवासीय']);
    const vacantIdx = findIndex(['vacant', 'खाली']);
    const lockedIdx = findIndex(['locked', 'ताला बंद']);
    const otherUseIdx = findIndex(['put to other uses', 'other uses', 'अन्य उपयोग']);
    const householdsIdx = findIndex(['total number of households', 'households', 'कुल परिवार']);
    const verifiedHouseholdsIdx = findIndex(['verified by supervisor', 'verified_households', 'सत्यापित परिवार']);
    const populationIdx = findIndex(['total population', 'population', 'जनसंख्या']);
    const seIdUsedIdx = findIndex(['se id used', 'se_id_used', 'इस्तेमाल id']);
    
    const processedList = [];
    
    uploadedSheetData.forEach(row => {
        const villageName = String(row[hlbIdx] || '').trim();
        if (!villageName || villageName.toLowerCase().includes('total') || villageName === '-') {
            return;
        }
        
        const getValue = (idx, fallback) => {
            if (idx === -1 || row[idx] === undefined || row[idx] === null) return fallback;
            return parseInt(row[idx]) || 0;
        };
        
        processedList.push({
            village: villageName,
            totalHlbs: getValue(totalHlbsIdx, 1),
            inProgress: getValue(inProgressIdx, 0),
            completedHlbs: getValue(completedHlbsIdx, 0),
            yetToStart: getValue(yetToStartIdx, 0),
            expectedHouses: getValue(totalIdx, 0),
            completedHouses: getValue(doneIdx, 0),
            whollyRes: getValue(whollyResIdx, 0),
            partlyRes: getValue(partlyResIdx, 0),
            vacant: getValue(vacantIdx, 0),
            locked: getValue(lockedIdx, 0),
            otherUse: getValue(otherUseIdx, 0),
            households: getValue(householdsIdx, 0),
            verifiedHouseholds: getValue(verifiedHouseholdsIdx, 0),
            population: getValue(populationIdx, 0),
            seIdUsed: getValue(seIdUsedIdx, 0)
        });
    });
    
    if (processedList.length === 0) {
        alert("कोई वैध डेटा प्रोसेस नहीं हो सका।");
        return;
    }
    
    const now = new Date();
    const dateStr = now.toLocaleDateString('hi-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    
    taskData.forEach(cat => {
        cat.tasks.forEach(t => {
            if (t.id === 'during_census_progress') {
                t.hlbProgress = processedList;
                t.lastUpdated = `${dateStr} | ${timeStr}`;
            }
        });
    });
    
    alert("✅ एक्सेल शीट का डेटा सफलतापूर्वक प्रोसेस करके एकीकृत कर दिया गया है!");
    
    const panel = document.getElementById('during-census-panel');
    if (panel) panel.style.display = 'none';
    
    resetUpload();
    onDataChange();
}

function resetUpload() {
    uploadedSheetData = null;
    sheetHeaders = [];
    const fileInput = document.getElementById('hlb-file-input');
    if (fileInput) fileInput.value = '';
    const colMap = document.getElementById('hlb-col-map');
    if (colMap) colMap.style.display = 'none';
    const dropZone = document.getElementById('hlb-drop-zone');
    if (dropZone) {
        dropZone.innerHTML = `
            <i class="fas fa-cloud-upload-alt"></i>
            <p>Excel / CSV फ़ाइल यहाँ खींचें या क्लिक करें</p>
            <small>समर्थित: .xlsx, .xls, .csv</small>
        `;
    }
}

// Render Dashboard
function renderDuringCensusDashboard() {
    const dashboardDiv = document.getElementById('during-census-dashboard');
    if (!dashboardDiv) return;
    
    const task = taskData.flatMap(c => c.tasks).find(t => t.id === 'during_census_progress');
    const hlbProgress = (task && task.hlbProgress && task.hlbProgress.length > 0) ? task.hlbProgress : DEFAULT_CENSUS_PROGRESS;
    const lastUpdated = (task && task.lastUpdated) ? task.lastUpdated : "20.05.2026 | 09:52 AM";
    
    // Aggregations
    const totalVillages = hlbProgress.length;
    let totalHlbs = 242;
    let inProgressHlbs = 152;
    let completedHlbs = 0;
    let yetToStartHlbs = 90;
    let expectedHouses = 30436;
    let completedHouses = 4783;
    let totalPopulation = 17274;
    
    // Check if we have an overall stats object (if we ever add one dynamically)
    if (typeof CENSUS_OVERALL_STATS !== 'undefined') {
        totalHlbs = CENSUS_OVERALL_STATS.totalHlbs;
        inProgressHlbs = CENSUS_OVERALL_STATS.inProgress;
        completedHlbs = CENSUS_OVERALL_STATS.completedHlbs;
        yetToStartHlbs = CENSUS_OVERALL_STATS.yetToStart;
        expectedHouses = CENSUS_OVERALL_STATS.expectedHouses;
        completedHouses = CENSUS_OVERALL_STATS.completedHouses;
        totalPopulation = CENSUS_OVERALL_STATS.population;
    }
    
    const hlbPct = Math.round((completedHlbs / totalHlbs) * 100) || 0;
    const housesPct = Math.round((completedHouses / expectedHouses) * 100) || 0;
    
    // Draw Shell
    dashboardDiv.innerHTML = `
        <div class="during-census-dashboard">
            <div class="dc-header">
                <div class="dc-title">
                    <div class="dc-title-icon"><i class="fas fa-chart-line"></i></div>
                    <div>
                        <h2>जनगणना कार्य प्रगति डैशबोर्ड (During Census Live Tracker)</h2>
                        <p>भिनाय ब्लॉक के गाँवों का वास्तविक प्रगति विवरण</p>
                    </div>
                </div>
                <div class="dc-last-updated">
                    <i class="fas fa-history"></i>
                    <span>अंतिम अपडेट: ${lastUpdated}</span>
                </div>
            </div>
            
            <!-- Cards Grid -->
            <div class="census-stats-grid">
                <div class="census-stat-card">
                    <div class="csc-header">
                        <span>कवर किए गए गाँव</span>
                        <i class="fas fa-map-marked-alt" style="color:var(--accent);"></i>
                    </div>
                    <div class="csc-value">${totalVillages}</div>
                    <div class="csc-footer">100% ग्रामीण क्षेत्र मैपिंग</div>
                </div>
                
                <div class="census-stat-card color-purple">
                    <div class="csc-header">
                        <span>कुल HLB प्रगति (House Listing Blocks)</span>
                        <i class="fas fa-th-large" style="color:#9c27b0;"></i>
                    </div>
                    <div class="csc-value">${completedHlbs} / ${totalHlbs}</div>
                    <div class="csc-footer">
                        <span>लंबित: ${yetToStartHlbs} | प्रगति पर: ${inProgressHlbs}</span>
                        <div class="csc-progress-bar"><div class="csc-progress-fill" style="width:${hlbPct}%"></div></div>
                    </div>
                </div>
                
                <div class="census-stat-card color-green">
                    <div class="csc-header">
                        <span>मकान सर्वेक्षण प्रगति (Census Houses)</span>
                        <i class="fas fa-house-user" style="color:#10b981;"></i>
                    </div>
                    <div class="csc-value">${completedHouses.toLocaleString('hi-IN')} / ${expectedHouses.toLocaleString('hi-IN')}</div>
                    <div class="csc-footer">
                        <span>कुल सर्वेक्षण दर: ${housesPct}%</span>
                        <div class="csc-progress-bar"><div class="csc-progress-fill" style="width:${housesPct}%"></div></div>
                    </div>
                </div>
                
                <div class="census-stat-card color-orange">
                    <div class="csc-header">
                        <span>कुल प्रगणित जनसंख्या</span>
                        <i class="fas fa-users" style="color:#f59e0b;"></i>
                    </div>
                    <div class="csc-value">${totalPopulation.toLocaleString('hi-IN')}</div>
                    <div class="csc-footer">सक्रिय फील्ड सर्वे कार्य प्रगति पर</div>
                </div>
            </div>
            
            <!-- Charts Grid -->
            <div class="census-charts-grid">
                <div class="census-chart-card">
                    <div class="ccc-title"><i class="fas fa-home"></i> मकान प्रकार विभाजन (House Types)</div>
                    <div class="census-chart-container">
                        <canvas id="houseTypeChart"></canvas>
                    </div>
                </div>

                <div class="census-chart-card">
                    <div class="ccc-title"><i class="fas fa-chart-pie"></i> HLB स्थिति विभाजन (HLB Status)</div>
                    <div class="census-chart-container">
                        <canvas id="hlbStatusChart"></canvas>
                    </div>
                </div>
                <div class="census-chart-card">
                    <div class="ccc-title"><i class="fas fa-chart-bar"></i> टॉप 10 गाँव - मकान प्रगणन दर (Survey %)</div>
                    <div class="census-chart-container">
                        <canvas id="topVillagesChart"></canvas>
                    </div>
                </div>
            </div>
            
            <!-- Controls (Search & Filter) -->
            <div class="census-controls">
                <div class="census-search-wrapper">
                    <i class="fas fa-search"></i>
                    <input type="text" class="census-search" placeholder="गाँव का नाम खोजें..." value="${censusSearchTerm}" oninput="handleCensusSearch(this.value)">
                </div>
                <div class="census-filters">
                    <button class="census-filter-btn ${censusFilter === 'all' ? 'active' : ''}" onclick="setCensusFilter('all')">सभी गाँव</button>
                    <button class="census-filter-btn ${censusFilter === 'pending' ? 'active' : ''}" onclick="setCensusFilter('pending')">लंबित (Not Started)</button>
                    <button class="census-filter-btn ${censusFilter === 'active' ? 'active' : ''}" onclick="setCensusFilter('active')">सक्रिय (Active)</button>
                    <button class="census-filter-btn ${censusFilter === 'high' ? 'active' : ''}" onclick="setCensusFilter('high')">उच्च प्रगति (50%+)</button>
                    <button class="census-filter-btn ${censusFilter === 'completed' ? 'active' : ''}" onclick="setCensusFilter('completed')">पूर्ण (100%)</button>
                </div>
            </div>
            
            <!-- Villages Table -->
            <div class="census-table-wrapper">
                <table class="census-table">
                    <thead>
                        <tr>
                            <th onclick="setCensusSort('name')">गाँव का नाम <i class="fas ${censusSortKey === 'name' ? (censusSortOrder === 'asc' ? 'fa-sort-up' : 'fa-sort-down') : 'fa-sort'}"></i></th>
                            <th onclick="setCensusSort('hlbs')">कुल HLB <i class="fas ${censusSortKey === 'hlbs' ? (censusSortOrder === 'asc' ? 'fa-sort-up' : 'fa-sort-down') : 'fa-sort'}"></i></th>
                            <th onclick="setCensusSort('expected')">अपेक्षित मकान <i class="fas ${censusSortKey === 'expected' ? (censusSortOrder === 'asc' ? 'fa-sort-up' : 'fa-sort-down') : 'fa-sort'}"></i></th>
                            <th onclick="setCensusSort('completed')">पूर्ण मकान <i class="fas ${censusSortKey === 'completed' ? (censusSortOrder === 'asc' ? 'fa-sort-up' : 'fa-sort-down') : 'fa-sort'}"></i></th>
                            <th onclick="setCensusSort('percent')" style="width:30%;">प्रगति (%) <i class="fas ${censusSortKey === 'percent' ? (censusSortOrder === 'asc' ? 'fa-sort-up' : 'fa-sort-down') : 'fa-sort'}"></i></th>
                            <th>स्थिति</th>
                        <th>सुपरवाइजर</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${renderCensusTableRows(hlbProgress)}
                    </tbody>
                </table>

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
            </div>
        </div>
    `;
    
    // Draw Charts
    drawHlbChart(yetToStartHlbs, inProgressHlbs, completedHlbs);
    drawTopVillagesChart(hlbProgress);

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

}

function renderCensusTableRows(hlbProgress) {
    let filtered = hlbProgress.filter(v => {
        const matchSearch = v.village.toLowerCase().includes(censusSearchTerm.toLowerCase());
        
        if (censusFilter === 'pending') {
            return matchSearch && v.completedHouses === 0 && v.inProgress === 0;
        } else if (censusFilter === 'active') {
            return matchSearch && (v.inProgress > 0 || v.completedHouses > 0) && (v.completedHlbs < v.totalHlbs || v.completedHouses < v.expectedHouses);
        } else if (censusFilter === 'completed') {
            return matchSearch && v.completedHouses >= v.expectedHouses && v.expectedHouses > 0;
        } else if (censusFilter === 'high') {
            const pct = Math.round((v.completedHouses / v.expectedHouses) * 100) || 0;
            return matchSearch && pct >= 50 && pct < 100;
        }
        return matchSearch;
    });
    
    filtered.sort((a, b) => {
        let valA, valB;
        if (censusSortKey === 'name') {
            valA = a.village;
            valB = b.village;
        } else if (censusSortKey === 'hlbs') {
            valA = a.totalHlbs;
            valB = b.totalHlbs;
        } else if (censusSortKey === 'expected') {
            valA = a.expectedHouses;
            valB = b.expectedHouses;
        } else if (censusSortKey === 'completed') {
            valA = a.completedHouses;
            valB = b.completedHouses;
        } else if (censusSortKey === 'population') {
            valA = a.population;
            valB = b.population;
        } else if (censusSortKey === 'percent') {
            valA = a.expectedHouses > 0 ? (a.completedHouses / a.expectedHouses) : 0;
            valB = b.expectedHouses > 0 ? (b.completedHouses / b.expectedHouses) : 0;
        }
        
        if (valA < valB) return censusSortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return censusSortOrder === 'asc' ? 1 : -1;
        return 0;
    });
    
    if (filtered.length === 0) {
        return `<tr><td colspan="7" style="text-align:center; padding:30px; color:#64748b; font-weight:bold;">खोज के अनुसार कोई गाँव नहीं मिला</td></tr>`;
    }
    
    // Calculate totals for the current filtered view
    let totalHlbsSum = 0;
    let expectedHousesSum = 0;
    let completedHousesSum = 0;
    
    filtered.forEach(v => {
        totalHlbsSum += v.totalHlbs || 0;
        expectedHousesSum += v.expectedHouses || 0;
        completedHousesSum += v.completedHouses || 0;
    });
    
    const totalPct = Math.round((completedHousesSum / expectedHousesSum) * 100) || 0;
    const totalColor = totalPct >= 100 ? '#10b981' : totalPct >= 50 ? '#3b82f6' : totalPct > 0 ? '#f59e0b' : '#ef4444';
    
    const totalRowHtml = `
        <tr style="background-color: #f1f5f9; font-weight: bold; border-bottom: 2px solid #cbd5e1;">
            <td style="color:#0f172a;">कुल (Total)</td>
            <td>${totalHlbsSum}</td>
            <td>${expectedHousesSum.toLocaleString('hi-IN')}</td>
            <td>${completedHousesSum.toLocaleString('hi-IN')}</td>
            <td>
                <div class="census-progress-cell">
                    <span class="pct-num" style="color:${totalColor}">${totalPct}%</span>
                    <div class="pct-track"><div class="pct-fill" style="width:${totalPct}%; background:${totalColor}"></div></div>
                </div>
            </td>
            <td>-</td>
            <td>-</td>
        </tr>
    `;
    
    return totalRowHtml + filtered.map(v => {
        const pct = Math.round((v.completedHouses / v.expectedHouses) * 100) || 0;
        const color = pct >= 100 ? '#10b981' : pct >= 50 ? '#3b82f6' : pct > 0 ? '#f59e0b' : '#ef4444';
        const isDone = pct >= 100;
        
        return `
            <tr onclick="openVillageDetails('${v.village.replace(/'/g, "\\'")}')">
                <td style="font-weight:700; color:#1e293b;">${v.village}</td>
                <td>${v.totalHlbs}</td>
                <td>${v.expectedHouses.toLocaleString('hi-IN')}</td>
                <td>${v.completedHouses.toLocaleString('hi-IN')}</td>
                <td>
                    <div class="census-progress-cell">
                        <span class="pct-num" style="color:${color}">${pct}%</span>
                        <div class="pct-track"><div class="pct-fill" style="width:${pct}%; background:${color}"></div></div>
                    </div>
                </td>
                <td>
                    <span class="badge-pill ${isDone ? 'status-active' : 'status-pending'}">
                        ${isDone ? 'पूर्ण (Completed)' : 'प्रक्रियारत (Active)'}
                    </span>
                </td>
                <td>
                    <button class="sup-eye-btn" onclick="event.stopPropagation(); showVillageSupervisors('${v.village.replace(/'/g, "\\'")}')" title="सुपरवाइजर देखें">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}


// Show village supervisor details in popup
function showVillageSupervisors(villageName) {
    // Find matching supervisors from VILLAGE_SUPERVISORS
    let supervisors = [];
    for (const [vKey, sups] of Object.entries(VILLAGE_SUPERVISORS)) {
        // Match by village name (ignore code in parentheses)
        const vNameClean = vKey.replace(/\s*\(\d+\)/, '').trim().toLowerCase();
        const searchClean = villageName.trim().toLowerCase();
        if (vNameClean === searchClean || vKey.toLowerCase() === searchClean) {
            supervisors = sups;
            break;
        }
    }
    
    // Also try partial match
    if (supervisors.length === 0) {
        for (const [vKey, sups] of Object.entries(VILLAGE_SUPERVISORS)) {
            if (vKey.toLowerCase().includes(villageName.toLowerCase()) || 
                villageName.toLowerCase().includes(vKey.replace(/\s*\(\d+\)/, '').trim().toLowerCase())) {
                supervisors = sups;
                break;
            }
        }
    }
    
    let modalOverlay = document.getElementById('sup-modal-overlay');
    if (!modalOverlay) {
        modalOverlay = document.createElement('div');
        modalOverlay.id = 'sup-modal-overlay';
        modalOverlay.className = 'sup-modal-overlay';
        document.body.appendChild(modalOverlay);
    }
    
    const supRows = supervisors.length > 0 
        ? supervisors.map((s, i) => `
            <tr>
                <td>${i+1}</td>
                <td><span class="sup-circle-badge">${s.circle}</span></td>
                <td style="font-weight:700;">${s.name}</td>
                <td><a href="tel:${s.mobile}" class="sup-call-link"><i class="fas fa-phone-alt"></i> ${s.mobile}</a></td>
            </tr>
        `).join('')
        : `<tr><td colspan="4" style="text-align:center; padding:20px; color:#94a3b8;">इस गाँव के लिए सुपरवाइजर जानकारी उपलब्ध नहीं है</td></tr>`;
    
    modalOverlay.innerHTML = `
        <div class="sup-modal-card">
            <div class="sup-modal-header">
                <div>
                    <h3><i class="fas fa-map-marker-alt"></i> ${villageName}</h3>
                    <p>सुपरवाइजर विवरण (${supervisors.length} सुपरवाइजर)</p>
                </div>
                <button onclick="closeSupervisorModal()" class="sup-modal-close"><i class="fas fa-times"></i></button>
            </div>
            <div class="sup-modal-body">
                <table class="sup-modal-table">
                    <thead>
                        <tr>
                            <th>क्र.</th>
                            <th>सर्किल</th>
                            <th>सुपरवाइजर का नाम</th>
                            <th>मोबाइल नंबर</th>
                        </tr>
                    </thead>
                    <tbody>${supRows}</tbody>
                </table>
            </div>
        </div>
    `;
    
    setTimeout(() => { modalOverlay.classList.add('active'); }, 10);
    modalOverlay.onclick = function(e) {
        if (e.target === modalOverlay) closeSupervisorModal();
    };
}

function closeSupervisorModal() {
    const overlay = document.getElementById('sup-modal-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        setTimeout(() => { overlay.innerHTML = ''; }, 300);
    }
}

// Chart.js Draw Functions
function drawHlbChart(yetToStart, inProgress, completed) {
    if (hlbDistributionChart) hlbDistributionChart.destroy();
    
    const canvas = document.getElementById('hlbStatusChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    hlbDistributionChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['लंबित HLB', 'प्रगति पर HLB', 'पूर्ण HLB'],
            datasets: [{
                data: [yetToStart, inProgress, completed],
                backgroundColor: ['#ef4444', '#f59e0b', '#10b981'],
                borderWidth: 0,
                hoverOffset: 12, clip: false
            }]
        },
        options: {
            layout: { padding: { top: 40, bottom: 80, left: 60, right: 60 } },
            radius: '60%',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: { family: 'Inter', weight: 'bold', size: 12 },
                        padding: 40,
                        boxWidth: 15
                    }
                }
            },
            cutout: '70%'
        }
    });
}

function drawTopVillagesChart(hlbProgress) {
    if (topVillagesChart) topVillagesChart.destroy();
    
    const canvas = document.getElementById('topVillagesChart');
    if (!canvas) return;
    
    const top10 = [...hlbProgress]
        .filter(v => v.expectedHouses > 0)
        .sort((a, b) => b.completedHouses - a.completedHouses)
        .slice(0, 10);
        
    const barLabels = top10.map(v => v.village.split(' - ')[1] || v.village);
    const barData = top10.map(v => Math.round((v.completedHouses / v.expectedHouses) * 100) || 0);
    
    const ctx = canvas.getContext('2d');
    topVillagesChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: barLabels,
            datasets: [{
                label: 'सर्वेक्षण पूर्ण (%)',
                data: barData,
                backgroundColor: 'rgba(79, 70, 229, 0.85)',
                hoverBackgroundColor: 'rgba(79, 70, 229, 1)',
                borderRadius: 8,
                borderWidth: 0
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: { 
                    max: 100, 
                    ticks: { font: { weight: 'bold', family: 'Inter' } },
                    grid: { display: false }
                },
                y: { 
                    ticks: { font: { weight: 'bold', family: 'Inter', size: 11 } },
                    grid: { display: false }
                }
            }
        }
    });
}

// Filters & Controls Interactivity
function handleCensusSearch(val) {
    censusSearchTerm = val;
    const tbody = document.querySelector('.census-table tbody');
    if (tbody) {
        const task = taskData.flatMap(c => c.tasks).find(t => t.id === 'during_census_progress');
        const list = (task && task.hlbProgress && task.hlbProgress.length > 0) ? task.hlbProgress : DEFAULT_CENSUS_PROGRESS;
        tbody.innerHTML = renderCensusTableRows(list);
    }
}

function setCensusFilter(val) {
    censusFilter = val;
    
    // Toggle active filter button
    const buttons = document.querySelectorAll('.census-filter-btn');
    buttons.forEach(btn => {
        if (btn.innerText.toLowerCase().includes(val === 'all' ? 'सभी' : val === 'pending' ? 'लंबित' : val === 'active' ? 'सक्रिय' : val === 'high' ? 'उच्च' : 'पूर्ण')) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Rerender table
    const tbody = document.querySelector('.census-table tbody');
    if (tbody) {
        const task = taskData.flatMap(c => c.tasks).find(t => t.id === 'during_census_progress');
        const list = (task && task.hlbProgress && task.hlbProgress.length > 0) ? task.hlbProgress : DEFAULT_CENSUS_PROGRESS;
        tbody.innerHTML = renderCensusTableRows(list);
    }
}

function setCensusSort(key) {
    if (censusSortKey === key) {
        censusSortOrder = censusSortOrder === 'asc' ? 'desc' : 'asc';
    } else {
        censusSortKey = key;
        censusSortOrder = 'desc';
    }
    
    // Refresh table & headers
    const task = taskData.flatMap(c => c.tasks).find(t => t.id === 'during_census_progress');
    const list = (task && task.hlbProgress && task.hlbProgress.length > 0) ? task.hlbProgress : DEFAULT_CENSUS_PROGRESS;
    
    const tableDiv = document.querySelector('.census-table-wrapper');
    if (tableDiv) {
        tableDiv.innerHTML = `
            <table class="census-table">
                <thead>
                    <tr>
                        <th onclick="setCensusSort('name')">गाँव का नाम <i class="fas ${censusSortKey === 'name' ? (censusSortOrder === 'asc' ? 'fa-sort-up' : 'fa-sort-down') : 'fa-sort'}"></i></th>
                        <th onclick="setCensusSort('hlbs')">कुल HLB <i class="fas ${censusSortKey === 'hlbs' ? (censusSortOrder === 'asc' ? 'fa-sort-up' : 'fa-sort-down') : 'fa-sort'}"></i></th>
                        <th onclick="setCensusSort('expected')">अपेक्षित मकान <i class="fas ${censusSortKey === 'expected' ? (censusSortOrder === 'asc' ? 'fa-sort-up' : 'fa-sort-down') : 'fa-sort'}"></i></th>
                        <th onclick="setCensusSort('completed')">पूर्ण मकान <i class="fas ${censusSortKey === 'completed' ? (censusSortOrder === 'asc' ? 'fa-sort-up' : 'fa-sort-down') : 'fa-sort'}"></i></th>
                        <th onclick="setCensusSort('percent')" style="width:30%;">प्रगति (%) <i class="fas ${censusSortKey === 'percent' ? (censusSortOrder === 'asc' ? 'fa-sort-up' : 'fa-sort-down') : 'fa-sort'}"></i></th>
                        <th>स्थिति</th>
                    </tr>
                </thead>
                <tbody>
                    ${renderCensusTableRows(list)}
                </tbody>
            </table>
        `;
    }
}

// Detailed Glassmorphic Modal functions
function openVillageDetails(villageName) {
    const task = taskData.flatMap(c => c.tasks).find(t => t.id === 'during_census_progress');
    const list = (task && task.hlbProgress && task.hlbProgress.length > 0) ? task.hlbProgress : DEFAULT_CENSUS_PROGRESS;
    const v = list.find(x => x.village === villageName);
    if (!v) return;
    
    const pct = Math.round((v.completedHouses / v.expectedHouses) * 100) || 0;
    const supVerifyPct = Math.round((v.verifiedHouseholds / v.households) * 100) || 0;
    
    let modalOverlay = document.getElementById('census-modal-overlay');
    if (!modalOverlay) {
        modalOverlay = document.createElement('div');
        modalOverlay.id = 'census-modal-overlay';
        modalOverlay.className = 'census-modal-overlay';
        document.body.appendChild(modalOverlay);
    }
    
    modalOverlay.innerHTML = `
        <div class="census-modal">
            <div class="cm-header">
                <h3><i class="fas fa-map-marker-alt"></i> ${v.village}</h3>
                <p>गाँव का विस्तृत प्रगति ब्रेकडाउन (Field Survey Statistics)</p>
                <button class="cm-close" onclick="closeVillageDetails()"><i class="fas fa-times"></i></button>
            </div>
            <div class="cm-body">
                <div class="cm-section-title">ब्लॉक और जनसंख्या आंकड़े (HLB & Population)</div>
                <div class="cm-grid-stats">
                    <div class="cm-stat-item">
                        <label>कुल HLBs</label>
                        <span>${v.totalHlbs}</span>
                    </div>
                    <div class="cm-stat-item">
                        <label>प्रगति पर HLBs</label>
                        <span>${v.inProgress}</span>
                    </div>
                    <div class="cm-stat-item">
                        <label>पूर्ण HLBs</label>
                        <span>${v.completedHlbs}</span>
                    </div>
                    <div class="cm-stat-item">
                        <label>कुल जनसंख्या</label>
                        <span>${v.population.toLocaleString('hi-IN')}</span>
                    </div>
                </div>
                
                <div class="cm-houses-breakdown">
                    <div class="cm-breakdown-card">
                        <h4><i class="fas fa-home" style="color:#4f46e5;"></i> मकान प्रोग्रेस (${pct}%)</h4>
                        <div class="cm-breakdown-list">
                            <div class="cm-breakdown-row"><span>कुल अनुमानित मकान:</span><span>${v.expectedHouses.toLocaleString('hi-IN')}</span></div>
                            <div class="cm-breakdown-row"><span>कुल प्रगणित मकान:</span><span>${v.completedHouses.toLocaleString('hi-IN')}</span></div>
                            <div class="cm-breakdown-row"><span>आवासीय मकान (Residential):</span><span>${(v.whollyRes + v.partlyRes).toLocaleString('hi-IN')}</span></div>
                            <div class="cm-breakdown-row"><span>गैर-आवासीय (Other Uses):</span><span>${v.otherUse.toLocaleString('hi-IN')}</span></div>
                        </div>
                    </div>
                    
                    <div class="cm-breakdown-card">
                        <h4><i class="fas fa-house-damage" style="color:#f59e0b;"></i> बंद एवं खाली मकान</h4>
                        <div class="cm-breakdown-list">
                            <div class="cm-breakdown-row"><span>खाली मकान (Vacant):</span><span>${v.vacant.toLocaleString('hi-IN')}</span></div>
                            <div class="cm-breakdown-row"><span>ताला बंद (Locked):</span><span>${v.locked.toLocaleString('hi-IN')}</span></div>
                            <div class="cm-breakdown-row"><span>कुल परिवार (Households):</span><span>${v.households.toLocaleString('hi-IN')}</span></div>
                            <div class="cm-breakdown-row"><span>पर्यवेक्षक द्वारा सत्यापित:</span><span>${v.verifiedHouseholds.toLocaleString('hi-IN')} (${supVerifyPct}%)</span></div>
                        </div>
                    </div>
                </div>

                <div class="cm-section-title">SE ID वितरण स्थिति</div>
                <div style="background:#f8fafc; border:1px solid #f1f5f9; padding:15px; border-radius:12px; display:flex; justify-content:space-between; align-items:center; font-weight:700;">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <i class="fas fa-fingerprint fa-2x" style="color:#9c27b0;"></i>
                        <div>
                            <span style="font-size:13px; color:#64748b; display:block;">कुल इस्तेमाल किए गए SE IDs</span>
                            <span style="font-size:18px; color:#1e293b;">${v.seIdUsed}</span>
                        </div>
                    </div>
                    <span class="badge-pill" style="background:#f3e5f5; color:#9c27b0;">सक्रिय (Active)</span>
                </div>
            </div>
        </div>
    `;
    
    setTimeout(() => {
        modalOverlay.classList.add('active');
    }, 10);
    
    modalOverlay.onclick = function(e) {
        if (e.target === modalOverlay) {
            closeVillageDetails();
        }
    };
}

function closeVillageDetails() {
    const modalOverlay = document.getElementById('census-modal-overlay');
    if (modalOverlay) {
        modalOverlay.classList.remove('active');
        setTimeout(() => {
            modalOverlay.innerHTML = '';
        }, 300);
    }
}

// --------------------------------------------------------------------------
// TABS AND PERSONNEL DIRECTORY INTERACTIVE VIEW LOGIC
// --------------------------------------------------------------------------

function switchTab(tabName) {
    activeCensusTab = tabName;
    
    const btnProgress = document.getElementById('btn-tab-progress');
    const btnDirectory = document.getElementById('btn-tab-directory');
    const btnPdf = document.getElementById('btn-tab-pdf');
    const btnReport = document.getElementById('btn-tab-report');
    
    // Reset all buttons
    if (btnProgress) btnProgress.classList.remove('active');
    if (btnDirectory) btnDirectory.classList.remove('active');
    if (btnPdf) btnPdf.classList.remove('active');
    if (btnReport) btnReport.classList.remove('active');
    
    // Hide all panels
    const dashboard = document.getElementById('during-census-dashboard');
    const scheduler = document.getElementById('daily-scheduler');
    const container = document.getElementById(isAdminPage ? 'admin-container' : 'public-container');
    const directoryPanel = document.getElementById('personnel-directory-panel');
    const pdfPanel = document.getElementById('pdf-viewer-panel');
    const reportPanel = document.getElementById('report-panel');
    const uploadTrigger = document.querySelector('button[onclick*="during-census-panel"]')?.parentElement;
    
    if (dashboard) dashboard.style.display = 'none';
    if (scheduler) scheduler.style.display = 'none';
    if (container) container.style.display = 'none';
    if (directoryPanel) directoryPanel.style.display = 'none';
    if (pdfPanel) pdfPanel.style.display = 'none';
    if (reportPanel) reportPanel.style.display = 'none';
    if (uploadTrigger) uploadTrigger.style.display = 'none';
    
    if (tabName === 'progress') {
        if (btnProgress) btnProgress.classList.add('active');
        if (dashboard) dashboard.style.display = 'block';
        if (scheduler) scheduler.style.display = 'block';
        if (container) container.style.display = 'block';
        if (uploadTrigger) uploadTrigger.style.display = 'block';
    } else if (tabName === 'directory') {
        if (btnDirectory) btnDirectory.classList.add('active');
        if (directoryPanel) {
            directoryPanel.style.display = 'block';
            renderPersonnelDirectory();
        }
    } else if (tabName === 'report') {
        if (btnReport) btnReport.classList.add('active');
        if (reportPanel) {
            reportPanel.style.display = 'block';
            renderReportPanel();
        }
    } else if (tabName === 'pdf') {
        if (btnPdf) btnPdf.classList.add('active');
        if (pdfPanel) {
            pdfPanel.style.display = 'flex';
            // Load PDF from localStorage or fallback to report.pdf
            const pdfIframe = document.getElementById('pdf-iframe');
            const pdfLink = document.getElementById('pdf-download-link');
            const savedPdf = localStorage.getItem('census_pdf_data');
            const src = savedPdf || 'pdf/Charge_Wise_HLB_Progress_Report.pdf';
            if (pdfIframe) pdfIframe.src = src;
            if (pdfLink) pdfLink.href = src;
        }
    }
}

// Handle PDF Upload in Admin
function handlePdfUpload(input) {
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        alert('कृपया केवल PDF फ़ाइल अपलोड करें।');
        return;
    }
    
    const statusSpan = document.getElementById('pdf-upload-status');
    statusSpan.innerHTML = '<i class="fas fa-spinner fa-spin"></i> अपलोड हो रहा है...';
    statusSpan.style.color = '#3b82f6';
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            // Trigger download first so it always works
            const a = document.createElement('a');
            a.href = e.target.result;
            a.download = 'Charge_Wise_HLB_Progress_Report.pdf';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            statusSpan.innerHTML = '<i class="fas fa-check-circle"></i> PDF डाउनलोड हो गया! इसे "pdf" फ़ोल्डर में रिप्लेस करें।';
            statusSpan.style.color = '#10b981';
            
            // Try saving to localStorage for instant preview
            try {
                localStorage.setItem('census_pdf_data', e.target.result);
            } catch(lsErr) {
                console.warn('LocalStorage full, preview might not update, but file is downloaded.');
            }
        } catch (err) {
            console.error(err);
            statusSpan.innerHTML = '<i class="fas fa-exclamation-triangle"></i> कुछ एरर आ गया।';
            statusSpan.style.color = '#ef4444';
        }
    };
    reader.readAsDataURL(file);
    input.value = '';
}

function renderPersonnelDirectory() {
    const panel = document.getElementById('personnel-directory-panel');
    if (!panel) return;
    
    panel.innerHTML = `
        <div class="directory-controls">
            <div class="directory-search-wrapper">
                <i class="fas fa-search"></i>
                <input type="text" class="directory-search" placeholder="नाम, मोबाइल, गाँव, HLB या ID खोजें..." value="${directorySearchTerm}">
            </div>
            <div class="directory-filters">
                <button class="directory-filter-btn ${directoryFilter === 'all' ? 'active' : ''}" data-filter="all" onclick="setDirectoryFilter('all')">सभी कार्मिक</button>
                <button class="directory-filter-btn ${directoryFilter === 'supervisor' ? 'active' : ''}" data-filter="supervisor" onclick="setDirectoryFilter('supervisor')">सुपरवाइजर (Supervisor)</button>
                <button class="directory-filter-btn ${directoryFilter === 'enumerator' ? 'active' : ''}" data-filter="enumerator" onclick="setDirectoryFilter('enumerator')">प्रगणक (Enumerator)</button>
            </div>
        </div>
        <div class="personnel-grid"></div>
    `;
    
    const searchInput = panel.querySelector('.directory-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            handleDirectorySearch(e.target.value);
        });
    }
    
    renderDirectoryCards();
}

function renderDirectoryCards() {
    const grid = document.querySelector('#personnel-directory-panel .personnel-grid');
    if (!grid) return;
    
    // Filter by role tab
    let filtered = personnelData.filter(p => {
        if (directoryFilter === 'supervisor' && p.role !== 'Supervisor') return false;
        if (directoryFilter === 'enumerator' && p.role !== 'Enumerator') return false;
        if (directorySearchTerm) {
            const term = directorySearchTerm.toLowerCase();
            return String(p.name || '').toLowerCase().includes(term) ||
                   String(p.mobile || '').toLowerCase().includes(term) ||
                   String(p.supervisor_circle || '').toLowerCase().includes(term) ||
                   String(p.hlb_new || '').toLowerCase().includes(term);
        }
        return true;
    });

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="directory-empty">
                <i class="fas fa-users-slash"></i>
                <h3>कोई परिणाम नहीं मिला</h3>
                <p>"${directorySearchTerm}" के लिए कोई कार्मिक नहीं मिला।</p>
            </div>
        `;
        return;
    }
    
    // ── "सभी कार्मिक" tab → grouped by supervisor circle (like Sheet 2) ──
    if (directoryFilter === 'all') {
        // Group by supervisor_circle
        const circles = {};
        filtered.forEach(p => {
            const c = p.supervisor_circle || 0;
            if (!circles[c]) circles[c] = { supervisor: null, enumerators: [] };
            if (p.role === 'Supervisor') circles[c].supervisor = p;
            else circles[c].enumerators.push(p);
        });

        // Sort circles numerically
        const sortedKeys = Object.keys(circles).map(Number).sort((a,b) => a - b);

        let html = '';
        sortedKeys.forEach(circleNum => {
            const grp = circles[circleNum];
            const sup = grp.supervisor;
            // Sort enumerators by hlb_new
            grp.enumerators.sort((a,b) => (Number(a.hlb_new)||999) - (Number(b.hlb_new)||999));

            html += `
            <div class="circle-group">
                <div class="circle-group-header" onclick="this.parentElement.classList.toggle('collapsed')">
                    <div class="cg-left">
                        <span class="cg-circle-num">${circleNum}</span>
                        <div class="cg-sup-info">
                            <span class="cg-sup-label">सुपरवाइजर</span>
                            <span class="cg-sup-name">${sup ? highlightText(sup.name, directorySearchTerm) : '-'}</span>
                        </div>
                    </div>
                    <div class="cg-right">
                        ${sup ? `<a href="tel:${sup.mobile}" class="cg-call-sup" onclick="event.stopPropagation()"><i class="fas fa-phone-alt"></i> ${highlightText(sup.mobile, directorySearchTerm)}</a>` : ''}
                        <span class="cg-count">${grp.enumerators.length} प्रगणक</span>
                        <i class="fas fa-chevron-down cg-arrow"></i>
                    </div>
                </div>
                <div class="circle-group-body">
                    <table class="cg-table">
                        <thead>
                            <tr>
                                <th style="width:50px">क्र.</th>
                                <th style="width:70px">HLB</th>
                                <th>प्रगणक का नाम</th>
                                <th style="width:160px">मोबाइल नंबर</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${grp.enumerators.map((en, i) => `
                            <tr>
                                <td>${i + 1}</td>
                                <td><span class="hlb-badge">${en.hlb_new || '-'}</span></td>
                                <td>${highlightText(en.name, directorySearchTerm)}</td>
                                <td><a href="tel:${en.mobile}" class="enum-call-link"><i class="fas fa-phone-alt"></i> ${highlightText(en.mobile, directorySearchTerm)}</a></td>
                            </tr>`).join('')}
                        </tbody>
                    </table>
                </div>
            </div>`;
        });
        grid.innerHTML = html;
        return;
    }

    // ── Supervisor / Enumerator tabs → simple card view ──
    filtered.sort((a, b) => {
        if (a.role === 'Supervisor') return (Number(a.supervisor_circle)||0) - (Number(b.supervisor_circle)||0);
        return (Number(a.hlb_new)||999) - (Number(b.hlb_new)||999);
    });

    grid.innerHTML = filtered.map((p, idx) => {
        const isSup = p.role === 'Supervisor';
        const cardClass = isSup ? 'personnel-card supervisor' : 'personnel-card enumerator';
        const roleLabel = isSup ? 'सुपरवाइजर' : 'प्रगणक';
        const hName = highlightText(p.name, directorySearchTerm);
        const hMobile = highlightText(p.mobile, directorySearchTerm);

        const badgeHtml = isSup
            ? `<div class="pc-circle-badge"><span>Circle</span><span>${highlightText(String(p.supervisor_circle), directorySearchTerm)}</span></div>`
            : `<div class="pc-circle-badge"><span>HLB</span><span>${highlightText(String(p.hlb_new || '-'), directorySearchTerm)}</span></div>`;

        const detailRow = isSup
            ? `<div class="pc-detail-row"><i class="fas fa-circle-notch"></i><span><b>सर्किल:</b> ${p.supervisor_circle}</span></div>`
            : `<div class="pc-detail-row"><i class="fas fa-user-shield"></i><span><b>सुपरवाइजर सर्किल:</b> ${highlightText(String(p.supervisor_circle), directorySearchTerm)}</span></div>`;

        return `
            <div class="${cardClass}">
                <div class="pc-top">
                    <span class="pc-badge-role">${roleLabel}</span>
                    ${badgeHtml}
                    <h3 class="pc-name">${hName}</h3>
                </div>
                <div class="pc-details">${detailRow}</div>
                <div class="pc-actions">
                    <a href="tel:${p.mobile}" class="pc-call-btn">
                        <i class="fas fa-phone-alt"></i> ${hMobile}
                    </a>
                </div>
            </div>
        `;
    }).join('');
}
function handleDirectorySearch(value) {
    directorySearchTerm = value;
    renderDirectoryCards();
}

function setDirectoryFilter(value) {
    directoryFilter = value;
    
    // Toggle active filter button
    const buttons = document.querySelectorAll('.directory-filter-btn');
    buttons.forEach(btn => {
        if (btn.getAttribute('data-filter') === value) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    renderDirectoryCards();
}

function highlightText(text, term) {
    if (!text) return '';
    const str = String(text);
    if (!term) return str;
    const escapedTerm = term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(${escapedTerm})`, 'gi');
    return str.replace(regex, '<span class="highlight">$1</span>');
}

// Final Start Sequence
loadData();


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
                hoverOffset: 8, clip: false
            }]
        },
        options: {
            layout: { padding: { top: 40, bottom: 80, left: 60, right: 60 } },
            radius: '60%',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { font: { family: 'Inter', size: 11 }, boxWidth: 12, padding: 35 }
                }
            }
        }
    });
}

// Generate Detailed Progress Report
function renderReportPanel() {
    const reportPanel = document.getElementById('report-panel');
    if (!reportPanel) return;
    
    // Instead of a custom view, we show the same report generated by admin but embedded in an iframe
    reportPanel.innerHTML = '<iframe id="report-iframe" style="width:100%; height:80vh; border:1px solid #ccc; border-radius:10px;"></iframe>';
    const iframe = document.getElementById('report-iframe');
    
    // Write the report HTML into the iframe
    const html = getReportHTML();
    iframe.contentWindow.document.open();
    iframe.contentWindow.document.write(html);
    iframe.contentWindow.document.close();
}

