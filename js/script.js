document.addEventListener('DOMContentLoaded', () => {
    // --- SERVICE WORKER REGISTRATION ---
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('Service Worker registered', reg))
            .catch(err => console.log('Service Worker not registered', err));
    }

    // --- DOM ELEMENTS ---
    const subjectSelect = document.getElementById('subject-select');
    const topicsContainer = document.getElementById('topics-container');
    const addRevisionBtn = document.getElementById('add-revision-btn');
    const revisionListContainer = document.getElementById('revision-list-container');
    const notifyTimeInput = document.getElementById('notify-time');

    // --- CONFIGURATION ---
    const subjectFiles = ['economics.json', 'statistical.json', 'history.json', 'communication.json', 'disaster.json'];
    const spacedRepetitionIntervals = [1, 3, 7, 15, 30]; // in days

    // --- APP STATE ---
    let appData = loadFromLocalStorage() || { revisions: [], settings: {} };

    // --- INITIALIZATION ---
    populateSubjectDropdown();
    displayRevisions();
    if (appData.settings.notifyTime) {
        notifyTimeInput.value = appData.settings.notifyTime;
    }

    // --- EVENT LISTENERS ---
    subjectSelect.addEventListener('change', handleSubjectChange);
    addRevisionBtn.addEventListener('click', addRevision);
    revisionListContainer.addEventListener('click', handleRevisionListClick);
    notifyTimeInput.addEventListener('change', saveNotificationTime);


    // --- FUNCTIONS ---
    function populateSubjectDropdown() {
        subjectFiles.forEach(file => {
            const option = document.createElement('option');
            option.value = file;
            option.textContent = file.replace('.json', '').charAt(0).toUpperCase() + file.replace('.json', '').slice(1);
            subjectSelect.appendChild(option);
        });
    }

    async function handleSubjectChange() {
        const selectedFile = subjectSelect.value;
        if (!selectedFile) {
            topicsContainer.innerHTML = '';
            return;
        }
        try {
            const response = await fetch(`subjects/${selectedFile}`);
            if (!response.ok) throw new Error('Network response was not ok.');
            const data = await response.json();
            displayTopics(data);
        } catch (error) {
            console.error('Failed to fetch subject data:', error);
            topicsContainer.innerHTML = '<p>Error loading topics. Please try again.</p>';
        }
    }

    function displayTopics(data) {
        let html = '';
        data.units.forEach(unit => {
            html += `<h3>${unit.unit}</h3>`;
            unit.topics.forEach(topic => {
                html += `<h4>${topic.topic}</h4>`;
                html += '<ul class="subtopic-list">';
                topic.subtopics.forEach(subtopic => {
                    html += `<li><input type="checkbox" id="${subtopic}" name="subtopic" value="${subtopic}" data-topic="${topic.topic}" data-subject="${data.subject}"><label for="${subtopic}">${subtopic}</label></li>`;
                });
                html += '</ul>';
            });
        });
        topicsContainer.innerHTML = html;
    }

    function addRevision() {
        const selectedSubtopics = document.querySelectorAll('input[name="subtopic"]:checked');
        if (selectedSubtopics.length === 0) {
            alert('Please select at least one subtopic to revise.');
            return;
        }

        const topicsToAdd = {};
        selectedSubtopics.forEach(checkbox => {
            const subject = checkbox.dataset.subject;
            const topic = checkbox.dataset.topic;
            const subtopic = checkbox.value;

            const key = `${subject}|${topic}`;
            if (!topicsToAdd[key]) {
                topicsToAdd[key] = {
                    subject: subject,
                    topic: topic,
                    subtopics: [],
                };
            }
            topicsToAdd[key].subtopics.push(subtopic);
        });

        Object.values(topicsToAdd).forEach(item => {
            const now = new Date();
            const nextRevision = new Date(now);
            nextRevision.setDate(now.getDate() + spacedRepetitionIntervals[0]);

            const newRevision = {
                id: Date.now() + Math.random(), // Unique ID
                subject: item.subject,
                topic: item.topic,
                subtopics: item.subtopics,
                revCount: 0, // Starts at 0, first review makes it 1
                nextRevision: nextRevision.toISOString(),
                createdAt: now.toISOString(),
                history: []
            };
            appData.revisions.push(newRevision);
        });

        saveToLocalStorage();
        displayRevisions();
        // Clear selections
        handleSubjectChange(); 
    }
    
    function displayRevisions() {
        if (appData.revisions.length === 0) {
            revisionListContainer.innerHTML = '<p>No topics added yet. Add one to get started!</p>';
            return;
        }
        
        const sortedRevisions = appData.revisions.sort((a, b) => new Date(a.nextRevision) - new Date(b.nextRevision));
        let html = '';
        const today = new Date();
        today.setHours(0,0,0,0); // For accurate date comparison

        sortedRevisions.forEach((item, index) => {
            const nextRevisionDate = new Date(item.nextRevision);
            let status = 'upcoming';
            let statusText = `Next revision on: ${nextRevisionDate.toLocaleDateString()}`;

            if(nextRevisionDate < today) {
                status = 'missed';
                statusText = `Revision was due on: ${nextRevisionDate.toLocaleDateString()}`;
            } else if (item.revCount >= spacedRepetitionIntervals.length) {
                status = 'completed';
                statusText = 'Completed all revisions!';
            }

            html += `
                <div class="revision-item status-${status}">
                    <h3>${item.topic} (${item.subject})</h3>
                    <p><strong>Subtopics:</strong> ${item.subtopics.join(', ')}</p>
                    <p><strong>Status:</strong> Revision #${item.revCount + 1}. ${statusText}</p>
                    ${status !== 'completed' ? `<button class="review-btn" data-id="${item.id}">Mark as Reviewed</button>` : ''}
                </div>
            `;
        });
        revisionListContainer.innerHTML = html;
    }

    function handleRevisionListClick(e) {
        if (e.target.classList.contains('review-btn')) {
            const itemId = parseFloat(e.target.dataset.id);
            markAsReviewed(itemId);
        }
    }

    function markAsReviewed(itemId) {
        const itemIndex = appData.revisions.findIndex(item => item.id === itemId);
        if (itemIndex === -1) return;

        const item = appData.revisions[itemIndex];
        const now = new Date();

        item.revCount++;
        item.history.push({
            date: now.toISOString(),
            revCount: item.revCount
        });

        const nextInterval = spacedRepetitionIntervals[item.revCount];
        if (nextInterval) {
            const nextRevisionDate = new Date(now);
            nextRevisionDate.setDate(now.getDate() + nextInterval);
            item.nextRevision = nextRevisionDate.toISOString();
        } else {
            // All revisions completed
            item.nextRevision = null; 
        }

        saveToLocalStorage();
        displayRevisions();
    }

    function saveNotificationTime() {
        appData.settings.notifyTime = notifyTimeInput.value;
        saveToLocalStorage();
        // Call notification setup function if it exists
        if (window.setupNotifications) {
            window.setupNotifications();
        }
        alert('Notification time saved!');
    }

    // --- LOCAL STORAGE HELPERS ---
    function saveToLocalStorage() {
        localStorage.setItem('revisionAppData', JSON.stringify(appData));
    }

    function loadFromLocalStorage() {
        const data = localStorage.getItem('revisionAppData');
        return data ? JSON.parse(data) : null;
    }
});