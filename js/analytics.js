document.addEventListener('DOMContentLoaded', () => {
    const appData = JSON.parse(localStorage.getItem('revisionAppData'));

    if (!appData || !appData.revisions || appData.revisions.length === 0) {
        document.querySelector('main').innerHTML = `
            <div class="card">
                <h2>No Data Available</h2>
                <p>Start adding and reviewing topics to see your progress here!</p>
                <a href="index.html" class="nav-link" style="display: inline-block; text-decoration: none;">Go Back</a>
            </div>
        `;
        return;
    }

    renderCharts(appData.revisions);
    displayLists(appData.revisions);
});

function renderCharts(revisions) {
    const today = new Date();
    today.setHours(0,0,0,0);

    let pending = 0;
    let completed = 0;
    revisions.forEach(item => {
        if (item.nextRevision === null) {
            completed++;
        } else {
            pending++;
        }
    });

    // Pie Chart for Overview
    const overviewCtx = document.getElementById('overview-chart').getContext('2d');
    new Chart(overviewCtx, {
        type: 'pie',
        data: {
            labels: ['Pending', 'Completed'],
            datasets: [{
                label: 'Revision Status',
                data: [pending, completed],
                backgroundColor: ['#ffc107', '#28a745'],
                borderColor: ['#fff', '#fff'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Overall Revision Progress'
                }
            }
        }
    });
    
    // Bar Chart for History
    const historyData = {};
    revisions.forEach(rev => {
        rev.history.forEach(h => {
            const date = new Date(h.date).toLocaleDateString();
            historyData[date] = (historyData[date] || 0) + 1;
        });
    });

    const historyCtx = document.getElementById('history-chart').getContext('2d');
    new Chart(historyCtx, {
        type: 'bar',
        data: {
            labels: Object.keys(historyData),
            datasets: [{
                label: 'Revisions per Day',
                data: Object.values(historyData),
                backgroundColor: 'rgba(0, 123, 255, 0.5)',
                borderColor: 'rgba(0, 123, 255, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            },
            responsive: true,
             plugins: {
                title: {
                    display: true,
                    text: 'Daily Review Activity'
                }
            }
        }
    });
}

function displayLists(revisions) {
    const upcomingContainer = document.getElementById('upcoming-revisions');
    const missedContainer = document.getElementById('missed-revisions');
    let upcomingHTML = '';
    let missedHTML = '';

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sortedRevisions = revisions
        .filter(item => item.nextRevision !== null)
        .sort((a, b) => new Date(a.nextRevision) - new Date(b.nextRevision));

    sortedRevisions.forEach(item => {
        const nextRevisionDate = new Date(item.nextRevision);
        const itemHTML = `
            <div class="revision-item">
                <h3>${item.topic} (${item.subject})</h3>
                <p><strong>Due Date:</strong> ${nextRevisionDate.toLocaleDateString()}</p>
            </div>`;

        if (nextRevisionDate < today) {
            missedHTML += itemHTML;
        } else {
            upcomingHTML += itemHTML;
        }
    });

    upcomingContainer.innerHTML = upcomingHTML || '<p>No upcoming revisions. Good job!</p>';
    missedContainer.innerHTML = missedHTML || '<p>No missed revisions. Keep it up!</p>';
}