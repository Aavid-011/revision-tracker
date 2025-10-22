document.addEventListener('DOMContentLoaded', () => {
    // This is a placeholder for a more complex notification system.
    // For now, it just handles asking for permission.
    // A button can be added to trigger this, e.g., in settings.
    
    // Auto-request on first visit if not set
    if (Notification.permission === 'default') {
        // We can create a small banner or button to prompt the user
        // instead of an immediate alert. For simplicity, we'll log it.
        console.log('Ready to ask for notification permission.');
    }
});

function requestNotificationPermission() {
    return new Promise((resolve, reject) => {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                console.log('Notification permission granted.');
                resolve();
            } else {
                console.log('Notification permission denied.');
                reject();
            }
        });
    });
}

// You can call `requestNotificationPermission()` from a user action,
// for example, when they first set a notification time.