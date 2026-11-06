
self.addEventListener("push", (event) => {
    let data = {
        title: "Student Expense Tracker",
        body: "You have a new notification.",
        url: "/"
    };

    if (event.data) {
        try {
            data = { ...data, ...event.data.json() };
        } catch (error) {
            console.error("Could not read push notification:", error);
        }
    }

    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: "/favicon.png",
            badge: "/favicon.png",
            data: {
                url: data.url || "/"
            }
        })
    );
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    const targetUrl = new URL(
        event.notification.data?.url || "/",
        self.location.origin
    ).href;

    event.waitUntil(
        clients.matchAll({
            type: "window",
            includeUncontrolled: true
        }).then((windowClients) => {
            for (const client of windowClients) {
                if (client.url.startsWith(self.location.origin)) {
                    return client.focus().then(() => {
                        if (client.url !== targetUrl) {
                            return client.navigate(targetUrl);
                        }
                    });
                }
            }

            return clients.openWindow(targetUrl);
        })
    );
});
